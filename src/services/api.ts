import axios from 'axios';

// Automatically resolve base URL. Falls back to same-origin path in local development.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach the session token from localStorage to the Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fixit_session_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for generic error logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error response intercepted:', error.response || error.message);
    return Promise.reject(error);
  }
);

export default api;
