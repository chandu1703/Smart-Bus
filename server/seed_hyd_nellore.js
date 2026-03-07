const mysql = require('mysql2/promise');

const buses = [
    {
        name: 'TSRTC Special',
        type: 'Smart A/C Seater',
        departure_city: 'Hyderabad',
        arrival_city: 'Nellore',
        departure_time: '19:17:00',
        arrival_time: '07:12:00',
        price: 950,
        total_seats: 40,
        current_lat: 17.3850,
        current_lng: 78.4867,
        driver_name: 'Srinivas',
        driver_phone: '9988776655',
        amenities: 'AC, Charging',
        travel_date: '2026-03-03' // Bus on 3rd (Past)
    },
    {
        name: 'Nellore Express',
        type: 'Executive Seater',
        departure_city: 'Hyderabad',
        arrival_city: 'Nellore',
        departure_time: '21:00:00',
        arrival_time: '05:00:00',
        price: 1100,
        total_seats: 36,
        current_lat: 17.3850,
        current_lng: 78.4867,
        driver_name: 'Venkatesh',
        driver_phone: '9944332211',
        amenities: 'WiFi, AC, Snacks',
        travel_date: '2026-04-03' // Bus on 3rd (Future - April)
    },
    {
        name: 'Super Fast Hyd',
        type: 'Express',
        departure_city: 'Hyderabad',
        arrival_city: 'Nellore',
        departure_time: '23:30:00',
        arrival_time: '06:00:00',
        price: 850,
        total_seats: 45,
        current_lat: 17.3850,
        current_lng: 78.4867,
        driver_name: 'Anil',
        driver_phone: '9911223344',
        amenities: 'AC',
        travel_date: '2026-03-13' // Bus on 13th (Future - March)
    },
    {
        name: 'Chandu (Today)',
        type: 'Smart A/C Seater',
        departure_city: 'Hyderabad',
        arrival_city: 'Nellore',
        departure_time: '19:17:00',
        arrival_time: '07:12:00',
        price: 950,
        total_seats: 40,
        current_lat: 17.3850,
        current_lng: 78.4867,
        driver_name: 'Srinivas',
        driver_phone: '9988776655',
        amenities: 'AC, Charging',
        travel_date: '2026-03-07' // Bus on Today
    }
];

async function seed() {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Chandu@1712',
        database: 'smartbus_db'
    });

    console.log('Adding Hyderabad -> Nellore buses...');

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
            console.log(`Added: ${bus.name} for ${bus.travel_date}`);
        } catch (err) {
            console.error(`Error adding bus ${bus.name}:`, err.message);
        }
    }

    await db.end();
}

seed();
