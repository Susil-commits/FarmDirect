/**
 * JWT Utility Functions for Frontend
 * Handles token decoding, validation, and expiry checks
 */

/**
 * Decode JWT token without verifying signature
 * (Server verification happens on API call)
 */
export const decodeToken = (token) => {
  if (!token) return null;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid token format');
      return null;
    }

    const decoded = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    );
    return decoded;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @param {number} bufferSeconds - Buffer time before actual expiry (default: 60 seconds)
 * @returns {boolean} - true if expired or expiring soon
 */
export const isTokenExpired = (token, bufferSeconds = 60) => {
  if (!token) return true;

  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;

  const expiryTime = decoded.exp * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const bufferTime = bufferSeconds * 1000;

  return currentTime >= expiryTime - bufferTime;
};

/**
 * Get remaining time for token expiry in seconds
 */
export const getTokenExpiryTime = (token) => {
  if (!token) return 0;

  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return 0;

  const expiryTime = decoded.exp * 1000;
  const currentTime = Date.now();
  const remainingMs = expiryTime - currentTime;

  return Math.max(0, Math.floor(remainingMs / 1000));
};

/**
 * Validate token structure and basic format
 */
export const isValidToken = (token) => {
  if (!token || typeof token !== 'string') return false;
  
  const decoded = decodeToken(token);
  return decoded !== null && decoded.id !== undefined;
};

/**
 * Get token payload without verification
 */
export const getTokenPayload = (token) => {
  return decodeToken(token);
};

/**
 * Check if user has required role
 */
export const hasRole = (token, requiredRole) => {
  const payload = decodeToken(token);
  if (!payload) return false;

  const userRole = payload.role || payload.userRole;
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }
  
  return userRole === requiredRole;
};

/**
 * Check if user has any of the required permissions
 */
export const hasPermission = (token, requiredPermission) => {
  const payload = decodeToken(token);
  if (!payload) return false;

  const permissions = payload.permissions || [];
  
  if (Array.isArray(requiredPermission)) {
    return requiredPermission.some(perm => permissions.includes(perm));
  }
  
  return permissions.includes(requiredPermission);
};

/**
 * Get user ID from token
 */
export const getUserIdFromToken = (token) => {
  const payload = decodeToken(token);
  return payload?.id || payload?.userId || null;
};

/**
 * Format token expiry time as readable string
 */
export const formatExpiryTime = (token) => {
  const seconds = getTokenExpiryTime(token);
  
  if (seconds <= 0) return 'Expired';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  
  return `${Math.floor(seconds / 86400)}d`;
};
