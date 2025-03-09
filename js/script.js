document.addEventListener('DOMContentLoaded', function() {
    // Form submit olayını dinleyelim
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Sonuçlar alanını temizleyelim
            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = '<p class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Yükleniyor...</span></div></p>';
            
            // Export butonlarını gizleyelim
            document.getElementById('exportButtons').style.display = 'none';
            
            // Form verilerini alalım
            const formData = new FormData(form);
            
            // AJAX isteği gönderelim
            fetch('whois_query.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                displayResults(data);
                
                // Sonuçlar varsa export butonlarını gösterelim
                if (data.length > 0) {
                    document.getElementById('exportButtons').style.display = 'block';
                }
            })
            .catch(error => {
                resultsDiv.innerHTML = `<div class="alert alert-danger">Hata oluştu: ${error.message}</div>`;
            });
        });
    }
    
    // Toplu PDF indirme butonunu dinleyelim
    const exportAllPdfBtn = document.getElementById('exportAllPdf');
    if (exportAllPdfBtn) {
        exportAllPdfBtn.addEventListener('click', function() {
            generateAllPDF();
        });
    }
    
    // jsPDF'in global olarak erişilebilir olduğunu kontrol edelim
    if (typeof window.jspdf === 'undefined' && typeof window.jsPDF !== 'undefined') {
        window.jspdf = { jsPDF: window.jsPDF };
    }
});

/**
 * WHOIS sonuçlarını gösteren fonksiyon
 */
