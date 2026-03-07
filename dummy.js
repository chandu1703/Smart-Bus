require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_51BTX0hI8E4W4z7X9X8X8X8X8X8X8X');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    path: '/socket.io/'
});

console.log('Socket.io initialized on server');

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'smartbus_secret_key_123';

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

// --- SOCKET.IO HANDLING ---
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join a bus tracking room
    socket.on('join-bus', (busId) => {
        socket.join(`bus-${busId}`);
        console.log(`Client joined bus tracking: bus-${busId}`);
    });

    // Update location (from driver app)
    socket.on('update-location', (data) => {
        const { busId, lat, lng } = data;
        // Update DB
        db.query('UPDATE buses SET current_lat = ?, current_lng = ? WHERE id = ?', [lat, lng, busId]);
        // Broadcast to clients in the room
        io.to(`bus-${busId}`).emit('location-update', { lat, lng });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// --- AUTH ENDPOINTS ---

app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, 'User'], (err, result) => {
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

// --- BUS ENDPOINTS ---

app.get('/api/buses', (req, res) => {
    const { from, to, date } = req.query;

    if (!from || !to) {
        return db.query('SELECT * FROM buses', (err, results) => {
            if (err) return res.status(500).json(err);
            res.json(results);
        });
    }

    // Advanced search logic: Checks main route AND intermediate stops in correct order
    const sql = `
        SELECT DISTINCT b.* 
        FROM buses b
        WHERE (
            -- Case 1: Direct match (Hyd -> Viz)
            (LOWER(b.departure_city) = LOWER(?) AND LOWER(b.arrival_city) = LOWER(?))
            -- Case 2: Source to Stop (Hyd -> Suryapet)
            OR (LOWER(b.departure_city) = LOWER(?) AND EXISTS (SELECT 1 FROM bus_stops s WHERE s.bus_id = b.id AND LOWER(s.stop_name) = LOWER(?)))
            -- Case 3: Stop to Destination (Suryapet -> Viz)
            OR (LOWER(b.arrival_city) = LOWER(?) AND EXISTS (SELECT 1 FROM bus_stops s WHERE s.bus_id = b.id AND LOWER(s.stop_name) = LOWER(?)))
            -- Case 4: Stop to Stop (Suryapet -> AnotherStop)
            OR EXISTS (
                SELECT 1 FROM bus_stops s1, bus_stops s2 
                WHERE s1.bus_id = b.id AND s2.bus_id = b.id 
                AND LOWER(s1.stop_name) = LOWER(?) AND LOWER(s2.stop_name) = LOWER(?) 
                AND s1.stop_order < s2.stop_order
            )
        )
        AND (? = '' OR ? IS NULL OR b.travel_date = ?)
    `;

    db.query(sql, [from, to, from, to, to, from, from, to, date, date, date], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json(err);
        }
        res.json(results);
    });
});

app.get('/api/buses/track/:id', (req, res) => {
    db.query('SELECT name, current_lat as lat, current_lng as lng, departure_time, travel_date FROM buses WHERE id = ?', [req.params.id], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ error: 'Bus not found' });
        res.json(results[0]);
    });
});

app.get('/api/buses/:id', (req, res) => {
    db.query('SELECT * FROM buses WHERE id = ?', [req.params.id], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ error: 'Bus not found' });
        const bus = results[0];
        db.query('SELECT * FROM bus_stops WHERE bus_id = ? ORDER BY stop_order', [bus.id], (err, stops) => {
            bus.stops = stops || [];
            res.json(bus);
        });
    });
});

// --- PAYMENT ENDPOINTS ---

app.post('/api/payment/create-intent', async (req, res) => {
    const { amount, bookingId } = req.body;
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Stripe expects cents
            currency: 'inr',
            metadata: { bookingId }
        });
        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- BOOKING ENDPOINTS ---

app.post('/api/bookings', (req, res) => {
    const { bookingId, busId, userId, travelDate, totalAmount, email, phone, passengers, paymentMethod } = req.body;

    const bookingSql = 'INSERT INTO bookings (booking_id, bus_id, user_id, travel_date, total_amount, contact_email, contact_phone, payment_method, payment_status, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

    db.query(bookingSql, [bookingId, busId, userId || null, travelDate, totalAmount, email, phone, paymentMethod || 'Pending', 'Pending', 'Pending'], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to create booking' });
        }

        const passengerSql = 'INSERT INTO passengers (booking_id, bus_id, seat_number, name, age, gender) VALUES ?';
        const passengerData = passengers.map(p => [bookingId, busId, p.seatId, p.name, p.age, p.gender]);

        db.query(passengerSql, [passengerData], (err, pResult) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Failed to insert passengers' });
            }
            res.json({ message: 'Booking created, pending payment', bookingId });
        });
    });
});

