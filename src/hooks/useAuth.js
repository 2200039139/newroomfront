import { useState, useEffect, useCallback } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  });
  
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('token') || null;
    } catch (error) {
      console.error('Error getting token from localStorage:', error);
      return null;
    }
  });

  const login = useCallback((userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
    setUser(null);
    setToken(null);
    window.location.href = '/login';
  }, []);

  useEffect(() => {
    if (!user || !token) {
      console.log('No user or token found, redirecting to login');
      window.location.href = '/login';
    }
  }, [user, token]);

  return {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!user && !!token
  };
};