import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { pool, initializeDatabase } from './db.js';
import { createSingleReviewPdf } from './singleReviewPdf.js';
import { sendEmailWithAttachment } from './emailHandler.js';
import { initializeWhatsAppClient, sendWhatsappPdf } from './whatsappClient.js';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// تهيئة قاعدة البيانات والواتساب
await initializeDatabase();
initializeWhatsAppClient();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/review', async (req, res) => {
    const data = req.body;
    
    const query = `
        INSERT INTO reviews (date, floor, roomNumber, guestName, guestPhone, email, 
        internet, maintenance, reception, bathroom, laundry, security, 
        minimarket, lobby, restaurant, cleanliness, suggestions) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    `;
    const params = [
        data.date, data.floor, data.roomNumber, data.guestName, data.mobileNumber,
        data.email, data.internet, data.maintenance, data.reception, data.bathroom,
        data.laundry, data.security, data.minimarket, data.lobby, data.restaurant,
        data.cleanliness, data.comments
    ];

    try {
        await pool.query(query, params);
        console.log(`👍 New review received for room ${data.roomNumber || 'N/A'}.`);
        
        res.status(201).json({ success: true, message: 'شكرًا لك! تم استلام تقييمك بنجاح.' });

        console.log("Processing background tasks (PDF, Email, WhatsApp)...");
        const pdfBuffer = await createSingleReviewPdf(data);
        if (pdfBuffer) {
            const baseFileName = `Guest-Review-${data.roomNumber || 'NA'}-${Date.now()}`;
            const whatsappCaption = `*تقييم جديد للخدمة*\n\n*النزيل:* ${data.guestName || '-'}\n*الغرفة:* ${data.roomNumber || '-'}\n*الطابق:* ${data.floor || '-'}`;

            await Promise.all([
                sendEmailWithAttachment({
                    pdfBuffer: pdfBuffer,
                    fileName: `${baseFileName}.pdf`,
                    subject: `📄 تقييم جديد - غرفة ${data.roomNumber || 'N/A'}`,
                    bodyHtml: '<h1>تقييم جديد للخدمة</h1><p>تم استلام تقييم جديد. التفاصيل في الملف المرفق.</p>'
                }),
                sendWhatsappPdf(pdfBuffer, `${baseFileName}.pdf`, whatsappCaption)
            ]);
        }

    } catch (error) {
        console.error("❌ Error processing review:", error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'حدث خطأ في الخادم.' });
        }
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
