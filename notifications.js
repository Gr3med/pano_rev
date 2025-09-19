import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export async function sendReportEmail(subject, pdfBuffer) {
    if (!process.env.EMAIL_RECIPIENT || !process.env.EMAIL_USER) {
        return console.warn("⚠️ Email variables not configured. Skipping email.");
    }
    const mailOptions = {
        from: `"${'تقارير فندق بانوراما'}" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_RECIPIENT,
        subject: subject,
        html: '<div dir="rtl"><h1>تقييم جديد</h1><p>التقرير المفصل مرفق.</p></div>',
        attachments: [{
            filename: `Guest-Review-${Date.now()}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
        }]
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email report sent successfully to ${process.env.EMAIL_RECIPIENT}`);
    } catch (error) {
        console.error("❌ Failed to send email:", error);
    }
}
