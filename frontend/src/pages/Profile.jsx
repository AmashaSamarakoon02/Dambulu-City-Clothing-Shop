import React from 'react';
import { Navigate } from 'react-router-dom';
import UserProfile from './UserProfile';
import EmployeeProfile from './EmployeeProfile';
import DeliveryProfile from './DeliveryProfile';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  switch (user?.role) {
    case 'EMPLOYEE':
      return <EmployeeProfile />;
    case 'DELIVERY':
      return <DeliveryProfile />;
    case 'USER':
    default:
      return <UserProfile />;
  }
};

export default Profile;