function displayResults(results) {
    const resultsDiv = document.getElementById('results');
    
    // Sonuç yoksa
    if (results.length === 0) {
        resultsDiv.innerHTML = '<p class="text-center text-muted">Sonuç bulunamadı.</p>';
        return;
    }
    
    // Sonuçları gösterelim
    let html = '<div class="accordion" id="whoisAccordion">';
    
    results.forEach((result, index) => {
        const statusClass = result.status === 'success' ? 'success' : 'danger';
        const statusIcon = result.status === 'success' ? 'check-circle' : 'exclamation-triangle';
        
        let daysLeftHtml = '';
        if (result.days_left !== null) {
            const daysLeftClass = result.days_left < 30 ? 'danger' : (result.days_left < 90 ? 'warning' : 'success');
            daysLeftHtml = `<span class="badge bg-${daysLeftClass}">${result.days_left} gün kaldı</span>`;
        }
        
        // JSON verilerini güvenli bir şekilde saklayalım
        // Özel karakterleri temizleyelim
        const safeResult = {
            domain: result.domain,
            status: result.status,
            message: result.message ? result.message.replace(/"/g, '&quot;') : '',
            expiry_date: result.expiry_date,
            creation_date: result.creation_date,
            registrar: result.registrar ? result.registrar.replace(/"/g, '&quot;') : '',
            nameservers: result.nameservers,
            days_left: result.days_left
        };
        
        // data-result özelliğini HTML attribute-safe yapalım
        const resultDataAttr = JSON.stringify(safeResult).replace(/"/g, '&quot;');
        
        html += `
            <div class="accordion-item" data-result="${resultDataAttr}">
                <h2 class="accordion-header" id="heading${index}">
                    <button class="accordion-button ${index === 0 ? '' : 'collapsed'}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${index}" aria-expanded="${index === 0 ? 'true' : 'false'}" aria-controls="collapse${index}">
                        <span class="text-${statusClass} me-2"><i class="bi bi-${statusIcon}"></i></span>
                        <strong>${result.domain}</strong>
                        ${result.expiry_date ? `<span class="ms-auto badge bg-info me-2">Son Tarih: ${result.expiry_date}</span>` : ''}
                        ${daysLeftHtml}
                    </button>
                </h2>
                <div id="collapse${index}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" aria-labelledby="heading${index}" data-bs-parent="#whoisAccordion">
                    <div class="accordion-body">
                        <div class="d-flex justify-content-end mb-2">
                            <button class="btn btn-sm btn-primary" onclick="generatePDF('${result.domain}', ${index})">
                                <i class="bi bi-file-earmark-pdf me-1"></i> PDF Olarak İndir
                            </button>
                        </div>
                        
                        <div class="whois-summary mb-3">
                            <h6>Özet Bilgiler:</h6>
                            <table class="table table-sm table-bordered">
                                <tr>
                                    <th>Domain</th>
                                    <td>${result.domain}</td>
                                </tr>
                                <tr>
                                    <th>Kayıt Tarihi</th>
                                    <td>${result.creation_date || 'Bulunamadı'}</td>
                                </tr>
                                <tr>
                                    <th>Bitiş Tarihi</th>
                                    <td>${result.expiry_date || 'Bulunamadı'}</td>
                                </tr>
                                <tr>
                                    <th>Kalan Gün</th>
                                    <td>${result.days_left !== null ? result.days_left + ' gün' : 'Bulunamadı'}</td>
                                </tr>
                                <tr>
                                    <th>Registrar</th>
                                    <td>${result.registrar || 'Bulunamadı'}</td>
                                </tr>
                                <tr>
                                    <th>Name Serverlar</th>
                                    <td>${Array.isArray(result.nameservers) ? result.nameservers.join('<br>') : 'Bulunamadı'}</td>
                                </tr>
                            </table>
                        </div>
                        
                        <h6>Tüm WHOIS Bilgileri:</h6>
                        <pre class="whois-data">${result.data ? result.data.replace(/</g, '&lt;').replace(/>/g, '&gt;') : result.message}</pre>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    resultsDiv.innerHTML = html;
    
    // Sonuç özeti ekleyelim
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    
    const summaryHtml = `
        <div class="alert alert-info mt-3">
            <strong>Özet:</strong> Toplam ${results.length} domain sorgulandı. 
            <span class="text-success">${successCount} başarılı</span>, 
            <span class="text-danger">${errorCount} başarısız</span>.
        </div>
    `;
    
    resultsDiv.insertAdjacentHTML('beforeend', summaryHtml);
}

/**
 * PDF oluşturan fonksiyon
 */
function generatePDF(domain, index) {
    // jsPDF'i kontrol edelim
    let jsPDFClass;
    
    if (typeof window.jspdf !== 'undefined' && typeof window.jspdf.jsPDF === 'function') {
        jsPDFClass = window.jspdf.jsPDF;
    } else if (typeof window.jsPDF === 'function') {
        jsPDFClass = window.jsPDF;
    } else {
        alert('PDF oluşturma kütüphanesi yüklenemedi. Lütfen sayfayı yenileyin veya farklı bir tarayıcı deneyin.');
        console.error('jsPDF kütüphanesi bulunamadı!');
        return;
    }
    
    try {
        // PDF oluşturalım
        const doc = new jsPDFClass();
        
        // Başlık ekleyelim
        doc.setFontSize(16);
        doc.text('MUTLUGSC WHOIS Raporu', 105, 15, { align: 'center' });
        
        // Tarih ekleyelim
        const today = new Date();
        doc.setFontSize(10);
        doc.text(`Oluşturulma Tarihi: ${today.toLocaleDateString('tr-TR')}`, 105, 22, { align: 'center' });
        
        // Domain bilgisini ekleyelim
        doc.setFontSize(14);
        doc.text(`Domain: ${domain}`, 20, 30);
        
        // Özet bilgileri alalım
        const accordionItem = document.querySelector(`#collapse${index}`).parentNode;
        const resultData = accordionItem.getAttribute('data-result');
        
        if (!resultData) {
            alert('Domain bilgileri bulunamadı. Lütfen sayfayı yenileyin ve tekrar deneyin.');
            return;
        }
        
        // HTML entities'i decode edelim ve JSON olarak parse edelim
        const decodedData = resultData.replace(/&quot;/g, '"');
        const result = JSON.parse(decodedData);
        
        // Özet bilgileri ekleyelim
        doc.setFontSize(12);
        doc.text('Özet WHOIS Bilgileri:', 20, 40);
        
        let y = 50;
        
        // Tablo başlıkları
        doc.setFillColor(240, 240, 240);
        doc.rect(20, y, 80, 8, 'F');
        doc.rect(100, y, 80, 8, 'F');
        doc.setFont(undefined, 'bold');
        doc.text('Bilgi', 25, y + 6);
        doc.text('Değer', 105, y + 6);
        doc.setFont(undefined, 'normal');
        y += 8;
        
        // Kayıt tarihi
        doc.rect(20, y, 80, 8);
        doc.rect(100, y, 80, 8);
        doc.text('Kayıt Tarihi', 25, y + 6);
        doc.text(result.creation_date || 'Bulunamadı', 105, y + 6);
        y += 8;
        
        // Bitiş tarihi
        doc.rect(20, y, 80, 8);
        doc.rect(100, y, 80, 8);
        doc.text('Bitiş Tarihi', 25, y + 6);
        doc.text(result.expiry_date || 'Bulunamadı', 105, y + 6);
        y += 8;
        
        // Kalan gün
        doc.rect(20, y, 80, 8);
        doc.rect(100, y, 80, 8);
        doc.text('Kalan Gün', 25, y + 6);
        doc.text(result.days_left !== null ? result.days_left + ' gün' : 'Bulunamadı', 105, y + 6);
        y += 8;
        
        // Registrar
        doc.rect(20, y, 80, 8);
        doc.rect(100, y, 80, 8);
        doc.text('Registrar', 25, y + 6);
        doc.text(result.registrar || 'Bulunamadı', 105, y + 6);
        y += 8;
        
        // Name serverlar
        doc.rect(20, y, 80, 8);
        doc.rect(100, y, 80, 8);
        doc.text('Name Serverlar', 25, y + 6);
        
        if (Array.isArray(result.nameservers) && result.nameservers.length > 0) {
            // İlk name server'ı tabloya ekleyelim
            doc.text(result.nameservers[0] || 'Bulunamadı', 105, y + 6);
            y += 8;
            
            // Diğer name serverları ekleyelim
            for (let i = 1; i < result.nameservers.length; i++) {
                doc.rect(20, y, 80, 8);
                doc.rect(100, y, 80, 8);
                doc.text('', 25, y + 6);
                doc.text(result.nameservers[i], 105, y + 6);
                y += 8;
            }
        } else {
            doc.text('Bulunamadı', 105, y + 6);
            y += 8;
        }
        
        // Footer ekleyelim
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`MUTLUGSC WHOIS Raporu - Sayfa ${i} / ${pageCount}`, 105, 290, { align: 'center' });
        }
        
        // PDF'i indirelim
        doc.save(`whois_${domain}.pdf`);
    } catch (error) {
        console.error('PDF oluşturma hatası:', error);
        alert('PDF oluşturulurken bir hata oluştu: ' + error.message);
    }
}

/**
 * Tüm sonuçları tek bir PDF olarak indiren fonksiyon
 */
function generateAllPDF() {
    // jsPDF'i kontrol edelim
    let jsPDFClass;
    
    if (typeof window.jspdf !== 'undefined' && typeof window.jspdf.jsPDF === 'function') {
        jsPDFClass = window.jspdf.jsPDF;
    } else if (typeof window.jsPDF === 'function') {
        jsPDFClass = window.jsPDF;
    } else {
        alert('PDF oluşturma kütüphanesi yüklenemedi. Lütfen sayfayı yenileyin veya farklı bir tarayıcı deneyin.');
        console.error('jsPDF kütüphanesi bulunamadı!');
        return;
    }
    
    try {
        // PDF oluşturalım
        const doc = new jsPDFClass();
        
        // Başlık ekleyelim
        doc.setFontSize(18);
        doc.text('MUTLUGSC WHOIS Toplu Raporu', 105, 15, { align: 'center' });
        
        // Tarih ekleyelim
        const today = new Date();
        doc.setFontSize(10);
        doc.text(`Oluşturulma Tarihi: ${today.toLocaleDateString('tr-TR')}`, 105, 22, { align: 'center' });
        
        // Tüm domainleri alalım
        const accordionItems = document.querySelectorAll('.accordion-item');
        let y = 30;
        
        // Her domain için
        accordionItems.forEach((item, index) => {
            // Domain adını alalım
            const domain = item.querySelector('strong').textContent;
            
            // Sonuç verisini alalım
            const resultData = item.getAttribute('data-result');
            
            if (!resultData) {
                console.error('Domain bilgileri bulunamadı:', domain);
                return;
            }
            
            // HTML entities'i decode edelim ve JSON olarak parse edelim
            const decodedData = resultData.replace(/&quot;/g, '"');
            const result = JSON.parse(decodedData);
            
            // Sayfa sınırını kontrol edelim
            if (y > 250) {
                doc.addPage();
                y = 20;
            }
            
            // Domain başlığını ekleyelim
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 255);
            doc.text(`${index + 1}. ${domain}`, 20, y);
            y += 10;
            
            // Özet bilgileri ekleyelim
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            
            // Kayıt tarihi
            doc.text(`Kayıt Tarihi: ${result.creation_date || 'Bulunamadı'}`, 25, y);
            y += 6;
            
            // Bitiş tarihi
            doc.text(`Bitiş Tarihi: ${result.expiry_date || 'Bulunamadı'}`, 25, y);
            y += 6;
            
            // Kalan gün
            doc.text(`Kalan Gün: ${result.days_left !== null ? result.days_left + ' gün' : 'Bulunamadı'}`, 25, y);
            y += 6;
            
            // Registrar
            doc.text(`Registrar: ${result.registrar || 'Bulunamadı'}`, 25, y);
            y += 6;
            
            // Name serverlar
            doc.text('Name Serverlar:', 25, y);
            y += 6;
            
            if (Array.isArray(result.nameservers) && result.nameservers.length > 0) {
                result.nameservers.forEach(ns => {
                    doc.text(`- ${ns}`, 30, y);
                    y += 6;
                });
            } else {
                doc.text('- Bulunamadı', 30, y);
                y += 6;
            }
            
            y += 10;
        });
        
        // Footer ekleyelim
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`MUTLUGSC WHOIS Toplu Raporu - Sayfa ${i} / ${pageCount}`, 105, 290, { align: 'center' });
        }
        
        // PDF'i indirelim
        doc.save(`whois_toplu_rapor_${today.toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
        console.error('PDF oluşturma hatası:', error);
        alert('PDF oluşturulurken bir hata oluştu: ' + error.message);
    }
} 