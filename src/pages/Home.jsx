import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Zap, Clock, MapPin, Star, Award, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBooking } from '../context/BookingContext';
import CityAutocomplete from '../components/CityAutocomplete';
import CalendarPicker from '../components/CalendarPicker';

const Home = () => {
    const navigate = useNavigate();
    const { searchData, updateSearch } = useBooking();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchData.from && searchData.to) {
            navigate('/search');
        }
    };

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            {/* Hero Section */}
            <section style={{
                background: 'linear-gradient(135deg, var(--secondary) 0%, #0F172A 100%)',
                padding: 'var(--hero-padding, 8rem 2rem 12rem)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <style>{`
                    @media (max-width: 768px) {
                        section { padding: 6rem 1rem 10rem !important; }
                        h1 { fontSize: 2.5rem !important; lineHeight: 1.2 !important; }
                        .search-grid { gridTemplateColumns: 1fr !important; padding: 1.5rem !important; }
                        .metrics-grid { gridTemplateColumns: 1fr 1fr !important; gap: 1rem !important; margin-top: -3rem !important; }
                        .feature-grid { gridTemplateColumns: 1fr !important; gap: 2rem !important; }
                    }
                `}</style>

                {/* Animated Background Elements */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 10, repeat: Infinity }}
                    style={{
                        position: 'absolute',
                        top: '-10%',
                        right: '-10%',
                        width: '600px',
                        height: '600px',
                        background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)',
                        borderRadius: '50%',
                        filter: 'blur(80px)'
                    }}
                ></motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="container"
                    style={{ position: 'relative', zIndex: 10 }}
                >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.5rem 1.25rem', borderRadius: '30px', color: 'white', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '2rem', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Star size={16} fill="var(--primary)" color="var(--primary)" />
                        NEXT-GEN TRAVEL TECHNOLOGY
                    </div>
                    <h1 style={{ color: 'white', fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', marginBottom: '1.5rem', lineHeight: '1.1', fontWeight: '900', letterSpacing: '-2px' }}>
                        The Future of <br />
                        <span style={{ color: 'var(--primary)', position: 'relative' }}>
                            Smart Travel
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ delay: 0.8, duration: 1 }}
                                style={{ position: 'absolute', bottom: '10px', left: 0, height: '8px', backgroundColor: 'rgba(216, 78, 85, 0.3)', zIndex: -1 }}
                            />
                        </span>
                    </h1>
                    <p style={{ color: '#94A3B8', fontSize: 'clamp(1rem, 4vw, 1.25rem)', maxWidth: '800px', margin: '0 auto 4rem', lineHeight: '1.6' }}>
                        Outrunning the competition with real-time AI assistance, MySQL-backed security, and high-fidelity live fleet tracking. Join 1M+ smart commuters.
                    </p>
                </motion.div>

                {/* Search Box */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="container"
                    style={{ position: 'relative', zIndex: 10 }}
                >
                    <div className="card glass search-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr)) auto',
                        gap: '1.5rem',
                        padding: '2.5rem',
                        alignItems: 'end',
                        boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.6)',
                        borderRadius: '24px'
                    }}>
                        <CityAutocomplete
                            label="SOURCE CITY"
                            placeholder="Where are you?"
                            value={searchData.from}
                            onChange={(val) => updateSearch({ from: val })}
                            icon={MapPin}
                        />

                        <CityAutocomplete
                            label="DESTINATION"
                            placeholder="Where to go?"
                            value={searchData.to}
                            onChange={(val) => updateSearch({ to: val })}
                            icon={MapPin}
                        />

                        <CalendarPicker
                            label="DEPARTURE DATE"
                            selectedDate={searchData.date}
                            onChange={(val) => updateSearch({ date: val })}
                        />

                        <button onClick={handleSearch} className="btn-primary" style={{ padding: '0 3rem', height: '58px', fontSize: '1.1rem', borderRadius: '12px' }}>
                            SEARCH BUSES
                        </button>
                    </div>
                </motion.div>
            </section>

            {/* Metrics Section */}
            <section style={{ marginTop: '-5rem', position: 'relative', zIndex: 20 }}>
                <div className="container">
                    <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                        <MetricItem icon={<Users />} count="1.2M+" label="Active Users" />
                        <MetricItem icon={<MapPin />} count="500+" label="Cities Covered" />
                        <MetricItem icon={<Award />} count="4.9/5" label="Average Rating" />
                        <MetricItem icon={<Zap />} count="24/7" label="AI Support" />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section style={{ padding: 'clamp(4rem, 10vw, 8rem) 1rem', backgroundColor: 'white' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: 'clamp(3rem, 8vw, 6rem)' }}>
                        <h2 style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', marginBottom: '1.5rem', fontWeight: '800' }}>Why SmartBus Leads</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>We don't just move people; we innovate every second of your journey.</p>
                    </div>

                    <div className="feature-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem' }}>
                        <FeatureCard
                            icon={<Zap size={36} />}
                            title="Real-Time AI Intelligence"
                            desc="Our integrated AI Helpdesk handles everything from tracking to cancellations in seconds. No more waiting on hold."
                            color="#DC2626"
                        />
                        <FeatureCard
                            icon={<ShieldCheck size={36} />}
                            title="AES-256 MySQL Security"
                            desc="Your data is non-negotiable. Every transaction and passenger detail is encrypted and stored in our robust SQL infrastructure."
                            color="#10B981"
                        />
                        <FeatureCard
                            icon={<Clock size={36} />}
                            title="Precision Fleet Monitoring"
                            desc="Powered by advanced geolocation APIs, our tracking system is accurate down to 3 meters. Know exactly where your bus is."
                            color="#2563EB"
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

const MetricItem = ({ icon, count, label }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="card"
        style={{ textAlign: 'center', padding: '2rem', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}
    >
        <div style={{ color: 'var(--primary)', display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            {icon}
        </div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '0.25rem' }}>{count}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</p>
    </motion.div>
);

const FeatureCard = ({ icon, title, desc, color }) => (
    <div style={{ display: 'flex', gap: '1.5rem', flexDirection: 'column' }}>
        <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            backgroundColor: `${color}15`,
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 10px 20px ${color}10`
        }}>
            {icon}
        </div>
        <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: '800' }}>{title}</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', fontSize: '0.95rem' }}>{desc}</p>
        </div>
    </div>
);

export default Home;
