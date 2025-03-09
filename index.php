<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MUTLUGSC WHOIS Sorgulama Paneli</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <link rel="stylesheet" href="css/style.css">
    <!-- jsPDF kütüphanesi -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
</head>
<body>
    <div class="container mt-5">
        <div class="row">
            <div class="col-md-12 text-center mb-4">
                <h1><i class="bi bi-globe me-2"></i>MUTLUGSC WHOIS Sorgulama Paneli</h1>
                <p class="lead">Web sitelerinizin WHOIS bilgilerini sorgulayın ve kaydedin</p>
            </div>
        </div>

        <div class="row">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="bi bi-list-ul me-2"></i>Domain Listesi</h5>
                    </div>
                    <div class="card-body">
                        <form action="whois_query.php" method="post" id="whoisForm">
                            <div class="mb-3">
                                <label for="domains" class="form-label">Domainleri alt alta girin (örn: example.com)</label>
                                <textarea class="form-control" id="domains" name="domains" rows="10" placeholder="example.com&#10;example.org&#10;example.net"></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary">
                                <i class="bi bi-search me-1"></i> WHOIS Sorgula
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5><i class="bi bi-file-earmark-text me-2"></i>Sonuçlar</h5>
                        <div id="exportButtons" style="display: none;">
                            <button class="btn btn-sm btn-success" id="exportAllPdf">
                                <i class="bi bi-file-earmark-pdf me-1"></i> Tümünü PDF İndir
                            </button>
                        </div>
                    </div>
                    <div class="card-body" id="results">
                        <p class="text-center text-muted">Henüz sorgu yapılmadı.</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mt-4">
            <div class="col-md-12">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="bi bi-info-circle me-2"></i>Bilgi</h5>
                    </div>
                    <div class="card-body">
                        <p>Bu panel, web sitelerinizin WHOIS bilgilerini sorgulamanıza ve kaydetmenize olanak tanır. Aşağıdaki bilgileri görebilirsiniz:</p>
                        <ul>
                            <li>Domain kayıt tarihi</li>
                            <li>Domain bitiş tarihi</li>
                            <li>Kalan gün sayısı</li>
                            <li>Registrar bilgileri</li>
                            <li>Name server bilgileri</li>
                        </ul>
                        <p>Sonuçları PDF olarak indirebilir ve kayıt altına alabilirsiniz.</p>
                        <p class="text-center text-muted mt-3">
                            <small>MUTLUGSC tarafından geliştirilmiştir &copy; <?php echo date('Y'); ?></small>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script>
        // jsPDF'in global olarak erişilebilir olduğunu kontrol edelim
        window.addEventListener('load', function() {
            if (typeof window.jspdf === 'undefined') {
                console.log('jsPDF global değişkeni tanımlanıyor...');
                if (typeof window.jsPDF !== 'undefined') {
                    window.jspdf = { jsPDF: window.jsPDF };
                }
            }
        });
    </script>
    <script src="js/script.js"></script>
</body>
</html> 