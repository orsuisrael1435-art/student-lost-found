import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('lf_token');
    if (!token) { setLoading(false); return; }
    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch {
      localStorage.removeItem('lf_token');
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: u } = res.data;
    localStorage.setItem('lf_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(u);
    return u;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    const { token, user: u } = res.data;
    localStorage.setItem('lf_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(u);
    return u;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('lf_token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateUser = (updatedUser) => setUser(prev => ({ ...prev, ...updatedUser }));

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, refreshUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
