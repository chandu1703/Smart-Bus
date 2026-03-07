import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, UserX, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

const DriverSeatMap = () => {
    const navigate = useNavigate();
    const [seats, setSeats] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedSeatDetails, setSelectedSeatDetails] = useState(null);

    useEffect(() => {
        fetchSeats();
        const interval = setInterval(fetchSeats, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchSeats = async () => {
        try {
            const BUS_ID = 1;
            const busRes = await axios.get(`${API_BASE_URL}/api/driver/stats/${BUS_ID}`);
            const totalSeats = busRes.data.totalSeats || 32;

            const occRes = await axios.get(`${API_BASE_URL}/api/buses/${BUS_ID}/occupied-seats`);
            const occupiedData = occRes.data;

            const updatedSeats = Array.from({ length: totalSeats }, (_, i) => {
                const seatNum = i + 1;
                const occInfo = occupiedData.find(o => o.seat_number === seatNum);
                return {
                    id: seatNum,
                    isOccupied: !!occInfo,
                    isBoarded: !!(occInfo && occInfo.scanned_at),
                    passenger: occInfo
                };
            });

            setSeats(updatedSeats);
            setLoading(false);
        } catch (err) {
            console.error("Layout fetch failed", err);
            setSeats(Array.from({ length: 32 }, (_, i) => ({ id: i + 1, isOccupied: false })));
            setLoading(false);
        }
    };

    if (loading) return <div style={{ padding: '5rem', textAlign: 'center' }}>Loading Seat Map...</div>;

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem', fontFamily: "'Outfit', sans-serif" }}>
            <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{ background: 'white', border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Seat Layout</h1>
                        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Real-time occupancy & Boarding status</p>
                    </div>
                </header>

                <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                    {/* Legend */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem', justifyContent: 'center', background: '#f8fafc', padding: '1rem', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 14, height: 14, background: 'white', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>VACANT</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 14, height: 14, background: '#F59E0B', borderRadius: '4px' }} />
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>RESERVED</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 14, height: 14, background: '#6366F1', borderRadius: '4px' }} />
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>BOARDED</span>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                        {/* Seat Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '12px',
                            background: '#f1f5f9',
                            padding: '1.5rem',
                            borderRadius: '20px',
                            border: '1px solid #e2e8f0',
                            height: 'fit-content'
                        }}>
                            {seats.map(seat => {
                                let bgColor = 'white';
                                let textColor = '#64748b';
                                if (seat.isOccupied) {
                                    bgColor = seat.isBoarded ? '#6366F1' : '#F59E0B';
                                    textColor = 'white';
                                }

                                return (
                                    <motion.div
                                        key={seat.id}
                                        whileHover={{ scale: 1.05 }}
                                        onClick={() => seat.isOccupied && setSelectedSeatDetails(seat.passenger)}
                                        style={{
                                            aspectRatio: '1',
                                            borderRadius: '10px',
                                            background: bgColor,
                                            border: `1px solid ${seat.isOccupied ? 'transparent' : '#cbd5e1'}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: textColor,
                                            fontWeight: 800,
                                            fontSize: '0.85rem',
                                            cursor: seat.isOccupied ? 'pointer' : 'default',
                                            boxShadow: seat.isOccupied ? '0 4px 10px rgba(0,0,0,0.1)' : 'none',
                                            position: 'relative'
                                        }}
                                    >
                                        {seat.id}
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Details Panel */}
                        <div style={{ position: 'sticky', top: '2rem', height: 'fit-content' }}>
                            {selectedSeatDetails ? (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                                        <div style={{ width: 40, height: 40, borderRadius: '12px', background: '#6366F1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Seat {selectedSeatDetails.seat_number}</h3>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, px: '0.5rem', py: '0.1rem', borderRadius: '4px', background: selectedSeatDetails.scanned_at ? '#dcfce7' : '#fef3c7', color: selectedSeatDetails.scanned_at ? '#166534' : '#92400e' }}>
                                                {selectedSeatDetails.scanned_at ? 'BOARDED' : 'RESERVED'}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        <div className="detail-row">
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
                                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e1b4b' }}>
                                                {selectedSeatDetails.boarding_point} ➔ {selectedSeatDetails.destination_point}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedSeatDetails(null)}
                                        style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 600, fontSize: '0.85rem' }}
                                    >
                                        Close Details
                                    </button>
                                </motion.div>
                            ) : (
                                <div style={{ height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: '20px', border: '2px dashed #e2e8f0', color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>
                                    <User size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                                    <p style={{ fontSize: '0.8rem', fontWeight: 500 }}>Select an occupied seat to view passenger information</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DriverSeatMap;
