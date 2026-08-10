/* eslint-disable no-empty */
/**
 * Direct backend API instance for file uploads.
 * 
 * CRITICAL: File uploads MUST bypass the Vite proxy because http-proxy
 * can corrupt multipart/form-data boundaries, causing multer to see
/**
 * Direct backend API instance for file uploads.
 * 
 * CRITICAL: File uploads MUST bypass the Vite proxy because http-proxy
 * can corrupt multipart/form-data boundaries, causing multer to see
 * req.files as empty on the backend.
 * 
 * In production, this connects to the deployed backend URL.
 * In development, it connects directly to http://localhost:5000/api.
 */
import axios from 'axios';
import { getAccessToken, clearAccessToken } from '../utils/tokenStore.js';

const BACKEND_URL = import.meta.env.VITE_API_DIRECT_URL || 'http://localhost:10000/api';

const directApi = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
});

directApi.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Debug: Log outgoing requests (development only)
  if (import.meta.env.DEV && config.data instanceof FormData) {
    const entries = [];
    for (let [key, value] of config.data.entries()) {
      entries.push(value instanceof File ? `${key}: ${value.name} (${value.size}B)` : `${key}: ${value}`);
    }
  }
  
  return config;
});

// Debug: Log responses (development only)
directApi.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
    }
    return response;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error(`❌ [directApi] Error from ${error.config?.url}:`, error.message);
      if (error.response) {
        console.error(`  Status: ${error.response.status}, Data:`, error.response.data);
      }
    }
    // On 401 during file upload, clear stale tokens so the user gets redirected to login
    // rather than seeing a confusing error. The main `api.js` interceptor handles full
    // token refresh; directApi is intentionally simpler (upload-only path).
    if (error.response?.status === 401) {
      clearAccessToken();
      localStorage.removeItem('userData');
    }
    return Promise.reject(error);
  }
);

export default directApi;