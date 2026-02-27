import { useEffect, useState } from 'react';
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

const BusTracking = () => {
    const { busId } = useParams();
    const navigate = useNavigate();
    const [location, setLocation] = useState(null);
    const [busName, setBusName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Poll the backend every 5 seconds for fresh coordinates
    useEffect(() => {
        let intervalId;
        const fetchLocation = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/buses/track/${busId}`);
                const data = await res.json();
                if (res.ok) {
                    setLocation([data.lat, data.lng]);
                    setBusName(data.name);
                    setError(null);
                } else {
                    setError(data.error || 'Failed to fetch location');
                }
                setLoading(false);
            } catch (e) {
                setError('Network error');
                setLoading(false);
            }
        };
        fetchLocation();
        intervalId = setInterval(fetchLocation, 5000);
        return () => clearInterval(intervalId);
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
