CREATE DATABASE IF NOT EXISTS smartbus_db;
-- Table for Users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('User', 'Admin') DEFAULT 'User',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for Buses
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
    current_lng DECIMAL(11, 8)
);

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
    status ENUM('Confirmed', 'Cancelled') DEFAULT 'Confirmed',
    payment_status ENUM('Pending', 'Paid', 'Failed') DEFAULT 'Pending',
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id) REFERENCES buses(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table for Passengers & Real-time Seat Status
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

-- Insert Sample Buses
INSERT INTO buses (name, type, departure_city, arrival_city, departure_time, arrival_time, price, current_lat, current_lng) 
VALUES 
('Royal Express', 'Luxury A/C Sleeper', 'New York', 'Boston', '21:00:00', '05:30:00', 1250.00, 40.7128, -74.0060),
('Smart Travels', 'Smart A/C Seater', 'Chicago', 'Detroit', '22:30:00', '07:15:00', 850.00, 41.8781, -87.6298),
('Green Lines', 'Electric Luxury Sleeper', 'Miami', 'Orlando', '19:45:00', '04:00:00', 1400.00, 25.7617, -80.1918);
