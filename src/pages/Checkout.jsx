import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Checkout = () => {
    const navigate = useNavigate();
    const { selectedSeats, selectedBus, searchData, setPassengerDetails, setBookingResult } = useBooking();
    const { user } = useAuth();

    const [formData, setFormData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [contactInfo, setContactInfo] = useState({
        email: '',
        phone: ''
    });

    useEffect(() => {
        if (selectedSeats.length > 0) {
            setFormData(selectedSeats.map(seatId => ({
                seatId,
                name: '',
                age: '',
                gender: 'Male'
            })));
        } else {
            navigate('/');
        }
    }, [selectedSeats, navigate]);

    const handleInputChange = (index, field, value) => {
        const updated = [...formData];
        updated[index][field] = value;
        setFormData(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const bookingId = 'SB-' + Math.random().toString(36).substr(2, 9).toUpperCase();

        const bookingData = {
            bookingId,
            busId: selectedBus?.id || 1,
            userId: user?.id || null,
            travelDate: searchData.date,
            totalAmount: selectedSeats.length * (selectedBus?.price || 1200),
            email: contactInfo.email,
            phone: contactInfo.phone,
            passengers: formData
        };

        try {
            // Send to MySQL Backend
            await axios.post('http://localhost:5000/api/bookings', bookingData);

            setPassengerDetails(formData);
            setBookingResult({
                bookingId,
                date: searchData.date,
                totalAmount: bookingData.totalAmount
            });
            navigate(`/payment/${bookingId}`);
        } catch (err) {
            console.error('Booking failed', err);
            alert('Booking failed. Please ensure the MySQL server is running.');
        } finally {
            setLoading(false);
        }
    };

    if (selectedSeats.length === 0) return null;

    return (
        <div style={{ padding: '4rem 0', backgroundColor: 'var(--background)' }}>
            <div className="container" style={{ maxWidth: '800px' }}>
                <h2 style={{ marginBottom: '2rem' }}>Passenger Details</h2>

                <form onSubmit={handleSubmit}>
                    {formData.map((passenger, index) => (
                        <div key={passenger.seatId} className="card" style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <User size={20} color="var(--primary)" />
                                    Passenger {index + 1}
                                </h3>
                                <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Seat {passenger.seatId}</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 150px', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>FULL NAME</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Enter name"
                                        value={passenger.name}
                                        onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>AGE</label>
                                    <input
                                        required
                                        type="number"
                                        placeholder="Age"
                                        value={passenger.age}
                                        onChange={(e) => handleInputChange(index, 'age', e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>GENDER</label>
                                    <select
                                        value={passenger.gender}
                                        onChange={(e) => handleInputChange(index, 'gender', e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', backgroundColor: 'white' }}
                                    >
                                        <option>Male</option>
                                        <option>Female</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShieldCheck size={20} color="var(--accent)" />
                            Travel & Contact Info
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>BOARDING FROM</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. Times Square"
                                    value={contactInfo.boarding}
                                    onChange={(e) => setContactInfo({ ...contactInfo, boarding: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>DESTINATION</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. South Station"
                                    value={contactInfo.destination}
                                    onChange={(e) => setContactInfo({ ...contactInfo, destination: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>EMAIL ADDRESS</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        required
                                        type="email"
                                        placeholder="Your email for QR ticket"
                                        value={contactInfo.email}
                                        onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>PHONE NUMBER</label>
                                <div style={{ position: 'relative' }}>
                                    <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        required
                                        type="tel"
                                        placeholder="Mobile number"
                                        value={contactInfo.phone}
                                        onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                        style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? <><Loader2 className="animate-spin" size={20} /> SAVING TO MYSQL...</> : <><ShieldCheck size={20} /> PAY & GENERATE SMART TICKET <ArrowRight size={20} /></>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Checkout;
