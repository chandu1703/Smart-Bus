import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Clock, MapPin, Star, Wifi, Coffee, Battery, ChevronRight, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBooking } from '../context/BookingContext';
import axios from 'axios';

const BusList = () => {
    const navigate = useNavigate();
    const { searchData, setSelectedBus } = useBooking();
    const [buses, setBuses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBuses = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/buses');

                const mappedBuses = res.data.map(bus => ({
                    id: bus.id,
                    name: bus.name,
                    type: bus.type,
                    departure: bus.departure_time.substring(0, 5),
                    arrival: bus.arrival_time.substring(0, 5),
                    price: parseFloat(bus.price),
                    rating: (4 + Math.random()).toFixed(1),
                    reviews: Math.floor(Math.random() * 200) + 10,
                    seatsAvailable: bus.total_seats,
                    features: ['wifi', 'water', 'charging'],
                    departure_city: bus.departure_city,
                    arrival_city: bus.arrival_city,
                    duration: 'approx. 8h'
                }));

                const filtered = mappedBuses.filter(bus =>
                    bus.departure_city.toLowerCase().includes(searchData.from?.toLowerCase() || '') &&
                    bus.arrival_city.toLowerCase().includes(searchData.to?.toLowerCase() || '')
                );

                setBuses(filtered);
            } catch (err) {
                console.error('Failed to fetch buses', err);
            } finally {
                setLoading(false);
            }
        };
        fetchBuses();
    }, [searchData]);

    const handleSelectBus = (bus) => {
        setSelectedBus(bus);
        navigate(`/seats/${bus.id}`);
    };

    if (loading) return (
        <div style={{ padding: '5rem', textAlign: 'center' }}>
            <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            <p style={{ marginTop: '1rem' }}>Searching for the best routes...</p>
        </div>
    );
    return (
        <div style={{ padding: '2rem 0', backgroundColor: 'var(--background)' }}>
            <style>{`
                @media (max-width: 768px) {
                    .search-overview { flex-direction: column !important; gap: 1rem !important; align-items: flex-start !important; }
                    .search-overview > div { width: 100% !important; justify-content: space-between !important; }
                    .bus-card-grid { grid-template-columns: 1fr !important; gap: 1.5rem !important; }
                    .bus-card-price-section { border-left: none !important; border-top: 1px solid var(--border) !important; padding-left: 0 !important; padding-top: 1.5rem !important; text-align: left !important; }
                    .bus-card-timing { justify-content: space-between !important; }
                }
            `}</style>
            <div className="container">
                {/* Search Overview Bar */}
                <div className="card search-overview" style={{
                    marginBottom: '2rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.25rem 2rem'
                }}>
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 'bold' }}>FROM</span>
                                <p style={{ fontWeight: '600' }}>{searchData.from || 'Source'}</p>
                            </div>
                            <ArrowRight size={16} color="var(--text-muted)" />
                            <div>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 'bold' }}>TO</span>
                                <p style={{ fontWeight: '600' }}>{searchData.to || 'Dest'}</p>
                            </div>
                        </div>
                        <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--border)', display: 'none' }}></div>
                        <div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 'bold' }}>DATE</span>
                            <p style={{ fontWeight: '600' }}>{searchData.date}</p>
                        </div>
                    </div>
                    <button className="btn-outline" onClick={() => navigate('/')} style={{ padding: '0.5rem 1rem', width: 'auto' }}>MODIFY</button>
                </div>

                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>{buses.length} Buses found</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {buses.map((bus, idx) => (
                        <motion.div
                            key={bus.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="card"
                            style={{
                                padding: '0',
                                overflow: 'hidden',
                                transition: 'all 0.2s',
                                cursor: 'pointer'
                            }}
                            whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                            onClick={() => handleSelectBus(bus)}
                        >
                            <div className="bus-card-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1.2fr) 1.5fr 1fr 1fr', padding: '1.5rem', gap: '1.5rem' }}>
                                <div>
                                    <h3 style={{ marginBottom: '0.25rem', fontSize: '1.25rem' }}>{bus.name}</h3>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{bus.type}</p>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        {bus.features.includes('wifi') && <Wifi size={18} color="var(--text-muted)" />}
                                        {bus.features.includes('water') && <Coffee size={18} color="var(--text-muted)" />}
                                        {bus.features.includes('charging') && <Battery size={18} color="var(--text-muted)" />}
                                    </div>
                                </div>

                                <div className="bus-card-timing" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ fontSize: '1.125rem', fontWeight: '800' }}>{bus.departure}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>{searchData.from}</p>
                                    </div>
                                    <div style={{ flex: 1, position: 'relative', minWidth: '40px', textAlign: 'center' }}>
                                        <div style={{ height: '2px', backgroundColor: 'var(--border)', width: '100%', marginBottom: '4px' }}></div>
                                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700' }}>{bus.duration}</p>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ fontSize: '1.125rem', fontWeight: '800' }}>{bus.arrival}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>{searchData.to}</p>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'center', alignSelf: 'center' }}>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent)', padding: '0.4rem 0.75rem', borderRadius: '8px', marginBottom: '0.5rem' }}>
                                        <Star size={16} fill="var(--accent)" />
                                        <span style={{ fontWeight: '700' }}>{bus.rating}</span>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{bus.reviews} reviews</p>
                                </div>

                                <div className="bus-card-price-section" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: '1px solid var(--border)', paddingLeft: '1.5rem' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>STARTING FROM</p>
                                    <p style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--secondary)', marginBottom: '0.5rem' }}>₹{bus.price}</p>
                                    <button className="btn-primary" style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}>SELECT SEATS</button>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.5rem', fontWeight: '700' }}>{bus.seatsAvailable} seats left</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div >
    );
};

export default BusList;
