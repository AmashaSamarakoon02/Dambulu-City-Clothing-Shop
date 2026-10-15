import React, { createContext, useState, useEffect, useContext } from 'react';
import axiosInstance from '../api/axiosInstance';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axiosInstance.get('/auth/check');
        setUser(response.data.user);
        setIsAuthenticated(Boolean(response.data.user));
      } catch (error) {
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const response = await axiosInstance.post('/auth/login', { email, password });
    setUser(response.data.user);
    setIsAuthenticated(true);
    return response.data;
  };

  // Registration does not log the user in: they must verify their email first.
  const register = async (firstName, lastName, email, password) => {
    const response = await axiosInstance.post('/auth/register', { firstName, lastName, email, password });
    return response.data;
  };

  const verifyEmail = async (token) => {
    const response = await axiosInstance.get(`/auth/verify-email/${token}`);
    return response.data;
  };

  const resendVerification = async (email) => {
    const response = await axiosInstance.post('/auth/resend-verification', { email });
    return response.data;
  };

  const forgotPassword = async (email) => {
    const response = await axiosInstance.post('/auth/forgot-password', { email });
    return response.data;
  };

  const resetPassword = async (token, password) => {
    const response = await axiosInstance.post(`/auth/reset-password/${token}`, { password });
    return response.data;
  };

  const logout = async () => {
    await axiosInstance.post('/auth/logout');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated, loading, login, register, logout,
      verifyEmail, resendVerification, forgotPassword, resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};
