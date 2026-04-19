import axios from 'axios';
import { isTokenExpired, decodeToken } from '../utils/jwtUtils.js';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Track if we're already refreshing to avoid multiple refresh requests
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Attempt to refresh the authentication token
 * Requires backend endpoint: POST /auth/refresh-token
 */
const refreshAuthToken = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
      refreshToken: localStorage.getItem('refreshToken')
    }, {
      withCredentials: true
    });

    const { token, refreshToken } = response.data;
    
    // Store new tokens
    localStorage.setItem('token', token);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }

    // Update timestamp for session activity
    localStorage.setItem('lastActivityTime', Date.now().toString());

    return token;
  } catch (error) {
    // Refresh failed - user must login again
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    window.location.href = '/login';
    throw error;
  }
};

// Request interceptor - Check token expiry and refresh if needed
api.interceptors.request.use(
  async (config) => {
    let token = localStorage.getItem('token');
    
    // Check if token exists and will expire soon (within 5 minutes)
    if (token && isTokenExpired(token, 300)) {
      try {
        if (!isRefreshing) {
          isRefreshing = true;
          token = await refreshAuthToken();
          isRefreshing = false;
          processQueue(null, token);
        } else {
          // Wait for ongoing refresh to complete
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(refreshedToken => {
            config.headers.Authorization = `Bearer ${refreshedToken}`;
            return config;
          });
        }
      } catch (error) {
        isRefreshing = false;
        processQueue(error, null);
        return Promise.reject(error);
      }
    }

    // Add token to request header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Update last activity time
    if (!config.url.includes('/auth/refresh-token')) {
      localStorage.setItem('lastActivityTime', Date.now().toString());
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle auth errors
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const token = await refreshAuthToken();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear auth data and let app redirect naturally
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('verificationStatus');
        // Don't redirect here - let the component handle it
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden (permission denied)
    if (error.response?.status === 403) {
      console.warn('Access forbidden - insufficient permissions');
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error or no response from server');
    }

    return Promise.reject(error.response?.data || error);
  }
);

export default api;
