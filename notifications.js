const nodemailer = require('nodemailer');
require('dotenv').config();

// إعداد خدمة إرسال البريد الإلكتروني باستخدام المعلومات من ملف .env
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendReportEmail(subject, htmlContent, attachments) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("⚠️  تنبيه: لم يتم تكوين متغيرات البريد الإلكتروني في ملف .env، سيتم تخطي إرسال الإيميل.");
        return;
    }

    const mailOptions = {
        from: `"${'تقارير فندق بانوراما'}" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_RECIPIENT,
        subject: subject,
        html: htmlContent,
        attachments: attachments
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ تم إرسال تقرير البريد الإلكتروني بنجاح إلى ${process.env.EMAIL_RECIPIENT}`);
    } catch (error) {
        console.error("❌ فشل في إرسال البريد الإلكتروني. تأكد من صحة بيانات الإيميل وكلمة مرور التطبيقات في ملف .env.", error);
    }
}

module.exports = { sendReportEmail };