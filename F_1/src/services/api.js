import axios from 'axios';
import { isTokenExpired } from '../utils/jwtUtils.js';

let rawBase = import.meta.env.VITE_API_BASE_URL || '/api';
if (rawBase !== '/api' && !rawBase.endsWith('/api') && !rawBase.endsWith('/api/')) {
  rawBase = rawBase.endsWith('/') ? rawBase + 'api' : rawBase + '/api';
}
export const API_BASE_URL = rawBase;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  // NOTE: Do NOT set Content-Type here. Axios auto-detects:
  // - For plain objects: sets application/json automatically
  // - For FormData: lets browser set multipart/form-data with correct boundary
  // Setting it manually breaks file uploads (multer can't parse without boundary)
});

// Track if we're already refreshing to avoid multiple refresh requests
let isRefreshing = false;
let failedQueue = [];

// Guard to prevent rapid refresh attempts when backend is unreachable
let lastRefreshAttempt = 0;
const REFRESH_COOLDOWN_MS = 10000; // 10 second cooldown between refresh attempts

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
  // Cooldown guard: don't hammer the refresh endpoint if it just failed
  const now = Date.now();
  if (now - lastRefreshAttempt < REFRESH_COOLDOWN_MS) {
    // Still within cooldown — reject silently to avoid redirect loops
    throw new Error('Refresh cooldown active');
  }
  lastRefreshAttempt = now;

  // Guard: If there is no access token, don't bother refreshing (user is likely logged out)
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token available');
  }

  try {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {}, {
      withCredentials: true
    });

    const { token: newToken } = response.data;
    
    // Store new token
    localStorage.setItem('token', newToken);

    // Update timestamp for session activity
    localStorage.setItem('lastActivityTime', Date.now().toString());

    return token;
  } catch (error) {
    // Refresh failed — clear auth data silently. Do NOT hard-redirect (window.location.href)
    // because that causes infinite reload loops when the backend is unreachable.
    // Instead, clear tokens and let the app's AuthContext handle the logout + redirect.
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    throw error;
  }
};

// Request interceptor - Check token expiry and refresh if needed
api.interceptors.request.use(
  async (config) => {
    let token = localStorage.getItem('token');
    
    // DEBUG: Log FormData requests to trace multipart upload issues
    if (config.data instanceof FormData) {
      console.log('🔍 [api.js] FormData request to:', config.url);
      console.log('🔍 [api.js] Content-Type:', config.headers['Content-Type']);
      console.log('🔍 [api.js] FormData entries:');
      for (const [key, value] of config.data.entries()) {
        console.log(`  - ${key}: ${value instanceof File ? `File(${value.name}, ${value.size} bytes, ${value.type})` : value}`);
      }
    }
    
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
