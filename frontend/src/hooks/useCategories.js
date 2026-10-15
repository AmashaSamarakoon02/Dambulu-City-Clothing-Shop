import { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';

// Categories rarely change, so share one request across the app.
let cache = null;
let pending = null;
const listeners = new Set();

const load = () => {
  if (!pending) {
    pending = axiosInstance.get('/categories')
      .then((res) => {
        cache = res.data;
        listeners.forEach((fn) => fn(cache));
        return cache;
      })
      .catch((err) => {
        console.error('Failed to load categories', err);
        pending = null;
        return [];
      });
  }
  return pending;
};

// Call after admins add/rename/delete categories.
export const refreshCategories = () => {
  pending = null;
  return load();
};

const useCategories = () => {
  const [categories, setCategories] = useState(cache || []);

  useEffect(() => {
    listeners.add(setCategories);
    if (!cache) load();
    return () => listeners.delete(setCategories);
  }, []);

  const nameFor = (slug) => categories.find((c) => c.slug === slug)?.name || slug;
  return { categories, nameFor };
};

export default useCategories;
