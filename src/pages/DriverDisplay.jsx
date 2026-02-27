import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, CheckCircle2, MapPin, Users, ArrowRight } from 'lucide-react';
import axios from 'axios';

const DriverDisplay = () => {
    const [busDetails, setBusDetails] = useState(null);
    const [seats, setSeats] = useState([]);
    const [loading, setLoading] = useState(true);

    // Mock Bus ID for driver (normally passed via login or route)
    const BUS_ID = 1;

    useEffect(() => {
        fetchSeatStatus();
        const interval = setInterval(fetchSeatStatus, 5000); // Polling for real-time hardware updates
        return () => clearInterval(interval);
    }, []);

    const fetchSeatStatus = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/buses/track/${BUS_ID}`);
            setBusDetails(res.data);

            // Fetch actual occupied seats from DB
            const occupiedRes = await axios.get(`http://localhost:5000/api/buses/${BUS_ID}/occupied-seats`);
            const occupiedData = occupiedRes.data;

            const totalSeats = 20;
            const updatedSeats = Array.from({ length: totalSeats }, (_, i) => {
                const seatNum = i + 1;
                const occInfo = occupiedData.find(p => p.seat_number === seatNum);
                return {
                    id: seatNum,
                    isOccupied: !!occInfo,
                    destination: occInfo ? occInfo.destination_point : null,
                    passengerName: occInfo ? occInfo.name : null
                };
            });
            setSeats(updatedSeats);
        } catch (err) {
            console.error('Failed to fetch hardware status', err);
            // Fallback for UI if MySQL is offline
            const totalSeats = 20;
            setSeats(Array.from({ length: totalSeats }, (_, i) => ({
                id: i + 1,
                isOccupied: [2, 5, 12].includes(i + 1),
                destination: [2, 5, 12].includes(i + 1) ? 'Smart City Terminal' : null,
                passengerName: [2, 5, 12].includes(i + 1) ? 'Demo Passenger' : null
            })));
        } finally {
            setLoading(false);
        }
    };

    const handleDrop = async (seatNumber) => {
        try {
            await axios.post('http://localhost:5000/api/passengers/drop', {
                busId: BUS_ID,
                seatNumber
            });
            fetchSeatStatus(); // Refresh
        } catch (err) {
            alert('Drop failed');
        }
    };

    if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading System...</div>;

    const occupiedCount = seats.filter(s => s.isOccupied).length;

    return (
        <div style={{ backgroundColor: '#0F172A', minHeight: '100vh', color: 'white', padding: '1.5rem', fontFamily: 'monospace' }}>
            {/* Top Bar */}
            <style>{`
                .seat-box:hover .release-btn { opacity: 1 !important; }
            `}</style>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #1E293B', paddingBottom: '1rem' }}>
                <div>
                    <h1 style={{ color: '#6366F1', fontSize: '1.5rem', margin: 0 }}>SMART-BUS DRIVER CONSOLE</h1>
                    <p style={{ color: '#94A3B8', fontSize: '0.8rem', margin: '4px 0 0' }}>SYSTEM: ACTIVE | {busDetails?.name || 'Bus-001'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{new Date().toLocaleTimeString()}</div>
                    <div style={{ color: '#10B981', fontSize: '0.7rem' }}>● HARDWARE SYNCED</div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                {/* Visual Seat Map */}
                <div style={{ background: '#1E293B', borderRadius: '16px', padding: '2rem', border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.1rem', color: '#CBD5E1' }}>SEAT OCCUPANCY</h2>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <div style={{ width: '12px', height: '12px', background: '#10B981', borderRadius: '2px' }}></div>
                                <span style={{ fontSize: '0.7rem' }}>EMPTY</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <div style={{ width: '12px', height: '12px', background: '#EF4444', borderRadius: '2px' }}></div>
                                <span style={{ fontSize: '0.7rem' }}>OCCUPIED</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', maxWidth: '400px', margin: '0 auto' }}>
                        {seats.map(seat => (
                            <motion.div
                                key={seat.id}
                                initial={false}
                                animate={{ backgroundColor: seat.isOccupied ? '#EF4444' : '#10B981' }}
                                className="seat-box"
                                style={{
                                    height: '60px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.9rem',
                                    fontWeight: 'bold',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                {seat.id}
                                {seat.isOccupied && (
                                    <div
                                        onClick={() => handleDrop(seat.id)}
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            background: 'rgba(0,0,0,0.8)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            opacity: 0,
                                            transition: 'opacity 0.2s'
                                        }}
                                        className="release-btn"
                                    >
                                        <div style={{ fontSize: '0.6rem' }}>FREE</div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Live Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ background: '#1E293B', borderRadius: '16px', padding: '1.5rem', border: '1px solid #334155' }}>
                        <h3 style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '1rem' }}>PASSENGER SUMMARY</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>{occupiedCount}</div>
                                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>ACTIVE PASSENGERS</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#6366F1' }}>{seats.length - occupiedCount}</div>
                                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>VACANT SEATS</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ background: '#1E293B', borderRadius: '16px', padding: '1.5rem', border: '1px solid #334155', flex: 1 }}>
                        <h3 style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '1rem' }}>NEXT DESTINATION ALERTS</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ background: '#0F172A', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #F59E0B' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>SEAT 05, 12</span>
                                    <span style={{ fontSize: '0.7rem', color: '#F59E0B' }}>DROP IN 2KM</span>
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Central Plaza Station</div>
                            </div>
                            <div style={{ padding: '0.5rem', textAlign: 'center', border: '1px dashed #334155', borderRadius: '8px' }}>
                                <span style={{ fontSize: '0.7rem', color: '#475569' }}>NO OTHER UPCOMING DROPS</span>
                            </div>
                        </div>
                    </div>

                    <div
                        onClick={async () => {
                            const emptySeat = seats.find(s => !s.isOccupied);
                            if (emptySeat) {
                                await axios.post('http://localhost:5000/api/bookings/walk-on', {
                                    busId: BUS_ID,
                                    seatNumber: emptySeat.id,
                                    destination: 'Smart City Terminal',
                                    amount: 850
                                });
                                fetchSeatStatus();
                            }
                        }}
                        style={{ background: '#6366F1', padding: '1.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
                    >
                        <Smartphone size={32} />
                        <div>
                            <div style={{ fontWeight: 'bold' }}>SIMULATE WALK-ON</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Book next available seat (S{seats.find(s => !s.isOccupied)?.id || 'None'})</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DriverDisplay;
