/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useCallback, useEffect, useContext, useRef } from 'react';
import { authService, userService } from '../services/appService.js';
import { socialAuthService } from '../services/socialAuthService.js';
import { isTokenExpired } from '../utils/jwtUtils.js';

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
  const [lastActivity, setLastActivity] = useState(null);
  const [loginHistory, setLoginHistory] = useState([]);
  const logoutRef = useRef(null);

  // Initialize authentication on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('userData');
      const storedVerificationStatus = localStorage.getItem('verificationStatus');
      const storedServerStartTime = localStorage.getItem('serverStartTime');
      
      if (token) {
        // Check if token is expired
        if (isTokenExpired(token)) {
          console.warn('Token expired on app load');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userData');
          localStorage.removeItem('serverStartTime');
          localStorage.removeItem('currentRoute');
          setUser(null);
          setSessionActive(false);
          setRedirectPath('/');
        } else {
          // Token exists and is valid - use cached user data first
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setSessionActive(true);
            
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
          }

          // Try to validate token structure with backend (non-blocking)
          try {
            const response = await authService.getCurrentUser();
            const userData = response.user || response.data?.user || response;
            
            // Check for server restart by comparing serverStartTime
            const currentServerStartTime = response.serverStartTime;
            if (storedServerStartTime && currentServerStartTime && storedServerStartTime !== currentServerStartTime.toString()) {
              console.warn('⚠️ Server was restarted! Logging out user.');
              // Server has restarted - force logout and redirect to home
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('userData');
              localStorage.removeItem('serverStartTime');
              localStorage.removeItem('verificationStatus');
              localStorage.removeItem('currentRoute');
              localStorage.removeItem('lastActivityTime');
              setUser(null);
              setSessionActive(false);
              setRedirectPath('/');
              setLoading(false);
              return;
            }
            
            // Update with fresh data from server
            setUser(userData);
            localStorage.setItem('userData', JSON.stringify(userData));

            const verifyStatus = userData?.kycStatus || storedVerificationStatus || null;
            setVerificationStatus(verifyStatus);
            if (verifyStatus) {
              localStorage.setItem('verificationStatus', verifyStatus);
            }

          } catch (err) {
            // Check if user was deleted (404 Not Found)
            if (err.status === 404 || err.message === 'User not found') {
              console.warn('⚠️ User account has been deleted');
              // Clear auth data
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('userData');
              localStorage.removeItem('serverStartTime');
              localStorage.removeItem('verificationStatus');
              localStorage.removeItem('currentRoute');
              localStorage.removeItem('lastActivityTime');
              setUser(null);
              setSessionActive(false);
              // BUG 8 FIX: correct path is /auth/login, not /login
              setRedirectPath('/auth/login?deleted=true');
              setError('Your account has been deleted. Please contact support if this was not intentional.');
              setLoading(false);
              return;
            }
            // If server is unreachable AND we have no cached user, then logout
            if (!storedUser && (err.message === 'Network Error' || err.code === 'ECONNREFUSED')) {
              console.error('Server unreachable on app load, logging out');
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('userData');
              localStorage.removeItem('serverStartTime');
              localStorage.removeItem('currentRoute');
              setUser(null);
              setSessionActive(false);
              setRedirectPath('/');
            }
            // Otherwise, keep the user logged in with cached data
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
          if (logoutRef.current) logoutRef.current();
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
  }, [user]);

  // Periodic token refresh check (every 5 minutes)
  // DISABLED: This was causing constant state updates and re-renders
  // Token refresh will happen on-demand when needed
  useEffect(() => {
    // Placeholder - not checking on interval
    return () => {};
  }, []);

  const register = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.register(userData);
      
      // DO NOT auto-login after registration.
      // The user must explicitly login via the login page after registration.
      // Previously, storing the token here caused App.jsx to redirect
      // unverified users directly to VerificationProgress instead of
      // showing the login page.
      
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
      
      // Store server start time for detecting server restart
      if (response.serverStartTime) {
        localStorage.setItem('serverStartTime', response.serverStartTime.toString());
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
      // Get user ID before clearing
      const userId = user?.id;
      
      await authService.logout();
      
      // Clear all auth data
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('verificationStatus');
      localStorage.removeItem('serverStartTime');
      // Clear user-specific submission state
      if (userId) {
        localStorage.removeItem(`verificationSubmittedAt_${userId}`);
      }
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
  }, [user]);

  // Keep logoutRef up-to-date so it can be called from activity listener without TDZ
  useEffect(() => { logoutRef.current = logout; }, [logout]);

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
      // BUG 16 FIX: Backend POST /auth/reset-password returns { success, message } only.
      // No token or user is returned — user must log in again after password reset.
      return response;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    try {
      const response = await userService.updateProfile(profileData);
      const updatedUser = response.data?.data || response.data || { ...user, ...profileData };
      setUser(updatedUser);
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
      if (response.serverStartTime) {
        localStorage.setItem('serverStartTime', response.serverStartTime.toString());
      }
      if (response.user) {
        localStorage.setItem('userData', JSON.stringify(response.user));
      }
      const verifyStatus = response.user?.kycStatus || 'pending';
      setVerificationStatus(verifyStatus);
      localStorage.setItem('verificationStatus', verifyStatus);
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
      if (response.serverStartTime) {
        localStorage.setItem('serverStartTime', response.serverStartTime.toString());
      }
      if (response.user) {
        localStorage.setItem('userData', JSON.stringify(response.user));
      }
      const verifyStatus = response.user?.kycStatus || 'pending';
      setVerificationStatus(verifyStatus);
      localStorage.setItem('verificationStatus', verifyStatus);
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

  const refreshUserRef = useRef(null);

  const submitVerificationDocuments = useCallback(async (documents) => {
    setLoading(true);
    setError(null);
    try {
      console.log('📤 Submitting verification documents...');
      
      let data;
      
      if (documents instanceof FormData) {
        // Send FormData directly with actual files (multipart/form-data)
        console.log('📎 Sending FormData with files:',
          Array.from(documents.entries()).map(([k, v]) =>
            v instanceof File ? `${k}: ${v.name} (${v.size} bytes)` : `${k}: ${v}`
          ).join(', ')
        );
        data = await authService.submitKYCFormData(documents);
      } else {
        // Fallback for JSON payload
        console.log('📄 Sending JSON payload');
        data = await authService.submitKYC(documents);
      }

      console.log('📡 API Response:', data);
      
      // Update context state
      setVerificationData(documents);
      setVerificationStatus('pending');
      localStorage.setItem('verificationStatus', 'pending');
      
      // Store file metadata for UI display (not the actual files)
      if (documents instanceof FormData) {
        const metadata = {};
        for (let [key, value] of documents.entries()) {
          if (value instanceof File) {
            metadata[key] = { fileName: value.name, size: value.size };
          } else {
            metadata[key] = value;
          }
        }
        localStorage.setItem('verificationData', JSON.stringify(metadata));
      } else {
        localStorage.setItem('verificationData', JSON.stringify(documents));
      }
      
      // CRITICAL: Update user with fresh data from backend (includes kycDocuments)
      // The backend returns the updated user with kycDocuments in the response
      if (data?.user) {
        const updatedUser = { ...user, ...data.user };
        setUser(updatedUser);
        localStorage.setItem('userData', JSON.stringify(updatedUser));
        console.log('✅ User updated with kycDocuments:', Object.keys(data.user.kycDocuments || {}));
      } else {
        // Fallback: fetch fresh user data from backend
        console.log('⚠️ No user in response, fetching fresh data...');
        if (refreshUserRef.current) await refreshUserRef.current();
      }
      
      console.log('✅ Verification documents submitted to backend:', data);
      return { status: 'success', message: 'Documents submitted for verification' };
    } catch (err) {
      console.error('❌ Error submitting documents:', err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Refresh user data from backend (useful after KYC submission, profile updates, etc.)
  const refreshUser = useCallback(async () => {
    try {
      const response = await authService.getCurrentUser();
      const userData = response.user || response.data?.user || response;
      
      if (userData) {
        setUser(userData);
        localStorage.setItem('userData', JSON.stringify(userData));
        
        const verifyStatus = userData?.kycStatus || null;
        setVerificationStatus(verifyStatus);
        if (verifyStatus) {
          localStorage.setItem('verificationStatus', verifyStatus);
        }
        
        console.log('🔄 User refreshed from backend, kycDocuments:', Object.keys(userData.kycDocuments || {}));
        return userData;
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
      return null;
    }
  }, []);

  // Keep refreshUserRef up-to-date so it can be called from submitVerificationDocuments without TDZ
  useEffect(() => { refreshUserRef.current = refreshUser; }, [refreshUser]);

  const fetchVerificationStatus = useCallback(async () => {
    try {
      // Fetch latest user data from backend to get current kycStatus
      const response = await authService.getCurrentUser();
      const userData = response.user || response.data?.user || response;
      
      if (userData) {
        const newStatus = userData.kycStatus || null;
        const oldStatus = localStorage.getItem('verificationStatus');
        
        // Update if status changed
        if (newStatus !== oldStatus) {
          setVerificationStatus(newStatus);
          localStorage.setItem('verificationStatus', newStatus);
          
          // Update user data as well
          setUser(userData);
          localStorage.setItem('userData', JSON.stringify(userData));
        }
        
        return newStatus;
      }
    } catch (err) {
      console.error('Error fetching verification status:', err);
      // Fall back to stored status if API fails
      const storedStatus = localStorage.getItem('verificationStatus');
      setVerificationStatus(storedStatus);
      return storedStatus;
    }
  }, []);

  // Periodic verification status check (every 30 seconds for pending users)
  // DISABLED: This was causing constant re-renders and API calls
  // Verification status can be checked on-demand instead
  useEffect(() => {
    // Placeholder - not fetching on interval to prevent constant refreshes
    return () => {};
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
    refreshUser,
    
    // Utilities - Existing
    setUser,
    setRedirectPath,
    clearRedirectPath: () => setRedirectPath(null),

    // NEW: Session Management
    sessionActive,
    lastActivity,
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
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
