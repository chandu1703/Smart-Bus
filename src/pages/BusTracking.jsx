import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Loader2, ArrowLeft } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default marker icon issue in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});
import { API_BASE_URL } from '../api/config';

// Helper component to smoothly pan map to new coordinates
const FlyToLocation = ({ position }) => {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo(position, 13, { duration: 2 });
        }
    }, [position, map]);
    return null;
};

const socket = io(API_BASE_URL, {
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    timeout: 10000,
    path: '/socket.io/'
});

const BusTracking = () => {
    const { busId } = useParams();
    const navigate = useNavigate();
    const [location, setLocation] = useState(null);
    const [busName, setBusName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Initial fetch to get bus details and current location
        const fetchInitial = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/buses/track/${busId}`);
                const data = await res.json();
                if (res.ok) {
                    setBusName(data.name);

                    // Check if tracking should be active (1 hr before travel_date + departure_time)
                    if (data.travel_date && data.departure_time) {
                        const travelDateTime = new Date(`${data.travel_date.split('T')[0]}T${data.departure_time}`);
                        const now = new Date();
                        const timeDiff = travelDateTime - now;
                        const oneHourInMs = 60 * 60 * 1000;

                        if (timeDiff > oneHourInMs) {
                            setError(`Live tracking will be available 1 hour before departure (${new Date(travelDateTime - oneHourInMs).toLocaleTimeString()}).`);
                            setLoading(false);
                            return;
                        }
                    }

                    if (data.lat && data.lng) {
                        setLocation([data.lat, data.lng]);
                    } else {
                        setError('Bus location not yet available.');
                    }
                }
                setLoading(false);
            } catch (e) {
                console.error('Initial fetch failed', e);
                setError('Failed to load tracking data.');
                setLoading(false);
            }
        };

        fetchInitial();

        // Join the bus tracking room
        socket.emit('join-bus', busId);

        // Listen for real-time updates
        socket.on('location-update', (data) => {
            if (data.busId == busId) {
                setLocation([data.lat, data.lng]);
                setError(null);
            }
        });

        return () => {
            socket.off('location-update');
            socket.emit('leave-bus', busId);
        };
    }, [busId]);

    const [userLocation, setUserLocation] = useState(null);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setUserLocation([pos.coords.latitude, pos.coords.longitude]);
            });
        }
    }, []);

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', padding: '1.5rem' }}>
            <style>{`
                @media (max-width: 768px) {
                    .tracking-header { font-size: 1.5rem !important; }
                    .map-container { height: 50vh !important; }
                    .back-btn { margin-bottom: 0.5rem !important; }
                }
            `}</style>
            <button className="back-btn" onClick={() => navigate(-1)} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
                <ArrowLeft size={20} /> Back
            </button>

            <h2 className="tracking-header" style={{ marginBottom: '1.5rem', color: 'var(--secondary)', fontSize: '2rem' }}>Live Tracking</h2>
            <div style={{ marginBottom: '1rem', background: 'white', padding: '1rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981' }}></div>
                <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>{busName || `Bus #${busId}`}</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Updating in real-time</span>
            </div>

            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                    <Loader2 className="animate-spin" size={48} color="var(--primary)" />
                </div>
            )}

            {error && (
                <div style={{ color: '#EF4444', padding: '1.5rem', backgroundColor: '#FEF2F2', borderRadius: '12px', border: '1px solid #FEE2E2', fontWeight: 600 }}>
                    {error}
                </div>
            )}

            {location && (
                <div className="map-container" style={{ height: '70vh', width: '100%', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', border: '1px solid var(--border)' }}>
                    <MapContainer center={location} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <FlyToLocation position={location} />

                        {/* Bus Marker */}
                        <Marker position={location} icon={L.divIcon({
                            className: 'custom-bus-marker',
                            html: `<div style="background-color: var(--primary); color: white; padding: 5px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.2);">🚌</div>`,
                            iconSize: [30, 30],
                            iconAnchor: [15, 15]
                        })}>
                            <Popup>{busName || `Bus #${busId}`}</Popup>
                        </Marker>

                        {/* User Marker */}
                        {userLocation && (
                            <Marker position={userLocation} icon={L.divIcon({
                                className: 'custom-user-marker',
                                html: `<div style="background-color: #10B981; width: 15px; height: 15px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px #10B981;"></div>`,
                                iconSize: [15, 15]
                            })}>
                                <Popup>You are here</Popup>
                            </Marker>
                        )}
                    </MapContainer>
                </div>
            )}
        </div>
    );
};

export default BusTracking;
