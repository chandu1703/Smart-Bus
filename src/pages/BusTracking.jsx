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

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', padding: '2rem' }}>
            <button onClick={() => navigate(-1)} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>
                <ArrowLeft size={20} /> Back
            </button>

            <h2 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>Live Tracking – {busName || `Bus #${busId}`}</h2>

            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                    <Loader2 className="animate-spin" size={48} color="var(--primary)" />
                </div>
            )}

            {error && (
                <div style={{ color: 'var(--error)', padding: '1rem', backgroundColor: '#FEF2F2', borderRadius: '8px' }}>
                    {error}
                </div>
            )}

            {location && (
                <MapContainer center={location} zoom={13} style={{ height: '70vh', width: '100%', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <FlyToLocation position={location} />
                    <Marker position={location}>
                        <Popup>{busName || `Bus #${busId}`}</Popup>
                    </Marker>
                </MapContainer>
            )}
        </div>
    );
};

export default BusTracking;
