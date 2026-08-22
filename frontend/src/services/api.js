import axios from 'axios';

// Get API base URL from Vite environment variables (safe for browser)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor (for future authorization tokens)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (centralized error handling)
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customError = {
      message: error.response?.data?.message || 'An error occurred while communicating with the server.',
      status: error.response?.status || 500,
      data: error.response?.data || null
    };
    
    // Log error for debugging
    console.error('API Error:', customError);
    
    return Promise.reject(customError);
  }
);

export default api;
