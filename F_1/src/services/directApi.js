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

const BACKEND_URL = import.meta.env.VITE_API_DIRECT_URL || 'http://localhost:5000/api';

const directApi = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
  // Do NOT set Content-Type — browser auto-detects multipart/form-data with boundary
});

// Copy auth token from localStorage for direct requests
directApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Debug: Log outgoing requests (development only)
  if (import.meta.env.DEV && config.data instanceof FormData) {
    const entries = [];
    for (let [key, value] of config.data.entries()) {
      entries.push(value instanceof File ? `${key}: ${value.name} (${value.size}B)` : `${key}: ${value}`);
    }
    console.log(`🚀 [directApi] ${config.method?.toUpperCase()} ${config.baseURL}${config.url} — FormData:`, entries);
  }
  
  return config;
});

// Debug: Log responses (development only)
directApi.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`✅ [directApi] ${response.status} from ${response.config.url}`);
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
    return Promise.reject(error);
  }
);

export default directApi;