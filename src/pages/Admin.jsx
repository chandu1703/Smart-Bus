import { useState, useEffect } from 'react';
import {
    Users, Bus, Map, TrendingUp, AlertCircle,
    Search, Filter, MoreVertical, MapPin,
    Activity, CheckCircle2, XCircle, LayoutDashboard, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const Admin = () => {
    const [stats, setStats] = useState({
        totalBookings: 0,
        activeBuses: 0,
        revenue: 0,
        cancelledBookings: 0,
        occupancyRate: '75%'
    });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newBus, setNewBus] = useState({
        name: '',
        type: 'Luxury A/C Sleeper',
        departure_city: '',
        arrival_city: '',
        departure_time: '',
        arrival_time: '',
        price: '',
        total_seats: 40
    });

    const [activeBuses, setActiveBuses] = useState([
        { id: 'BUS-101', route: 'New York - Boston', status: 'In Transit', occupancy: '28/40', driver: 'John Doe', delay: '5m' },
        { id: 'BUS-204', route: 'Chicago - Detroit', status: 'Boarding', occupancy: '15/40', driver: 'Jane Smith', delay: 'On Time' },
        { id: 'BUS-305', route: 'Miami - Orlando', status: 'Delayed', occupancy: '35/40', driver: 'Mike Ross', delay: '25m' },
        { id: 'BUS-402', route: 'Seattle - Portland', status: 'In Transit', occupancy: '12/40', driver: 'Sarah Connor', delay: 'On Time' }
    ]);

    const fetchStats = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/admin/stats');
            setStats({
                ...stats,
                totalBookings: res.data.totalBookings,
                revenue: res.data.revenue,
                activeBuses: res.data.activeBuses,
                cancelledBookings: res.data.cancelledBookings
            });

            // Fetch buses for monitoring
            const busRes = await axios.get('http://localhost:5000/api/buses');
            const monitoringData = busRes.data.map(bus => ({
                id: `SB-${bus.id}`,
                route: `${bus.departure_city} - ${bus.arrival_city}`,
                status: ['In Transit', 'Boarding', 'On Time'][Math.floor(Math.random() * 3)],
                occupancy: `12/${bus.total_seats}`, // Placeholder occupancy
                driver: 'Smart Driver',
                delay: 'On Time'
            }));
            setActiveBuses(monitoringData);
        } catch (err) {
            console.error('Failed to fetch admin stats', err);
            setStats({
                totalBookings: 1240,
                revenue: 85400,
                activeBuses: 45,
                cancelledBookings: 12,
                occupancyRate: '82%'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleAddBus = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/admin/buses', newBus);
            alert('Bus added successfully!');
            setShowModal(false);
            setNewBus({
                name: '',
                type: 'Luxury A/C Sleeper',
                departure_city: '',
                arrival_city: '',
                departure_time: '',
                arrival_time: '',
                price: '',
                total_seats: 40
            });
            fetchStats();
        } catch (err) {
            console.error(err);
            alert('Failed to add bus. Please ensure MySQL is running.');
        }
    };

    return (
        <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', padding: '2rem' }}>
            <div className="container">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Admin Dashboard</h1>
                        <p style={{ color: 'var(--text-muted)' }}>SmartBus Control Panel & Fleet Management (MySQL Connected)</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <TrendingUp size={18} /> Reports
                        </button>
                        <button className="btn-primary" onClick={() => setShowModal(true)}>
                            + Add New Bus
                        </button>
                    </div>
                </header>

                {/* Add Bus Modal */}
                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="card"
                            style={{ width: '100%', maxWidth: '600px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3>Add New Bus to Fleet</h3>
                                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><XCircle /></button>
                            </div>

                            <form onSubmit={handleAddBus} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', marginBottom: '0.5rem' }}>BUS NAME / OPERATOR</label>
                                    <input required type="text" placeholder="e.g. Royal Express" value={newBus.name} onChange={e => setNewBus({ ...newBus, name: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', marginBottom: '0.5rem' }}>TYPE</label>
                                    <select value={newBus.type} onChange={e => setNewBus({ ...newBus, type: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                        <option>Luxury A/C Sleeper</option>
                                        <option>Smart A/C Seater</option>
                                        <option>Electric Luxury Sleeper</option>
                                        <option>Semi-Sleeper</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', marginBottom: '0.5rem' }}>BASE PRICE (₹)</label>
                                    <input required type="number" value={newBus.price} onChange={e => setNewBus({ ...newBus, price: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', marginBottom: '0.5rem' }}>TOTAL SEATS</label>
                                    <input required type="number" value={newBus.total_seats} onChange={e => setNewBus({ ...newBus, total_seats: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', marginBottom: '0.5rem' }}>SOURCE CITY</label>
                                    <input required type="text" placeholder="e.g. New York" value={newBus.departure_city} onChange={e => setNewBus({ ...newBus, departure_city: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', marginBottom: '0.5rem' }}>DESTINATION</label>
                                    <input required type="text" placeholder="e.g. Boston" value={newBus.arrival_city} onChange={e => setNewBus({ ...newBus, arrival_city: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', marginBottom: '0.5rem' }}>DEPARTURE TIME</label>
                                    <input required type="time" value={newBus.departure_time} onChange={e => setNewBus({ ...newBus, departure_time: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', marginBottom: '0.5rem' }}>ARRIVAL TIME</label>
                                    <input required type="time" value={newBus.arrival_time} onChange={e => setNewBus({ ...newBus, arrival_time: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
                                </div>

                                <div style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
                                    <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem' }}>CONFIRM & ADD TO DATABASE</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                    <StatCard icon={<Users color="#6366f1" />} label="Total Bookings (DB)" value={loading ? <Loader2 className="animate-spin" size={20} /> : stats.totalBookings} change="+12% today" />
                    <StatCard icon={<Bus color="#f59e0b" />} label="Active Fleet" value={stats.activeBuses} change="95% online" />
                    <StatCard icon={<TrendingUp color="#10b981" />} label="Total Revenue" value={loading ? <Loader2 className="animate-spin" size={20} /> : `₹${stats.revenue.toLocaleString()}`} change="+8% this week" />
                    <StatCard icon={<XCircle color="#ef4444" />} label="Cancelled" value={stats.cancelledBookings} change="Loss impact" />
                </div>

                {/* Fleet Monitoring Section */}
                <div className="card" style={{ padding: '0' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <LayoutDashboard size={20} /> Live Fleet Monitoring
                        </h3>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                placeholder="Search Bus ID or Route..."
                                style={{ padding: '0.5rem 1rem 0.5rem 2.5rem', borderRadius: '20px', border: '1px solid var(--border)', outline: 'none', fontSize: '0.9rem' }}
                            />
                        </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bus ID</th>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Route</th>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Occupancy</th>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Driver</th>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Delay</th>
                                <th style={{ padding: '1rem 1.5rem' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeBuses.map((bus, idx) => (
                                <tr key={bus.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1.25rem 1.5rem', fontWeight: '600' }}>{bus.id}</td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <MapPin size={14} color="var(--text-muted)" />
                                            {bus.route}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <StatusBadge status={bus.status} />
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ flex: 1, height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', width: '60px', overflow: 'hidden' }}>
                                                <div style={{
                                                    height: '100%',
                                                    backgroundColor: bus.status === 'Delayed' ? '#ef4444' : 'var(--accent)',
                                                    width: `${(parseInt(bus.occupancy.split('/')[0]) / parseInt(bus.occupancy.split('/')[1])) * 100}%`
                                                }}></div>
                                            </div>
                                            <span style={{ fontSize: '0.85rem' }}>{bus.occupancy}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.9rem' }}>{bus.driver}</td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <span style={{ color: bus.delay === 'On Time' ? 'var(--accent)' : '#ef4444', fontWeight: '500', fontSize: '0.9rem' }}>
                                            {bus.delay}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <button style={{ background: 'transparent', color: 'var(--text-muted)' }}>
                                            <MoreVertical size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, change }) => (
    <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '600' }}>{label}</p>
            <h3 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{value}</h3>
            <span style={{ fontSize: '0.75rem', color: change.includes('+') || change.includes('Online') || change === 'Optimal' ? 'var(--accent)' : '#ef4444', fontWeight: '700' }}>{change}</span>
        </div>
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--background)', borderRadius: '12px' }}>
            {icon}
        </div>
    </div>
);

const StatusBadge = ({ status }) => {
    let colors = { bg: '#E2E8F0', text: '#64748B' };
    if (status === 'In Transit') colors = { bg: '#DBEAFE', text: '#2563EB' };
    if (status === 'Boarding') colors = { bg: '#D1FAE5', text: '#059669' };
    if (status === 'Delayed') colors = { bg: '#FEE2E2', text: '#DC2626' };

    return (
        <span style={{
            padding: '0.35rem 0.75rem',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: '700',
            backgroundColor: colors.bg,
            color: colors.text
        }}>
            {status}
        </span>
    );
};

export default Admin;
