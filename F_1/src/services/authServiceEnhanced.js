import api, { refreshAuthToken } from './api.js';
import { isTokenExpired } from '../utils/jwtUtils.js';
import { getAccessToken, clearAccessToken } from '../utils/tokenStore.js';

class AuthServiceEnhanced {
  
  async refreshToken() {
    try {
      const newToken = await refreshAuthToken();
      return { token: newToken };
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAccessToken();
      throw error;
    }
  }

  async validateSession() {
    try {
      const token = getAccessToken();
      
      if (!token) {
        return { valid: false, reason: 'No token' };
      }

      if (isTokenExpired(token)) {
        return { valid: false, reason: 'Token expired' };
      }

      const response = await api.get('/auth/validate-session');
      return {
        valid: true,
        user: response.user,
        expiresAt: response.expiresAt,
      };
    } catch (error) {
      console.error('Session validation failed:', error);
      return { valid: false, reason: error.message };
    }
  }

  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me');
      return response;
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      throw error;
    }
  }

  async updateUserPermissions(userId, permissions) {
    try {
      const response = await api.put(`/auth/users/${userId}/permissions`, {
        permissions,
      });
      return response;
    } catch (error) {
      console.error('Failed to update permissions:', error);
      throw error;
    }
  }

  async getUserRoles() {
    try {
      const response = await api.get('/auth/roles');
      return response;
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      throw error;
    }
  }

  async checkPermission(action, resourceId = null) {
    try {
      const response = await api.post('/auth/check-permission', {
        action,
        resourceId,
      });
      return response.allowed;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }

  async logoutAllDevices() {
    try {
      const response = await api.post('/auth/logout-all');
      clearAccessToken();
      localStorage.removeItem('userData');
      return response;
    } catch (error) {
      console.error('Failed to logout from all devices:', error);
      throw error;
    }
  }

  async getLoginHistory() {
    try {
      const response = await api.get('/auth/login-history');
      return response;
    } catch (error) {
      console.error('Failed to fetch login history:', error);
      return [];
    }
  }

  async verifyEmail(code) {
    try {
      const response = await api.post('/auth/verify-email', { code });
      return response;
    } catch (error) {
      console.error('Email verification failed:', error);
      throw error;
    }
  }

  async enable2FA() {
    try {
      const response = await api.post('/auth/2fa/enable');
      return response;
    } catch (error) {
      console.error('Failed to enable 2FA:', error);
      throw error;
    }
  }

  async verify2FA(code) {
    try {
      const response = await api.post('/auth/2fa/verify', { code });
      return response;
    } catch (error) {
      console.error('2FA verification failed:', error);
      throw error;
    }
  }

  async disable2FA(code) {
    try {
      const response = await api.post('/auth/2fa/disable', { code });
      return response;
    } catch (error) {
      console.error('Failed to disable 2FA:', error);
      throw error;
    }
  }
}

export const authServiceEnhanced = new AuthServiceEnhanced();

export default authServiceEnhanced;
