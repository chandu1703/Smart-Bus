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
   🔐 AUTH MIDDLEWARE
=========================== */

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "No token provided" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token session" });
        req.user = user;
        next();
    });
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ error: "Auth required" });
        if (!roles.includes(req.user.role?.toLowerCase())) {
            return res.status(403).json({ error: "Insufficient privileges" });
        }
        next();
    };
};

/* ===========================
   ✅ ADMIN BUS MANAGEMENT
=========================== */

app.post("/api/admin/buses", authenticateToken, requireRole(['admin']), async (req, res) => {
    console.log("🚚 [ADMIN] Deploying new bus:", req.body.name);
    try {
        const {
            name, type, departure_city, arrival_city,
            departure_time, arrival_time, price, total_seats,
            lat, lng, driver_name, driver_phone, amenities,
            stops, travel_date, status
        } = req.body;

        const [result] = await db.query(
            `INSERT INTO buses 
            (name, type, departure_city, arrival_city, 
            departure_time, arrival_time, price, total_seats, 
            current_lat, current_lng, 
            driver_name, driver_phone, amenities, travel_date, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, type, departure_city, arrival_city,
                departure_time || null, arrival_time || null,
                parseFloat(price) || 0, parseInt(total_seats) || 40,
                lat || 17.3850, lng || 78.4867,
                driver_name, driver_phone, amenities,
                travel_date || null, status || 'Scheduled']
        );

        if (stops && stops.length > 0) {
            const stopData = stops.map((s, idx) => [
                result.insertId, s.name, s.arrival || null, s.departure || null,
                s.lat || 17.3850, s.lng || 78.4867, idx
            ]);
            await db.query(
                "INSERT INTO bus_stops (bus_id, stop_name, arrival_time, departure_time, lat, lng, stop_order) VALUES ?",
                [stopData]
            );
        }

        res.json({ message: "Bus deployed successfully", busId: result.insertId });
    } catch (err) {
        console.error("ADMIN BUS DEPLOY ERROR:", err);
        res.status(500).json({ error: "Failed to deploy bus", details: err.message });
    }
});

app.patch("/api/admin/buses/:id", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const fields = req.body;
        const keys = Object.keys(fields);
        const values = Object.values(fields);
        if (keys.length === 0) return res.status(400).json({ error: "No fields to update" });
        const setClause = keys.map(k => `${k} = ?`).join(', ');
        await db.query(`UPDATE buses SET ${setClause} WHERE id = ?`, [...values, req.params.id]);
        res.json({ message: "Bus updated successfully" });
    } catch (err) {
        res.status(500).json(err);
    }
});

app.delete("/api/admin/buses/:id", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        await db.query("DELETE FROM buses WHERE id = ?", [req.params.id]);
        res.json({ message: "Bus deleted successfully" });
    } catch (err) {
        res.status(500).json(err);
    }
});

app.get("/api/admin/stats", authenticateToken, requireRole(['admin']), async (req, res) => {
    console.log("📊 [ADMIN] Fetching dashboard stats");
    try {
        const [bookings] = await db.query("SELECT COUNT(*) as count FROM bookings");
        const [buses] = await db.query("SELECT COUNT(*) as count FROM buses");
        const [revenue] = await db.query("SELECT SUM(total_amount) as sum FROM bookings");
        const [cancellations] = await db.query("SELECT COUNT(*) as count FROM bookings WHERE status = 'Cancelled'");

        res.json({
            totalBookings: (bookings && bookings[0]?.count) || 0,
            activeBuses: (buses && buses[0]?.count) || 0,
            revenue: (revenue && revenue[0]?.sum) || 0,
            cancellations: (cancellations && cancellations[0]?.count) || 0
        });
    } catch (err) {
        console.error("ADMIN STATS ERROR:", err);
        res.status(500).json({ error: "Failed to fetch stats", details: err.message });
    }
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
            { expiresIn: "365d" } // Extended for driver console persistence
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

        // Improved Search Logic:
        // 1. If from/to are specified, we search for buses that have BOTH 'from' and 'to' in their route (either as main cities or intermediate stops)
        // 2. We MUST ensure the 'from' point comes BEFORE the 'to' point in the sequence (stop_order)

        if (!from || !to) {
            // Admin/Overview view: include occupancy stats
            const [rows] = await db.query(`
                SELECT b.*,
            (SELECT COUNT(*) FROM passengers p WHERE p.bus_id = b.id AND p.dropped_at IS NULL) as occupied_count,
        (SELECT COUNT(*) FROM passengers p WHERE p.bus_id = b.id AND p.scanned_at IS NOT NULL AND p.dropped_at IS NULL) as boarded_count
                FROM buses b 
                ORDER BY b.travel_date ASC, b.departure_time ASC
    `);
            return res.json(rows);
        }

        let query = `
            SELECT DISTINCT b.*
    FROM buses b
            LEFT JOIN bus_stops s_from ON b.id = s_from.bus_id
            LEFT JOIN bus_stops s_to ON b.id = s_to.bus_id
WHERE(
    (LOWER(b.departure_city) LIKE LOWER(?) OR(LOWER(s_from.stop_name) LIKE LOWER(?) AND s_from.bus_id IS NOT NULL))
AND
    (LOWER(b.arrival_city) LIKE LOWER(?) OR(LOWER(s_to.stop_name) LIKE LOWER(?) AND s_to.bus_id IS NOT NULL))
            )
`;
        const params = [`${from}% `, `${from}% `, `${to}% `, `${to}% `];

        if (date) {
            query += " AND b.travel_date = ?";
            params.push(date);
        }

        const [rows] = await db.query(query, params);

        // Filter by sequence if they are intermediate stops
        // This is a bit complex in SQL so we do a quick check:
        // For each bus, if 'from' is intermediate, get its order. If 'to' is intermediate, get its order.
        // If 'from' is main start, order = -1. If 'to' is main end, order = 999.
        // Then ensure from_order < to_order.

        const filtered = [];
        for (const bus of rows) {
            const [stops] = await db.query("SELECT stop_name, stop_order, arrival_time, departure_time FROM bus_stops WHERE bus_id = ? ORDER BY stop_order", [bus.id]);

            let fromOrder = -2;
            let toOrder = -2;
            let actualDeparture = bus.departure_time;
            let actualArrival = bus.arrival_time;

            if (bus.departure_city.toLowerCase().startsWith(from.toLowerCase())) {
                fromOrder = -1;
                actualDeparture = bus.departure_time;
            }
            if (bus.arrival_city.toLowerCase().startsWith(to.toLowerCase())) {
                toOrder = 1000;
                actualArrival = bus.arrival_time;
            }

            stops.forEach(s => {
                if (s.stop_name.toLowerCase().startsWith(from.toLowerCase())) {
                    fromOrder = s.stop_order;
                    actualDeparture = s.departure_time || s.arrival_time;
                }
                if (s.stop_name.toLowerCase().startsWith(to.toLowerCase())) {
                    toOrder = s.stop_order;
                    actualArrival = s.arrival_time || s.departure_time;
                }
            });

            if (fromOrder !== -2 && toOrder !== -2 && fromOrder < toOrder) {
                filtered.push({
                    ...bus,
                    departure_time: actualDeparture,
                    arrival_time: actualArrival
                });
            }
        }

        res.json(filtered);
    } catch (err) {
        console.error("GET BUSES ERROR:", err);
        res.status(500).json(err);
    }
});

app.get("/api/buses/track/:busId", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT id, name, current_lat as lat, current_lng as lng, driver_name, status, total_seats FROM buses WHERE id = ?",
            [req.params.busId]
        );
        if (rows.length === 0) return res.status(404).json({ error: "Bus not found" });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Admin routes moved to top

/* ===========================
   DRIVER DASHBOARD APIs
=========================== */

app.get("/api/driver/stats/:busId", authenticateToken, requireRole(['driver', 'admin']), async (req, res) => {
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

app.get("/api/driver/verify-passenger", authenticateToken, requireRole(['driver', 'admin']), async (req, res) => {
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

app.post("/api/driver/board", authenticateToken, requireRole(['driver', 'admin']), async (req, res) => {
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

app.get("/", (req, res) => res.send("SmartBus API is Live 🚀"));

// Stats moved to top

/* ===========================
   SERVER START
=========================== */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () =>
    console.log(`Server running on port ${PORT} `)
);