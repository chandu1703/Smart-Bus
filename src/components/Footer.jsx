import { Bus, Facebook, Twitter, Instagram, Mail, Phone } from 'lucide-react';

const Footer = () => {
    return (
        <footer style={{
            backgroundColor: 'var(--secondary)',
            color: 'white',
            padding: '4rem 2rem 2rem',
            marginTop: 'auto'
        }}>
            <div className="container" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '3rem',
                marginBottom: '3rem'
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: '800' }}>
                            {window.location.pathname.includes('driver') ? 'DriverConsole' : 'SmartBus'}
                        </span>
                    </div>
                    <p style={{ color: '#94A3B8', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                        {window.location.pathname.includes('driver')
                            ? 'Professional fleet management and driver operations system. Real-time occupancy tracking and journey analytics.'
                            : 'Experience the future of smart travel. Fast, secure, and reliable bus bookings with real-time tracking.'}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Facebook size={20} style={{ cursor: 'pointer' }} />
                        <Twitter size={20} style={{ cursor: 'pointer' }} />
                        <Instagram size={20} style={{ cursor: 'pointer' }} />
                    </div>
                </div>

                <div>
                    <h4 style={{ marginBottom: '1.5rem', color: 'white' }}>Quick Links</h4>
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <li><a href="/" style={{ color: '#94A3B8' }}>Driver Dashboard</a></li>
                        <li><a href="/driver/seats" style={{ color: '#94A3B8' }}>Seat Occupancy</a></li>
                        <li><a href="#" style={{ color: '#94A3B8' }}>Route Schedule</a></li>
                    </ul>
                </div>

                <div>
                    <h4 style={{ marginBottom: '1.5rem', color: 'white' }}>Contact Us</h4>
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94A3B8' }}>
                            <Phone size={18} /> +91 98765 43210
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94A3B8' }}>
                            <Mail size={18} /> support@smartbus.com
                        </li>
                    </ul>
                </div>
            </div>

            <div style={{
                borderTop: '1px solid rgba(255,255,255,0.1)',
                paddingTop: '2rem',
                textAlign: 'center',
                color: '#64748B',
                fontSize: '0.9rem'
            }}>
                © {new Date().getFullYear()} {window.location.pathname.includes('driver') ? 'DriverConsole Pro' : 'SmartBus Technologies'}. All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;
