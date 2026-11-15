import axios from 'axios';

const axiosInstance = axios.create({
  // Local dev: http://localhost:5000/api (from .env). Production: /api, forwarded to Railway by vercel.json.
  baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api'),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;
