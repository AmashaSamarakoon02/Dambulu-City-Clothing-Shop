import React, { createContext, useContext, useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';

// Admin portal session. Completely separate from the customer AuthContext
// (different API + cookie), and only mounted around the admin routes.
const AdminAuthContext = createContext();

export const useAdminAuth = () => useContext(AdminAuthContext);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get('/admin/auth/check')
      .then((res) => setAdmin(res.data.user))
      .catch(() => setAdmin(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await axiosInstance.post('/admin/auth/login', { email, password });
    setAdmin(res.data.user);
    return res.data;
  };

  const logout = async () => {
    await axiosInstance.post('/admin/auth/logout');
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, isAdmin: Boolean(admin), loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
