import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DriverDashboard from './pages/DriverDashboard';
import DriverSeatMap from './pages/DriverSeatMap';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function DriverApp() {
    return (
        <AuthProvider>
            <BookingProvider>
                <Router>
                    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
                        <Navbar isDriver={true} />
                        <main style={{ flex: 1 }}>
                            <Routes>
                                <Route path="/" element={<DriverDashboard />} />
                                <Route path="/driver" element={<DriverDashboard />} />
                                <Route path="/driver.html" element={<DriverDashboard />} />
                                <Route path="/driver/seats" element={<DriverSeatMap />} />
                            </Routes>
                        </main>
                        <Footer />
                    </div>
                </Router>
            </BookingProvider>
        </AuthProvider>
    );
}

export default DriverApp;
