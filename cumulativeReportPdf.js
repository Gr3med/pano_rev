import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// ... (الدوال المساعدة تبقى كما هي) ...
const getRatingText = (r) => ({5: 'ممتاز', 3: 'جيد', 1: 'ضعيف'}[parseInt(r, 10)] || '-');
const getRatingColor = (r) => ({5: '#28a745', 3: '#ffc107', 1: '#dc3545'}[parseInt(r, 10)] || '#6c757d');
const getAvgRatingText = (avg) => { const s = parseFloat(avg); if (s >= 4) return 'ممتاز'; if (s >= 2.5) return 'جيد'; if (s > 0) return 'ضعيف'; return '-'; };
const getAvgRatingColor = (avg) => { const s = parseFloat(avg); if (s >= 4) return '#28a745'; if (s >= 2.5) return '#ffc107'; if (s > 0) return '#dc3545'; return '#6c757d'; };

export async function createCumulativePdfReport(stats, recentReviews) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const logoBase64 = await fs.readFile(path.join(__dirname, 'public', 'logo.jpg'), 'base64');
    const logoUri = `data:image/jpeg;base64,${logoBase64}`;
    const today = new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });

    // ... (كود بناء HTML يبقى كما هو) ...
    const reviewsHtml = recentReviews.map(review => {
        const suggestionsHtml = review.suggestions ? `<tr><td colspan="10" class="comments-cell"><strong>مقترحات:</strong> ${review.suggestions}</td></tr>` : ''
        return `
        <div class="review-block">
            <table class="guest-info-table">
                <thead><tr><th>النزيل</th><th>الطابق</th><th>الغرفة</th><th>الجوال</th><th>التاريخ</th></tr></thead>
                <tbody><tr>
                    <td>${review.guestName || '-'}</td>
                    <td>${review.floor || '-'}</td>
                    <td>${review.roomNumber || '-'}</td>
                    <td dir="ltr">${review.guestPhone || '-'}</td>
                    <td>${review.date || '-'}</td>
                </tr></tbody>
            </table>
            <table class="review-table">
                <thead><tr><th>الانترنت</th><th>الصيانة</th><th>الاستقبال</th><th>الحمام</th><th>المغسلة</th><th>الأمن</th><th>الماركت</th><th>الصالة</th><th>المطعم</th><th>النظافة</th></tr></thead>
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
                    ${suggestionsHtml}
                </tbody>
            </table>
        </div>`;
    }).join('');
    const htmlContent = ` <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Tajawal', sans-serif; -webkit-print-color-adjust: exact; font-size: 12px; }
            .page { padding: 25px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
            .header img { max-width: 150px; }
            .header h1 { color: #A98A44; font-size: 24px; margin: 10px 0 5px; }
            .section-title { font-size: 18px; font-weight: 700; color: #A98A44; border-bottom: 2px solid #A98A44; padding-bottom: 8px; margin-top: 25px; margin-bottom: 15px; }
            .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .summary-table td { border: 1px solid #dee2e6; padding: 9px; text-align: center; }
            .summary-table td:nth-child(odd) { font-weight: bold; background-color: #f8f9fa; width: 15%; }
            .review-block { margin-bottom: 15px; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; page-break-inside: avoid; }
            .guest-info-table, .review-table { width: 100%; border-collapse: collapse; font-size: 11px; }
            .guest-info-table th { background-color: #f2f2f2; padding: 8px; border: 1px solid #dee2e6; }
            .guest-info-table td { padding: 8px; text-align: center; border: 1px solid #dee2e6; }
            .review-table thead { background-color: #333; color: white; }
            .review-table th, .review-table td { padding: 8px; text-align: center; border-left: 1px solid #eee; }
            .rating-cell { font-weight: bold; }
            .comments-cell { background-color: #f9f9f9; text-align: right !important; padding: 10px; }
        </style>
    </head>
    <body>
        <div class="page">
            <div class="header">
                <img src="${logoUri}" alt="Hotel Logo">
                <h1>التقرير الشهري لاستبيان الفندق</h1>
                <p>تاريخ الإصدار: ${today}</p>
            </div>
            <div class="section-title">ملخص متوسط التقييمات (إجمالي ${stats.total_reviews} تقييم)</div>
            <table class="summary-table">
                <tbody>
                    <tr>
                        <td>الانترنت</td><td style="color: ${getAvgRatingColor(stats.avg_internet)}">${getAvgRatingText(stats.avg_internet)}</td>
                        <td>الصيانة</td><td style="color: ${getAvgRatingColor(stats.avg_maintenance)}">${getAvgRatingText(stats.avg_maintenance)}</td>
                    </tr>
                    <tr>
                        <td>الاستقبال</td><td style="color: ${getAvgRatingColor(stats.avg_reception)}">${getAvgRatingText(stats.avg_reception)}</td>
                        <td>دورة المياه</td><td style="color: ${getAvgRatingColor(stats.avg_bathroom)}">${getAvgRatingText(stats.avg_bathroom)}</td>
                    </tr>
                    <tr>
                        <td>المغسلة</td><td style="color: ${getAvgRatingColor(stats.avg_laundry)}">${getAvgRatingText(stats.avg_laundry)}</td>
                        <td>الأمن</td><td style="color: ${getAvgRatingColor(stats.avg_security)}">${getAvgRatingText(stats.avg_security)}</td>
                    </tr>
                    <tr>
                        <td>الميني ماركت</td><td style="color: ${getAvgRatingColor(stats.avg_minimarket)}">${getAvgRatingText(stats.avg_minimarket)}</td>
                        <td>صالة الاستقبال</td><td style="color: ${getAvgRatingColor(stats.avg_lobby)}">${getAvgRatingText(stats.avg_lobby)}</td>
                    </tr>
                    <tr>
                        <td>المطعم</td><td style="color: ${getAvgRatingColor(stats.avg_restaurant)}">${getAvgRatingText(stats.avg_restaurant)}</td>
                        <td>النظافة</td><td style="color: ${getAvgRatingColor(stats.avg_cleanliness)}">${getAvgRatingText(stats.avg_cleanliness)}</td>
                    </tr>
                </tbody>
            </table>
            <div class="section-title">عينة من تقييمات الشهر</div>
            ${reviewsHtml}
        </div>
    </body></html>`; // كود HTML الكامل هنا

    let browser = null;
    et browser = null;
    try {
        // ★★★ تم حذف executablePath وإبقاء الإعدادات المهمة فقط ★★★
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' } });
        return pdfBuffer;
    } catch (error) {
        console.error("❌ Error during cumulative PDF generation:", error);
        return null;
    } finally {
        if (browser) await browser.close();
    }
}

