require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
});

db.connect((err) => {
    if (err) {
        console.error(`Error connecting to MySQL with ${process.env.DB_USER}:`, err.message);
        return;
    }
    console.log(`Successfully connected to MySQL with ${process.env.DB_USER}!`);
    db.query('CREATE DATABASE IF NOT EXISTS smartbus_db;', (err) => {
        if (err) console.error('Error creating database:', err);
        else console.log('Database smartbus_db confirmed.');
        process.exit();
    });
});
