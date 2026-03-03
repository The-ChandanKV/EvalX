import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('evalx_user')); } catch { return null; }
    });
    const [loading, setLoading] = useState(false);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const { token, user } = res.data;  // backend spreads at top level, not nested under 'data'
        localStorage.setItem('evalx_token', token);
        localStorage.setItem('evalx_user', JSON.stringify(user));
        setUser(user);
        return user;
    };

    const register = async (data) => {
        const res = await api.post('/auth/register', data);
        const { token, user } = res.data;  // backend spreads at top level, not nested under 'data'
        localStorage.setItem('evalx_token', token);
        localStorage.setItem('evalx_user', JSON.stringify(user));
        setUser(user);
        return user;
    };

    const logout = () => {
        localStorage.removeItem('evalx_token');
        localStorage.removeItem('evalx_user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, setLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
