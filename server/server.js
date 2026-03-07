require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/socket.io/"
});

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "smartbus_secret_key_123";

/* ===========================
   ✅ MYSQL CONNECTION (PROMISE POOL)
=========================== */

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 4000,
    ssl: {
        rejectUnauthorized: true,
        // TiDB Cloud often requires the CA certificate or just minVersion: 'TLSv1.2'
        minVersion: 'TLSv1.2'
    },
    waitForConnections: true,
    connectionLimit: 10,
    connectTimeout: 10000 // 10s timeout for production
});

// Test connection and log errors
db.getConnection()
    .then(conn => {
        console.log("✅ Successfully connected to TiDB Cloud");
        conn.release();
    })
    .catch(err => {
        console.error("❌ DATABASE CONNECTION ERROR:", err.message);
        console.error("Check your .env variables and TiDB Cloud IP Whitelist.");
    });

// Helper to calculate distance in KM
const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

(async () => {
    try {
        const conn = await db.getConnection();
        console.log("Connected to MySQL Database");
        conn.release();
    } catch (err) {
        console.error("MySQL Connection Failed:", err);
    }
})();

/* ===========================
   SOCKET.IO
=========================== */

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join-bus", (busId) => {
        socket.join(`bus-${busId}`);
    });

    socket.on("update-location", async ({ busId, lat, lng }) => {
        try {
            await db.query(
                "UPDATE buses SET current_lat=?, current_lng=? WHERE id=?",
                [lat, lng, busId]
            );

            // AUTO-DROP LOGIC: If bus reaches a stop, free up seats for those passengers
            const [stops] = await db.query("SELECT * FROM bus_stops WHERE bus_id = ?", [busId]);
            if (stops && stops.length > 0) {
                for (const stop of stops) {
                    const dist = getDistance(lat, lng, stop.lat, stop.lng);
                    if (dist < 0.5) { // Within 500m of the station
                        await db.query(
                            "UPDATE passengers SET dropped_at = NOW(), is_active = FALSE WHERE bus_id = ? AND LOWER(destination_point) = LOWER(?) AND dropped_at IS NULL",
                            [busId, stop.stop_name]
                        );
                    }
                }
            }

            io.to(`bus-${busId}`).emit("location-update", { busId, lat, lng });
        } catch (err) {
            console.error(err);
        }
    });

    socket.on("disconnect", () =>
        console.log("Client disconnected")
    );
});

/* ===========================
   AUTH
=========================== */

app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const hashed = await bcrypt.hash(password, 10);

        await db.query(
            "INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)",
            [name, email, hashed, "User"]
        );

        res.status(201).json({ message: "User registered" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Email exists or server error" });
    }
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const [rows] = await db.query(
            "SELECT * FROM users WHERE email=?",
            [email]
        );

        if (!rows.length)
            return res.status(401).json({ error: "Invalid credentials" });

        const user = rows[0];

        const match = await bcrypt.compare(password, user.password);
        if (!match)
            return res.status(401).json({ error: "Invalid credentials" });

        const token = jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: "2h" }
        );

        res.json({ token, user });
    } catch (err) {
        res.status(500).json(err);
    }
});

app.post('/api/bookings', async (req, res) => {
    try {
        const { bookingId, busId, userId, travelDate, totalAmount, email, phone, passengers, paymentMethod } = req.body;
        console.log("CREATING BOOKING:", bookingId, "Bus:", busId, "Date:", travelDate);

        const bookingSql = 'INSERT INTO bookings (booking_id, bus_id, user_id, travel_date, total_amount, contact_email, contact_phone, payment_method, payment_status, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

        const pStatus = req.body.paymentStatus || 'Pending';
        const bStatus = req.body.status || 'Pending';

        await db.query(bookingSql, [bookingId, busId, userId || null, travelDate, totalAmount, email, phone, paymentMethod || 'Instant', pStatus, bStatus]);

        if (passengers && passengers.length > 0) {
            const passengerSql = 'INSERT INTO passengers (booking_id, bus_id, seat_number, name, age, gender, boarding_point, destination_point) VALUES ?';
            const passengerData = passengers.map(p => [
                bookingId,
                busId,
                p.seatId,
                p.name,
                p.age,
                p.gender,
                req.body.boardingPoint || null,
                req.body.droppingPoint || null
            ]);

            // For mysql2/promise .query(sql, [data]) where data is [[...],[...]]
            await db.query(passengerSql, [passengerData]);
        }

        console.log("BOOKING SUCCESS:", bookingId);
        res.json({ message: 'Booking created successfully', bookingId });
    } catch (err) {
        console.error("BOOKING ERROR:", err);
        res.status(500).json({ error: 'Failed to create booking', details: err.message });
    }
});

