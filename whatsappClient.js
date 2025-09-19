import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import qrcode from 'qrcode-terminal';

let client;
let isClientReady = false;

export function initializeWhatsAppClient() {
    console.log('Initializing WhatsApp client...');
    client = new Client({
        authStrategy: new LocalAuth({ dataPath: 'whatsapp_session' }),
        puppeteer: {
            headless: true,
            channel: 'chrome',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    client.on('qr', qr => qrcode.generate(qr, { small: true }));
    client.on('ready', () => { isClientReady = true; console.log('✅ WhatsApp client is ready!'); });
    
    client.initialize();
}

export async function sendPdfReportToWhatsapp(pdfBuffer, caption) {
    if (!isClientReady || !process.env.WHATSAPP_RECIPIENT_NUMBER) return;
    try {
        const media = new MessageMedia('application/pdf', pdfBuffer.toString('base64'), 'Hotel-Review.pdf');
        await client.sendMessage(`${process.env.WHATSAPP_RECIPIENT_NUMBER}@c.us`, media, { caption: caption });
        console.log(`✅ WhatsApp report sent successfully.`);
    } catch (error) {
        console.error(`❌ Failed to send WhatsApp message:`, error);
    }
}
