
import React, { createContext, useState, useCallback, useEffect, useContext, useRef } from 'react';
import { authService, userService } from '../services/appService.js';
import { socialAuthService } from '../services/socialAuthService.js';
import { isTokenExpired } from '../utils/jwtUtils.js';
import { getAccessToken, setAccessToken, clearAccessToken } from '../utils/tokenStore.js';
import { refreshAuthToken, canAttemptRefresh } from '../services/api.js';

export const AuthContext = createContext();

const getDeviceFingerprint = () => {
  const userAgent = navigator.userAgent;
  const language = navigator.language;
  const screenResolution = `${window.innerWidth}x${window.innerHeight}`;
  
  const fingerprint = btoa(`${userAgent}|${language}|${screenResolution}`).substring(0, 16);
  return fingerprint;
};

const recordLoginHistory = (user) => {
  try {
    const loginHistory = JSON.parse(localStorage.getItem('loginHistory') || '[]');
    
    const newLogin = {
      timestamp: Date.now(),
      email: user?.email,
      role: user?.role,
      deviceFingerprint: getDeviceFingerprint(),
      ip: 'local', 
    };

    loginHistory.unshift(newLogin);
    if (loginHistory.length > 10) {
      loginHistory.pop();
    }

    localStorage.setItem('loginHistory', JSON.stringify(loginHistory));
  } catch (err) {
    console.warn('Failed to record login history:', err);
  }
};

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
  
  const [sessionActive, setSessionActive] = useState(false);
  const [lastActivity, setLastActivity] = useState(null);
  const [loginHistory, setLoginHistory] = useState([]);
  const logoutRef = useRef(null);
  
  const initCalledRef = useRef(false);

  useEffect(() => {
    
    if (initCalledRef.current) return;
    initCalledRef.current = true;

    const initializeAuth = async () => {
      const storedUser = localStorage.getItem('userData');
      const storedVerificationStatus = localStorage.getItem('verificationStatus');
      const storedServerStartTime = localStorage.getItem('serverStartTime');
      
      if (!storedUser) {
        
        clearAccessToken();
        setUser(null);
        setSessionActive(false);
        setLoading(false);
        return;
      }

      if (!canAttemptRefresh()) {
        
        clearAccessToken();
        localStorage.removeItem('userData');
        setUser(null);
        setSessionActive(false);
        setLoading(false);
        return;
      }

      try {
        
        const newToken = await refreshAuthToken();
        if (newToken) {
          setSessionActive(true);
          
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            const verifyStatus = userData?.kycStatus || storedVerificationStatus || null;
            setVerificationStatus(verifyStatus);
          } catch (parseErr) {
            console.warn('Failed to parse stored user data:', parseErr);
            localStorage.removeItem('userData');
          }

          try {
            const history = JSON.parse(localStorage.getItem('loginHistory') || '[]');
            setLoginHistory(history);
          } catch {  }

          if (!localStorage.getItem('lastActivityTime')) {
            localStorage.setItem('lastActivityTime', Date.now().toString());
          }

          try {
            const response = await authService.getCurrentUser();
            const userData = response.user || response.data?.user || response;
            
            const currentServerStartTime = response.serverStartTime;
            if (storedServerStartTime && currentServerStartTime && storedServerStartTime !== currentServerStartTime.toString()) {
              console.warn('⚠️ Server was restarted! Logging out user.');
              clearAccessToken();
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
            
            setUser(userData);
            localStorage.setItem('userData', JSON.stringify(userData));

            const verifyStatus = userData?.kycStatus || storedVerificationStatus || null;
            setVerificationStatus(verifyStatus);
            if (verifyStatus) {
              localStorage.setItem('verificationStatus', verifyStatus);
            }
          } catch (err) {
            if (err.status === 404 || err.message === 'User not found') {
              console.warn('⚠️ User account has been deleted');
              clearAccessToken();
              localStorage.removeItem('userData');
              localStorage.removeItem('serverStartTime');
              localStorage.removeItem('verificationStatus');
              localStorage.removeItem('currentRoute');
              localStorage.removeItem('lastActivityTime');
              setUser(null);
              setSessionActive(false);
              setRedirectPath('/auth/login?deleted=true');
              setError('Your account has been deleted. Please contact support if this was not intentional.');
              setLoading(false);
              return;
            }
          }
        }
      } catch {
        
        clearAccessToken();
        localStorage.removeItem('userData');
        setUser(null);
        setSessionActive(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    let activityTimeout;
    
    const handleActivity = () => {
      
      clearTimeout(activityTimeout);
      
      activityTimeout = setTimeout(() => {
        const now = Date.now().toString();
        localStorage.setItem('lastActivityTime', now);
        setLastActivity(new Date());

        if (isSessionExpired(1800000)) {
          console.warn('Session expired due to inactivity');
          
          try {
            const event = new CustomEvent('farm-session-expired');
            window.dispatchEvent(event);
          } catch {  }
          if (logoutRef.current) logoutRef.current();
        }
      }, 2000); 
    };

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

  useEffect(() => {
    
    return () => {};
  }, []);

  const register = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.register(userData);
      
      try {
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
      } catch {  }
      return response;
    } catch (err) {
      setError(err?.message || err || 'Registration failed');
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
      
      setAccessToken(response.token);
      
      if (response.serverStartTime) {
        localStorage.setItem('serverStartTime', response.serverStartTime.toString());
      }
      
      if (response.user) {
        localStorage.setItem('userData', JSON.stringify(response.user));
      }

      setUser(response.user);
      setSessionActive(true);
      localStorage.setItem('lastActivityTime', Date.now().toString());
      
      recordLoginHistory(response.user);
      try {
        const history = JSON.parse(localStorage.getItem('loginHistory') || '[]');
        setLoginHistory(history);
      } catch {  }

      const verifyStatus = response.user?.kycStatus || 'not_submitted';
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
      
      const userId = user?.id;
      
      await authService.logout();
      
      clearAccessToken();
      localStorage.removeItem('verificationStatus');
      localStorage.removeItem('serverStartTime');
      
      if (userId) {
        localStorage.removeItem(`verificationSubmittedAt_${userId}`);
      }
      localStorage.removeItem('userData');
      localStorage.removeItem('currentRoute');
      localStorage.removeItem('lastActivityTime');

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
      setAccessToken(response.token);
      if (response.serverStartTime) {
        localStorage.setItem('serverStartTime', response.serverStartTime.toString());
      }
      if (response.user) {
        localStorage.setItem('userData', JSON.stringify(response.user));
      }
      const verifyStatus = response.user?.kycStatus || 'not_submitted';
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
      setAccessToken(response.token);
      if (response.serverStartTime) {
        localStorage.setItem('serverStartTime', response.serverStartTime.toString());
      }
      if (response.user) {
        localStorage.setItem('userData', JSON.stringify(response.user));
      }
      const verifyStatus = response.user?.kycStatus || 'not_submitted';
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
      
      let data;
      
      if (documents instanceof FormData) {
        
        console.log('📎 Sending FormData with files:',
          Array.from(documents.entries()).map(([k, v]) =>
            v instanceof File ? `${k}: ${v.name} (${v.size} bytes)` : `${k}: ${v}`
          ).join(', ')
        );
        data = await authService.submitKYCFormData(documents);
      } else {
        
        data = await authService.submitKYC(documents);
      }

      setVerificationData(documents);
      setVerificationStatus('pending');
      localStorage.setItem('verificationStatus', 'pending');
      
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
      
      if (data?.user) {
        const updatedUser = { ...user, ...data.user };
        setUser(updatedUser);
        localStorage.setItem('userData', JSON.stringify(updatedUser));
      } else {
        
        if (refreshUserRef.current) await refreshUserRef.current();
      }
      
      return { status: 'success', message: 'Documents submitted for verification' };
    } catch (err) {
      console.error('❌ Error submitting documents:', err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

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
        
        return userData;
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
      return null;
    }
  }, []);

  useEffect(() => { refreshUserRef.current = refreshUser; }, [refreshUser]);

  const fetchVerificationStatus = useCallback(async () => {
    try {
      
      const response = await authService.getCurrentUser();
      const userData = response.user || response.data?.user || response;
      
      if (userData) {
        const newStatus = userData.kycStatus || null;
        const oldStatus = localStorage.getItem('verificationStatus');
        
        if (newStatus !== oldStatus) {
          setVerificationStatus(newStatus);
          localStorage.setItem('verificationStatus', newStatus);
          
          setUser(userData);
          localStorage.setItem('userData', JSON.stringify(userData));
        }
        
        return newStatus;
      }
    } catch (err) {
      console.error('Error fetching verification status:', err);
      
      const storedStatus = localStorage.getItem('verificationStatus');
      setVerificationStatus(storedStatus);
      return storedStatus;
    }
  }, []);

  useEffect(() => {
    
    return () => {};
  }, []);

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

  const getLoginHistory = useCallback(() => {
    return loginHistory;
  }, [loginHistory]);

  const getLastLogin = useCallback(() => {
    return loginHistory[1] || null; 
  }, [loginHistory]);

  const checkSession = useCallback(async () => {
    const token = getAccessToken();
    
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
    
    user,
    loading,
    error,
    isAuthenticated: !!user,
    verificationStatus,
    verificationData,
    redirectPath,
    
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
    
    setUser,
    setRedirectPath,
    clearRedirectPath: () => setRedirectPath(null),
    clearError: () => setError(null),

    sessionActive,
    lastActivity,
    checkSession,
    
    hasRole,
    hasPermission,
    
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
