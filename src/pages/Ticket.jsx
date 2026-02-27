import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Share2, CheckCircle2, MapPin, Calendar, Clock, Bus, Map as MapIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBooking } from '../context/BookingContext';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

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
                const res = await axios.get(`http://localhost:5000/api/buses/track/${busId}`);
                setPosition([res.data.lat, res.data.lng]);
                setLoading(false);
            } catch (err) {
                console.error('Tracking error', err);
                // Fallback for demo if server not running
                setPosition([40.7128, -74.0060]);
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

    if (!bookingResult) {
        return (
            <div style={{ padding: '5rem', textAlign: 'center' }}>
                <h2>Ticket Not Found</h2>
                <Link to="/" className="btn-primary" style={{ marginTop: '1rem' }}>Go Home</Link>
            </div>
        );
    }

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
                        <p style={{ fontSize: '0.9rem' }}>Details stored in MySQL. Your ticket is ready.</p>
                    </div>
                </motion.div>

                {/* Ticket Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="card"
                    style={{ padding: 0, overflow: 'hidden', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', position: 'relative' }}
                >
                    <div style={{ backgroundColor: 'var(--secondary)', color: 'white', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Bus size={24} color="var(--primary)" />
                            <span style={{ fontWeight: '800', fontSize: '1.2rem' }}>SmartBus Ticket</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '0.7rem', opacity: 0.7 }}>BOOKING ID</p>
                            <p style={{ fontWeight: '700', letterSpacing: '1px' }}>{bookingId}</p>
                        </div>
                    </div>

                    <div style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', position: 'relative' }}>
                            <div>
                                <h3 style={{ fontSize: '1.5rem' }}>{searchData.from}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Dep: {selectedBus?.departure || 'N/A'}</p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                <div style={{ width: '40%', height: '1px', borderTop: '2px dashed var(--border)', position: 'relative' }}>
                                    <div style={{ position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'white', padding: '0 10px' }}>
                                        <Bus size={20} color="var(--text-muted)" />
                                    </div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <h3 style={{ fontSize: '1.5rem' }}>{searchData.to}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Arr: {selectedBus?.arrival || 'N/A'}</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem', padding: '1.5rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                            <div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>TRAVEL DATE</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Calendar size={18} color="var(--primary)" />
                                    <span style={{ fontWeight: '600' }}>{searchData.date}</span>
                                </div>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>SEATS</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <CheckCircle2 size={18} color="var(--accent)" />
                                    <span style={{ fontWeight: '600' }}>{selectedSeats.join(', ')}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', backgroundColor: 'var(--background)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                            <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                <QRCodeSVG value={`BS-${bookingId}`} size={80} level="H" />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '600' }}>Smart Entry QR</p>
                                <button
                                    onClick={() => setShowMap(!showMap)}
                                    className="btn-outline"
                                    style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem' }}
                                >
                                    <MapIcon size={14} /> {showMap ? 'Hide Tracking' : 'Track Live Bus'}
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
                                    <TrackingMap busId={selectedBus?.id || 1} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div style={{ marginTop: '2rem' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '1rem' }}>PASSENGERS</p>
                            {passengerDetails?.map((p, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                    <span>{p.name} ({p.gender}, {p.age})</span>
                                    <span style={{ fontWeight: '600' }}>Seat {p.seatId}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                    <button className="btn-outline" style={{ flex: 1, display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <Download size={20} /> DOWNLOAD
                    </button>
                    <button className="btn-outline" style={{ flex: 1, display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <Share2 size={20} /> SHARE
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Ticket;
