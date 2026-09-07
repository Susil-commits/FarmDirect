import { safeStorage } from './storage.js';

let accessToken = safeStorage.getItem('token') || null;

export const getAccessToken = () => {
  if (!accessToken) {
    accessToken = safeStorage.getItem('token') || null;
  }
  return accessToken;
};

export const setAccessToken = (token) => {
  accessToken = token || null;
  if (token) {
    safeStorage.setItem('token', token);
  } else {
    safeStorage.removeItem('token');
  }
};

export const clearAccessToken = () => {
  accessToken = null;
  safeStorage.removeItem('token');
};

export default {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
};
