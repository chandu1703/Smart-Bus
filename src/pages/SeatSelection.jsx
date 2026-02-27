import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBooking } from '../context/BookingContext';
import { Smartphone, Info, ArrowLeft } from 'lucide-react';
import axios from 'axios';

const SEAT_PRICE = 1200;

const SeatSelection = () => {
    const navigate = useNavigate();
    const { selectedBus, selectedSeats, setSelectedSeats } = useBooking();

    // Mock seat layout (1-20 Seater)
    const leftSeats = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
    const rightSeats = [
        [2, 4], [6, 8], [10, 12], [14, 16], [18, 20]
    ];

    const [bookedSeats, setBookedSeats] = useState([]);
    const [loadingSeats, setLoadingSeats] = useState(true);

    useEffect(() => {
        if (selectedBus) {
            fetchBookedSeats();
            const interval = setInterval(fetchBookedSeats, 5000); // Polling for real-time changes
            return () => clearInterval(interval);
        }
    }, [selectedBus]);

    const fetchBookedSeats = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/buses/${selectedBus.id}/occupied-seats`);
            const occupied = res.data.map(p => p.seat_number);
            setBookedSeats(occupied);
        } catch (err) {
            console.error('Error fetching seats', err);
            // Mock fallback if offline
            setBookedSeats([1, 4, 10, 15]);
        } finally {
            setLoadingSeats(false);
        }
    };

    const toggleSeat = (id) => {
        if (bookedSeats.includes(id)) return;
        if (selectedSeats.includes(id)) {
            setSelectedSeats(selectedSeats.filter(s => s !== id));
        } else {
            setSelectedSeats([...selectedSeats, id]);
        }
    };

    if (!selectedBus) {
        return <div style={{ padding: '5rem', textAlign: 'center' }}>
            <p style={{ marginBottom: '1rem' }}>Please select a bus first.</p>
            <button onClick={() => navigate('/')} className="btn-primary">GO HOME</button>
        </div>;
    }

    return (
        <div style={{ padding: '2rem 0', backgroundColor: 'var(--background)', minHeight: '90vh' }}>
            <style>{`
                @media (max-width: 900px) {
                    .seat-selection-container { grid-template-columns: 1fr !important; }
                    .summary-card { position: fixed !important; bottom: 0; left: 0; right: 0; top: auto !important; z-index: 100 !important; border-radius: 20px 20px 0 0 !important; box-shadow: 0 -10px 25px rgba(0,0,0,0.1) !important; padding: 1.5rem !important; }
                    .summary-card button { height: 50px !important; }
                    .back-btn { margin-bottom: 2rem !important; }
                    .seat-map-card { margin-bottom: 120px !important; }
                }
            `}</style>
            <div className="container seat-selection-container" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem' }}>

                {/* Seat Map */}
                <div className="card seat-map-card">
                    <button onClick={() => navigate(-1)} className="btn-outline back-btn" style={{ padding: '0.4rem 1rem', marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', border: 'none', background: '#F1F5F9' }}>
                        <ArrowLeft size={16} /> Back to Search
                    </button>

                    <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', flexDirection: 'column', gap: '0.5rem' }}>
                        Select Seats
                        <span style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-muted)' }}>
                            Bus: {selectedBus.name} • {selectedBus.type}
                        </span>
                    </h2>

                    {/* Legend */}
                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2.5rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <div style={{ width: '18px', height: '18px', border: '1.5px solid var(--border)', borderRadius: '4px' }}></div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>Available</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <div style={{ width: '18px', height: '18px', backgroundColor: 'var(--primary)', borderRadius: '4px' }}></div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>Selected</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <div style={{ width: '18px', height: '18px', backgroundColor: '#E2E8F0', borderRadius: '4px' }}></div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>Booked</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0' }}>
                        <div style={{
                            width: '260px',
                            border: '2px solid var(--border)',
                            borderRadius: '24px 24px 8px 8px',
                            padding: '45px 20px 25px',
                            position: 'relative',
                            backgroundColor: 'white'
                        }}>
                            {/* Driver Section */}
                            <div style={{ position: 'absolute', top: '15px', right: '25px', opacity: 0.3 }}>
                                <Smartphone size={24} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '35px 1fr 82px', gap: '20px' }}>
                                {/* Left Side (Single) */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {leftSeats.map(id => (
                                        <Seat
                                            key={id}
                                            id={id}
                                            isSelected={selectedSeats.includes(id)}
                                            isBooked={bookedSeats.includes(id)}
                                            onClick={() => toggleSeat(id)}
                                        />
                                    ))}
                                </div>

                                {/* Aisle */}
                                <div style={{ borderRight: '1.5px dashed var(--border)' }}></div>

                                {/* Right Side (Double) */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {rightSeats.map((pair, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '12px' }}>
                                            {pair.map(id => (
                                                <Seat
                                                    key={id}
                                                    id={id}
                                                    isSelected={selectedSeats.includes(id)}
                                                    isBooked={bookedSeats.includes(id)}
                                                    onClick={() => toggleSeat(id)}
                                                />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Selection Summary */}
                <div className="summary-card" style={{ position: 'sticky', top: '100px', height: 'fit-content' }}>
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Booking Details</h3>

                        {selectedSeats.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)' }}>
                                <Info size={32} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
                                <p style={{ fontSize: '0.9rem' }}>Please select at least one seat to continue</p>
                            </div>
                        ) : (
                            <div className="summary-content">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Seats:</span>
                                    <span style={{ fontWeight: '700' }}>{selectedSeats.sort((a, b) => a - b).join(', ')}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                                    <span style={{ color: 'var(--secondary)', fontWeight: '600' }}>Total Amount</span>
                                    <span style={{ fontWeight: '800', fontSize: '1.4rem', color: 'var(--primary)' }}>₹{selectedSeats.length * (selectedBus.price || SEAT_PRICE)}</span>
                                </div>

                                <button
                                    onClick={() => navigate('/checkout')}
                                    className="btn-primary"
                                    style={{ width: '100%', padding: '1rem' }}
                                >
                                    CONFIRM SEATS & CONTINUE
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="card" style={{ marginTop: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <Smartphone size={18} color="var(--accent)" />
                            <p style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--accent)' }}>M-Ticket & Live Tracking Enabled</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

const Seat = ({ id, isSelected, isBooked, onClick }) => (
    <motion.div
        whileHover={!isBooked ? { scale: 1.05 } : {}}
        whileTap={!isBooked ? { scale: 0.95 } : {}}
        onClick={onClick}
        style={{
            width: '35px',
            height: '35px',
            border: isSelected ? 'none' : '1.5px solid var(--border)',
            borderRadius: '8px',
            backgroundColor: isBooked ? '#F1F5F9' : isSelected ? 'var(--primary)' : 'white',
            cursor: isBooked ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: '700',
            color: isSelected ? 'white' : isBooked ? '#CBD5E1' : 'var(--text-main)',
            userSelect: 'none',
            transition: 'all 0.2s'
        }}
    >
        {id}
    </motion.div>
);

export default SeatSelection;
