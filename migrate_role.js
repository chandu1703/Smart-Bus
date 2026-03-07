const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'server/.env' });

async function migrate() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });

    try {
        await db.query(`ALTER TABLE users MODIFY COLUMN role ENUM('User', 'Admin', 'Driver') DEFAULT 'User'`);
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
migrate();
