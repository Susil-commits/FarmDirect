/**
 * Password Reset Service
 * Handles password reset and recovery flow
 */
import { API_BASE_URL } from './api.js';

export const passwordResetService = {
  /**
   * Request password reset email
   * @param {string} email - User email
   */
  requestReset: async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error('Request failed');
      return await response.json();
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  },

  /**
   * Verify reset token and update password
   * @param {string} token - Reset token from email
   * @param {string} newPassword - New password
   */
  resetPassword: async (token, newPassword) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      if (!response.ok) throw new Error('Reset failed');
      return await response.json();
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  },

  /**
   * Update password (authenticated user)
   * @param {object} data - Old and new passwords
   */
  updatePassword: async (data) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Update failed');
      return await response.json();
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },
};
