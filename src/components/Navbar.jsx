import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bus, User, Users, Menu, X, LayoutDashboard, LogOut, Search, Ticket as TicketIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = ({ isDriver = false }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <>
            <nav style={{
                padding: '1rem 2rem',
                backgroundColor: 'white',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                boxShadow: 'var(--shadow-sm)'
            }}>
                <style>{`
                    @media (max-width: 768px) {
                        nav { padding: 1rem !important; }
                        .nav-links { display: none !important; }
                        .mobile-menu-btn { display: flex !important; }
                    }
                    .nav-links { display: flex; align-items: center; gap: 2rem; }
                    .mobile-menu-btn { display: none; align-items: center; justify-content: center; width: 40px; height: 40px; background: #F1F5F9; border-radius: 10px; }
                `}</style>

                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
                    <div style={{
                        backgroundColor: '#6366F1',
                        color: 'white',
                        padding: '0.5rem',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <LayoutDashboard size={24} />
                    </div>
                    <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#6366F1', letterSpacing: '-0.5px' }}>
                        Driver<span style={{ color: 'var(--secondary)' }}>Console</span>
                    </span>
                </Link>

                <div className="nav-links">
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        {isDriver ? (
                            <>
                                <Link to="/" style={{ fontWeight: '600', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <LayoutDashboard size={18} /> Dashboard
                                </Link>
                                <Link to="/driver/seats" style={{ fontWeight: '500', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Users size={18} /> Occupancy
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link to="/" style={{ fontWeight: '600', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Bus size={18} /> Home
                                </Link>
                                <Link to="/search" style={{ fontWeight: '500', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Search size={18} /> Book Ticket
                                </Link>
                                <Link to="/status" style={{ fontWeight: '500', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <TicketIcon size={18} /> My Ticket
                                </Link>
                            </>
                        )}
                    </div>

                    <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--border)' }}></div>

                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.875rem', fontWeight: '700', lineHeight: 1 }}>{user.name}</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.role}</p>
                            </div>
                            <button
                                onClick={() => { logout(); navigate('/'); }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    background: 'rgba(216, 78, 85, 0.1)',
                                    color: 'var(--primary)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    fontWeight: '600'
                                }}
                            >
                                <LogOut size={18} /> Logout
                            </button>
                        </div>
                    ) : (
                        <Link to="/login" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'var(--primary)',
                            color: 'white',
                            padding: '0.6rem 1.25rem',
                            borderRadius: '8px',
                            fontWeight: '600',
                            textDecoration: 'none'
                        }}>
                            <User size={20} />
                            Login / Signup
                        </Link>
                    )}
                </div>

                <button className="mobile-menu-btn" onClick={toggleMenu}>
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </nav>

            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{
                            backgroundColor: 'white',
                            borderBottom: '1px solid var(--border)',
                            overflow: 'hidden',
                            position: 'fixed',
                            top: '64px',
                            left: 0,
                            right: 0,
                            zIndex: 999,
                            padding: '1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.5rem',
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                        }}
                    >
                        {isDriver ? (
                            <>
                                <Link to="/" onClick={toggleMenu} style={{ fontWeight: '600', fontSize: '1.1rem' }}>Dashboard</Link>
                                <Link to="/driver/seats" onClick={toggleMenu} style={{ fontWeight: '600', fontSize: '1.1rem' }}>Occupancy</Link>
                            </>
                        ) : (
                            <>
                                <Link to="/" onClick={toggleMenu} style={{ fontWeight: '600', fontSize: '1.1rem' }}>Home</Link>
                                <Link to="/search" onClick={toggleMenu} style={{ fontWeight: '600', fontSize: '1.1rem' }}>Book Ticket</Link>
                                <Link to="/status" onClick={toggleMenu} style={{ fontWeight: '600', fontSize: '1.1rem' }}>Ticket Status</Link>
                                {user && <Link to="/my-bookings" onClick={toggleMenu} style={{ fontWeight: '600', fontSize: '1.1rem' }}>My Bookings</Link>}
                            </>
                        )}
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                            {user ? (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ fontWeight: '700' }}>{user.name}</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.role}</p>
                                    </div>
                                    <button onClick={() => { logout(); navigate('/'); toggleMenu(); }} className="btn-outline">Logout</button>
                                </div>
                            ) : (
                                <Link to="/login" onClick={toggleMenu} className="btn-primary" style={{ width: '100%', textDecoration: 'none' }}>Login / Signup</Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