app.get('/api/buses/:id', async (req, res) => {
    try {
        const busId = req.params.id;
        const [busRows] = await db.query('SELECT * FROM buses WHERE id = ?', [busId]);
        if (!busRows.length) return res.status(404).json({ error: 'Bus not found' });

        const [stopRows] = await db.query('SELECT * FROM bus_stops WHERE bus_id = ? ORDER BY stop_order', [busId]);
        const bus = busRows[0];
        bus.stops = stopRows;
        res.json(bus);
    } catch (err) {
        console.error("GET BUS ERROR:", err);
        res.status(500).json(err);
    }
});

app.post('/api/bookings/pay', async (req, res) => {
    try {
        const { bookingId, paymentStatus, paymentMethod, paymentIntentId } = req.body;
        await db.query(
            'UPDATE bookings SET payment_status = ?, payment_method = ?, status = ?, payment_intent_id = ? WHERE booking_id = ?',
            [paymentStatus, paymentMethod, paymentStatus === 'Paid' ? 'Confirmed' : 'Pending', paymentIntentId, bookingId]
        );
        res.json({ message: 'Payment processed successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Payment update failed' });
    }
});

app.get('/api/bookings/user/:userId', async (req, res) => {
    try {
        const query = `
            SELECT b.*, bus.name as bus_name, bus.departure_city, bus.arrival_city, bus.departure_time 
            FROM bookings b 
            JOIN buses bus ON b.bus_id = bus.id 
            WHERE b.user_id = ? 
            ORDER BY b.created_at DESC
        `;
        const [results] = await db.query(query, [req.params.userId]);
        res.json(results);
    } catch (err) {
        res.status(500).json(err);
    }
});

app.get('/api/bookings/status/:bookingId', async (req, res) => {
    try {
        const bookingId = req.params.bookingId;
        const query = `
            SELECT b.*, bus.name as bus_name, bus.departure_time, bus.arrival_time, bus.departure_city, bus.arrival_city, bus.driver_name, bus.driver_phone
            FROM bookings b
            JOIN buses bus ON b.bus_id = bus.id
            WHERE b.booking_id = ?
        `;

        const [results] = await db.query(query, [bookingId]);
        if (results.length === 0) return res.status(404).json({ error: 'Booking not found' });

        const booking = results[0];
        const [pResults] = await db.query('SELECT * FROM passengers WHERE booking_id = ?', [bookingId]);
        booking.passengers = pResults;
        res.json(booking);
    } catch (err) {
        res.status(500).json(err);
    }
});

app.post('/api/bookings/cancel/:bookingId', async (req, res) => {
    try {
        const bookingId = req.params.bookingId;
        await db.query('UPDATE bookings SET status = "Cancelled" WHERE booking_id = ?', [bookingId]);
        res.json({ message: 'Ticket cancelled successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Cancellation failed' });
    }
});

/* ===========================
   GET BUSES
=========================== */

