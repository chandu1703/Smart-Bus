const mysql = require('mysql2/promise');

const buses = [
    {
        name: 'Horizon Express',
        type: 'A/C Luxury Sleeper',
        departure_city: 'New York',
        arrival_city: 'Boston',
        departure_time: '08:00:00',
        arrival_time: '14:00:00',
        price: 1200,
        total_seats: 32,
        current_lat: 40.7128,
        current_lng: -74.0060,
        driver_name: 'Rahul Sharma',
        driver_phone: '9876543210',
        amenities: 'WiFi, AC, Charging, Water',
        travel_date: '2026-03-07'
    },
    {
        name: 'Rapid Transit',
        type: 'Express Seater',
        departure_city: 'New York',
        arrival_city: 'Boston',
        departure_time: '10:30:00',
        arrival_time: '16:30:00',
        price: 800,
        total_seats: 40,
        current_lat: 40.7128,
        current_lng: -74.0060,
        driver_name: 'Amit Kumar',
        driver_phone: '9876543211',
        amenities: 'AC, Charging',
        travel_date: '2026-03-07'
    },
    {
        name: 'Night Owl',
        type: 'Premium Sleeper',
        departure_city: 'Chicago',
        arrival_city: 'Detroit',
        departure_time: '22:00:00',
        arrival_time: '06:00:00',
        price: 1500,
        total_seats: 30,
        current_lat: 41.8781,
        current_lng: -87.6298,
        driver_name: 'Suresh Raina',
        driver_phone: '9876543212',
        amenities: 'WiFi, AC, Bed, Snacks',
        travel_date: '2026-03-07'
    }
];

async function seed() {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Chandu@1712',
        database: 'smartbus_db'
    });

    console.log('Seeding buses...');

    for (const bus of buses) {
        try {
            await db.query(`
                INSERT INTO buses 
                (name, type, departure_city, arrival_city, departure_time, arrival_time, price, total_seats, current_lat, current_lng, driver_name, driver_phone, amenities, travel_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                bus.name, bus.type, bus.departure_city, bus.arrival_city,
                bus.departure_time, bus.arrival_time, bus.price, bus.total_seats,
                bus.current_lat, bus.current_lng, bus.driver_name, bus.driver_phone,
                bus.amenities, bus.travel_date
            ]);
            console.log(`Added bus: ${bus.name} for ${bus.travel_date}`);
        } catch (err) {
            if (err.code === 'ER_BAD_FIELD_ERROR' && err.message.includes('travel_date')) {
                console.log('travel_date column missing, attempting to add it...');
                await db.query('ALTER TABLE buses ADD COLUMN travel_date DATE');
                // Retry
                await db.query(`
                    INSERT INTO buses 
                    (name, type, departure_city, arrival_city, departure_time, arrival_time, price, total_seats, current_lat, current_lng, driver_name, driver_phone, amenities, travel_date)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    bus.name, bus.type, bus.departure_city, bus.arrival_city,
                    bus.departure_time, bus.arrival_time, bus.price, bus.total_seats,
                    bus.current_lat, bus.current_lng, bus.driver_name, bus.driver_phone,
                    bus.amenities, bus.travel_date
                ]);
                console.log(`Added bus: ${bus.name} after adding column`);
            } else {
                console.error(`Error adding bus ${bus.name}:`, err.message);
            }
        }
    }

    await db.end();
}

seed();
