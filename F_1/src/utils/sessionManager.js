import { isSessionExpired, getTokenExpiryTime } from './jwtUtils.js';

/**
 * Session Manager
 * Handles session monitoring, warnings, and lifecycle
 */
class SessionManager {
  constructor() {
    this.warningDisplayed = false;
    this.warningThreshold = 300; // 5 minutes before expiry
    this.listeners = [];
  }

  /**
   * Get current session status
   */
  getSessionStatus() {
    const token = localStorage.getItem('token');
    const lastActivity = localStorage.getItem('lastActivityTime');
    const user = localStorage.getItem('userData');

    if (!token || !user) {
      return {
        active: false,
        reason: 'No token or user data',
      };
    }

    if (isSessionExpired()) {
      return {
        active: false,
        reason: 'Idle timeout exceeded',
        idleMinutes: Math.floor((Date.now() - parseInt(lastActivity)) / 60000),
      };
    }

    const expirySeconds = getTokenExpiryTime(token);
    return {
      active: true,
      expirySeconds,
      expiryMinutes: Math.floor(expirySeconds / 60),
      lastActivityTime: lastActivity ? new Date(parseInt(lastActivity)) : null,
    };
  }

  /**
   * Check if session will expire soon and needs warning
   */
  shouldShowExpiryWarning() {
    const token = localStorage.getItem('token');
    if (!token) return false;

    const expirySeconds = getTokenExpiryTime(token);
    return expirySeconds > 0 && expirySeconds < this.warningThreshold;
  }

  /**
   * Get formatted session expiry time
   */
  getFormattedExpiryTime() {
    const token = localStorage.getItem('token');
    if (!token) return 'Expired';

    const expirySeconds = getTokenExpiryTime(token);

    if (expirySeconds <= 0) return 'Expired';
    if (expirySeconds < 60) return `${expirySeconds}s`;
    if (expirySeconds < 3600) return `${Math.floor(expirySeconds / 60)}m`;
    if (expirySeconds < 86400) return `${Math.floor(expirySeconds / 3600)}h`;

    return `${Math.floor(expirySeconds / 86400)}d`;
  }

  /**
   * Extend session by updating last activity time
   */
  extendSession() {
    localStorage.setItem('lastActivityTime', Date.now().toString());
    this.notifyListeners('sessionExtended');
  }

  /**
   * Clear session completely
   */
  clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('verificationStatus');
    localStorage.removeItem('lastActivityTime');
    this.notifyListeners('sessionCleared');
  }

  /**
   * Get session duration (time logged in)
   */
  getSessionDuration() {
    const loginEntry = JSON.parse(localStorage.getItem('loginHistory') || '[]')[0];
    if (!loginEntry) return null;

    const currentTime = Date.now();
    const loginTime = loginEntry.timestamp;
    const durationMs = currentTime - loginTime;

    return {
      seconds: Math.floor(durationMs / 1000),
      minutes: Math.floor(durationMs / 60000),
      hours: Math.floor(durationMs / 3600000),
      formatted: this._formatDuration(durationMs),
    };
  }

  /**
   * Get login history
   */
  getLoginHistory() {
    return JSON.parse(localStorage.getItem('loginHistory') || '[]');
  }

  /**
   * Get previous login information
   */
  getPreviousLogin() {
    const history = this.getLoginHistory();
    return history[1] || null;
  }

  /**
   * Validate session token
   */
  isSessionValid() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('userData');

    if (!token || !user) return false;
    if (isSessionExpired()) return false;

    return true;
  }

  /**
   * Add listener for session events
   */
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (err) {
        console.error('Error in session listener:', err);
      }
    });
  }

  /**
   * Format duration in milliseconds
   */
  _formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Log session info for debugging
   */
  logSessionInfo() {
    const status = this.getSessionStatus();
    const duration = this.getSessionDuration();
    const history = this.getLoginHistory();

    console.group('🔐 Session Information');
    console.log('Status:', status);
    console.log('Duration:', duration);
    console.log('Login History:', history);
    console.log('Previous Login:', this.getPreviousLogin());
    console.groupEnd();
  }
}

// Singleton instance
export const sessionManager = new SessionManager();

export default sessionManager;
