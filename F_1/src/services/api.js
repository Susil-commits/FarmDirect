/* eslint-disable no-unused-vars, no-empty */
import axios from 'axios';
import { isTokenExpired } from '../utils/jwtUtils.js';
import { safeStorage } from '../utils/storage.js';
import { getAccessToken, setAccessToken, clearAccessToken } from '../utils/tokenStore.js';

let rawBase = import.meta.env.VITE_API_BASE_URL || '/api';
if (rawBase !== '/api' && !rawBase.endsWith('/api') && !rawBase.endsWith('/api/')) {
  rawBase = rawBase.endsWith('/') ? rawBase + 'api' : rawBase + '/api';
}
export const API_BASE_URL = rawBase;

/** Default request timeout (30 seconds). */
const REQUEST_TIMEOUT_MS = 30_000;

/** Retry budget: non-mutating requests only, 1 retry with exponential backoff. */
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 1000;
const RETRY_METHODS = new Set(['get', 'head', 'options']);

// Track in-flight refresh request to deduplicate concurrent refresh calls
let refreshPromise = null;
let isRefreshing = false;
let failedQueue = [];

// Guard to prevent rapid refresh attempts when backend is unreachable
let lastRefreshAttempt = 0;
const REFRESH_COOLDOWN_MS = 10000; // 10 second cooldown between refresh attempts

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

/**
 * Attempt to refresh the authentication token
 * Requires backend endpoint: POST /auth/refresh-token
 */
export const refreshAuthToken = async () => {
  // If a refresh request is already in-flight, return the active promise
  if (refreshPromise) {
    return refreshPromise;
  }

  // Cooldown guard: don't hammer the refresh endpoint if it just failed
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

      // Store new token in memory
      setAccessToken(newToken);

      // Update timestamp for session activity
      safeStorage.setItem('lastActivityTime', Date.now().toString());

      return newToken;
    } catch (error) {
      // Refresh failed — clear auth data silently. Do NOT hard-redirect (window.location.href)
      // because that causes infinite reload loops when the backend is unreachable.
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
  // NOTE: Do NOT set Content-Type here. Axios auto-detects:
  // - For plain objects: sets application/json automatically
  // - For FormData: lets browser set multipart/form-data with correct boundary
  // Setting it manually breaks file uploads (multer can't parse without boundary)
});

// Request interceptor - Check token expiry and refresh if needed
api.interceptors.request.use(
  async (config) => {
    let token = getAccessToken();

    // Track cold start / slow response timer (3 seconds)
    const requestId = Math.random().toString(36).substring(2, 9);
    config._requestId = requestId;

    if (typeof window !== 'undefined' && !config.url?.includes('/health')) {
      config._wakingTimer = setTimeout(() => {
        config._wakingTriggered = true;
        window.dispatchEvent(new CustomEvent('farm-server-waking', { detail: { requestId } }));
      }, 3000);
    }

    // DEBUG: Log FormData requests to trace multipart upload issues (dev only)
    if (import.meta.env.DEV && config.data instanceof FormData) {
      for (const [key, value] of config.data.entries()) {
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

    // Update last activity time (but not for refresh calls)
    if (!config.url?.includes('/auth/refresh-token')) {
      safeStorage.setItem('lastActivityTime', Date.now().toString());
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Helper to clear timer and signal server ready
const clearWakingTimer = (config) => {
  if (config?._wakingTimer) {
    clearTimeout(config._wakingTimer);
  }
  if (config?._wakingTriggered && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('farm-server-ready', { detail: { requestId: config._requestId } }));
  }
};

// Response interceptor - Handle auth errors and retries
api.interceptors.response.use(
  (response) => {
    clearWakingTimer(response.config);
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    clearWakingTimer(originalRequest);

    // ── Rate limit (429) — user-friendly message ─────────────────────────────
    if (error.response?.status === 429) {
      const payload = {
        success: false,
        message: 'Too many requests. Please wait a moment and try again.',
        status: 429,
        code: 'TOO_MANY_REQUESTS',
      };
      return Promise.reject(payload);
    }

    // ── Handle 401 Unauthorized ───────────────────────────────────────────────
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const token = await refreshAuthToken();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear auth data and let app redirect naturally
        clearAccessToken();
        safeStorage.removeItem('userData');
        safeStorage.removeItem('verificationStatus');
        return Promise.reject(refreshError);
      }
    }

    // ── Handle 403 Forbidden ──────────────────────────────────────────────────
    if (error.response?.status === 403) {
      // Structured — let caller handle (don't suppress)
    }

    // ── Retry on network error (GET/HEAD/OPTIONS only) ────────────────────────
    if (!error.response && !originalRequest._retried) {
      const method = (originalRequest.method || '').toLowerCase();
      if (RETRY_METHODS.has(method)) {
        originalRequest._retried = true;
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        return api(originalRequest);
      }
    }

    // ── Handle timeout ────────────────────────────────────────────────────────
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return Promise.reject({
        success: false,
        message: 'The request timed out. Please check your connection and try again.',
        status: 408,
        code: 'REQUEST_TIMEOUT',
      });
    }

    // ── Normalize error payload ───────────────────────────────────────────────
    // Attach HTTP status to the rejection payload whether it's a structured
    // backend error object or a raw Error, so callers can always check err.status.
    const payload = error.response?.data || error;
    if (error.response?.status && typeof payload === 'object' && payload !== null) {
      payload.status = error.response.status;
    }
    return Promise.reject(payload);
  }
);

export default api;
