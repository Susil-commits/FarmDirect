
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

export const isTokenExpired = (token, bufferSeconds = 60) => {
  if (!token) return true;

  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;

  const expiryTime = decoded.exp * 1000; 
  const currentTime = Date.now();
  const bufferTime = bufferSeconds * 1000;

  return currentTime >= expiryTime - bufferTime;
};

export const getTokenExpiryTime = (token) => {
  if (!token) return 0;

  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return 0;

  const expiryTime = decoded.exp * 1000;
  const currentTime = Date.now();
  const remainingMs = expiryTime - currentTime;

  return Math.max(0, Math.floor(remainingMs / 1000));
};

export const isValidToken = (token) => {
  if (!token || typeof token !== 'string') return false;
  
  const decoded = decodeToken(token);
  return decoded !== null && decoded.id !== undefined;
};

export const getTokenPayload = (token) => {
  return decodeToken(token);
};

export const hasRole = (token, requiredRole) => {
  const payload = decodeToken(token);
  if (!payload) return false;

  const userRole = payload.role || payload.userRole;
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }
  
  return userRole === requiredRole;
};

export const hasPermission = (token, requiredPermission) => {
  const payload = decodeToken(token);
  if (!payload) return false;

  const permissions = payload.permissions || [];
  
  if (Array.isArray(requiredPermission)) {
    return requiredPermission.some(perm => permissions.includes(perm));
  }
  
  return permissions.includes(requiredPermission);
};

export const getUserIdFromToken = (token) => {
  const payload = decodeToken(token);
  return payload?.id || payload?.userId || null;
};

export const formatExpiryTime = (token) => {
  const seconds = getTokenExpiryTime(token);
  
  if (seconds <= 0) return 'Expired';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  
  return `${Math.floor(seconds / 86400)}d`;
};
