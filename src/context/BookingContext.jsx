import React, { createContext, useContext, useState } from 'react';

const BookingContext = createContext();

export const useBooking = () => useContext(BookingContext);

export const BookingProvider = ({ children }) => {
    const [searchData, setSearchData] = useState({
        from: '',
        to: '',
        date: new Date().toISOString().split('T')[0]
    });

    const [selectedBus, setSelectedBus] = useState(null);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [passengerDetails, setPassengerDetails] = useState([]);
    const [bookingResult, setBookingResult] = useState(null);

    const updateSearch = (data) => {
        setSearchData(prev => ({ ...prev, ...data }));
    };

    const clearSelection = () => {
        setSelectedSeats([]);
    };

    const value = {
        searchData,
        updateSearch,
        selectedBus,
        setSelectedBus,
        selectedSeats,
        setSelectedSeats,
        passengerDetails,
        setPassengerDetails,
        bookingResult,
        setBookingResult,
        clearSelection
    };

    return (
        <BookingContext.Provider value={value}>
            {children}
        </BookingContext.Provider>
    );
};
