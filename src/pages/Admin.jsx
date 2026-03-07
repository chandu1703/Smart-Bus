import { useState, useEffect } from 'react';
import {
    Bus, Plus, MapPin, Clock, Calendar, Users,
    TrendingUp, Trash2, Edit3, MoreVertical,
    CheckCircle2, AlertCircle, Phone,
    Settings, Search, Filter, Download, Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

const Admin = () => {
    const [buses, setBuses] = useState([]);
    const [stats, setStats] = useState({
        totalBookings: 0,
        activeBuses: 0,
        revenue: 0,
        cancellations: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [activeTab, setActiveTab] = useState('Current'); // 'Current' or 'Past'

    const [newBus, setNewBus] = useState({
        name: '', type: 'Luxury A/C Sleeper',
        departure_city: '', arrival_city: '',
        departure_time: '', arrival_time: '',
        price: '', total_seats: 42,
        driver_name: '', driver_phone: '',
        amenities: 'WiFi, Charging Point, Water Bottle, Blanket',
        stops: [], travel_date: ''
    });

    const [newStop, setNewStop] = useState({ name: '', arrival: '', departure: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [busRes, statsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/buses`),
                axios.get(`${API_BASE_URL}/api/admin/stats`)
            ]);
            setBuses(busRes.data);
            setStats(statsRes.data);
        } catch (err) {
            console.error("Failed to fetch admin data", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddBus = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE_URL}/api/admin/buses`, newBus);
            setShowAddModal(false);
            fetchData();
            // Reset form
            setNewBus({
                name: '', type: 'Luxury A/C Sleeper',
                departure_city: '', arrival_city: '',
                departure_time: '', arrival_time: '',
                price: '', total_seats: 42,
                driver_name: '', driver_phone: '',
                amenities: 'WiFi, Charging Point, Water Bottle, Blanket',
                stops: [], travel_date: ''
            });
        } catch (err) {
            alert("Error adding bus");
        }
    };

    const handleDeleteBus = async (id) => {
        if (!window.confirm("Delete this bus and all associated data?")) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/admin/buses/${id}`);
            fetchData();
        } catch (err) {
            alert("Delete failed");
        }
    };

    const toggleBusStatus = async (bus) => {
        const newStatus = bus.status === 'Running' ? 'Scheduled' : 'Running';
        try {
            await axios.patch(`${API_BASE_URL}/api/admin/buses/${bus.id}`, { status: newStatus });
            fetchData();
        } catch (err) {
            alert("Status update failed");
        }
    };

    const addStop = () => {
        if (!newStop.name) return;
        setNewBus({ ...newBus, stops: [...newBus.stops, newStop] });
        setNewStop({ name: '', arrival: '', departure: '' });
    };

    const removeStop = (idx) => {
        const filtered = newBus.stops.filter((_, i) => i !== idx);
        setNewBus({ ...newBus, stops: filtered });
    };

    const filteredBuses = buses.filter(bus => {
        const busDate = new Date(bus.travel_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const isPast = busDate < today;
        const matchesTab = activeTab === 'Current' ? !isPast : isPast;

        const matchesSearch = bus.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bus.departure_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bus.arrival_city.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || bus.status === statusFilter;
        return matchesTab && matchesSearch && matchesStatus;
    });

    return (
        <div style={{ padding: '2rem 0', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
            <div className="container">

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Fleet Command</h1>
                        <p style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Manage your bus operations, routes and schedules.</p>
                    </div>
                    <button onClick={() => setShowAddModal(true)} className="btn-primary">
                        <Plus size={20} /> Deploy New Bus
                    </button>
                </div>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                    <StatCard title="Total Bookings" value={stats.totalBookings} icon={<Users color="var(--primary)" />} trend="+12%" />
                    <StatCard title="Active Fleet" value={stats.activeBuses} icon={<Bus color="#10B981" />} trend="Stable" />
                    <StatCard title="Total Revenue" value={`₹${stats.revenue.toLocaleString()}`} icon={<TrendingUp color="#6366F1" />} trend="+8.4%" />
                    <StatCard title="Cancellations" value={stats.cancellations} icon={<AlertCircle color="#EF4444" />} trend="-3%" />
                </div>

                {/* Main Content Area */}
                <div className="card" style={{ padding: '0', overflow: 'hidden', border: 'none', boxShadow: 'var(--shadow-lg)' }}>

                    {/* Tabs & Toolbar */}
                    <div style={{ borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 1.5rem' }}>
                        <button
                            onClick={() => setActiveTab('Current')}
                            style={{
                                padding: '1.25rem 1.5rem',
                                border: 'none',
                                background: 'transparent',
                                fontSize: '0.875rem',
                                fontWeight: '700',
                                color: activeTab === 'Current' ? '#6366F1' : 'var(--text-muted)',
                                borderBottom: activeTab === 'Current' ? '2px solid #6366F1' : '2px solid transparent',
                                cursor: 'pointer'
                            }}
                        >
                            Active Fleet
                        </button>
                        <button
                            onClick={() => setActiveTab('Past')}
                            style={{
                                padding: '1.25rem 1.5rem',
                                border: 'none',
                                background: 'transparent',
                                fontSize: '0.875rem',
                                fontWeight: '700',
                                color: activeTab === 'Past' ? '#6366F1' : 'var(--text-muted)',
                                borderBottom: activeTab === 'Past' ? '2px solid #6366F1' : '2px solid transparent',
                                cursor: 'pointer'
                            }}
                        >
                            Past History
                        </button>
                    </div>

                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: '300px' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                                <input
                                    placeholder="Search by name or route..."
                                    style={{ paddingLeft: '40px' }}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <select style={{ width: '160px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                <option value="All">All Status</option>
                                <option value="Scheduled">Scheduled</option>
                                <option value="Running">Running</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button className="btn-outline" style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}>
                                <Download size={16} style={{ marginRight: '0.4rem' }} /> Export CSV
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#F1F5F9' }}>
                                    <th style={thStyle}>BUS DETAILS</th>
                                    <th style={thStyle}>ROUTE & DATE</th>
                                    <th style={thStyle}>TIMING</th>
                                    <th style={thStyle}>DRIVER</th>
                                    <th style={thStyle}>SEATS / PRICE</th>
                                    <th style={thStyle}>OCCUPANCY</th>
                                    <th style={thStyle}>STATUS</th>
                                    <th style={{ ...thStyle, textAlign: 'right' }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '4rem' }}>Loading fleet data...</td></tr>
                                ) : filteredBuses.length === 0 ? (
                                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '4rem' }}>No buses found matching your criteria.</td></tr>
                                ) : filteredBuses.map((bus) => (
                                    <tr key={bus.id} style={trStyle}>
                                        <td style={tdStyle}>
                                            <div style={{ fontWeight: '700', color: '#1E293B' }}>{bus.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{bus.type}</div>
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600' }}>
                                                {bus.departure_city} <span style={{ color: 'var(--primary)' }}>→</span> {bus.arrival_city}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Calendar size={12} /> {new Date(bus.travel_date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                                                <Clock size={14} color="var(--text-muted)" />
                                                {bus.departure_time.substring(0, 5)} - {bus.arrival_time.substring(0, 5)}
                                            </div>
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ fontWeight: '600' }}>{bus.driver_name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                <Phone size={10} /> {bus.driver_phone}
                                            </div>
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ fontWeight: '700', color: 'var(--accent)' }}>₹{bus.price}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{bus.total_seats} Capacity</div>
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.2rem' }}>
                                                <div style={{ background: '#F59E0B', width: 8, height: 8, borderRadius: '50%' }}></div>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{bus.occupied_count || 0} RSV</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                <div style={{ background: '#6366F1', width: 8, height: 8, borderRadius: '50%' }}></div>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{bus.boarded_count || 0} BRD</span>
                                            </div>
                                        </td>
                                        <td style={tdStyle}>
                                            <StatusBadge status={bus.status} onClick={() => toggleBusStatus(bus)} />
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button onClick={() => navigate(`/driver/seats?busId=${bus.id}`)} style={actionBtnStyle} title="View Layout">
                                                    <Layout size={16} color="var(--primary)" />
                                                </button>
                                                <button onClick={() => handleDeleteBus(bus.id)} style={actionBtnStyle} title="Delete">
                                                    <Trash2 size={16} color="#EF4444" />
                                                </button>
                                                <button style={actionBtnStyle} title="Edit">
                                                    <Edit3 size={16} color="var(--text-muted)" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add Bus Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div style={modalOverlayStyle}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            style={modalContentStyle}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h2 style={{ fontSize: '1.5rem' }}>Deploy New Bus</h2>
                                <button onClick={() => setShowAddModal(false)} style={{ background: 'none' }}><Trash2 size={24} color="var(--text-muted)" /></button>
                            </div>

                            <form onSubmit={handleAddBus} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label>Bus Name</label>
                                    <input required placeholder="e.g. Orange Travels - Volvo Multi-Axle" value={newBus.name} onChange={e => setNewBus({ ...newBus, name: e.target.value })} />
                                </div>

                                <div>
                                    <label>Bus Type</label>
                                    <select value={newBus.type} onChange={e => setNewBus({ ...newBus, type: e.target.value })}>
                                        <option>Luxury A/C Sleeper</option>
                                        <option>A/C Seater / Sleeper</option>
                                        <option>Non-A/C Sleeper</option>
                                        <option>Scania Multi-Axle</option>
                                    </select>
                                </div>

                                <div>
                                    <label>Travel Date</label>
                                    <input type="date" required value={newBus.travel_date} onChange={e => setNewBus({ ...newBus, travel_date: e.target.value })} />
                                </div>

                                <div>
                                    <label>Departure City</label>
                                    <input required placeholder="Hyderabad" value={newBus.departure_city} onChange={e => setNewBus({ ...newBus, departure_city: e.target.value })} />
                                </div>

                                <div>
                                    <label>Arrival City</label>
                                    <input required placeholder="Bangalore" value={newBus.arrival_city} onChange={e => setNewBus({ ...newBus, arrival_city: e.target.value })} />
                                </div>

                                <div>
                                    <label>Departure Time</label>
                                    <input type="time" required value={newBus.departure_time} onChange={e => setNewBus({ ...newBus, departure_time: e.target.value })} />
                                </div>

                                <div>
                                    <label>Arrival Time</label>
                                    <input type="time" required value={newBus.arrival_time} onChange={e => setNewBus({ ...newBus, arrival_time: e.target.value })} />
                                </div>

                                <div>
                                    <label>Fare (₹)</label>
                                    <input type="number" required placeholder="1200" value={newBus.price} onChange={e => setNewBus({ ...newBus, price: e.target.value })} />
                                </div>

                                <div>
                                    <label>Total Seats</label>
                                    <input type="number" required placeholder="42" value={newBus.total_seats} onChange={e => setNewBus({ ...newBus, total_seats: e.target.value })} />
                                </div>

                                <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                                    <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={18} /> Intermediate Stops</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <input placeholder="Stop Name" value={newStop.name} onChange={e => setNewStop({ ...newStop, name: e.target.value })} />
                                        <input type="time" value={newStop.arrival} onChange={e => setNewStop({ ...newStop, arrival: e.target.value })} />
                                        <input type="time" value={newStop.departure} onChange={e => setNewStop({ ...newStop, departure: e.target.value })} />
                                        <button type="button" onClick={addStop} className="btn-primary" style={{ padding: '0.75rem' }}><Plus size={20} /></button>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {newBus.stops.map((s, i) => (
                                            <div key={i} style={{ background: 'var(--indigo-50)', padding: '0.5rem 0.75rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                                                <span style={{ fontWeight: '600' }}>{s.name}</span>
                                                <span style={{ color: 'var(--text-muted)' }}>{s.arrival}</span>
                                                <button type="button" onClick={() => removeStop(i)} style={{ background: 'none', padding: 0 }}><Trash2 size={14} color="#EF4444" /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ gridColumn: 'span 2' }}>
                                    <label>Amenities (Comma separated)</label>
                                    <textarea rows="2" value={newBus.amenities} onChange={e => setNewBus({ ...newBus, amenities: e.target.value })} />
                                </div>

                                <div style={{ gridColumn: 'span 2' }}>
                                    <label>Driver Info</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <input placeholder="Name" value={newBus.driver_name} onChange={e => setNewBus({ ...newBus, driver_name: e.target.value })} />
                                        <input placeholder="Phone" value={newBus.driver_phone} onChange={e => setNewBus({ ...newBus, driver_phone: e.target.value })} />
                                    </div>
                                </div>

                                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button type="button" onClick={() => setShowAddModal(false)} className="btn-outline" style={{ flex: 1 }}>Cancel</button>
                                    <button type="submit" className="btn-primary" style={{ flex: 2 }}>Deploy Bus</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* Components */
const StatCard = ({ title, value, icon, trend }) => (
    <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
            <p style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{title}</p>
            <h3 style={{ fontSize: '1.75rem', margin: 0 }}>{value}</h3>
            {trend && <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: '700', color: trend.startsWith('+') ? '#10B981' : '#64748B' }}>{trend} vs last month</div>}
        </div>
        <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '14px' }}>{icon}</div>
    </div>
);

const StatusBadge = ({ status, onClick }) => {
    const getColors = () => {
        switch (status) {
            case 'Running': return { bg: '#ECFDF5', text: '#10B981' };
            case 'Scheduled': return { bg: '#EFF6FF', text: '#3B82F6' };
            case 'Completed': return { bg: '#F8FAFC', text: '#64748B' };
            default: return { bg: '#F1F5F9', text: '#475569' };
        }
    };
    const { bg, text } = getColors();
    return (
        <button onClick={onClick} style={{ backgroundColor: bg, color: text, padding: '0.4rem 0.8rem', borderRadius: '100px', fontSize: '0.7rem', fontWeight: '800', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: text }}></div>
            {status}
        </button>
    );
};

/* Styles */
const thStyle = { padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle = { padding: '1.25rem 1.5rem', borderBottom: '1px solid #F1F5F9', fontSize: '0.9rem' };
const trStyle = { transition: 'background-color 0.2s' };
const actionBtnStyle = { background: '#F8FAFC', padding: '0.6rem', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '2rem', backdropFilter: 'blur(4px)' };
const modalContentStyle = { background: 'white', padding: '2.5rem', borderRadius: '24px', width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' };

export default Admin;
