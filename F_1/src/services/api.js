
import axios from 'axios';
import { isTokenExpired } from '../utils/jwtUtils.js';
import { safeStorage } from '../utils/storage.js';
import { getAccessToken, setAccessToken, clearAccessToken } from '../utils/tokenStore.js';

let rawBase = import.meta.env.VITE_API_BASE_URL || '/api';
if (rawBase !== '/api' && !rawBase.endsWith('/api') && !rawBase.endsWith('/api/')) {
  rawBase = rawBase.endsWith('/') ? rawBase + 'api' : rawBase + '/api';
}
export const API_BASE_URL = rawBase;

const REQUEST_TIMEOUT_MS = 30_000;

const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 1000;
const RETRY_METHODS = new Set(['get', 'head', 'options']);

let refreshPromise = null;
let isRefreshing = false;
let failedQueue = [];

let lastRefreshAttempt = 0;
const REFRESH_COOLDOWN_MS = 10000; 

export const canAttemptRefresh = () => {
  return Date.now() - lastRefreshAttempt >= REFRESH_COOLDOWN_MS;
};

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

export const refreshAuthToken = async () => {
  
  if (refreshPromise) {
    return refreshPromise;
  }

  const now = Date.now();
  if (now - lastRefreshAttempt < REFRESH_COOLDOWN_MS) {
    throw new Error('Refresh cooldown active');
  }
  lastRefreshAttempt = now;

  refreshPromise = (async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {}, {
        withCredentials: true,
        timeout: REQUEST_TIMEOUT_MS,
      });

      const { token: newToken } = response.data;

      setAccessToken(newToken);

      safeStorage.setItem('lastActivityTime', Date.now().toString());

      return newToken;
    } catch (error) {
      
      clearAccessToken();
      safeStorage.removeItem('userData');
      safeStorage.removeItem('verificationStatus');
      throw error;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: REQUEST_TIMEOUT_MS,
  
});

api.interceptors.request.use(
  async (config) => {
    let token = getAccessToken();

    const requestId = Math.random().toString(36).substring(2, 9);
    config._requestId = requestId;

    if (typeof window !== 'undefined' && !config.url?.includes('/health')) {
      config._wakingTimer = setTimeout(() => {
        config._wakingTriggered = true;
        window.dispatchEvent(new CustomEvent('farm-server-waking', { detail: { requestId } }));
      }, 3000);
    }

    if (import.meta.env.DEV && config.data instanceof FormData) {
      for (const [key, value] of config.data.entries()) {
      }
    }

    if (token && isTokenExpired(token, 300)) {
      try {
        if (!isRefreshing) {
          isRefreshing = true;
          token = await refreshAuthToken();
          isRefreshing = false;
          processQueue(null, token);
        } else {
          
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

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (!config.url?.includes('/auth/refresh-token')) {
      safeStorage.setItem('lastActivityTime', Date.now().toString());
    }

    return config;
  },
  (error) => Promise.reject(error)
);

const clearWakingTimer = (config) => {
  if (config?._wakingTimer) {
    clearTimeout(config._wakingTimer);
  }
  if (config?._wakingTriggered && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('farm-server-ready', { detail: { requestId: config._requestId } }));
  }
};

api.interceptors.response.use(
  (response) => {
    clearWakingTimer(response.config);
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    clearWakingTimer(originalRequest);

    if (error.response?.status === 429) {
      const payload = {
        success: false,
        message: 'Too many requests. Please wait a moment and try again.',
        status: 429,
        code: 'TOO_MANY_REQUESTS',
      };
      return Promise.reject(payload);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const token = await refreshAuthToken();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        
        clearAccessToken();
        safeStorage.removeItem('userData');
        safeStorage.removeItem('verificationStatus');
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 403) {
      
    }

    if (!error.response && !originalRequest._retried) {
      const method = (originalRequest.method || '').toLowerCase();
      if (RETRY_METHODS.has(method)) {
        originalRequest._retried = true;
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        return api(originalRequest);
      }
    }

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return Promise.reject({
        success: false,
        message: 'The request timed out. Please check your connection and try again.',
        status: 408,
        code: 'REQUEST_TIMEOUT',
      });
    }

    const payload = error.response?.data || error;
    if (error.response?.status && typeof payload === 'object' && payload !== null) {
      payload.status = error.response.status;
    }
    return Promise.reject(payload);
  }
);

export default api;
