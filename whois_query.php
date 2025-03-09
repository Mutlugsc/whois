<?php
header('Content-Type: application/json');

// Hata raporlamasını açalım
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Sonuç dizisi
$results = [];

// POST ile gelen domain listesini alalım
if (isset($_POST['domains']) && !empty($_POST['domains'])) {
    $domains = explode("\n", trim($_POST['domains']));
    
    // Her domain için WHOIS sorgusu yapalım
    foreach ($domains as $domain) {
        $domain = trim($domain);
        if (empty($domain)) continue;
        
        // Domain formatını kontrol edelim
        if (!preg_match('/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/', $domain)) {
            $results[] = [
                'domain' => $domain,
                'status' => 'error',
                'message' => 'Geçersiz domain formatı',
                'data' => null,
                'expiry_date' => null,
                'creation_date' => null,
                'registrar' => null,
                'nameservers' => null,
                'days_left' => null
            ];
            continue;
        }
        
        // WHOIS sorgusu yapalım
        $whoisData = getWhoisData($domain);
        
        // Sonuç dizisine ekleyelim
        $expiryDate = extractExpiryDate($whoisData, $domain);
        $creationDate = extractCreationDate($whoisData);
        $registrar = extractRegistrar($whoisData);
        $nameservers = extractNameservers($whoisData);
        $daysLeft = calculateDaysLeft($expiryDate);
        
        $results[] = [
            'domain' => $domain,
            'status' => 'success',
            'message' => 'WHOIS sorgusu başarılı',
            'data' => $whoisData,
            'expiry_date' => $expiryDate,
            'creation_date' => $creationDate,
            'registrar' => $registrar,
            'nameservers' => $nameservers,
            'days_left' => $daysLeft
        ];
    }
}

// Sonuçları JSON olarak döndürelim
echo json_encode($results);

/**
 * WHOIS sorgusu yapan fonksiyon
 */
function getWhoisData($domain) {
    $whoisServers = [
        'com' => 'whois.verisign-grs.com',
        'net' => 'whois.verisign-grs.com',
        'org' => 'whois.pir.org',
        'info' => 'whois.afilias.net',
        'biz' => 'whois.biz',
        'io' => 'whois.nic.io',
        'co' => 'whois.nic.co',
        'me' => 'whois.nic.me',
        'tr' => 'whois.nic.tr',
        'com.tr' => 'whois.nic.tr',
        'org.tr' => 'whois.nic.tr',
        'net.tr' => 'whois.nic.tr'
    ];
    
    // Domain uzantısını alalım
    $parts = explode('.', $domain);
    $tld = implode('.', array_slice($parts, 1));
    
    // WHOIS sunucusunu belirleyelim
    $whoisServer = isset($whoisServers[$tld]) ? $whoisServers[$tld] : null;
    
    // Eğer WHOIS sunucusu bulunamadıysa
    if (!$whoisServer) {
        return "Bu domain uzantısı için WHOIS sunucusu bulunamadı: $tld";
    }
    
    // WHOIS sorgusu yapalım
    $socket = fsockopen($whoisServer, 43, $errno, $errstr, 10);
    if (!$socket) {
        return "WHOIS sunucusuna bağlanılamadı: $errstr";
    }
    
    // Sorguyu gönderelim
    fwrite($socket, $domain . "\r\n");
    
    // Yanıtı alalım
    $response = '';
    while (!feof($socket)) {
        $response .= fgets($socket, 128);
    }
    fclose($socket);
    
    return $response;
}

/**
 * WHOIS yanıtından son kullanma tarihini çıkaran fonksiyon
 */
