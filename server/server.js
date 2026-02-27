require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'smartbus_secret_key_123';

// MySQL Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smartbus_db'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL Database');
});

// --- AUTH ENDPOINTS ---

app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        [name, email, hashedPassword], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Email already exists or server error' });
            }
            res.status(201).json({ message: 'User registered successfully' });
        });
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err || results.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '2h' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    });
});

// --- BOOKING ENDPOINTS ---

app.get('/api/buses', (req, res) => {
    db.query('SELECT * FROM buses', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/bookings', (req, res) => {
    const { bookingId, busId, userId, travelDate, totalAmount, email, phone, passengers, paymentMethod } = req.body;

    const bookingSql = 'INSERT INTO bookings (booking_id, bus_id, user_id, travel_date, total_amount, contact_email, contact_phone, payment_method, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

    db.query(bookingSql, [bookingId, busId, userId || null, travelDate, totalAmount, email, phone, paymentMethod || 'Pending', 'Pending'], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to create booking' });
        }

        const passengerSql = 'INSERT INTO passengers (booking_id, seat_number, name, age, gender) VALUES ?';
        const passengerData = passengers.map(p => [bookingId, p.seatId, p.name, p.age, p.gender]);

        db.query(passengerSql, [passengerData], (err, pResult) => {
            if (err) return res.status(500).json({ error: 'Failed to insert passengers' });
            res.json({ message: 'Booking created, pending payment', bookingId });
        });
    });
});

app.post('/api/bookings/pay', (req, res) => {
    const { bookingId, paymentStatus, paymentMethod } = req.body;
    db.query('UPDATE bookings SET payment_status = ?, payment_method = ?, status = ? WHERE booking_id = ?',
        [paymentStatus, paymentMethod, paymentStatus === 'Paid' ? 'Confirmed' : 'Confirmed', bookingId], (err, result) => {
            if (err) return res.status(500).json({ error: 'Payment update failed' });
            res.json({ message: 'Payment processed successfully' });
        });
});

// Get Ticket Status & Details
app.get('/api/bookings/status/:bookingId', (req, res) => {
    const bookingId = req.params.bookingId;
    const query = `
        SELECT b.*, bus.name as bus_name, bus.departure_time, bus.arrival_time, bus.departure_city, bus.arrival_city
        FROM bookings b
        JOIN buses bus ON b.bus_id = bus.id
        WHERE b.booking_id = ?
    `;

    db.query(query, [bookingId], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ error: 'Booking not found' });

        const booking = results[0];
        db.query('SELECT * FROM passengers WHERE booking_id = ?', [bookingId], (err, pResults) => {
            booking.passengers = pResults;
            res.json(booking);
        });
    });
});

// Cancel Ticket
app.post('/api/bookings/cancel/:bookingId', (req, res) => {
    const bookingId = req.params.bookingId;
    db.query('UPDATE bookings SET status = "Cancelled" WHERE booking_id = ?', [bookingId], (err, result) => {
        if (err) return res.status(500).json({ error: 'Cancellation failed' });
        res.json({ message: 'Ticket cancelled successfully' });
    });
});

// Tracking
app.get('/api/buses/track/:busId', (req, res) => {
    const busId = req.params.busId;
    db.query('SELECT current_lat, current_lng, name FROM buses WHERE id = ?', [busId], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ error: 'Bus not found' });
        const jitterLat = (Math.random() - 0.5) * 0.01;
        const jitterLng = (Math.random() - 0.5) * 0.01;
        res.json({
            lat: parseFloat(results[0].current_lat) + jitterLat,
            lng: parseFloat(results[0].current_lng) + jitterLng,
            name: results[0].name
        });
    });
});

// --- ADMIN ENDPOINTS ---

app.get('/api/admin/stats', (req, res) => {
    const queries = {
        totalBookings: 'SELECT COUNT(*) as count FROM bookings',
        revenue: 'SELECT SUM(total_amount) as total FROM bookings WHERE payment_status = "Paid"',
        activeBuses: 'SELECT COUNT(*) as count FROM buses',
        cancelledBookings: 'SELECT COUNT(*) as count FROM bookings WHERE status = "Cancelled"'
    };

    const stats = {};
    let completed = 0;
    const keys = Object.keys(queries);

    keys.forEach(key => {
        db.query(queries[key], (err, result) => {
            if (!err) {
                stats[key] = result[0].count !== undefined ? result[0].count : (result[0].total || 0);
            } else {
                stats[key] = 0;
            }
            completed++;
            if (completed === keys.length) {
                res.json(stats);
            }
        });
    });
});

app.post('/api/admin/buses', (req, res) => {
    const { name, type, departure_city, arrival_city, departure_time, arrival_time, price, total_seats, lat, lng } = req.body;
    const sql = 'INSERT INTO buses (name, type, departure_city, arrival_city, departure_time, arrival_time, price, total_seats, current_lat, current_lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [name, type, departure_city, arrival_city, departure_time, arrival_time, price, total_seats || 40, lat || 40.7128, lng || -74.0060], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json(err);
        }
        res.json({ message: 'Bus added successfully', id: result.insertId });
    });
});

// --- REAL-TIME SEAT MANAGEMENT ---

// Get currently occupied seats for a bus
app.get('/api/buses/:busId/occupied-seats', (req, res) => {
    const busId = req.params.busId;
    const query = `
        SELECT seat_number, destination_point, name 
        FROM passengers 
        WHERE bus_id = ? AND is_active = TRUE
    `;
    db.query(query, [busId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Drop passenger (Release seat)
// This can be triggered by location-based geofencing or driver manual action
app.post('/api/passengers/drop', (req, res) => {
    const { busId, seatNumber } = req.body;
    const query = `
        UPDATE passengers 
        SET is_active = FALSE, dropped_at = CURRENT_TIMESTAMP 
        WHERE bus_id = ? AND seat_number = ? AND is_active = TRUE
    `;
    db.query(query, [busId, seatNumber], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: `Seat ${seatNumber} is now vacant.` });
    });
});

// Walk-on Booking (Dynamic)
app.post('/api/bookings/walk-on', (req, res) => {
    const { busId, seatNumber, destination, amount } = req.body;
    const bookingId = 'WALK-' + Math.random().toString(36).substr(2, 6).toUpperCase();

    // 1. Create a dummy booking for records
    const bookingSql = 'INSERT INTO bookings (booking_id, bus_id, travel_date, total_amount, status, payment_status, payment_method) VALUES (?, ?, CURDATE(), ?, "Confirmed", "Paid", "UPI-QR")';

    db.query(bookingSql, [bookingId, busId, amount], (err, result) => {
        if (err) return res.status(500).json(err);

        // 2. Occupy the seat immediately
        const passengerSql = 'INSERT INTO passengers (booking_id, bus_id, seat_number, name, destination_point, scanned_at, is_active) VALUES (?, ?, ?, "Walk-on Passenger", ?, CURRENT_TIMESTAMP, TRUE)';
        db.query(passengerSql, [bookingId, busId, seatNumber, destination], (err, pResult) => {
            if (err) return res.status(500).json(err);
            res.json({ message: 'Walk-on booking successful', bookingId, seatNumber });
        });
    });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
