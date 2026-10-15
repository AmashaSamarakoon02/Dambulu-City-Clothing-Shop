import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

// Guards the admin panel with the admin session (never the customer session).
const AdminRoute = () => {
  const { isAdmin, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/admin/login" replace state={{ from: location }} />;
  return <Outlet />;
};

export default AdminRoute;
