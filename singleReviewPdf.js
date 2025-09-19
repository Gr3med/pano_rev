import puppeteer from 'puppeteer-core'; // ★★★ تم التعديل لاستخدام النسخة الخفيفة ★★★
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const getRatingText = (r) => ({5: 'ممتاز', 3: 'جيد', 1: 'ضعيف'}[parseInt(r, 10)] || '-');
const getRatingColor = (r) => ({5: '#28a745', 3: '#ffc107', 1: '#dc3545'}[parseInt(r, 10)] || '#6c757d');

export async function createSingleReviewPdf(data) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const logoBase64 = await fs.readFile(path.join(__dirname, 'public', 'logo.jpg'), 'base64');
    const logoUri = `data:image/jpeg;base64,${logoBase64}`;
    const today = new Date().toLocaleString('ar-EG', { dateStyle: 'full', timeStyle: 'short' });

    const labels = {
        'internet': 'خدمة الإنترنت', 'maintenance': 'الصيانة والأجهزة', 'reception': 'خدمة الاستقبال',
        'bathroom': 'جاهزية دورة المياه', 'laundry': 'خدمة المغسلة', 'security': 'خدمة الحراسة',
        'minimarket': 'الميني ماركت', 'lobby': 'صالة الاستقبال', 'restaurant': 'المطعم والكافيهات',
        'cleanliness': 'النظافة العامة'
    };

    const ratingsHtml = Object.entries(labels).map(([key, label]) => `
        <tr>
            <td class='rating-label'>${label}</td>
            <td class='rating-value' style='color: ${getRatingColor(data[key])};'>${getRatingText(data[key])}</td>
        </tr>
    `).join('');

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Tajawal', sans-serif; -webkit-print-color-adjust: exact; font-size: 14px; line-height: 1.6; color: #333; }
            .card { width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 15px rgba(0,0,0,0.05); border-radius: 10px; }
            .header { text-align: center; border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 20px; }
            .header h1 { font-size: 24px; color: #C2A541; margin: 0; }
            .section-title { font-size: 18px; font-weight: 700; margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #C2A541; padding-bottom: 5px; }
            .details-table, .ratings-table { width: 100%; border-collapse: collapse; }
            .details-table td, .ratings-table td { padding: 12px 8px; border-bottom: 1px solid #f0f0f0; }
            .details-table tr:last-child td, .ratings-table tr:last-child td { border-bottom: none; }
            .detail-label { font-weight: bold; color: #555; width: 150px; }
            .rating-label { font-weight: 500; }
            .rating-value { font-weight: bold; text-align: left; font-size: 14.5px; }
            .comments-section { margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 8px; border-right: 3px solid #C2A541; }
            .footer { text-align: center; margin-top: 25px; font-size: 12px; color: #aaa; }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="header">
                <img src="${logoUri}" alt="Hotel Logo" width="120" style="margin-bottom: 10px;">
                <h1>تقييم جديد للخدمة</h1>
            </div>
            <div class="section-title">تفاصيل الحجز</div>
            <table class="details-table">
                <tr><td class="detail-label">اسم النزيل:</td><td>${data.guestName || 'لم يُذكر'}</td></tr>
                <tr><td class="detail-label">رقم الغرفة:</td><td>${data.roomNumber || '-'} (الطابق ${data.floor || '-'})</td></tr>
                <tr><td class="detail-label">تاريخ التقييم:</td><td>${data.date || '-'}</td></tr>
                <tr><td class="detail-label">الجوال:</td><td dir="ltr">${data.mobileNumber || 'لم يُذكر'}</td></tr>
                <tr><td class="detail-label">البريد الإلكتروني:</td><td>${data.email || 'لم يُذكر'}</td></tr>
            </table>
            <div class="section-title">تقييم الخدمات</div>
            <table class="ratings-table">${ratingsHtml}</table>
            ${data.comments ? `<div class="section-title">مقترحات النزيل</div><div class="comments-section"><p>${data.comments}</p></div>` : ''}
            <div class="footer">تم إنشاء هذا التقرير تلقائياً بتاريخ ${today}</div>
        </div>
    </body></html>`;

    let browser = null;
    try {
        // ★★★ تم التعديل لاستخدام المتصفح المثبت على الخادم ★★★
        browser = await puppeteer.launch({
            headless: true,
            channel: 'chrome',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        return pdfBuffer;
    } catch (error) {
        console.error("❌ Error during single PDF generation:", error);
        return null;
    } finally {
        if (browser) await browser.close();
    }
}
