import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import BusList from './pages/BusList';
import SeatSelection from './pages/SeatSelection';
import Checkout from './pages/Checkout';
import Ticket from './pages/Ticket';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';
import TicketStatus from './pages/TicketStatus';
import Payment from './pages/Payment';
import AiHelpdesk from './components/AiHelpdesk';
import BusTracking from './pages/BusTracking';
import DriverDisplay from './pages/DriverDisplay';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'Admin') return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BookingProvider>
        <Router>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
            <Navbar />
            <main style={{ flex: 1 }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/status" element={<TicketStatus />} />
                <Route path="/search" element={<BusList />} />
                <Route path="/seats/:busId" element={<SeatSelection />} />
                <Route
                  path="/checkout"
                  element={
                    <PrivateRoute>
                      <Checkout />
                    </PrivateRoute>
                  }
                />
                <Route path="/track/:busId" element={<BusTracking />} />
                <Route path="/driver" element={<DriverDisplay />} />
                <Route path="/payment/:bookingId" element={<Payment />} />
                <Route
                  path="/admin"
                  element={
                    <PrivateRoute adminOnly={true}>
                      <Admin />
                    </PrivateRoute>
                  }
                />
              </Routes>
            </main>
            <Footer />
            <AiHelpdesk />
          </div>
        </Router>
      </BookingProvider>
    </AuthProvider>
  );
}

export default App;
