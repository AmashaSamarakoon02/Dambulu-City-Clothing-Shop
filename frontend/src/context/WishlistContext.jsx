import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

// Must be rendered inside the Router (uses navigate for the login prompt).
export const WishlistProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }
    setLoading(true);
    axiosInstance.get('/wishlist')
      .then((res) => setItems(res.data))
      .catch((err) => console.error('Failed to load wishlist', err))
      .finally(() => setLoading(false));
  }, [isAuthenticated, user?.id]);

  const isWishlisted = (productId) => items.some((p) => p.id === productId);

  const toggleWishlist = async (product) => {
    if (!isAuthenticated) {
      toast('Please log in to save items to your wishlist.');
      navigate('/login', { state: { from: { pathname: window.location.pathname } } });
      return;
    }

    const wasWishlisted = isWishlisted(product.id);
    // Optimistic update, rolled back on failure.
    setItems((prev) => (wasWishlisted ? prev.filter((p) => p.id !== product.id) : [product, ...prev]));
    try {
      if (wasWishlisted) {
        await axiosInstance.delete(`/wishlist/${product.id}`);
        toast.success('Removed from wishlist');
      } else {
        await axiosInstance.post(`/wishlist/${product.id}`);
        toast.success('Saved to wishlist');
      }
    } catch (err) {
      setItems((prev) => (wasWishlisted ? [product, ...prev] : prev.filter((p) => p.id !== product.id)));
      toast.error(err.response?.data?.error || 'Could not update your wishlist');
    }
  };

  return (
    <WishlistContext.Provider value={{ wishlist: items, wishlistCount: items.length, loading, isWishlisted, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};
