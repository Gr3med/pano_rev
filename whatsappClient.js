// whatsappClient.js (النسخة النهائية المتوافقة مع الإصدار القديم)

import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;

import qrcode from 'qrcode-terminal';
import dotenv from 'dotenv';
import fs from 'fs'; // لاستخدام نظام الملفات (حفظ وحذف)
import path from 'path'; // للتعامل مع مسارات الملفات
import { fileURLToPath } from 'url'; // للحصول على المسار الصحيح في ES Modules

dotenv.config();

// إعداد لمعرفة المسار الحالي للملف (ضروري لحفظ الملف المؤقت)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SESSION_FILE_PATH = './session';

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: SESSION_FILE_PATH }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

let isClientReady = false;

client.on('qr', (qr) => {
    console.log('--- [WhatsApp] ---');
    console.log('امسح هذا الـ QR Code من تطبيق الواتساب الخاص بك:');
    qrcode.generate(qr, { small: true });
    console.log('--------------------');
});

client.on('authenticated', () => {
    console.log('✅ [WhatsApp] تمت المصادقة بنجاح.');
});

client.on('auth_failure', msg => {
    console.error('❌ [WhatsApp] فشل في المصادقة:', msg);
    console.warn('⚠️ قد تحتاج إلى حذف مجلد "session" والمحاولة مرة أخرى.');
});

client.on('ready', () => {
    isClientReady = true;
    console.log('✅ [WhatsApp] العميل جاهز!');
});

client.initialize();

/**
 * دالة لإرسال تقرير PDF إلى رقم محدد في .env
 * @param {Buffer} pdfBuffer - ملف PDF على هيئة Buffer
 * @param {string} caption - التعليق المصاحب للملف
 */
async function sendPdfReportToWhatsapp(pdfBuffer, caption) {
    if (!isClientReady) {
        console.warn("⚠️ [WhatsApp] العميل ليس جاهزاً بعد، تم تخطي الإرسال.");
        return;
    }
    const recipient = process.env.WHATSAPP_RECIPIENT_NUMBER;
    if (!recipient) {
        console.warn("⚠️ [WhatsApp] لم يتم تحديد رقم المستلم في ملف .env (WHATSAPP_RECIPIENT_NUMBER).");
        return;
    }

    // ★★★ بداية الكود الجديد والحل النهائي ★★★
    // إنشاء مسار فريد للملف المؤقت لتجنب أي تداخل
    const tempPdfPath = path.join(__dirname, `report-${Date.now()}.pdf`);

    try {
        // 1. كتابة الـ Buffer إلى ملف مؤقت على القرص
        fs.writeFileSync(tempPdfPath, pdfBuffer);

        // 2. إنشاء الوسائط من مسار الملف (الطريقة المضمونة للإصدارات القديمة)
        const media = MessageMedia.fromFilePath(tempPdfPath);
        
        // 3. إرسال الرسالة كالمعتاد
        const chatId = `${recipient}@c.us`;
        await client.sendMessage(chatId, media, { caption: caption });
        console.log(`✅ [WhatsApp] تم إرسال التقرير بنجاح إلى الرقم ${recipient}`);

    } catch (error) {
        console.error(`❌ [WhatsApp] فشل في إرسال التقرير إلى الرقم ${recipient}.`, error);
    } finally {
        // 4. حذف الملف المؤقت دائمًا بعد الانتهاء (سواء نجح الإرسال أو فشل)
        if (fs.existsSync(tempPdfPath)) {
            fs.unlinkSync(tempPdfPath);
        }
    }
    // ★★★ نهاية الكود الجديد ★★★
}

export { sendPdfReportToWhatsapp };