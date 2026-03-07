CREATE DATABASE IF NOT EXISTS smartbus_db;
USE smartbus_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('User', 'Admin') DEFAULT 'User',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS buses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(100),
    departure_city VARCHAR(100),
    arrival_city VARCHAR(100),
    departure_time TIME,
    arrival_time TIME,
    price DECIMAL(10, 2),
    total_seats INT DEFAULT 40,
    current_lat DECIMAL(10, 8),
    current_lng DECIMAL(11, 8),
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    amenities TEXT, -- Store as JSON string or comma-separated
    travel_date DATE,
    status ENUM('Scheduled', 'In Transit', 'Completed', 'Cancelled') DEFAULT 'Scheduled'
);

CREATE TABLE IF NOT EXISTS bus_stops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bus_id INT,
    stop_name VARCHAR(100),
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    arrival_time TIME,
    departure_time TIME,
    stop_order INT, -- To maintain sequence
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE
);

-- Mock stops for Bus #1 (Hyderabad to Vijayawada)
INSERT INTO bus_stops (bus_id, stop_name, lat, lng, stop_order) VALUES 
(1, 'Hyderabad MGBS', 17.3730, 78.4760, 1),
(1, 'Suryapet', 17.1500, 79.6200, 2),
(1, 'Nandigama', 16.7700, 80.2900, 3),
(1, 'Vijayawada', 16.5060, 80.6480, 4);

-- Table for Bookings
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id VARCHAR(20) UNIQUE NOT NULL,
    bus_id INT,
    user_id INT NULL,
    travel_date DATE,
    total_amount DECIMAL(10, 2),
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    status ENUM('Pending', 'Confirmed', 'Cancelled') DEFAULT 'Pending',
    payment_status ENUM('Pending', 'Paid', 'Failed') DEFAULT 'Pending',
    payment_method VARCHAR(50),
    payment_intent_id VARCHAR(100), -- For Stripe
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id) REFERENCES buses(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS passengers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id VARCHAR(20),
    bus_id INT,
    seat_number INT,
    name VARCHAR(100),
    age INT,
    gender VARCHAR(20),
    boarding_point VARCHAR(100),
    destination_point VARCHAR(100),
    scanned_at TIMESTAMP NULL, -- When they scan onto the bus
    dropped_at TIMESTAMP NULL, -- When they reach destination (automatic or manual)
    is_active BOOLEAN DEFAULT TRUE, -- Seat is occupied
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
    FOREIGN KEY (bus_id) REFERENCES buses(id)
);

INSERT INTO buses (name, type, departure_city, arrival_city, departure_time, arrival_time, price, current_lat, current_lng, driver_name, driver_phone, amenities, travel_date) 
VALUES 
('TGSRTC Guda', 'Super Luxury A/C', 'Hyderabad', 'Vijayawada', '21:00:00', '03:30:00', 850.00, 17.3730, 78.4760, 'Ramesh Kumar', '9848012345', 'WiFi, AC, Charging Point', '2026-03-07'),
('Orange Travels', 'Volo Multi-Axle A/C', 'Bangalore', 'Chennai', '22:30:00', '05:15:00', 1200.00, 12.9716, 77.5946, 'Suresh Babu', '9848054321', 'AC, Water, Snacks, Charging Point', '2026-03-07'),
('Neeta Travels', 'Scania A/C Sleeper', 'Mumbai', 'Pune', '19:45:00', '23:00:00', 600.00, 19.0760, 72.8777, 'Vijay Singh', '9555667777', 'WiFi, AC, Bed, Snacks', '2026-03-07'),
('Nellore Express', 'A/C Sleeper', 'Hyderabad', 'Nellore', '23:00:00', '06:00:00', 1100.00, 17.3730, 78.4760, 'Kiran Yadav', '9123456780', 'AC, Bed, Charging', '2026-03-07');

UPDATE passengers SET scanned_at = NULL, is_active = FALSE;
