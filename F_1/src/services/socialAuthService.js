import { API_BASE_URL } from './api.js';
import { getAccessToken } from '../utils/tokenStore.js';

export const socialAuthService = {
  
  initiateGoogleLogin: () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('Google Client ID not configured');
      return;
    }
    
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const scope = 'openid email profile';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;
    window.location.href = authUrl;
  },

  initiateGitHubLogin: () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    if (!clientId) {
      console.error('GitHub Client ID not configured');
      return;
    }
    
    const redirectUri = `${window.location.origin}/auth/github/callback`;
    const scope = 'user:email';
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
    window.location.href = authUrl;
  },

  handleGoogleCallback: async (code) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) throw new Error('Google login failed');
      return await response.json();
    } catch (error) {
      console.error('Google callback error:', error);
      throw error;
    }
  },

  handleGitHubCallback: async (code) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/github/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) throw new Error('GitHub login failed');
      return await response.json();
    } catch (error) {
      console.error('GitHub callback error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      const token = getAccessToken();
      if (!token) return;

      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },
};