function extractExpiryDate($whoisData, $domain) {
    $patterns = [
        '/Registry Expiry Date: ([^\n]+)/',
        '/Expiration Date: ([^\n]+)/',
        '/Expiry Date: ([^\n]+)/',
        '/Domain Expiration Date: ([^\n]+)/',
        '/expire: ([^\n]+)/',
        '/Expires on: ([^\n]+)/',
        '/Expires: ([^\n]+)/',
        '/Expiry date: ([^\n]+)/',
        '/paid-till: ([^\n]+)/',
        '/validity: ([^\n]+)/',
        '/Expires on\.+: ([^\n]+)/',
        '/renewal date: ([^\n]+)/'
    ];
    
    foreach ($patterns as $pattern) {
        if (preg_match($pattern, $whoisData, $matches)) {
            $date = trim($matches[1]);
            // Tarihi standart formata çevirelim
            try {
                $dateObj = new DateTime($date);
                return $dateObj->format('Y-m-d');
            } catch (Exception $e) {
                return $date; // Tarih çevrilemezse olduğu gibi döndürelim
            }
        }
    }
    
    return "Bulunamadı";
}

/**
 * WHOIS yanıtından kayıt tarihini çıkaran fonksiyon
 */
function extractCreationDate($whoisData) {
    $patterns = [
        '/Creation Date: ([^\n]+)/',
        '/Created Date: ([^\n]+)/',
        '/Created on: ([^\n]+)/',
        '/Created On: ([^\n]+)/',
        '/Domain Registration Date: ([^\n]+)/',
        '/Domain Create Date: ([^\n]+)/',
        '/Domain Name Commencement Date: ([^\n]+)/',
        '/registered: ([^\n]+)/',
        '/created: ([^\n]+)/',
        '/Created: ([^\n]+)/',
        '/Registration Time: ([^\n]+)/',
        '/created\.+: ([^\n]+)/'
    ];
    
    foreach ($patterns as $pattern) {
        if (preg_match($pattern, $whoisData, $matches)) {
            $date = trim($matches[1]);
            // Tarihi standart formata çevirelim
            try {
                $dateObj = new DateTime($date);
                return $dateObj->format('Y-m-d');
            } catch (Exception $e) {
                return $date; // Tarih çevrilemezse olduğu gibi döndürelim
            }
        }
    }
    
    return "Bulunamadı";
}

/**
 * WHOIS yanıtından registrar bilgisini çıkaran fonksiyon
 */
function extractRegistrar($whoisData) {
    $patterns = [
        '/Registrar: ([^\n]+)/',
        '/Sponsoring Registrar: ([^\n]+)/',
        '/Registrar Name: ([^\n]+)/',
        '/registrar: ([^\n]+)/',
        '/Registrar Organization: ([^\n]+)/',
        '/Registration Service Provider: ([^\n]+)/'
    ];
    
    foreach ($patterns as $pattern) {
        if (preg_match($pattern, $whoisData, $matches)) {
            return trim($matches[1]);
        }
    }
    
    return "Bulunamadı";
}

/**
 * WHOIS yanıtından name server bilgilerini çıkaran fonksiyon
 */
function extractNameservers($whoisData) {
    $nameservers = [];
    $patterns = [
        '/Name Server: ([^\n]+)/',
        '/Nameservers: ([^\n]+)/',
        '/nserver: ([^\n]+)/',
        '/Name servers: ([^\n]+)/',
        '/nameserver: ([^\n]+)/',
        '/NS: ([^\n]+)/'
    ];
    
    foreach ($patterns as $pattern) {
        if (preg_match_all($pattern, $whoisData, $matches)) {
            foreach ($matches[1] as $ns) {
                $nameservers[] = trim($ns);
            }
            if (!empty($nameservers)) {
                return $nameservers;
            }
        }
    }
    
    return ["Bulunamadı"];
}

/**
 * Son kullanma tarihine göre kalan gün sayısını hesaplayan fonksiyon
 */
function calculateDaysLeft($expiryDate) {
    if ($expiryDate == "Bulunamadı") {
        return null;
    }
    
    try {
        $expiry = new DateTime($expiryDate);
        $today = new DateTime();
        $diff = $today->diff($expiry);
        return $diff->days * ($diff->invert ? -1 : 1); // Eğer tarih geçmişse negatif değer döndür
    } catch (Exception $e) {
        return null;
    }
}
?> 