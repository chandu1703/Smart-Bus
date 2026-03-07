import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, MapPin, Clock, ArrowRight, UserCheck, Search, Filter } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';
import { motion } from 'framer-motion';

const DriverBusSelection = () => {
    const [buses, setBuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBuses = async () => {
            try {
                // Fetch all buses for selection
                const res = await axios.get(`${API_BASE_URL}/api/buses`);
                setBuses(res.data);
            } catch (err) {
                console.error("Failed to fetch buses for selection", err);
            } finally {
                setLoading(false);
            }
        };
        fetchBuses();
    }, []);

    const filteredBuses = buses.filter(bus => {
        const busDate = new Date(bus.travel_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isPast = busDate < today;

        const matchesSearch = bus.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bus.departure_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bus.arrival_city.toLowerCase().includes(searchTerm.toLowerCase());

        return !isPast && matchesSearch;
    });

    const handleSelectBus = (busId) => {
        // Navigate to dashboard with busId
        navigate(`/driver/dashboard?busId=${busId}`);
    };

    if (loading) return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
            <div className="animate-spin" style={{ display: 'inline-block' }}><Bus size={40} /></div>
            <h2>Initializing Fleet Console...</h2>
        </div>
    );

    return (
        <div style={{ padding: '3rem 0', backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
            <div className="container" style={{ maxWidth: '800px' }}>

                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{ display: 'inline-flex', background: 'var(--indigo-50)', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
                        <Bus size={32} color="var(--primary)" />
                    </div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>Select Assigned Bus</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: '500' }}>Please select the vehicle you are operating today to start live tracking.</p>
                </div>

                {/* Search Bar */}
                <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', padding: '1rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
                        <input
                            placeholder="Find your bus by name or route..."
                            style={{ paddingLeft: '44px', border: 'none', background: 'transparent', height: '48px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Bus List */}
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                    {filteredBuses.map((bus, idx) => (
                        <motion.div
                            key={bus.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => handleSelectBus(bus.id)}
                            className="card"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '1.5rem 2rem',
                                cursor: 'pointer',
                                border: '2px solid transparent'
                            }}
                            whileHover={{ scale: 1.01, borderColor: 'var(--primary)', boxShadow: 'var(--shadow-lg)' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{ background: '#F1F5F9', padding: '1rem', borderRadius: '16px' }}>
                                    <Bus size={24} color="#475569" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{bus.name}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <MapPin size={14} /> {bus.departure_city} → {bus.arrival_city}
                                        </div>
                                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#CBD5E1' }}></div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <Clock size={14} /> {bus.departure_time.substring(0, 5)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{ textAlign: 'right', display: 'none' }}>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '800' }}>STATUS</p>
                                    <p style={{ fontWeight: '700', color: bus.status === 'Running' ? 'var(--accent)' : 'var(--primary)' }}>{bus.status}</p>
                                </div>
                                <div style={{ background: 'var(--indigo-50)', padding: '0.6rem', borderRadius: '12px' }}>
                                    <ArrowRight size={20} color="var(--primary)" />
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {filteredBuses.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                            <Filter size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p>No buses matching your search were found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DriverBusSelection;