app.post('/api/bookings/pay', (req, res) => {
    const { bookingId, paymentStatus, paymentMethod, paymentIntentId } = req.body;
    db.query('UPDATE bookings SET payment_status = ?, payment_method = ?, status = ?, payment_intent_id = ? WHERE booking_id = ?',
        [paymentStatus, paymentMethod, paymentStatus === 'Paid' ? 'Confirmed' : 'Pending', paymentIntentId, bookingId], (err, result) => {
            if (err) return res.status(500).json({ error: 'Payment update failed' });
            res.json({ message: 'Payment processed successfully' });
        });
});

app.get('/api/bookings/user/:userId', (req, res) => {
    const query = `
        SELECT b.*, bus.name as bus_name, bus.departure_city, bus.arrival_city, bus.departure_time 
        FROM bookings b 
        JOIN buses bus ON b.bus_id = bus.id 
        WHERE b.user_id = ? 
        ORDER BY b.created_at DESC
    `;
    db.query(query, [req.params.userId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.get('/api/bookings/status/:bookingId', (req, res) => {
    const bookingId = req.params.bookingId;
    const query = `
        SELECT b.*, bus.name as bus_name, bus.departure_time, bus.arrival_time, bus.departure_city, bus.arrival_city, bus.driver_name, bus.driver_phone
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

app.post('/api/bookings/cancel/:bookingId', (req, res) => {
    const bookingId = req.params.bookingId;
    db.query('UPDATE bookings SET status = "Cancelled" WHERE booking_id = ?', [bookingId], (err, result) => {
        if (err) return res.status(500).json({ error: 'Cancellation failed' });
        res.json({ message: 'Ticket cancelled successfully' });
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
    const { name, type, departure_city, arrival_city, departure_time, arrival_time, price, total_seats, lat, lng, driver_name, driver_phone, amenities, stops, travel_date } = req.body;

    const sql = 'INSERT INTO buses (name, type, departure_city, arrival_city, departure_time, arrival_time, price, total_seats, current_lat, current_lng, driver_name, driver_phone, amenities, travel_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

    db.query(sql, [name, type, departure_city, arrival_city, departure_time, arrival_time, price, total_seats || 40, lat || 12.9716, lng || 77.5946, driver_name, driver_phone, amenities, travel_date], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json(err);
        }

        const busId = result.insertId;

        // Insert stops if provided
        if (stops && stops.length > 0) {
            const stopData = stops.map((s, idx) => [busId, s.name, s.arrival, s.departure, idx]);
            db.query('INSERT INTO bus_stops (bus_id, stop_name, arrival_time, departure_time, stop_order) VALUES ?', [stopData], (err) => {
                if (err) console.error('Error inserting stops:', err);
                res.json({ message: 'Bus and stops added successfully', id: busId });
            });
        } else {
            res.json({ message: 'Bus added successfully', id: busId });
        }
    });
});

// --- REAL-TIME SEAT MANAGEMENT ---

app.get('/api/buses/:busId/occupied-seats', (req, res) => {
    const busId = req.params.busId;
    const query = 'SELECT seat_number, name, gender, age FROM passengers WHERE bus_id = ? AND is_active = TRUE';
    db.query(query, [busId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/bookings/walk-on', (req, res) => {
    const { busId, seatNumber, destination, amount } = req.body;
    const bookingId = 'WALK-' + Math.random().toString(36).substr(2, 6).toUpperCase();

    db.query('INSERT INTO bookings (booking_id, bus_id, travel_date, total_amount, payment_status, status) VALUES (?, ?, CURDATE(), ?, "Paid", "Confirmed")',
        [bookingId, busId, amount], (err) => {
            if (err) return res.status(500).json(err);

            db.query('INSERT INTO passengers (booking_id, bus_id, seat_number, name, is_active) VALUES (?, ?, ?, ?, TRUE)',
                [bookingId, busId, seatNumber, 'Walk-on Passenger'], (err) => {
                    if (err) return res.status(500).json(err);
                    res.json({ message: 'Walk-on booking success' });
                });
        });
});

app.post('/api/passengers/drop', (req, res) => {
    const { busId, seatNumber } = req.body;
    db.query('UPDATE passengers SET is_active = FALSE WHERE bus_id = ? AND seat_number = ? AND is_active = TRUE',
        [busId, seatNumber], (err) => {
            if (err) return res.status(500).json(err);
            res.json({ message: 'Passenger dropped' });
        });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
