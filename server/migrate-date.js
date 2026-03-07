require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'smartbus_db'
});

db.connect((err) => {
    if (err) {
        console.error('Connection failed:', err);
        return;
    }
    const sql = 'ALTER TABLE buses ADD COLUMN IF NOT EXISTS travel_date DATE;';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error adding travel_date:', err);
        } else {
            console.log('travel_date column added (or already exists).');
        }
        process.exit();
    });
});
