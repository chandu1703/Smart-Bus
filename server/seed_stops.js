const mysql = require('mysql2/promise');

const stops = [
    { name: 'Hyderabad (MGBS)', lat: 17.3850, lng: 78.4867, order: 1 },
    { name: 'Suryapet', lat: 17.1425, lng: 79.6236, order: 2 },
    { name: 'Kurnool', lat: 15.8281, lng: 78.0373, order: 3 },
    { name: 'Kadapa', lat: 14.4673, lng: 78.8242, order: 4 },
    { name: 'Nellore', lat: 14.4426, lng: 79.9865, order: 5 }
];

async function seed() {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Chandu@1712',
        database: 'smartbus_db'
    });

    console.log('Updating stops for Hyderabad -> Nellore bus...');

    // Clear existing stops for bus 1
    await db.query('DELETE FROM bus_stops WHERE bus_id = 1');

    for (const stop of stops) {
        try {
            await db.query(`
                INSERT INTO bus_stops (bus_id, stop_name, lat, lng, stop_order)
                VALUES (?, ?, ?, ?, ?)
            `, [1, stop.name, stop.lat, stop.lng, stop.order]);
            console.log(`Added stop: ${stop.name}`);
        } catch (err) {
            console.error(`Error adding stop ${stop.name}:`, err.message);
        }
    }

    await db.end();
}

seed();
