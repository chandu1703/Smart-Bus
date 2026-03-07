import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bus, MapPin, Calendar, Clock, ChevronRight, Loader2, Ticket as TicketIcon } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../api/config';

const BookingHistory = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchBookings();
        }
    }, [user]);

    const fetchBookings = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/bookings/user/${user.id}`);
            setBookings(res.data);
        } catch (err) {
            console.error('Failed to fetch bookings', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}><Loader2 className="animate-spin" size={48} /></div>;

    return (
        <div style={{ padding: '4rem 1rem', backgroundColor: 'var(--background)', minHeight: '80vh' }}>
            <div className="container" style={{ maxWidth: '800px' }}>
                <h1 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <TicketIcon size={32} color="var(--primary)" /> My Bookings
                </h1>

                {bookings.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>You haven't booked any tickets yet.</p>
                        <button className="btn-primary" onClick={() => navigate('/')}>BOOK NOW</button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {bookings.map((booking) => (
                            <motion.div
                                key={booking.id}
                                whileHover={{ y: -4, boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}
                                className="card"
                                style={{ padding: '1.5rem', cursor: 'pointer' }}
                                onClick={() => {
                                    // Navigate to status or specific ticket page
                                    // For now, let's use the status page with the booking ID
                                    navigate('/status', { state: { bookingId: booking.booking_id } });
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '20px',
                                            fontSize: '0.7rem',
                                            fontWeight: '700',
                                            backgroundColor: booking.status === 'Confirmed' ? '#D1FAE5' : booking.status === 'Cancelled' ? '#FEE2E2' : '#FEF3C7',
                                            color: booking.status === 'Confirmed' ? '#059669' : booking.status === 'Cancelled' ? '#DC2626' : '#D97706',
                                            marginBottom: '0.5rem',
                                            display: 'inline-block'
                                        }}>
                                            {booking.status.toUpperCase()}
                                        </span>
                                        <h3 style={{ fontSize: '1.2rem' }}>{booking.bus_name}</h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ID: {booking.booking_id}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--secondary)' }}>₹{booking.total_amount}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{booking.payment_status}</p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '2rem' }}>
                                        <div>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700' }}>FROM</p>
                                            <p style={{ fontWeight: '600' }}>{booking.departure_city}</p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700' }}>TO</p>
                                            <p style={{ fontWeight: '600' }}>{booking.arrival_city}</p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700' }}>DATE</p>
                                            <p style={{ fontWeight: '600' }}>{new Date(booking.travel_date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} color="var(--border)" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingHistory;
