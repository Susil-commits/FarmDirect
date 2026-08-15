
import axios from 'axios';
import { getAccessToken, clearAccessToken } from '../utils/tokenStore.js';
import { safeStorage } from '../utils/storage.js';

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
  
  if (import.meta.env.DEV && config.data instanceof FormData) {
    const entries = [];
    for (let [key, value] of config.data.entries()) {
      entries.push(value instanceof File ? `${key}: ${value.name} (${value.size}B)` : `${key}: ${value}`);
    }
  }
  
  return config;
});

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
    
    if (error.response?.status === 401) {
      clearAccessToken();
      safeStorage.removeItem('userData');
    }
    return Promise.reject(error);
  }
);

export default directApi;