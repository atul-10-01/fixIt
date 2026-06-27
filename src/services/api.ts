import axios from 'axios';

const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for generic error handling if needed in the future
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error response intercepted:', error.response || error.message);
    return Promise.reject(error);
  }
);

export default api;
