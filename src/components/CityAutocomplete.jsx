import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapPin, Search, Loader2 } from 'lucide-react';
import debounce from 'lodash.debounce';

const CityAutocomplete = ({ value, onChange, placeholder, icon: Icon, label }) => {
    const [query, setQuery] = useState(value);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Debounced search function
    const searchCity = useRef(
        debounce(async (text) => {
            if (text.length < 3) {
                setSuggestions([]);
                return;
            }
            setLoading(true);
            try {
                const response = await axios.get(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${text}&addressdetails=1&limit=5&featuretype=city`
                );
                setSuggestions(response.data);
            } catch (err) {
                console.error('City search error:', err);
            } finally {
                setLoading(false);
            }
        }, 500)
    ).current;

    useEffect(() => {
        if (query !== value) {
            searchCity(query);
        }
    }, [query]);

    const handleSelect = (city) => {
        const cityName = city.display_name.split(',')[0];
        setQuery(cityName);
        onChange(cityName);
        setSuggestions([]);
        setShowDropdown(false);
    };

    return (
        <div style={{ textAlign: 'left', position: 'relative' }} ref={dropdownRef}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                {label}
            </label>
            <div style={{ position: 'relative' }}>
                <Icon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', zIndex: 1 }} />
                <input
                    type="text"
                    placeholder={placeholder}
                    value={query}
                    onFocus={() => setShowDropdown(true)}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '0.875rem 0.875rem 0.875rem 2.5rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        outline: 'none',
                        fontSize: '1rem'
                    }}
                />
                {loading && <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />}
            </div>

            {showDropdown && suggestions.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    border: '1px solid var(--border)',
                    zIndex: 1000,
                    marginTop: '4px',
                    maxHeight: '250px',
                    overflowY: 'auto'
                }}>
                    {suggestions.map((city, idx) => (
                        <div
                            key={idx}
                            onClick={() => handleSelect(city)}
                            style={{
                                padding: '0.75rem 1rem',
                                cursor: 'pointer',
                                borderBottom: idx !== suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                                transition: 'background 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--background)'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                        >
                            <MapPin size={14} color="var(--text-muted)" />
                            <div style={{ fontSize: '0.9rem' }}>
                                <div style={{ fontWeight: '600' }}>{city.display_name.split(',')[0]}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{city.display_name.split(',').slice(1).join(',')}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CityAutocomplete;
