import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// استخدام رابط الاتصال الخارجي الذي يوفره Render
// هذا هو الأسلوب الموصى به
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

export { pool };

// دالة للتأكد من وجود الجدول وإنشائه إذا لم يكن موجوداً
export async function initializeDatabase() {
    // تم تعديل الكود ليتوافق مع PostgreSQL
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        date VARCHAR(255),
        floor INT,
        roomNumber INT,
        guestName VARCHAR(255),
        guestPhone VARCHAR(255),
        email VARCHAR(255),
        internet INT,
        maintenance INT,
        reception INT,
        bathroom INT,
        laundry INT,
        security INT,
        minimarket INT,
        lobby INT,
        restaurant INT,
        cleanliness INT,
        suggestions TEXT,
        createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );`;
    try {
        await pool.query(createTableQuery);
        console.log("✅ PostgreSQL Database and 'reviews' table are ready.");
    } catch (error) {
        console.error("❌ Failed to initialize database table:", error);
        process.exit(1);
    }
}