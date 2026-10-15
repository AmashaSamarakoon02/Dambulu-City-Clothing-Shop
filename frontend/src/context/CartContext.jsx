import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';

const CartContext = createContext();
const STORAGE_KEY = 'luxe-cart';

export const useCart = () => useContext(CartContext);

const itemKey = (productId, size, color) => `${productId}|${size || ''}|${color || ''}`;

const loadCart = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved.filter((item) => item?.key && item.quantity > 0) : [];
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(loadCart);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // Storage unavailable (private mode) – cart still works for this session.
    }
  }, [cartItems]);

  // Adds `quantity` of a product variant; returns false if stock would be exceeded.
  const addToCart = (product, { size = '', color = '', quantity = 1 } = {}) => {
    const key = itemKey(product.id, size, color);
    const inCart = cartItems.find((item) => item.key === key)?.quantity || 0;
    const allowed = Math.min(quantity, product.stock - inCart);

    if (allowed <= 0) {
      toast.error(product.stock > 0 ? `Only ${product.stock} available – they're already in your cart.` : 'This item is out of stock.');
      return false;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.key === key);
      if (existing) {
        return prev.map((item) => (item.key === key ? { ...item, quantity: item.quantity + allowed, stock: product.stock } : item));
      }
      return [...prev, {
        key,
        productId: product.id,
        name: product.name,
        image: product.image,
        price: product.price,
        originalPrice: product.originalPrice,
        stock: product.stock,
        size,
        color,
        quantity: allowed
      }];
    });

    if (allowed < quantity) toast(`Only ${allowed} more could be added (stock limit).`);
    else toast.success(`${product.name} added to cart`);
    setIsCartOpen(true);
    return true;
  };

  const removeFromCart = (key) => {
    setCartItems((prev) => prev.filter((item) => item.key !== key));
  };

  const updateQuantity = (key, quantity) => {
    setCartItems((prev) => prev.map((item) => {
      if (item.key !== key) return item;
      return { ...item, quantity: Math.max(1, Math.min(quantity, item.stock || 99)) };
    }));
  };

  const clearCart = () => setCartItems([]);

  // Refresh prices/stock from the server (products may have changed since they were added).
  const syncCart = useCallback(async () => {
    const ids = [...new Set(cartItems.map((item) => item.productId))];
    if (!ids.length) return;

    const results = await Promise.allSettled(ids.map((id) => axiosInstance.get(`/products/${id}`)));
    const latest = {};
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') latest[ids[i]] = result.value.data;
      else if (result.reason?.response?.status === 404) latest[ids[i]] = null;
    });
    const isUnavailable = (item) => item.productId in latest && (!latest[item.productId] || latest[item.productId].stock <= 0);
    const removed = cartItems.filter(isUnavailable).length;

    setCartItems((prev) => prev.flatMap((item) => {
      if (!(item.productId in latest)) return [item]; // network error: keep as-is
      if (isUnavailable(item)) return [];
      const product = latest[item.productId];
      return [{
        ...item,
        name: product.name,
        image: product.image,
        price: product.price,
        originalPrice: product.originalPrice,
        stock: product.stock,
        quantity: Math.min(item.quantity, product.stock)
      }];
    }));
    if (removed) toast(`${removed} item(s) in your cart are no longer available and were removed.`);
  }, [cartItems]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      subtotal,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      syncCart,
      isCartOpen,
      setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
};
