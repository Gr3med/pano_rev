import dotenv from 'dotenv';
import { pool } from './db.js';
import { createCumulativePdfReport } from './cumulativeReportPdf.js';
import { sendEmailWithAttachment } from './emailHandler.js';
import { initializeWhatsAppClient, sendWhatsappPdf } from './whatsappClient.js';

dotenv.config();

async function generateAndSendMonthlyReport() {
    console.log("--- cron: Running monthly report job ---");
    
    initializeWhatsAppClient();
    console.log("cron: Waiting 45 seconds for WhatsApp client to be ready...");
    await new Promise(resolve => setTimeout(resolve, 45000));

    try {
        // تم تعديل الاستعلامات لـ PostgreSQL
        const statsQuery = `
            SELECT 
                COUNT(id) as total_reviews, AVG(internet) as avg_internet, AVG(maintenance) as avg_maintenance,
                AVG(reception) as avg_reception, AVG(bathroom) as avg_bathroom, AVG(laundry) as avg_laundry,
                AVG(security) as avg_security, AVG(minimarket) as avg_minimarket, AVG(lobby) as avg_lobby,
                AVG(restaurant) as avg_restaurant, AVG(cleanliness) as avg_cleanliness 
            FROM reviews WHERE date_part('year', createdAt) = date_part('year', NOW() - interval '1 month') 
            AND date_part('month', createdAt) = date_part('month', NOW() - interval '1 month')
        `;
        const reviewsQuery = `
            SELECT * FROM reviews 
            WHERE date_part('year', createdAt) = date_part('year', NOW() - interval '1 month') 
            AND date_part('month', createdAt) = date_part('month', NOW() - interval '1 month') 
            ORDER BY createdAt DESC LIMIT 20
        `;

        const statsResult = await pool.query(statsQuery);
        const reviewsResult = await pool.query(reviewsQuery);
        
        const stats = statsResult.rows[0];
        const reviews = reviewsResult.rows;
        
        if (!stats || stats.total_reviews == 0) {
            console.log(`cron: No reviews found for the last month. Exiting.`);
            return;
        }

        const pdfBuffer = await createCumulativePdfReport(stats, reviews);
        const lastMonthDate = new Date();
        lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
        const reportMonthName = lastMonthDate.toLocaleString('ar-EG', { month: 'long', year: 'numeric' });
        const baseFileName = `Monthly-Report-${lastMonthDate.getFullYear()}-${lastMonthDate.getMonth() + 1}`;
        const whatsappCaption = `*تقرير ${reportMonthName}*\n\nإجمالي التقييمات: ${stats.total_reviews}`;

        if (pdfBuffer) {
            await Promise.all([
                sendEmailWithAttachment({
                    pdfBuffer: pdfBuffer,
                    fileName: `${baseFileName}.pdf`,
                    subject: `📊 التقرير الشهري - ${reportMonthName}`,
                    bodyHtml: `<h1>التقرير الشهري لتقييمات النزلاء</h1><p>مرفق طيه التقرير التجميعي لشهر ${reportMonthName}.</p>`
                }),
                sendWhatsappPdf(pdfBuffer, `${baseFileName}.pdf`, whatsappCaption)
            ]);
        }
        
        console.log("--- cron: Monthly report sent successfully! ---");

    } catch (error) {
        console.error("--- cron: ERROR during monthly report generation:", error);
    } finally {
        await pool.end();
        console.log("cron: Job finished. Exiting in 15 seconds.");
        setTimeout(() => process.exit(0), 15000);
    }
}

generateAndSendMonthlyReport();