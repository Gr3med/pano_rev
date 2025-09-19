import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
    },
});

export async function sendEmailWithAttachment({ pdfBuffer, fileName, subject, bodyHtml }) {
    if (!process.env.EMAIL_RECIPIENT) {
        console.warn("⚠️ EMAIL_RECIPIENT is not set. Skipping email.");
        return;
    }

    const mailOptions = {
        from: `"${'تقارير فندق بانوراما'}" <${process.env.SMTP_USERNAME}>`,
        to: process.env.EMAIL_RECIPIENT,
        subject: subject,
        html: `<div dir="rtl">${bodyHtml}</div>`,
        attachments: [{
            filename: fileName,
            content: pdfBuffer,
            contentType: 'application/pdf'
        }]
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to ${process.env.EMAIL_RECIPIENT}`);
    } catch (error) {
        console.error("❌ Failed to send email:", error);
    }
}