app.get("/api/buses/:busId/occupied-seats", async (req, res) => {
    try {
        const { busId } = req.params;
        const { from, to } = req.query;

        // Fetch bus and stops to determine sequence
        const [busRows] = await db.query("SELECT * FROM buses WHERE id = ?", [busId]);
        if (!busRows.length) return res.status(404).json({ error: "Bus not found" });
        const bus = busRows[0];

        const [allStops] = await db.query("SELECT stop_name, stop_order FROM bus_stops WHERE bus_id = ? ORDER BY stop_order", [busId]);

        // Helper to get order for a city name
        const getOrder = (cityName) => {
            if (!cityName) return 0;
            const stop = allStops.find(s => s.stop_name.toLowerCase() === cityName.toLowerCase());
            if (stop) return stop.stop_order;
            if (cityName.toLowerCase() === bus.departure_city.toLowerCase()) return -1;
            if (cityName.toLowerCase() === bus.arrival_city.toLowerCase()) return 10000;
            return 0; // Default fallback
        };

        const [allPassengers] = await db.query(
            "SELECT * FROM passengers WHERE bus_id = ? AND is_active = 1 AND dropped_at IS NULL",
            [busId]
        );

        if (from && to) {
            const searchFromOrder = getOrder(from);
            const searchToOrder = getOrder(to);

            // Filter passengers whose journey overlaps with the searched segment
            const occupied = allPassengers.filter(p => {
                const pFromOrder = getOrder(p.boarding_point);
                const pToOrder = getOrder(p.destination_point);

                // Segment Overlap Rule: (PassengerEnd > SearchStart) AND (PassengerStart < SearchEnd)
                return pToOrder > searchFromOrder && pFromOrder < searchToOrder;
            });

            return res.json(occupied);
        }

        // Fallback or default (no from/to provided): Show all active bookings
        res.json(allPassengers);
    } catch (err) {
        console.error("OCCUPIED SEATS ERROR:", err);
        res.status(500).json(err);
    }
});

app.get("/api/buses", async (req, res) => {
    try {
        const { from, to, date } = req.query;
        console.log("BUS SEARCH REQUEST - From:", from, "To:", to, "Date:", date);

        // Advanced Search: Join with bus_stops to support intermediate stations and sequence checking
        let query = `
            SELECT DISTINCT b.* 
            FROM buses b
            JOIN bus_stops s_from ON b.id = s_from.bus_id
            JOIN bus_stops s_to ON b.id = s_to.bus_id
            WHERE s_from.stop_order < s_to.stop_order
        `;
        const params = [];

        if (from) {
            query += " AND LOWER(s_from.stop_name) LIKE LOWER(?)";
            params.push(`${from}%`);
        }
        if (to) {
            query += " AND LOWER(s_to.stop_name) LIKE LOWER(?)";
            params.push(`${to}%`);
        }
        if (date) {
            query += " AND b.travel_date = ?";
            params.push(date);
        }

        const [rows] = await db.query(query, params);

        // Fallback to original columns if no intermediate stops match (or if stops table is incomplete for that route)
        if (rows.length === 0) {
            let fallbackQuery = "SELECT * FROM buses WHERE 1=1";
            const fallbackParams = [];
            if (from) { fallbackQuery += " AND LOWER(departure_city) LIKE LOWER(?)"; fallbackParams.push(`${from}%`); }
            if (to) { fallbackQuery += " AND LOWER(arrival_city) LIKE LOWER(?)"; fallbackParams.push(`${to}%`); }
            if (date) { fallbackQuery += " AND travel_date = ?"; fallbackParams.push(date); }

            const [fallbackRows] = await db.query(fallbackQuery, fallbackParams);
            return res.json(fallbackRows);
        }

        res.json(rows);
    } catch (err) {
        console.error("GET BUSES ERROR:", err);
        res.status(500).json(err);
    }
});

app.get("/api/buses/track/:busId", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT id, name, current_lat as lat, current_lng as lng, driver_name, status FROM buses WHERE id = ?",
            [req.params.busId]
        );
        if (rows.length === 0) return res.status(404).json({ error: "Bus not found" });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json(err);
    }
});

/* ===========================
   ✅ ADMIN ADD BUS (FIXED)
=========================== */

