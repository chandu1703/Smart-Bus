require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const fs = require('fs');
const mysql = require('mysql2');
const path = require('path');

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'smartbus_db',
    multipleStatements: true
});

db.connect((err) => {
    if (err) {
        console.error('Connection failed:', err);
        return;
    }
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    db.query(schemaSql, (err, results) => {
        if (err) {
            console.error('Error executing schema.sql:', err);
        } else {
            console.log('Schema executed successfully.');
        }
        process.exit();
    });
});
