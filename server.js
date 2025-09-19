import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

import { sendReportEmail } from './notifications.js';
import { createSingleReviewPdf } from './singleReviewPdf.js'; // ★★★ تم إضافة هذا الملف ★★★
import { initializeWhatsAppClient, sendPdfReportToWhatsapp } from './whatsappClient.js';

dotenv.config();

// --- 1. إعداد قاعدة البيانات (PostgreSQL) ---
const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function setupDatabase() {
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY, date TEXT, floor INTEGER, roomNumber INTEGER,
        guestName TEXT, guestPhone TEXT, email TEXT, internet INTEGER, maintenance INTEGER,
        reception INTEGER, bathroom INTEGER, laundry INTEGER, security INTEGER,
        minimarket INTEGER, lobby INTEGER, restaurant INTEGER, cleanliness INTEGER,
        howDidYouHear TEXT, suggestions TEXT, createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );`;
    try {
        await pool.query(createTableQuery);
        console.log("✅ PostgreSQL Database and 'reviews' table are ready.");
    } catch (error) {
        console.error("❌ Failed to initialize database table:", error);
        process.exit(1);
    }
}

// --- 2. الإعدادات والثوابت ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// --- 3. مسار API لاستقبال التقييمات ---
app.post('/api/review', async (req, res) => {
    const data = req.body;
    const query = `
        INSERT INTO reviews(
            date, floor, roomNumber, guestName, guestPhone, email, 
            internet, maintenance, reception, bathroom, laundry, security, 
            minimarket, lobby, restaurant, cleanliness, suggestions
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    `;
    const params = [
        data.date, data.floor, data.roomNumber, data.guestName, data.mobileNumber, data.email, 
        data.internet, data.maintenance, data.reception, data.bathroom, data.laundry, data.security, 
        data.minimarket, data.lobby, data.restaurant, data.cleanliness, data.comments
    ];

    try {
        await pool.query(query, params);
        console.log(`👍 New review received for room ${data.roomNumber}.`);
        res.status(201).json({ success: true, message: 'شكرًا لك! تم استلام تقييمك بنجاح.' });

        // --- تشغيل المهام في الخلفية بعد إرسال الرد للمستخدم ---
        console.log("Processing PDF, Email, and WhatsApp in the background...");
        const pdfBuffer = await createSingleReviewPdf(data, __dirname);
        if (pdfBuffer) {
            const subject = `📄 تقييم جديد من غرفة ${data.roomNumber || 'N/A'}`;
            const whatsappCaption = `*تقييم جديد للخدمة*\n\n*النزيل:* ${data.guestName || '-'}\n*الغرفة:* ${data.roomNumber || '-'}`;
            
            await Promise.all([
                sendReportEmail(subject, pdfBuffer),
                sendPdfReportToWhatsapp(pdfBuffer, whatsappCaption)
            ]);
        }
        
    } catch (err) {
        console.error("Error inserting data:", err);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'خطأ في السيرفر عند حفظ البيانات.' });
        }
    }
});

// --- 4. تشغيل الخادم ---
async function startServer() {
    await setupDatabase();
    initializeWhatsAppClient();
    app.listen(PORT, () => console.log(`🚀 السيرفر يعمل على http://localhost:${PORT}`));
}

startServer();
