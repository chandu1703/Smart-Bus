import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Search, CheckCircle2, XCircle, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const TicketStatus = () => {
    const navigate = useNavigate();
    const [bookingId, setBookingId] = useState('');
    const [loading, setLoading] = useState(false);
    const [ticketDetails, setTicketDetails] = useState(null);
    const [error, setError] = useState('');
    const [cancelling, setCancelling] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!bookingId) return;
        setLoading(true);
        setError('');
        setTicketDetails(null);

        try {
            const res = await axios.get(`http://localhost:5000/api/bookings/status/${bookingId.toUpperCase()}`);
            setTicketDetails(res.data);
        } catch (err) {
            console.error('Search failed', err);
            // Fallback for demo if MySQL is offline
            if (bookingId.toUpperCase().includes('DEMO')) {
                setTicketDetails({
                    booking_id: bookingId.toUpperCase(),
                    status: 'Confirmed',
                    departure_city: 'New York',
                    arrival_city: 'Boston',
                    departure_time: '09:00 AM',
                    arrival_time: '02:00 PM',
                    travel_date: new Date(),
                    bus_name: 'SmartBus Express',
                    total_amount: 1200,
                    passengers: [
                        { name: 'John Doe', gender: 'Male', age: 28, seat_number: 5 }
                    ]
                });
            } else {
                setError('Ticket not found. Try searching with "DEMO" to see a preview.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!window.confirm('Are you sure you want to cancel this ticket? This action cannot be undone.')) return;

        setCancelling(true);
        try {
            await axios.post(`http://localhost:5000/api/bookings/cancel/${ticketDetails.booking_id}`);
            setTicketDetails({ ...ticketDetails, status: 'Cancelled' });
            alert('Ticket cancelled successfully.');
        } catch (err) {
            alert('Cancellation failed. Please try again later.');
        } finally {
            setCancelling(false);
        }
    };

    return (
        <div style={{ padding: '4rem 1rem', backgroundColor: 'var(--background)', minHeight: '80vh' }}>
            <div className="container" style={{ maxWidth: '700px' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '1rem' }}>Check Ticket Status</h1>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '3rem' }}>
                    Enter your Booking ID to view details or cancel your ticket.
                </p>

                <div className="card" style={{ marginBottom: '3rem', padding: '1.5rem' }}>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Bus size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Enter Booking ID (e.g., SB-ABC123XYZ)"
                                value={bookingId}
                                onChange={(e) => setBookingId(e.target.value)}
                                style={{ width: '100%', padding: '0.875rem 0.875rem 0.875rem 2.8rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '1rem' }}
                            />
                        </div>
                        <button className="btn-primary" type="submit" disabled={loading} style={{ padding: '0 2rem' }}>
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'CHECK'}
                        </button>
                    </form>
                    {error && <p style={{ color: '#DC2626', fontSize: '0.875rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><AlertCircle size={16} /> {error}</p>}
                </div>

                <AnimatePresence>
                    {ticketDetails && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="card"
                            style={{ overflow: 'hidden', padding: 0 }}
                        >
                            <div style={{
                                padding: '1.5rem',
                                backgroundColor: ticketDetails.status === 'Cancelled' ? '#FEE2E2' : 'var(--secondary)',
                                color: ticketDetails.status === 'Cancelled' ? '#DC2626' : 'white',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>BOOKING STATUS</p>
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: ticketDetails.status === 'Cancelled' ? '#DC2626' : 'white' }}>
                                        {ticketDetails.status === 'Cancelled' ? <XCircle /> : <CheckCircle2 />}
                                        {ticketDetails.status.toUpperCase()}
                                    </h3>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>BOOKING ID</p>
                                    <h3 style={{ letterSpacing: '1px', color: ticketDetails.status === 'Cancelled' ? '#DC2626' : 'white' }}>{ticketDetails.booking_id}</h3>
                                </div>
                            </div>

                            <div style={{ padding: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                    <div>
                                        <h4 style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>FROM</h4>
                                        <p style={{ fontSize: '1.2rem', fontWeight: '700' }}>{ticketDetails.departure_city}</p>
                                        <p style={{ fontSize: '0.9rem' }}>{ticketDetails.departure_time}</p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', color: 'var(--border)' }}>
                                        <ArrowRight size={24} />
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <h4 style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>TO</h4>
                                        <p style={{ fontSize: '1.2rem', fontWeight: '700' }}>{ticketDetails.arrival_city}</p>
                                        <p style={{ fontSize: '0.9rem' }}>{ticketDetails.arrival_time}</p>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', padding: '1.5rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: '2rem' }}>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>TRAVEL DATE</p>
                                        <p style={{ fontWeight: '600' }}>{new Date(ticketDetails.travel_date).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>OPERATOR</p>
                                        <p style={{ fontWeight: '600' }}>{ticketDetails.bus_name}</p>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '2rem' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '1rem' }}>PASSENGERS</p>
                                    {ticketDetails.passengers?.map((p, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                                            <span>{p.name} ({p.gender}, {p.age})</span>
                                            <span style={{ fontWeight: '600' }}>Seat {p.seat_number}</span>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--background)', padding: '1rem', borderRadius: '12px' }}>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL AMOUNT PAID</p>
                                        <p style={{ fontSize: '1.25rem', fontWeight: '800' }}>₹{ticketDetails.total_amount}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        {ticketDetails.status === 'Confirmed' && (
                                            <>
                                                <button
                                                    onClick={() => navigate(`/track/${ticketDetails.bus_id}`)}
                                                    className="btn-primary"
                                                >
                                                    Track Bus
                                                </button>
                                                <button
                                                    onClick={handleCancel}
                                                    disabled={cancelling}
                                                    className="btn-outline"
                                                    style={{ borderColor: '#DC2626', color: '#DC2626' }}
                                                >
                                                    {cancelling ? <Loader2 className="animate-spin" /> : 'CANCEL TICKET'}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default TicketStatus;
