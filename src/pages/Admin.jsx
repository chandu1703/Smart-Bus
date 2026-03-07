import { useState, useEffect } from 'react';
import {
    Users, Bus, TrendingUp, XCircle, LayoutDashboard,
    Search, MoreVertical, MapPin, Plus, Loader2,
    CheckCircle2, AlertTriangle, RefreshCw, PhoneCall
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

const Admin = () => {
    const [stats, setStats] = useState({ totalBookings: 0, activeBuses: 0, revenue: 0, cancelledBookings: 0 });
    const [buses, setBuses] = useState([]);
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingBuses, setLoadingBuses] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [newBus, setNewBus] = useState({
        name: '', type: 'Luxury A/C Sleeper',
        departure_city: '', arrival_city: '',
        departure_time: '', arrival_time: '',
        price: '', total_seats: 40,
        driver_name: '', driver_phone: '',
        amenities: '', stops: [], travel_date: ''
    });
    const [stopInput, setStopInput] = useState({ name: '', arrival: '', departure: '' });

    useEffect(() => {
        fetchStats();
        fetchBuses();
    }, []);

    const fetchStats = async () => {
        setLoadingStats(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/admin/stats`);
            setStats(res.data);
        } catch (err) {
            console.error('Failed to fetch stats', err);
        } finally {
            setLoadingStats(false);
        }
    };

    const fetchBuses = async () => {
        setLoadingBuses(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/buses`);
            setBuses(res.data);
        } catch (err) {
            console.error('Failed to fetch buses', err);
        } finally {
            setLoadingBuses(false);
        }
    };

    const addStop = () => {
        if (!stopInput.name) return;
        setNewBus({ ...newBus, stops: [...newBus.stops, { ...stopInput }] });
        setStopInput({ name: '', arrival: '', departure: '' });
    };

    const removeStop = (idx) => {
        setNewBus({ ...newBus, stops: newBus.stops.filter((_, i) => i !== idx) });
    };

    const handleAddBus = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axios.post(`${API_BASE_URL}/api/admin/buses`, newBus);
            alert('Bus added successfully!');
            setShowModal(false);
            setNewBus({
                name: '', type: 'Luxury A/C Sleeper',
                departure_city: '', arrival_city: '',
                departure_time: '', arrival_time: '',
                price: '', total_seats: 40,
                driver_name: '', driver_phone: '',
                amenities: '', stops: [], travel_date: ''
            });
            fetchBuses();
            fetchStats();
        } catch (err) {
            console.error(err);
            alert('Failed to add bus: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    const filteredBuses = buses.filter(b =>
        b.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.departure_city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.arrival_city?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const inputStyle = { width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '0.9rem', backgroundColor: 'var(--background)' };
    const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: '800', marginBottom: '0.4rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' };

    return (
        <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', padding: '2rem 0' }}>
            <style>{`
                @media (max-width: 768px) {
                    header { flex-direction: column; align-items: flex-start !important; gap: 1.5rem; }
                    header > div { width: 100%; }
                    .header-actions { width: 100%; justify-content: space-between; }
                    .modal-grid { grid-template-columns: 1fr !important; }
                    .admin-stats { grid-template-columns: 1fr !important; }
                }
            `}</style>
            <div className="container">
                {/* Header */}
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Admin Dashboard</h1>
                        <p style={{ color: 'var(--text-muted)' }}>SmartBus Control Panel — Fleet Management &amp; Analytics</p>
                    </div>
                    <div className="header-actions" style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            onClick={() => { fetchStats(); fetchBuses(); }}
                            className="btn-outline"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem' }}
                        >
                            <RefreshCw size={16} /> Refresh
                        </button>
                        <button
                            className="btn-primary"
                            onClick={() => setShowModal(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                            <Plus size={18} /> Add New Bus
                        </button>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="admin-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    <StatCard
                        icon={<Bus size={24} color="#6366f1" />}
                        label="Total Buses"
                        value={loadingStats ? '...' : stats.activeBuses}
                        sub="In fleet"
                        color="#EEF2FF"
                    />
                    <StatCard
                        icon={<Users size={24} color="#f59e0b" />}
                        label="Total Bookings"
                        value={loadingStats ? '...' : stats.totalBookings}
                        sub="All time"
                        color="#FFFBEB"
                    />
                    <StatCard
                        icon={<TrendingUp size={24} color="#10b981" />}
                        label="Revenue Collected"
                        value={loadingStats ? '...' : `₹${Number(stats.revenue || 0).toLocaleString('en-IN')}`}
                        sub="From paid bookings"
                        color="#ECFDF5"
                    />
                    <StatCard
                        icon={<XCircle size={24} color="#ef4444" />}
                        label="Cancellations"
                        value={loadingStats ? '...' : stats.cancelledBookings}
                        sub="Total cancelled"
                        color="#FEF2F2"
                    />
                </div>

                {/* Fleet Table */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <LayoutDashboard size={20} /> Fleet Monitor
                        </h3>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                placeholder="Search by bus or city..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ padding: '0.5rem 1rem 0.5rem 2.2rem', borderRadius: '20px', border: '1px solid var(--border)', outline: 'none', fontSize: '0.875rem' }}
                            />
                        </div>
                    </div>

                    {loadingBuses ? (
                        <div style={{ padding: '4rem', textAlign: 'center' }}>
                            <Loader2 className="animate-spin" size={36} color="var(--primary)" style={{ margin: '0 auto' }} />
                            <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Loading fleet data...</p>
                        </div>
                    ) : filteredBuses.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center' }}>
                            <Bus size={48} color="var(--border)" style={{ margin: '0 auto 1rem' }} />
                            <p style={{ color: 'var(--text-muted)' }}>No buses found. Add your first bus!</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                                        {['ID', 'Bus Name', 'Route', 'Date', 'Timing', 'Driver', 'Price', 'Seats', 'Amenities', 'Status'].map(h => (
                                            <th key={h} style={{ padding: '0.85rem 1.25rem', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', whiteSpace: 'nowrap' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBuses.map((bus, idx) => (
                                        <motion.tr
                                            key={bus.id}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.04 }}
                                            style={{ borderBottom: '1px solid var(--border)' }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                                        >
                                            <td style={{ padding: '1rem 1.25rem', fontWeight: '700', color: 'var(--text-muted)', fontSize: '0.85rem' }}>#{bus.id}</td>
                                            <td style={{ padding: '1rem 1.25rem' }}>
                                                <div style={{ fontWeight: '600' }}>{bus.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{bus.type}</div>
                                            </td>
                                            <td style={{ padding: '1rem 1.25rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                                                    <MapPin size={12} color="var(--text-muted)" />
                                                    <span style={{ fontWeight: '600' }}>{bus.departure_city}</span>
                                                    <span style={{ color: 'var(--text-muted)' }}>→</span>
                                                    <span style={{ fontWeight: '600' }}>{bus.arrival_city}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem' }}>
                                                {bus.travel_date ? new Date(bus.travel_date).toLocaleDateString() : '—'}
                                            </td>
                                            <td style={{ padding: '1rem 1.25rem', fontSize: '0.82rem' }}>
                                                <div>{bus.departure_time?.substring(0, 5)} — {bus.arrival_time?.substring(0, 5)}</div>
                                            </td>
                                            <td style={{ padding: '1rem 1.25rem' }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{bus.driver_name || '—'}</div>
                                                {bus.driver_phone && (
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <PhoneCall size={10} />{bus.driver_phone}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '1rem 1.25rem', fontWeight: '700', color: 'var(--secondary)' }}>
                                                ₹{Number(bus.price).toLocaleString('en-IN')}
                                            </td>
                                            <td style={{ padding: '1rem 1.25rem', textAlign: 'center', fontWeight: '600' }}>
                                                {bus.total_seats}
                                            </td>
                                            <td style={{ padding: '1rem 1.25rem', maxWidth: '160px' }}>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {bus.amenities || '—'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.25rem' }}>
                                                <StatusBadge status={bus.status || 'Scheduled'} />
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Bus Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                        onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="card"
                            style={{ width: '100%', maxWidth: '860px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                                <div>
                                    <h2 style={{ margin: 0 }}>Add New Bus to Fleet</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>Fill all details — they will be visible to passengers when searching</p>
                                </div>
                                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleAddBus}>
                                {/* Section: Basic Info */}
                                <p style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>🚌 Bus Info</p>
                                <div className="modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={labelStyle}>Bus Name / Operator</label>
                                        <input required type="text" placeholder="e.g. Royal Express" value={newBus.name} onChange={e => setNewBus({ ...newBus, name: e.target.value })} style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Bus Type</label>
                                        <select value={newBus.type} onChange={e => setNewBus({ ...newBus, type: e.target.value })} style={inputStyle}>
                                            <option>Luxury A/C Sleeper</option>
                                            <option>Smart A/C Seater</option>
                                            <option>Electric Luxury Sleeper</option>
                                            <option>Semi-Sleeper</option>
                                            <option>Non A/C Seater</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Total Seats</label>
                                        <input required type="number" min="1" value={newBus.total_seats} onChange={e => setNewBus({ ...newBus, total_seats: e.target.value })} style={inputStyle} />
                                    </div>
                                </div>

                                {/* Section: Route */}
                                <p style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>📍 Route Details</p>
                                <div className="modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div>
                                        <label style={labelStyle}>Departure City (Source)</label>
                                        <input required type="text" placeholder="e.g. Hyderabad" value={newBus.departure_city} onChange={e => setNewBus({ ...newBus, departure_city: e.target.value })} style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Arrival City (Destination)</label>
                                        <input required type="text" placeholder="e.g. Bangalore" value={newBus.arrival_city} onChange={e => setNewBus({ ...newBus, arrival_city: e.target.value })} style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Departure Time</label>
                                        <input required type="time" value={newBus.departure_time} onChange={e => setNewBus({ ...newBus, departure_time: e.target.value })} style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Arrival Time</label>
                                        <input required type="time" value={newBus.arrival_time} onChange={e => setNewBus({ ...newBus, arrival_time: e.target.value })} style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Ticket Price (₹)</label>
                                        <input required type="number" min="1" placeholder="e.g. 1200" value={newBus.price} onChange={e => setNewBus({ ...newBus, price: e.target.value })} style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Travel Date</label>
                                        <input required type="date" value={newBus.travel_date} onChange={e => setNewBus({ ...newBus, travel_date: e.target.value })} style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Amenities (comma-separated)</label>
                                        <input type="text" placeholder="e.g. WiFi, AC, Water, Charging" value={newBus.amenities} onChange={e => setNewBus({ ...newBus, amenities: e.target.value })} style={inputStyle} />
                                    </div>
                                </div>

                                {/* Section: Driver */}
                                <p style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>👤 Driver Details</p>
                                <div className="modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div>
                                        <label style={labelStyle}>Driver Name</label>
                                        <input required type="text" placeholder="e.g. Ramesh Kumar" value={newBus.driver_name} onChange={e => setNewBus({ ...newBus, driver_name: e.target.value })} style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Driver Phone</label>
                                        <input required type="tel" placeholder="e.g. 9876543210" value={newBus.driver_phone} onChange={e => setNewBus({ ...newBus, driver_phone: e.target.value })} style={inputStyle} />
                                    </div>
                                </div>

                                {/* Section: Stops */}
                                <p style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>🔵 Intermediate Boarding Stops</p>
                                <div style={{ backgroundColor: '#F1F5F9', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                                    <div className="modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px auto', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'end' }}>
                                        <div>
                                            <label style={labelStyle}>Stop Name</label>
                                            <input type="text" placeholder="e.g. Kurnool" value={stopInput.name} onChange={e => setStopInput({ ...stopInput, name: e.target.value })} style={{ ...inputStyle }} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Arrives</label>
                                            <input type="time" value={stopInput.arrival} onChange={e => setStopInput({ ...stopInput, arrival: e.target.value })} style={{ ...inputStyle }} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Departs</label>
                                            <input type="time" value={stopInput.departure} onChange={e => setStopInput({ ...stopInput, departure: e.target.value })} style={{ ...inputStyle }} />
                                        </div>
                                        <button type="button" onClick={addStop} className="btn-primary" style={{ padding: '0.75rem 1.2rem' }}>
                                            + Add
                                        </button>
                                    </div>

                                    {newBus.stops.length === 0 ? (
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem' }}>No stops added yet. Add boarding points along the route.</p>
                                    ) : (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {newBus.stops.map((s, i) => (
                                                <div key={i} style={{ backgroundColor: 'white', padding: '0.4rem 0.85rem', borderRadius: '20px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--border)', fontWeight: '600' }}>
                                                    <MapPin size={12} color="var(--primary)" />
                                                    {s.name} ({s.arrival}→{s.departure})
                                                    <XCircle size={14} style={{ cursor: 'pointer', color: '#EF4444' }} onClick={() => removeStop(i)} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-outline" style={{ flex: 1, padding: '1rem' }}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary" style={{ flex: 2, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={submitting}>
                                        {submitting ? <><Loader2 className="animate-spin" size={18} /> Saving...</> : <><CheckCircle2 size={18} /> CONFIRM &amp; ADD TO DATABASE</>}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const StatCard = ({ icon, label, value, sub, color }) => (
    <motion.div
        whileHover={{ y: -3 }}
        className="card"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
    >
        <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '700', textTransform: 'uppercase' }}>{label}</p>
            <h3 style={{ fontSize: '2rem', marginBottom: '0.25rem', fontWeight: '800' }}>{value}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub}</span>
        </div>
        <div style={{ padding: '0.85rem', backgroundColor: color, borderRadius: '12px' }}>
            {icon}
        </div>
    </motion.div>
);

const StatusBadge = ({ status }) => {
    const map = {
        'Scheduled': { bg: '#DBEAFE', text: '#2563EB' },
        'In Transit': { bg: '#D1FAE5', text: '#059669' },
        'Completed': { bg: '#E2E8F0', text: '#64748B' },
        'Cancelled': { bg: '#FEE2E2', text: '#DC2626' },
    };
    const colors = map[status] || { bg: '#FEF3C7', text: '#D97706' };
    return (
        <span style={{ padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700', backgroundColor: colors.bg, color: colors.text, whiteSpace: 'nowrap' }}>
            {status}
        </span>
    );
};

export default Admin;
