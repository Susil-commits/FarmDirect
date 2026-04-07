import React, { createContext, useState, useCallback, useEffect } from 'react';
import { authService } from '../services/appService.js';
import { socialAuthService } from '../services/socialAuthService.js';
import { isTokenExpired, decodeToken, hasRole, getUserIdFromToken } from '../utils/jwtUtils.js';

export const AuthContext = createContext();

/**
 * Generate simplified device fingerprint for session tracking
 */
const getDeviceFingerprint = () => {
  const userAgent = navigator.userAgent;
  const language = navigator.language;
  const screenResolution = `${window.innerWidth}x${window.innerHeight}`;
  
  // Create simple fingerprint (not cryptographically secure, just for demo)
  const fingerprint = btoa(`${userAgent}|${language}|${screenResolution}`).substring(0, 16);
  return fingerprint;
};

/**
 * Track login history in localStorage
 */
const recordLoginHistory = (user) => {
  try {
    const loginHistory = JSON.parse(localStorage.getItem('loginHistory') || '[]');
    
    const newLogin = {
      timestamp: Date.now(),
      email: user?.email,
      role: user?.role,
      deviceFingerprint: getDeviceFingerprint(),
      ip: 'local', // Would come from backend in real scenario
    };

    // Keep only last 10 logins
    loginHistory.unshift(newLogin);
    if (loginHistory.length > 10) {
      loginHistory.pop();
    }

    localStorage.setItem('loginHistory', JSON.stringify(loginHistory));
  } catch (err) {
    console.warn('Failed to record login history:', err);
  }
};

/**
 * Check if session has been idle too long
 * @param {number} maxIdleTime - Max idle time in milliseconds (default: 30 minutes)
 */
