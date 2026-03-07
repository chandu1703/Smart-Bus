import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Share2, CheckCircle2, MapPin, Calendar, Clock, Bus, Map as MapIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBooking } from '../context/BookingContext';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';
import { toPng } from 'html-to-image';
import download from 'downloadjs';

// Fix for default marker icons in Leaflet
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const TrackingMap = ({ busId }) => {
    const [position, setPosition] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosition = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/buses/track/${busId}`);
                setPosition([res.data.lat, res.data.lng]);
                setLoading(false);
            } catch (err) {
                console.error('Tracking error', err);
                setPosition(null);
                setLoading(false);
            }
        };

        fetchPosition();
        const interval = setInterval(fetchPosition, 5000);
        return () => clearInterval(interval);
    }, [busId]);

    if (loading) return <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" /></div>;

    return (
        <div style={{ height: '300px', width: '100%', borderRadius: '12px', overflow: 'hidden', marginTop: '1rem' }}>
            <MapContainer center={position} zoom={11} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={position}>
                    <Popup>Bus current location</Popup>
                </Marker>
            </MapContainer>
        </div>
    );
};

const Ticket = () => {
    const { bookingId } = useParams();
    const { bookingResult, selectedBus, searchData, passengerDetails, selectedSeats } = useBooking();
    const [showMap, setShowMap] = useState(false);
    const [dbBooking, setDbBooking] = useState(null);
    const [loading, setLoading] = useState(!bookingResult);
    const ticketRef = useRef(null);

    useEffect(() => {
        if (!bookingResult && bookingId) {
            const fetchBooking = async () => {
                try {
                    const res = await axios.get(`${API_BASE_URL}/api/bookings/status/${bookingId}`);
                    setDbBooking(res.data);
                } catch (err) {
                    console.error("Failed to fetch booking fallback", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchBooking();
        }
    }, [bookingId, bookingResult]);

    if (loading) return <div style={{ padding: '5rem', textAlign: 'center' }}><Loader2 className="animate-spin" size={48} /></div>;

    const data = bookingResult || dbBooking;

    if (!data) {
        return (
            <div style={{ padding: '5rem', textAlign: 'center' }}>
                <h2>Ticket Not Found</h2>
                <Link to="/" className="btn-primary" style={{ marginTop: '1rem' }}>Go Home</Link>
            </div>
        );
    }

    // Map DB fields to match component expectations if needed
    const displayData = bookingResult ? {
        from: searchData.from,
        to: searchData.to,
        date: searchData.date,
        busName: selectedBus?.name,
        seats: selectedSeats,
        passengers: passengerDetails.map(p => ({ ...p, seat_number: p.seatId })),
        busId: selectedBus?.id
    } : {
        from: dbBooking.departure_city,
        to: dbBooking.arrival_city,
        date: new Date(dbBooking.travel_date).toLocaleDateString(),
        busName: dbBooking.bus_name,
        seats: dbBooking.passengers?.map(p => p.seat_number) || [],
        passengers: dbBooking.passengers || [],
        busId: dbBooking.bus_id
    };

    const handleDownload = () => {
        if (ticketRef.current === null) return;
        toPng(ticketRef.current, { cacheBust: true, backgroundColor: '#ffffff' })
            .then((dataUrl) => {
                download(dataUrl, `ticket-${bookingId}.png`);
            })
            .catch((err) => {
                console.error('Could not download ticket', err);
            });
    };

    const handleShare = async () => {
        const shareText = `My SmartBus ticket for ${displayData.from} to ${displayData.to} on ${displayData.date}. Booking ID: ${bookingId}`;
        const shareUrl = window.location.origin + `/ticket/${bookingId}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'SmartBus Ticket',
                    text: shareText,
                    url: shareUrl,
                });
            } catch (err) {
                console.warn('Share failed', err);
            }
        } else {
            // WhatsApp fallback
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
            window.open(whatsappUrl, '_blank');
        }
    };

    const handleEmailShare = () => {
        const shareText = `My SmartBus ticket for ${displayData.from} to ${displayData.to} on ${displayData.date}. Booking ID: ${bookingId}`;
        const shareUrl = window.location.origin + `/ticket/${bookingId}`;
        const mailtoUrl = `mailto:?subject=SmartBus Ticket ${bookingId}&body=${encodeURIComponent(shareText + '\n\nTrack here: ' + shareUrl)}`;
        window.location.href = mailtoUrl;
    };

    return (
        <div style={{ padding: '4rem 0', backgroundColor: '#F1F5F9', minHeight: 'calc(100vh - 80px)' }}>
            <div className="container" style={{ maxWidth: '600px' }}>

                {/* Success Alert */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        backgroundColor: '#DCFCE7', color: '#166534', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', border: '1px solid #BBF7D0'
                    }}
                >
                    <CheckCircle2 size={24} />
                    <div>
                        <p style={{ fontWeight: '700' }}>Booking Successful!</p>
                        <p style={{ fontSize: '0.9rem' }}>Your ticket is ready.</p>
                    </div>
                </motion.div>

                {/* Ticket Card Container (for download) */}
                <div ref={ticketRef} style={{ background: '#F1F5F9', padding: '10px' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="card"
                        style={{ padding: 0, overflow: 'hidden', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', position: 'relative', background: 'white', borderRadius: '24px' }}
                    >
                        <div style={{ backgroundColor: '#0F172A', color: 'white', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ background: 'var(--primary)', padding: '8px', borderRadius: '12px' }}>
                                    <Bus size={20} color="white" />
                                </div>
                                <span style={{ fontWeight: '800', fontSize: '1.2rem', letterSpacing: '-0.5px' }}>SmartBus Ticket</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.65rem', opacity: 0.7, fontWeight: '800' }}>BOOKING ID</p>
                                <p style={{ fontWeight: '700', letterSpacing: '1px', color: 'var(--primary)' }}>{bookingId}</p>
                            </div>
                        </div>

                        <div style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', position: 'relative', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '800' }}>FROM</p>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1E293B' }}>{displayData.from}</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500' }}>{displayData.busName}</p>
                                </div>

                                <div style={{ flex: 0.8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <motion.div
                                        animate={{ x: [0, 10, 0] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        <ArrowRight size={24} color="var(--primary)" />
                                    </motion.div>
                                    <div style={{ width: '100%', height: '1px', borderTop: '2px dashed var(--border)', marginTop: '4px' }}></div>
                                </div>

                                <div style={{ flex: 1, textAlign: 'right' }}>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '800' }}>TO</p>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1E293B' }}>{displayData.to}</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500' }}>#{displayData.busId}</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem', padding: '1.5rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                                <div>
                                    <p style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>DEPARTURE DATE</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ background: '#EEF2FF', padding: '8px', borderRadius: '10px' }}>
                                            <Calendar size={18} color="#6366F1" />
                                        </div>
                                        <span style={{ fontWeight: '700', color: '#1E293B' }}>{displayData.date}</span>
                                    </div>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>SEAT NUMBERS</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ background: '#ECFDF5', padding: '8px', borderRadius: '10px' }}>
                                            <CheckCircle2 size={18} color="#10B981" />
                                        </div>
                                        <span style={{ fontWeight: '700', color: '#1E293B' }}>{displayData.seats.join(', ')}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', background: 'linear-gradient(to right, #F8FAFC, #F1F5F9)', padding: '1.5rem', borderRadius: '20px', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
                                <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                                    <QRCodeSVG value={bookingId} size={90} level="H" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '0.95rem', marginBottom: '0.4rem', fontWeight: '800', color: '#1E293B' }}>Boarding QR Pass</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Show this to the driver for quick entry validation.</p>
                                    <button
                                        onClick={() => setShowMap(!showMap)}
                                        className="btn-outline"
                                        style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white' }}
                                    >
                                        <MapIcon size={14} /> {showMap ? 'Hide Live Map' : 'Track Bus Location'}
                                    </button>
                                </div>
                            </div>

                            <AnimatePresence>
                                {showMap && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        <TrackingMap busId={displayData.busId} />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div style={{ marginTop: '2rem' }}>
                                <p style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase' }}>PASSENGER ROSTER</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {displayData.passengers?.map((p, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800', color: '#475569' }}>
                                                    {p.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1E293B' }}>{p.name}</p>
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.gender} • {p.age} Years</p>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: '800' }}>SEAT</p>
                                                <p style={{ fontWeight: '900', color: 'var(--primary)', fontSize: '1.1rem' }}>{p.seat_number}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="ticket-actions" style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                    <button className="btn-primary" onClick={handleDownload} style={{ flex: 1.5, display: 'flex', gap: '0.75rem', justifyContent: 'center', alignItems: 'center', height: '56px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(220, 38, 38, 0.2)' }}>
                        <Download size={22} /> DOWNLOAD TICKET
                    </button>
                    <div style={{ display: 'flex', gap: '0.75rem', flex: 1 }}>
                        <button className="btn-outline" onClick={handleShare} style={{ flex: 1, display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center', height: '56px', borderRadius: '16px', border: '2px solid #E2E8F0' }}>
                            <Share2 size={20} /> Share
                        </button>
                        <button className="btn-outline" onClick={handleEmailShare} style={{ flex: 1, display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center', height: '56px', borderRadius: '16px', border: '2px solid #E2E8F0' }}>
                            Email
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Add ArrowRight icon missing from imports
const ArrowRight = ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14"></path>
        <path d="m12 5 7 7-7 7"></path>
    </svg>
);

export default Ticket;
