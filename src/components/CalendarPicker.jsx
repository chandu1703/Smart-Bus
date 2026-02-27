import { useState, useRef, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, isBefore, startOfToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CalendarPicker = ({ selectedDate, onChange, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate || new Date()));
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const renderHeader = () => {
        return (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: '#F1F5F9' }}>
                    <ChevronLeft size={20} />
                </button>
                <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>{format(currentMonth, 'MMMM yyyy')}</span>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: '#F1F5F9' }}>
                    <ChevronRight size={20} />
                </button>
            </div>
        );
    };

    const renderDays = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 'bold', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0.5rem 0' }}>
                {days.map(day => <div key={day}>{day}</div>)}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = "";

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, "d");
                const cloneDay = day;
                const isDisabled = isBefore(day, startOfToday());
                const isSelected = isSameDay(day, new Date(selectedDate));

                days.push(
                    <div
                        key={day}
                        style={{
                            padding: '0.75rem',
                            textAlign: 'center',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            borderRadius: '8px',
                            color: !isSameMonth(day, monthStart) ? '#CBD5E1' : isDisabled ? '#E2E8F0' : isSelected ? 'white' : 'inherit',
                            backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                            fontWeight: isSelected ? 'bold' : 'normal',
                            transition: 'all 0.2s',
                            position: 'relative'
                        }}
                        onClick={() => {
                            if (!isDisabled) {
                                onChange(format(cloneDay, 'yyyy-MM-dd'));
                                setIsOpen(false);
                            }
                        }}
                        onMouseEnter={(e) => {
                            if (!isDisabled && !isSelected) e.currentTarget.style.backgroundColor = '#F1F5F9';
                        }}
                        onMouseLeave={(e) => {
                            if (!isDisabled && !isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        {formattedDate}
                        {isSameDay(day, new Date()) && !isSelected && (
                            <div style={{ position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
                        )}
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div key={day} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div style={{ padding: '0.5rem' }}>{rows}</div>;
    };

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'rgba(255,255,255,0.6)', marginBottom: '0.75rem', letterSpacing: '1px' }}>{label}</label>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    padding: '1rem 1rem 1rem 3.5rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative'
                }}
            >
                <CalendarIcon size={18} style={{ position: 'absolute', left: '16px', color: 'var(--primary)' }} />
                <span style={{ fontWeight: '600', color: selectedDate ? 'var(--text-main)' : 'var(--text-muted)' }}>
                    {selectedDate ? format(new Date(selectedDate), 'dd MMM yyyy') : 'Select Date'}
                </span>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 10px)',
                            left: 0,
                            zIndex: 100,
                            width: '320px',
                            backgroundColor: 'white',
                            borderRadius: '16px',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                            overflow: 'hidden',
                            userSelect: 'none'
                        }}
                    >
                        {renderHeader()}
                        {renderDays()}
                        {renderCells()}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CalendarPicker;
