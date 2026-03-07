import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DriverDashboard from './pages/DriverDashboard';
import DriverSeatMap from './pages/DriverSeatMap';
import DriverBusSelection from './pages/DriverBusSelection';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

const DriverRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div style={{ padding: '5rem', textAlign: 'center' }}>Validating Driver Credentials...</div>;

    // Check if user is logged in AND is either a Driver or an Admin
    if (!user) return <Navigate to="/login" />;

    const role = user.role?.toLowerCase();
    if (role !== 'driver' && role !== 'admin') {
        return (
            <div style={{ padding: '5rem', textAlign: 'center', color: '#EF4444' }}>
                <h2>Access Denied</h2>
                <p>Only registered drivers can access this console.</p>
                <button onClick={() => window.location.href = '/'} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#6366F1', color: 'white', border: 'none', borderRadius: '8px' }}>
                    Back to Main App
                </button>
            </div>
        );
    }

    return children;
};

import { usePWAInstall } from './hooks/usePWAInstall';
import { Smartphone, Download, X } from 'lucide-react';

const InstallBanner = () => {
    const { isInstallable, install } = usePWAInstall();
    const [dismissed, setDismissed] = useState(false);

    if (!isInstallable || dismissed) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            right: '20px',
            background: '#1E293B',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10000,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255,255,255,0.1)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: '#6366F1', padding: '0.6rem', borderRadius: '12px' }}>
                    <Smartphone size={20} />
                </div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Install Driver Console</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Access fleet controls faster from home screen</div>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={install} style={{ background: '#6366F1', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '12px', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Download size={14} /> INSTALL
                </button>
                <button onClick={() => setDismissed(true)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', padding: '0.4rem' }}>
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};

function DriverApp() {
    return (
        <AuthProvider storageKey="driver_sys">
            <BookingProvider>
                <Router>
                    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
                        <Navbar isDriver={true} />
                        <main style={{ flex: 1 }}>
                            <Routes>
                                <Route path="/login" element={<Login hideRegister={true} />} />
                                <Route path="/" element={
                                    <DriverRoute>
                                        <DriverBusSelection />
                                    </DriverRoute>
                                } />
                                <Route path="/driver" element={
                                    <DriverRoute>
                                        <DriverBusSelection />
                                    </DriverRoute>
                                } />
                                <Route path="/driver.html" element={
                                    <DriverRoute>
                                        <DriverBusSelection />
                                    </DriverRoute>
                                } />
                                <Route path="/driver/dashboard" element={
                                    <DriverRoute>
                                        <DriverDashboard />
                                    </DriverRoute>
                                } />
                                <Route path="/driver/seats" element={
                                    <DriverRoute>
                                        <DriverSeatMap />
                                    </DriverRoute>
                                } />
                                <Route path="*" element={<Navigate to="/" />} />
                            </Routes>
                        </main>
                        <Footer />
                        <InstallBanner />
                    </div>
                </Router>
            </BookingProvider>
        </AuthProvider>
    );
}

export default DriverApp;
