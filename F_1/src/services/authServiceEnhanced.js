import api from './api.js';
import { isTokenExpired } from '../utils/jwtUtils.js';

/**
 * Enhanced Authentication Service
 * Integrates with JWT token refresh and session management
 */
class AuthServiceEnhanced {
  /**
   * Refresh authentication token
   * Endpoint: POST /auth/refresh-token
   * Backend should accept: { refreshToken }
   * Backend should return: { token, refreshToken? }
   */
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/auth/refresh-token', {
        refreshToken,
      });

      // Store new tokens
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('lastActivityTime', Date.now().toString());
      }

      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }

      return response;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear auth data on refresh failure
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      throw error;
    }
  }

  /**
   * Validate session with backend
   * Endpoint: GET /auth/validate-session
   * Returns current user data if valid
   */
  async validateSession() {
    try {
      const token = localStorage.getItem('token');
      
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

  /**
   * Get current user with latest data
   * Endpoint: GET /auth/me
   */
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me');
      return response;
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      throw error;
    }
  }

  /**
   * Update user permissions/roles (admin only)
   * Endpoint: PUT /auth/users/:userId/permissions
   */
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

  /**
   * Get user roles
   * Endpoint: GET /auth/roles
   */
  async getUserRoles() {
    try {
      const response = await api.get('/auth/roles');
      return response;
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      throw error;
    }
  }

  /**
   * Check if user can perform action
   * Endpoint: POST /auth/check-permission
   * Returns: { allowed: boolean }
   */
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

  /**
   * Revoke token/logout from all devices
   * Endpoint: POST /auth/logout-all
   */
  async logoutAllDevices() {
    try {
      const response = await api.post('/auth/logout-all');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userData');
      return response;
    } catch (error) {
      console.error('Failed to logout from all devices:', error);
      throw error;
    }
  }

  /**
   * Get login history
   * Endpoint: GET /auth/login-history
   */
  async getLoginHistory() {
    try {
      const response = await api.get('/auth/login-history');
      return response;
    } catch (error) {
      console.error('Failed to fetch login history:', error);
      return [];
    }
  }

  /**
   * Verify email
   * Endpoint: POST /auth/verify-email
   * Body: { code }
   */
  async verifyEmail(code) {
    try {
      const response = await api.post('/auth/verify-email', { code });
      return response;
    } catch (error) {
      console.error('Email verification failed:', error);
      throw error;
    }
  }

  /**
   * Enable two-factor authentication
   * Endpoint: POST /auth/2fa/enable
   */
  async enable2FA() {
    try {
      const response = await api.post('/auth/2fa/enable');
      return response;
    } catch (error) {
      console.error('Failed to enable 2FA:', error);
      throw error;
    }
  }

  /**
   * Verify two-factor authentication
   * Endpoint: POST /auth/2fa/verify
   */
  async verify2FA(code) {
    try {
      const response = await api.post('/auth/2fa/verify', { code });
      return response;
    } catch (error) {
      console.error('2FA verification failed:', error);
      throw error;
    }
  }

  /**
   * Disable two-factor authentication
   * Endpoint: POST /auth/2fa/disable
   */
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

// Export singleton instance
export const authServiceEnhanced = new AuthServiceEnhanced();

export default authServiceEnhanced;