const isSessionExpired = (maxIdleTime = 1800000) => {
  const lastActivity = localStorage.getItem('lastActivityTime');
  if (!lastActivity) return false;

  const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
  return timeSinceLastActivity > maxIdleTime;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redirectPath, setRedirectPath] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [verificationData, setVerificationData] = useState(null);
  
  // NEW: Session and role management
  const [sessionActive, setSessionActive] = useState(false);
  const [tokenRefreshTime, setTokenRefreshTime] = useState(null);
  const [lastActivity, setLastActivity] = useState(null);
  const [loginHistory, setLoginHistory] = useState([]);

  // Initialize authentication on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const storedVerificationStatus = localStorage.getItem('verificationStatus');
      const storedUser = localStorage.getItem('userData');
      
      if (token) {
        // Check if token is expired
        if (isTokenExpired(token)) {
          console.warn('Token expired on app load');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userData');
          setUser(null);
          setSessionActive(false);
        } else {
          try {
            // Validate token structure and get user from backend
            const response = await authService.getCurrentUser();
            // Response structure after API interceptor: {message, user, ...}
            const userData = response.user || response.data?.user || response;
            
            setUser(userData);
            setSessionActive(true);
            localStorage.setItem('userData', JSON.stringify(userData));

            const verifyStatus = userData?.kycStatus || storedVerificationStatus || null;
            setVerificationStatus(verifyStatus);
            if (verifyStatus) {
              localStorage.setItem('verificationStatus', verifyStatus);
            }

            // Load login history
            const history = JSON.parse(localStorage.getItem('loginHistory') || '[]');
            setLoginHistory(history);

            // Set last activity time if not set
            if (!localStorage.getItem('lastActivityTime')) {
              localStorage.setItem('lastActivityTime', Date.now().toString());
            }

          } catch (err) {
            // API call failed, try to restore from cache
            if (storedUser) {
              try {
                const cachedUser = JSON.parse(storedUser);
                setUser(cachedUser);
                setSessionActive(true);
                setVerificationStatus(cachedUser?.kycStatus || storedVerificationStatus || null);
                console.log('Restored user from cache');
              } catch (parseErr) {
                console.error('Failed to parse cached user:', parseErr);
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('userData');
                setUser(null);
                setSessionActive(false);
                setError(err);
              }
            } else {
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              setUser(null);
              setSessionActive(false);
              setError(err);
            }
          }
        }
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Monitor session activity and idle timeout
  useEffect(() => {
    if (!user) return;

    let activityTimeout;
    
    const handleActivity = () => {
      // Clear previous timeout
      clearTimeout(activityTimeout);
      
      // Debounce: only update after 2 seconds of inactivity
      activityTimeout = setTimeout(() => {
        const now = Date.now().toString();
        localStorage.setItem('lastActivityTime', now);
        setLastActivity(new Date());

        // Check for idle timeout (30 minutes)
        if (isSessionExpired(1800000)) {
          console.warn('Session expired due to inactivity');
          logout();
        }
      }, 2000); // 2 second debounce
    };

    // Add activity listeners
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      clearTimeout(activityTimeout);
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [user, logout]);

  // Periodic token refresh check (every 5 minutes)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      const token = localStorage.getItem('token');
      
      if (token && isTokenExpired(token, 600)) {
        // Token will expire in next 10 minutes - it will auto-refresh on next API call
        console.log('Token will expire soon - will auto-refresh on next API call');
        setTokenRefreshTime(new Date());
      }
    }, 300000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [user]);

  const register = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.register(userData);
      
      // Update stats
      const currentStats = JSON.parse(
        localStorage.getItem('farmStats') || 
        '{"farmers": 5000, "customers": 50000, "varieties": 100, "deliveryDays": "3-5"}'
      );
      
      if (userData.role === 'farmer') {
        currentStats.farmers += 1;
      } else {
        currentStats.customers += 1;
      }
      
      localStorage.setItem('farmStats', JSON.stringify(currentStats));
      return response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(credentials);
      
      // Store tokens
      localStorage.setItem('token', response.token);
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      
      // Store user data
      if (response.user) {
        localStorage.setItem('userData', JSON.stringify(response.user));
      }

      // Update auth state
      setUser(response.user);
      setSessionActive(true);
      localStorage.setItem('lastActivityTime', Date.now().toString());
      
      // Record login history
      recordLoginHistory(response.user);
      const history = JSON.parse(localStorage.getItem('loginHistory') || '[]');
      setLoginHistory(history);

      // Store verification status
      const verifyStatus = response.user?.kycStatus || 'pending';
      setVerificationStatus(verifyStatus);
      localStorage.setItem('verificationStatus', verifyStatus);

      return response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authService.logout();
      
      // Clear all auth data
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('verificationStatus');
      localStorage.removeItem('userData');
      localStorage.removeItem('currentRoute');
      localStorage.removeItem('lastActivityTime');

      // Clear state
      setUser(null);
      setSessionActive(false);
      setVerificationStatus(null);
      setVerificationData(null);
      setLastActivity(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePassword = useCallback(async (passwordData) => {
    try {
      const response = await authService.updatePassword(passwordData);
      return response;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const forgotPassword = useCallback(async (email) => {
    try {
      const response = await authService.forgotPassword(email);
      return response;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const resetPassword = useCallback(async (token, password) => {
    try {
      const response = await authService.resetPassword(token, password);
      localStorage.setItem('token', response.token);
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      setUser(response.user);
      setSessionActive(true);
      return response;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    try {
      const updatedUser = {
        ...user,
        ...profileData,
      };
      setUser(updatedUser);
      localStorage.setItem('userProfile', JSON.stringify(updatedUser));
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [user]);

  const googleLogin = useCallback(async (code) => {
    setLoading(true);
    setError(null);
    try {
      const response = await socialAuthService.handleGoogleCallback(code);
      localStorage.setItem('token', response.token);
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      setUser(response.user);
      setSessionActive(true);
      recordLoginHistory(response.user);
      return response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const githubLogin = useCallback(async (code) => {
    setLoading(true);
    setError(null);
    try {
      const response = await socialAuthService.handleGitHubCallback(code);
      localStorage.setItem('token', response.token);
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      setUser(response.user);
      setSessionActive(true);
      recordLoginHistory(response.user);
      return response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const initiateGoogleLogin = useCallback(() => {
    socialAuthService.initiateGoogleLogin();
  }, []);

  const initiateGitHubLogin = useCallback(() => {
    socialAuthService.initiateGitHubLogin();
  }, []);

  const submitVerificationDocuments = useCallback(async (documents) => {
    setLoading(true);
    setError(null);
    try {
      setVerificationData(documents);
      setVerificationStatus('pending');
      localStorage.setItem('verificationStatus', 'pending');
      localStorage.setItem('verificationData', JSON.stringify(documents));
      
      console.log('Verification documents submitted:', documents);
      return { status: 'success', message: 'Documents submitted for verification' };
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVerificationStatus = useCallback(async () => {
    const storedStatus = localStorage.getItem('verificationStatus');
    setVerificationStatus(storedStatus);
    return storedStatus;
  }, []);

  // NEW: Role-based access guards
  const hasRole = useCallback((role) => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  }, [user]);

  const hasPermission = useCallback((permission) => {
    if (!user) return false;
    const userPermissions = user.permissions || [];
    if (Array.isArray(permission)) {
      return permission.some(p => userPermissions.includes(p));
    }
    return userPermissions.includes(permission);
  }, [user]);

  // NEW: Get login history
  const getLoginHistory = useCallback(() => {
    return loginHistory;
  }, [loginHistory]);

  // NEW: Get last login info
  const getLastLogin = useCallback(() => {
    return loginHistory[1] || null; // Index 1 is second-most-recent (first is current)
  }, [loginHistory]);

  // NEW: Force session check
  const checkSession = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return { active: false, reason: 'No token' };
    }

    if (isTokenExpired(token)) {
      setSessionActive(false);
      return { active: false, reason: 'Token expired' };
    }

    if (isSessionExpired()) {
      setSessionActive(false);
      return { active: false, reason: 'Session expired due to inactivity' };
    }

    return { active: true };
  }, []);

  const value = {
    // Existing
    user,
    loading,
    error,
    isAuthenticated: !!user,
    verificationStatus,
    verificationData,
    redirectPath,
    
    // Methods - Existing
    register,
    login,
    logout,
    updatePassword,
    forgotPassword,
    resetPassword,
    updateProfile,
    googleLogin,
    githubLogin,
    initiateGoogleLogin,
    initiateGitHubLogin,
    submitVerificationDocuments,
    fetchVerificationStatus,
    
    // Utilities - Existing
    setUser,
    setRedirectPath,
    clearRedirectPath: () => setRedirectPath(null),

    // NEW: Session Management
    sessionActive,
    lastActivity,
    tokenRefreshTime,
    checkSession,
    
    // NEW: Role & Permission Guards
    hasRole,
    hasPermission,
    
    // NEW: Login History & Device Tracking
    getLoginHistory,
    getLastLogin,
    deviceFingerprint: getDeviceFingerprint(),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
