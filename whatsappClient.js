import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import qrcode from 'qrcode-terminal';
import dotenv from 'dotenv';

dotenv.config();

let client;
let isClientReady = false;

export function initializeWhatsAppClient() {
    console.log('Initializing WhatsApp client with puppeteer-core...');
    
    client = new Client({
        authStrategy: new LocalAuth({ dataPath: 'whatsapp_session' }),
        puppeteer: {
            headless: true,
            // ★★★ هذا هو التعديل الجديد والمهم ★★★
            // channel: 'chrome' يخبر المكتبة باستخدام المتصفح المثبت بدلاً من تحميل واحد جديد
            channel: 'chrome',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        }
    });

    client.on('qr', (qr) => {
        console.log('--- [WhatsApp QR Code] ---');
        qrcode.generate(qr, { small: true });
        console.log('-------------------------');
    });

    client.on('ready', () => {
        isClientReady = true;
        console.log('✅ WhatsApp client is ready!');
    });

    client.on('auth_failure', msg => {
        console.error('❌ WhatsApp AUTHENTICATION FAILURE', msg);
    });

    client.on('disconnected', (reason) => {
        console.log('WhatsApp client was logged out', reason);
        isClientReady = false;
        client.initialize();
    });

    client.initialize();
}

export async function sendWhatsappPdf(pdfBuffer, fileName, caption) {
    if (!isClientReady) {
        console.warn("⚠️ WhatsApp client is not ready. Skipping message.");
        return;
    }
    const recipient = process.env.WHATSAPP_RECIPIENT_NUMBER;
    if (!recipient) {
        console.warn("⚠️ WHATSAPP_RECIPIENT_NUMBER not set. Skipping message.");
        return;
    }

    try {
        const media = new MessageMedia('application/pdf', pdfBuffer.toString('base64'), fileName);
        const chatId = `${recipient}@c.us`;
        await client.sendMessage(chatId, media, { caption: caption });
        console.log(`✅ WhatsApp report sent successfully to ${recipient}`);
    } catch (error) {
        console.error(`❌ Failed to send WhatsApp message to ${recipient}:`, error);
    }
}
