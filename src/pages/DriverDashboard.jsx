import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    MapPin,
    ChevronRight,
    QrCode,
    Layout,
    UserPlus,
    TrendingUp,
    Navigation2,
    Clock,
    UserCheck,
    AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Html5Qrcode } from 'html5-qrcode';
import { API_BASE_URL } from '../api/config';

const socket = io(API_BASE_URL, {
    transports: ['websocket'],
    path: '/socket.io/'
});

const DriverDashboard = () => {
    const navigate = useNavigate();
    // Get busId from URL query or default to 1
    const query = new URLSearchParams(window.location.search);
    const BUS_ID = query.get('busId') || 1;
    const [stats, setStats] = useState({
        totalSeats: 32,
        availableSeats: 32,
        boardedCount: 0,
        currentStop: 'Main Terminal',
        nextStop: 'Central Square',
        dropNextStop: 0,
        boardNextStop: 0
    });
    const [ticketInput, setTicketInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scannedPassenger, setScannedPassenger] = useState(null);
    const [currentPos, setCurrentPos] = useState({ lat: 0, lng: 0 });
    const [occupiedSeats, setOccupiedSeats] = useState([]);
    const [busName, setBusName] = useState('Loading Bus...');
    const [selectedSeatDetails, setSelectedSeatDetails] = useState(null);

    // 0. Fetch Bus Details for Identification
    useEffect(() => {
        const getBusDetails = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/buses/track/${BUS_ID}`);
                setBusName(res.data.name);
            } catch (err) {
                console.error("Failed to load bus details", err);
            }
        };
        getBusDetails();
    }, [BUS_ID]);

    // 1. Real-time Stop Accuracy & Stats
    const fetchStats = async (lat, lng) => {
        try {
            const url = `${API_BASE_URL}/api/driver/stats/${BUS_ID}${lat ? `?lat=${lat}&lng=${lng}` : ''}`;
            const res = await axios.get(url);
            setStats(res.data);

            // Fetch occupied seats for Driver visual
            const occRes = await axios.get(`${API_BASE_URL}/api/buses/${BUS_ID}/occupied-seats`);
            setOccupiedSeats(occRes.data);
        } catch (err) {
            console.error("Failed to fetch stats", err);
        } finally {
            setLoading(false);
        }
    };

    // 2. Live Tracking & Geofencing
    useEffect(() => {
        let watchId = null;

        const handleUpdate = (lat, lng) => {
            setCurrentPos({ lat, lng });
            socket.emit('update-location', { busId: BUS_ID, lat, lng });
            fetchStats(lat, lng);
        };

        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    handleUpdate(pos.coords.latitude, pos.coords.longitude);
                },
                (err) => {
                    console.warn("GPS Access Denied/Error, using last known or default.");
                },
                { enableHighAccuracy: true, maximumAge: 0 }
            );
        }

        // Fallback: Simulation for testing if they aren't actually moving
        // Fallback: Simulation for testing if they aren't actually moving
        const simInterval = setInterval(() => {
            setCurrentPos(prev => {
                if (prev.lat === 0) return { lat: 17.3850, lng: 78.4867 }; // Default to MGBS Hyd

                // Slow crawl simulation towards Nellore
                const nextLat = prev.lat + (14.4426 - 17.3850) * 0.0001;
                const nextLng = prev.lng + (79.9865 - 78.4867) * 0.0001;

                socket.emit('update-location', { busId: BUS_ID, lat: nextLat, lng: nextLng });
                return { lat: nextLat, lng: nextLng };
            });
        }, 10000);

        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
            clearInterval(simInterval);
        };
    }, [BUS_ID]);

    // 3. Real QR Scanner Implementation
    useEffect(() => {
        let html5QrCode;

        const startScanner = async () => {
            if (isScanning && !scannedPassenger) {
                // Wait for the reader element to be in DOM
                const checkElement = setInterval(async () => {
                    const element = document.getElementById('reader');
                    if (element) {
                        clearInterval(checkElement);
                        try {
                            html5QrCode = new Html5Qrcode("reader");
                            await html5QrCode.start(
                                { facingMode: "environment" },
                                {
                                    fps: 10,
                                    qrbox: { width: 250, height: 250 },
                                },
                                async (decodedText) => {
                                    try {
                                        await html5QrCode.stop();
                                        const res = await axios.get(`${API_BASE_URL}/api/driver/verify-passenger?busId=${BUS_ID}&ticketId=${decodedText}`);
                                        setScannedPassenger(res.data);
                                    } catch (err) {
                                        setMessage({ type: 'error', text: 'Invalid or already boarded ticket' });
                                        setIsScanning(false);
                                    }
                                },
                                (errorMessage) => {
                                    // ignore periodic failures
                                }
                            );
                        } catch (err) {
                            console.error("Scanner failed to start", err);
                        }
                    }
                }, 100);
            }
        };

        startScanner();

        return () => {
            if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().catch(console.error);
            }
        };
    }, [isScanning, scannedPassenger]);

    const handleBoardWithId = async (id) => {
        try {
            await axios.post(`${API_BASE_URL}/api/driver/board`, {
                ticketId: id,
                busId: BUS_ID
            });
            setMessage({ type: 'success', text: `Passenger Boarded Successfully!` });
            fetchStats(currentPos.lat, currentPos.lng);
            setTicketInput('');
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Boarding failed' });
            setTimeout(() => setMessage(null), 3000);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(() => fetchStats(currentPos.lat, currentPos.lng), 15000);
        return () => clearInterval(interval);
    }, []);

    const handleBoardPassenger = async () => {
        if (!ticketInput.trim()) return;
        await handleBoardWithId(ticketInput);
    };

    if (loading) {
        return (
            <div className="loading-screen" style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
                color: 'white'
            }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid #6366F1', borderRadius: '50%', width: 50, height: 50 }}
                />
                <p style={{ marginTop: '1rem', fontWeight: 500, opacity: 0.8 }}>Initializing Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-container" style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            padding: '2rem',
            fontFamily: "'Outfit', sans-serif"
        }}>
            <style>{`
                .glass-card {
                    background: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.05);
                    border-radius: 24px;
                }
                .stat-box {
                    padding: 1.5rem;
                    border-radius: 20px;
                    background: white;
                    border: 1px solid #f1f5f9;
                }
                .btn-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    alignItems: center;
                    justify-content: center;
                }
                .dashboard-header {
                    margin-bottom: 2.5rem;
                    display: flex;
                    justify-content: space-between;
                    alignItems: center;
                }
                .action-button {
                    background: #6366F1;
                    color: white;
                    padding: 1rem 2rem;
                    border-radius: 16px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
                }
                .action-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
                }
                .input-field {
                    background: #f1f5f9;
                    border: 2px solid transparent;
                    padding: 1rem 1.5rem;
                    border-radius: 16px;
                    font-size: 1rem;
                    width: 100%;
                    outline: none;
                }
                .badge {
                    padding: 0.4rem 0.8rem;
                    border-radius: 100px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                }
            `}</style>

            <header className="dashboard-header">
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                >
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e1b4b', letterSpacing: '-0.02em' }}>
                        {busName} <span style={{ color: '#6366F1', fontSize: '1.2rem', fontWeight: 600 }}>• ID #{BUS_ID}</span>
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b' }}>
                            <Clock size={16} />
                            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#cbd5e1' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>System Live</span>
                        </div>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#cbd5e1' }} />
                        <div style={{ color: '#6366F1', fontSize: '0.85rem', fontWeight: 600, background: 'rgba(99, 102, 241, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                            Tracking Active
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    style={{ textAlign: 'right' }}
                >
                    <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>BUS ID: #{BUS_ID}</div>
                    <div style={{ fontSize: '1.1rem', color: '#1e1b4b', fontWeight: 700 }}>{busName}</div>
                </motion.div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                {/* Left Card: Capacity & Seating */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="glass-card"
                    style={{ padding: '2rem' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                        <div className="btn-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366F1' }}>
                            <Users size={24} />
                        </div>
                        <h2 style={{ fontSize: '1.25rem' }}>Seating Status</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                        <div className="stat-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>TOTAL CAPACITY</div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e1b4b' }}>{stats.totalSeats}</div>
                            </div>
                            <TrendingUp size={24} color="#e2e8f0" />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                            <div className="stat-box" style={{ borderLeft: '4px solid #10b981' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>VACANCY</div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>{stats.availableSeats}</div>
                            </div>
                            <div className="stat-box" style={{ borderLeft: '4px solid #F59E0B' }}>
                                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>RESERVED</div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F59E0B' }}>{(stats.occupiedCount || 0) - (stats.boardedCount || 0)}</div>
                            </div>
                            <div className="stat-box" style={{ borderLeft: '4px solid #6366F1' }}>
                                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>BOARDED</div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#6366F1' }}>{stats.boardedCount}</div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Right Card: Journey Updates */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card"
                    style={{ padding: '2rem' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                        <div className="btn-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                            <Navigation2 size={24} />
                        </div>
                        <h2 style={{ fontSize: '1.25rem' }}>Journey Info</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div className="stat-box" style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>CURRENT STOP</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.25rem' }}>{stats.currentStop}</div>
                            </div>
                            <div className="stat-box" style={{ flex: 1, background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>NEXT STOP</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.25rem', color: '#6366F1' }}>{stats.nextStop}</div>
                            </div>
                        </div>

                        <div className="stat-box">
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '1rem' }}>Next Stop Expectations</span>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Users size={18} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{stats.dropNextStop}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>DROPPING OFF</div>
                                    </div>
                                </div>
                                <div style={{ width: 1, background: '#f1f5f9' }} />
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#dcfce7', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <UserPlus size={18} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{stats.boardNextStop}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>BOARDING IN</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* VISUAL SEAT MAP FOR DRIVER */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card"
                    style={{ padding: '2rem' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                        <div className="btn-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366F1' }}>
                            <Layout size={20} />
                        </div>
                        <h2 style={{ fontSize: '1.25rem' }}>Live Seat Map</h2>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', fontSize: '0.75rem', fontWeight: 700 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <div style={{ width: 12, height: 12, background: 'white', border: '1px solid #cbd5e1', borderRadius: '3px' }}></div>
                                FREE
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <div style={{ width: 12, height: 12, background: '#F59E0B', borderRadius: '3px' }}></div>
                                RESERVED
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <div style={{ width: 12, height: 12, background: '#6366F1', borderRadius: '3px' }}></div>
                                BOARDED
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 280px', gap: '2rem' }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '12px',
                            background: '#f8fafc',
                            padding: '1.5rem',
                            borderRadius: '20px',
                            border: '1px solid #e2e8f0',
                            height: 'fit-content'
                        }}>
                            {Array.from({ length: stats.totalSeats || 32 }, (_, i) => {
                                const seatId = i + 1;
                                const seatInfo = occupiedSeats.find(s => s.seat_number === seatId);
                                const isOccupied = !!seatInfo;
                                const isBoarded = !!(seatInfo && seatInfo.scanned_at);

                                let bgColor = 'white';
                                let textColor = '#64748b';
                                if (isOccupied) {
                                    bgColor = isBoarded ? '#6366F1' : '#F59E0B';
                                    textColor = 'white';
                                }

                                return (
                                    <motion.div
                                        key={seatId}
                                        whileHover={{ scale: 1.05 }}
                                        onClick={() => isOccupied && setSelectedSeatDetails(seatInfo)}
                                        style={{
                                            aspectRatio: '1',
                                            background: bgColor,
                                            color: textColor,
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.8rem',
                                            fontWeight: 800,
                                            cursor: isOccupied ? 'pointer' : 'default',
                                            boxShadow: isOccupied ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                            border: isOccupied ? 'none' : '1px solid #e2e8f0'
                                        }}
                                    >
                                        {seatId}
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* SEAT DETAILS PANEL */}
                        <div style={{ position: 'sticky', top: 0 }}>
                            {selectedSeatDetails ? (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                                        <div style={{ width: 40, height: 40, borderRadius: '12px', background: '#6366F1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Users size={20} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Seat {selectedSeatDetails.seat_number}</h3>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, px: '0.5rem', py: '0.1rem', borderRadius: '4px', background: selectedSeatDetails.scanned_at ? '#dcfce7' : '#fef3c7', color: selectedSeatDetails.scanned_at ? '#166534' : '#92400e' }}>
                                                {selectedSeatDetails.scanned_at ? 'BOARDED' : 'RESERVED'}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Passenger Name</label>
                                            <div style={{ fontWeight: 700 }}>{selectedSeatDetails.name}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Age</label>
                                                <div style={{ fontWeight: 700 }}>{selectedSeatDetails.age} Yrs</div>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Gender</label>
                                                <div style={{ fontWeight: 700 }}>{selectedSeatDetails.gender}</div>
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Route</label>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                                                {selectedSeatDetails.boarding_point} ➔ {selectedSeatDetails.destination_point}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedSeatDetails(null)}
                                        style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 600, fontSize: '0.85rem' }}
                                    >
                                        Close Info
                                    </button>
                                </motion.div>
                            ) : (
                                <div style={{ height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: '20px', border: '2px dashed #e2e8f0', color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>
                                    <Users size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                                    <p style={{ fontSize: '0.8rem', fontWeight: 500 }}>Select a seat for passenger info</p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

            </div>

            {/* Manual Entry Section */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="glass-card"
                style={{ marginTop: '2rem', padding: '2rem' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="btn-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366F1' }}>
                        <UserCheck size={24} />
                    </div>
                    <h2 style={{ fontSize: '1.25rem' }}>Manual Ticket Entry</h2>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <input
                            className="input-field"
                            placeholder="Enter Ticket ID or Passenger Name"
                            value={ticketInput}
                            onChange={(e) => setTicketInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleBoardPassenger()}
                        />
                        <AnimatePresence>
                            {message && (
                                <motion.div
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 10, opacity: 0 }}
                                    style={{
                                        position: 'absolute',
                                        top: '120%',
                                        left: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        color: message.type === 'success' ? '#10b981' : '#f43f5e',
                                        fontSize: '0.875rem',
                                        fontWeight: 600
                                    }}
                                >
                                    {message.type === 'success' ? <UserCheck size={16} /> : <AlertCircle size={16} />}
                                    {message.text}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <button
                        className="action-button"
                        onClick={handleBoardPassenger}
                        disabled={!ticketInput.trim()}
                        style={{ opacity: ticketInput.trim() ? 1 : 0.6 }}
                    >
                        Board Passenger <ChevronRight size={20} />
                    </button>
                </div>
            </motion.div>

            {/* Bottom Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
                <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    onClick={() => navigate('/driver/seats')}
                    className="glass-card"
                    style={{
                        padding: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.5rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.3s'
                    }}
                    whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.95)' }}
                >
                    <div className="btn-icon" style={{ background: '#6366F1', color: 'white' }}>
                        <Layout size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e1b4b' }}>Seat Layout</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>View visual occupancy map</div>
                    </div>
                </motion.button>

                <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    onClick={() => setIsScanning(true)}
                    className="glass-card"
                    style={{
                        padding: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.5rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.3s'
                    }}
                    whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.95)' }}
                >
                    <div className="btn-icon" style={{ background: '#10b981', color: 'white' }}>
                        <QrCode size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>Scan Ticket Entry</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Quick check-in via QR scan</div>
                    </div>
                </motion.button>
            </div>

            {/* Scanning Overlay Modal */}
            <AnimatePresence>
                {isScanning && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(15, 23, 42, 0.95)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 2000,
                            padding: '2rem'
                        }}
                    >
                        <div style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
                            {!scannedPassenger ? (
                                <>
                                    <div style={{ position: 'relative', width: '300px', height: '300px', margin: '0 auto 2rem', border: '4px solid rgba(255,255,255,0.1)', borderRadius: '40px', overflow: 'hidden', background: '#000' }}>
                                        <div id="reader" style={{ width: '100%', height: '100%' }}></div>
                                        {/* Scanner Laser Animation Overlay */}
                                        <motion.div
                                            animate={{ top: ['0%', '100%', '0%'] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                            style={{ position: 'absolute', left: 0, right: 0, height: '4px', background: '#10b981', boxShadow: '0 0 15px #10b981', zIndex: 10, pointerEvents: 'none' }}
                                        />
                                    </div>
                                    <h2 style={{ color: 'white', marginBottom: '1rem' }}>Align Ticket QR Code</h2>
                                    <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Scanning for valid passenger bookings...</p>
                                    <button
                                        onClick={() => setIsScanning(false)}
                                        style={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)', background: 'transparent', padding: '0.75rem 2rem', border: '1px solid', borderRadius: '12px' }}
                                    >
                                        Cancel Scan
                                    </button>
                                </>
                            ) : (
                                <motion.div
                                    initial={{ scale: 0.9, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    className="glass-card"
                                    style={{ padding: '2.5rem', background: 'white' }}
                                >
                                    <div className="btn-icon" style={{ background: '#dcfce7', color: '#10b981', margin: '0 auto 1.5rem', width: 64, height: 64 }}>
                                        <UserCheck size={32} />
                                    </div>
                                    <h2 style={{ color: '#1e1b4b', marginBottom: '0.5rem' }}>
                                        {Array.isArray(scannedPassenger) && scannedPassenger.length > 1 ? `${scannedPassenger.length} Passengers Verified` : 'Passenger Verified'}
                                    </h2>
                                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '20px', textAlign: 'left', marginBottom: '1.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                                        {(Array.isArray(scannedPassenger) ? scannedPassenger : [scannedPassenger]).map((p, idx) => (
                                            <div key={idx} style={{ padding: '1rem', borderBottom: idx < (Array.isArray(scannedPassenger) ? scannedPassenger.length : 1) - 1 ? '1px solid #e2e8f0' : 'none' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                                    <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Name</span>
                                                    <span style={{ fontWeight: 700 }}>{p.name}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                                    <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Seat & Age</span>
                                                    <span style={{ fontWeight: 700, color: '#6366F1' }}>Seat {p.seat_number} • {p.age}y</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Destination</span>
                                                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{p.destination_point}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button
                                            onClick={() => { setScannedPassenger(null); setIsScanning(false); }}
                                            style={{ flex: 1, padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', fontWeight: 600 }}
                                        >
                                            Dismiss
                                        </button>
                                        <button
                                            onClick={async () => {
                                                const id = Array.isArray(scannedPassenger) ? scannedPassenger[0].booking_id : scannedPassenger.booking_id;
                                                await handleBoardWithId(id);
                                                setScannedPassenger(null);
                                                setIsScanning(false);
                                            }}
                                            style={{ flex: 1.5, background: '#6366F1', color: 'white', padding: '1rem', borderRadius: '14px', fontWeight: 700, boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)' }}
                                        >
                                            Confirm All Boarding
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DriverDashboard;
