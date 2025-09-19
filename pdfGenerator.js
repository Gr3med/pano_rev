// pdfGenerator.js (النسخة الكاملة والمحدثة)

import puppeteer from 'puppeteer';

// --- دوال مساعدة لتنسيق التقييمات ---

function getRatingText(rating) {
    switch (parseInt(rating, 10)) {
        case 5: return 'ممتاز';
        case 3: return 'جيد';
        case 1: return 'ضعيف';
        default: return '-';
    }
}

function getRatingColor(rating) {
    const r = parseInt(rating, 10);
    if (r === 5) return '#28a745';
    if (r === 3) return '#ffc107';
    if (r === 1) return '#dc3545';
    return '#6c757d';
}

function getAverageRatingText(average) {
    const score = parseFloat(average);
    if (score >= 4) return 'ممتاز';
    if (score >= 2.5) return 'جيد';
    if (score > 0) return 'ضعيف';
    return '-';
}

function getAverageRatingColor(average) {
    const score = parseFloat(average);
    if (score >= 4) return '#28a745';
    if (score >= 2.5) return '#ffc107';
    if (score > 0) return '#dc3545';
    return '#6c757d';
}

// --- الدالة الرئيسية لإنشاء التقرير ---

async function createCumulativePdfReport(stats, recentReviews, logoDataUri) {
    const today = new Date();

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
            <style>
                :root { --primary-color: #A98A44; --secondary-color: #333; } 
                body { font-family: 'Tajawal', sans-serif; -webkit-print-color-adjust: exact; font-size: 12px; color: #333; } 
                .page { padding: 30px; } 
                .header { text-align: center; margin-bottom: 25px; border-bottom: 1px solid #eee; padding-bottom: 20px; } 
                .header img { max-width: 180px; } 
                .header h1 { color: var(--primary-color); font-size: 24px; margin-top: 10px; margin-bottom: 5px; } 
                .header p { font-size: 14px; color: #777; margin: 0; }
                .section-title { font-size: 18px; font-weight: 700; color: var(--primary-color); border-bottom: 2px solid var(--primary-color); padding-bottom: 8px; margin-top: 25px; margin-bottom: 15px; } 
                .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; } 
                .summary-table td { border: 1px solid #dee2e6; padding: 9px; text-align: center; } 
                .summary-table td:nth-child(odd) { font-weight: bold; background-color: #f8f9fa; width: 15%; }
                .review-block { margin-bottom: 25px; border: 1px solid #ccc; border-radius: 8px; overflow: hidden; page-break-inside: avoid; }
                .guest-info-table, .review-table { width: 100%; border-collapse: collapse; }
                .guest-info-table th { background-color: #f2f2f2; font-weight: bold; text-align: center; border: 1px solid #dee2e6; padding: 9px; }
                .guest-info-table td { border: 1px solid #dee2e6; padding: 9px; text-align: center; word-break: break-all; }
                .review-table thead { background-color: var(--secondary-color); color: white; }
                .review-table th { padding: 9px; font-weight: 500; }
                .review-table td { padding: 8px; text-align: center; vertical-align: middle; border: 1px solid #dee2e6;} 
                .rating-cell { font-weight: bold; font-size: 13px; } 
                .comments-cell { background-color: #f9f9f9; text-align: right !important; white-space: pre-wrap; word-wrap: break-word; padding: 12px; font-size: 11px; }
            </style>
        </head>
        <body>
            <div class="page">
                <div class="header">
                    <img src="${logoDataUri}" alt="Hotel Logo">
                    <h1>تقرير استبيان فندق بانوراما</h1>
                    <p>تاريخ الإصدار: ${today.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                
                <div class="section-title">ملخص متوسط التقييمات (إجمالي ${stats.total_reviews} تقييم)</div>
                <table class="summary-table">
                    <tbody>
                        <tr>
                            <td>الانترنت</td><td class="rating-cell" style="color: ${getAverageRatingColor(stats.avg_internet)}">${getAverageRatingText(stats.avg_internet)}</td>
                            <td>الصيانة</td><td class="rating-cell" style="color: ${getAverageRatingColor(stats.avg_maintenance)}">${getAverageRatingText(stats.avg_maintenance)}</td>
                        </tr>
                        <tr>
                            <td>الاستقبال</td><td class="rating-cell" style="color: ${getAverageRatingColor(stats.avg_reception)}">${getAverageRatingText(stats.avg_reception)}</td>
                            <td>دورة المياه</td><td class="rating-cell" style="color: ${getAverageRatingColor(stats.avg_bathroom)}">${getAverageRatingText(stats.avg_bathroom)}</td>
                        </tr>
                        <tr>
                            <td>المغسلة</td><td class="rating-cell" style="color: ${getAverageRatingColor(stats.avg_laundry)}">${getAverageRatingText(stats.avg_laundry)}</td>
                            <td>الأمن</td><td class="rating-cell" style="color: ${getAverageRatingColor(stats.avg_security)}">${getAverageRatingText(stats.avg_security)}</td>
                        </tr>
                        <tr>
                            <td>الميني ماركت</td><td class="rating-cell" style="color: ${getAverageRatingColor(stats.avg_minimarket)}">${getAverageRatingText(stats.avg_minimarket)}</td>
                            <td>صالة الاستقبال</td><td class="rating-cell" style="color: ${getAverageRatingColor(stats.avg_lobby)}">${getAverageRatingText(stats.avg_lobby)}</td>
                        </tr>
                        <tr>
                            <td>المطعم</td><td class="rating-cell" style="color: ${getAverageRatingColor(stats.avg_restaurant)}">${getAverageRatingText(stats.avg_restaurant)}</td>
                            <td>النظافة</td><td class="rating-cell" style="color: ${getAverageRatingColor(stats.avg_cleanliness)}">${getAverageRatingText(stats.avg_cleanliness)}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="section-title">تفاصيل التقييمات الأخيرة</div>
                ${recentReviews.map(review => `
                <div class="review-block">
                    <table class="guest-info-table">
                        <thead><tr><th>النزيل</th><th>الطابق</th><th>الغرفة</th><th>الجوال</th><th>البريد</th><th>التاريخ</th></tr></thead>
                        <tbody><tr>
                            <td>${review.guestName || '-'}</td>
                            <td>${review.floor || '-'}</td>
                            <td>${review.roomNumber || '-'}</td>
                            <td>${review.guestPhone || '-'}</td>
                            <td>${review.email || '-'}</td>
                            <td>${review.date || '-'}</td>
                        </tr></tbody>
                    </table>
                    <table class="review-table">
                        <thead><tr><th>الانترنت</th><th>الصيانة</th><th>الاستقبال</th><th>دورة المياه</th><th>المغسلة</th><th>الأمن</th><th>الميني ماركت</th><th>الصالة</th><th>المطعم</th><th>النظافة</th></tr></thead>
                        <tbody>
                            <tr>
                                <td class="rating-cell" style="color: ${getRatingColor(review.internet)}">${getRatingText(review.internet)}</td>
                                <td class="rating-cell" style="color: ${getRatingColor(review.maintenance)}">${getRatingText(review.maintenance)}</td>
                                <td class="rating-cell" style="color: ${getRatingColor(review.reception)}">${getRatingText(review.reception)}</td>
                                <td class="rating-cell" style="color: ${getRatingColor(review.bathroom)}">${getRatingText(review.bathroom)}</td>
                                <td class="rating-cell" style="color: ${getRatingColor(review.laundry)}">${getRatingText(review.laundry)}</td>
                                <td class="rating-cell" style="color: ${getRatingColor(review.security)}">${getRatingText(review.security)}</td>
                                <td class="rating-cell" style="color: ${getRatingColor(review.minimarket)}">${getRatingText(review.minimarket)}</td>
                                <td class="rating-cell" style="color: ${getRatingColor(review.lobby)}">${getRatingText(review.lobby)}</td>
                                <td class="rating-cell" style="color: ${getRatingColor(review.restaurant)}">${getRatingText(review.restaurant)}</td>
                                <td class="rating-cell" style="color: ${getRatingColor(review.cleanliness)}">${getRatingText(review.cleanliness)}</td>
                            </tr>
                            ${(review.howDidYouHear || review.suggestions) ? `<tr><td colspan="10" class="comments-cell">
                                ${review.howDidYouHear ? `<strong>كيف تعرف علينا:</strong> ${review.howDidYouHear}<br>` : ''}
                                ${review.suggestions ? `<strong>مقترحات:</strong> ${review.suggestions}` : ''}
                            </td></tr>` : ''}
                        </tbody>
                    </table>
                </div>
                `).join('')}
            </div>
        </body></html>
    `;

    const emailHtmlContent = `<div dir="rtl" style="text-align: center; padding: 20px;"><h1>تقرير جديد لاستبيان الفندق</h1><p>التقرير المفصل مرفق.</p></div>`;

    let browser = null;
    try {
browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' } });
        return { pdfBuffer, emailHtmlContent };
    } catch (error) {
        console.error("❌ Error during PDF generation:", error);
        throw error;
    } finally {
        if (browser) await browser.close();
    }
}

// ★★★ تم التعديل هنا ليتوافق مع ES Modules المستخدمة في server.js ★★★

export { createCumulativePdfReport };
