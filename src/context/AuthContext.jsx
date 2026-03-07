import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children, storageKey = 'sb' }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const USER_KEY = `${storageKey}_user`;
    const TOKEN_KEY = `${storageKey}_token`;

    useEffect(() => {
        const savedUser = localStorage.getItem(USER_KEY);
        const token = localStorage.getItem(TOKEN_KEY);
        if (savedUser && token) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, [USER_KEY, TOKEN_KEY]);

    const login = async (email, password) => {
        try {
            const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
            setUser(res.data.user);
            localStorage.setItem(TOKEN_KEY, res.data.token);
            localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
            return { success: true };
        } catch (err) {
            return { success: false, error: err.response?.data?.error || 'Login failed' };
        }
    };

    const register = async (name, email, password, role) => {
        try {
            await axios.post(`${API_BASE_URL}/api/auth/register`, { name, email, password, role });
            return { success: true };
        } catch (err) {
            return { success: false, error: err.response?.data?.error || 'Registration failed' };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        delete axios.defaults.headers.common['Authorization'];
    };

    // Auto-attach token to all axios requests
    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [TOKEN_KEY]);

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