app.post("/api/admin/buses", async (req, res) => {
    try {
        const {
            name,
            type,
            departure_city,
            arrival_city,
            departure_time,
            arrival_time,
            price,
            total_seats,
            lat,
            lng,
            driver_name,
            driver_phone,
            amenities,
            stops,
            travel_date
        } = req.body;

        const [result] = await db.query(
            `INSERT INTO buses
      (name,type,departure_city,arrival_city,
       departure_time,arrival_time,price,total_seats,
       current_lat,current_lng,
       driver_name,driver_phone,amenities,travel_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                name,
                type,
                departure_city,
                arrival_city,
                departure_time,
                arrival_time,
                price,
                total_seats || 40,
                lat || 12.9716,
                lng || 77.5946,
                driver_name,
                driver_phone,
                amenities,
                travel_date
            ]
        );

        const busId = result.insertId;

        /* Insert stops */
        if (stops?.length) {
            const stopData = stops.map((s, i) => [
                busId,
                s.name,
                s.arrival,
                s.departure,
                i
            ]);

            await db.query(
                `INSERT INTO bus_stops
        (bus_id,stop_name,arrival_time,departure_time,stop_order)
        VALUES ?`,
                [stopData]
            );
        }

        res.json({
            message: "Bus added successfully",
            id: busId
        });
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});

/* ===========================
   DRIVER DASHBOARD APIs
=========================== */

app.get("/api/driver/stats/:busId", async (req, res) => {
    try {
        const busId = req.params.busId;
        const { lat, lng } = req.query; // Dashboard sends its current GPS

        const [busRows] = await db.query("SELECT * FROM buses WHERE id = ?", [busId]);
        if (!busRows.length) return res.status(404).json({ error: "Bus not found" });
        const bus = busRows[0];

        // Total Occupied (Reserved + Boarded)
        const [allOccRows] = await db.query(
            "SELECT COUNT(*) as count FROM passengers WHERE bus_id = ? AND dropped_at IS NULL",
            [busId]
        );
        const occupiedCount = allOccRows[0].count;

        // Boarded only (Scanned)
        const [boardedRows] = await db.query(
            "SELECT COUNT(*) as count FROM passengers WHERE bus_id = ? AND scanned_at IS NOT NULL AND dropped_at IS NULL",
            [busId]
        );
        const boardedCount = boardedRows[0].count;

        // Calculate Stops proximity
        const [stops] = await db.query("SELECT * FROM bus_stops WHERE bus_id = ? ORDER BY stop_order", [busId]);

        let currentStop = "In Transit";
        let nextStop = "End of Route";
        let dropNextStopCount = 0;

        if (lat && lng && stops.length > 0) {
            // Find closest stop within 500m
            const sortedStops = stops.map(s => ({
                ...s,
                dist: getDistance(lat, lng, s.lat, s.lng)
            })).sort((a, b) => a.dist - b.dist);

            const closest = sortedStops[0];
            if (closest.dist < 0.5) { // within 500m
                currentStop = closest.stop_name;
                const next = stops.find(s => s.stop_order === closest.stop_order + 1);
                nextStop = next ? next.stop_name : "Terminus";
            } else {
                // Between stops
                const passed = stops.filter(s => {
                    // Primitive logic: if we are closer to the next stop in order
                    return getDistance(lat, lng, s.lat, s.lng) < 2;
                });
                nextStop = stops.find(s => s.stop_order > (passed[passed.length - 1]?.stop_order || 0))?.stop_name || "Destination";
            }
        }

        // Drop count for next stop
        const [dropRows] = await db.query(
            "SELECT COUNT(*) as count FROM passengers WHERE bus_id = ? AND LOWER(destination_point) = LOWER(?) AND scanned_at IS NOT NULL AND dropped_at IS NULL",
            [busId, nextStop]
        );

        res.json({
            totalSeats: bus.total_seats || 32,
            availableSeats: (bus.total_seats || 32) - occupiedCount,
            boardedCount: boardedCount,
            occupiedCount: occupiedCount,
            currentStop: currentStop,
            nextStop: nextStop,
            dropNextStop: dropRows[0].count,
            boardNextStop: 3
        });
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});

app.get("/api/driver/verify-passenger", async (req, res) => {
    try {
        const { ticketId, busId } = req.query;
        const [rows] = await db.query(
            "SELECT * FROM passengers WHERE bus_id = ? AND (booking_id = ? OR name = ?) AND scanned_at IS NULL",
            [busId, ticketId, ticketId]
        );

        if (!rows.length) {
            return res.status(404).json({ error: "No valid passengers found for this ticket/name" });
        }

        res.json(rows); // Return all matching passengers
    } catch (err) {
        res.status(500).json(err);
    }
});

app.post("/api/driver/board", async (req, res) => {
    try {
        const { ticketId, busId } = req.body;
        // Find passenger by booking_id or name (if ticketId is a name)
        const [result] = await db.query(
            "UPDATE passengers SET scanned_at = NOW(), is_active = TRUE WHERE bus_id = ? AND (booking_id = ? OR name = ?) AND scanned_at IS NULL",
            [busId, ticketId, ticketId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Valid passenger not found or already boarded" });
        }

        res.json({ message: `Boarding confirmed for ${ticketId}` });
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});

/* ===========================
   SERVER START
=========================== */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`)
);