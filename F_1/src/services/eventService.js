import { API_BASE_URL } from './api.js';
import { getAccessToken } from '../utils/tokenStore.js';

let sessionId = null;

function generateSecureId() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  return Date.now().toString(36) + Math.floor(Math.random() * 1e9).toString(36);
}

function getSessionId() {
  if (sessionId) return sessionId;
  try {
    sessionId = sessionStorage.getItem('fd_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + generateSecureId() + '_' + Date.now().toString(36);
      sessionStorage.setItem('fd_session_id', sessionId);
    }
  } catch {
    if (!sessionId) {
      sessionId = 'sess_' + generateSecureId() + '_' + Date.now().toString(36);
    }
  }
  return sessionId;
}

const queue = [];
let flushTimer = null;
const FLUSH_INTERVAL_MS = 5000;
const MAX_BATCH_SIZE = 25;

export async function flushEvents() {
  if (queue.length === 0) return;

  const batch = queue.splice(0, MAX_BATCH_SIZE);
  const endpoint = `${API_BASE_URL}/events`;
  const token = getAccessToken();

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ events: batch }),
      keepalive: true,
    });
  } catch {
    // Drop silently to prevent disrupting user experience
  }
}

function flushBeacon() {
  if (queue.length === 0) return;
  const batch = queue.splice(0, MAX_BATCH_SIZE);
  const endpoint = `${API_BASE_URL}/events`;

  try {
    const blob = new Blob([JSON.stringify({ events: batch })], { type: 'application/json' });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, blob);
    } else {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch }),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Ignore on page unload
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushEvents().catch(() => {});
  }, FLUSH_INTERVAL_MS);
}

// Lifecycle listeners
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushBeacon();
    }
  });

  window.addEventListener('beforeunload', () => {
    flushBeacon();
  });
}

export function trackEvent(type, { cropId = null, query = null, meta = {} } = {}) {
  try {
    const eventItem = {
      sessionId: getSessionId(),
      type,
      cropId: cropId || null,
      query: query || null,
      meta,
      at: new Date().toISOString(),
    };

    queue.push(eventItem);

    if (queue.length >= MAX_BATCH_SIZE) {
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }
      flushEvents().catch(() => {});
    } else {
      scheduleFlush();
    }
  } catch {
    // Fail silently
  }
}

export const trackView = (cropId, meta) => trackEvent('view', { cropId, meta });
export const trackSearch = (query, meta) => trackEvent('search', { query, meta });
export const trackClick = (cropId, meta) => trackEvent('click', { cropId, meta });
export const trackCart = (cropId, meta) => trackEvent('cart', { cropId, meta });
export const trackWishlist = (cropId, meta) => trackEvent('wishlist', { cropId, meta });
export const trackInterest = (cropId, meta) => trackEvent('interest', { cropId, meta });
export const trackOffer = (cropId, meta) => trackEvent('offer', { cropId, meta });
export const trackOrder = (cropId, meta) => trackEvent('order', { cropId, meta });

export default {
  trackEvent,
  trackView,
  trackSearch,
  trackClick,
  trackCart,
  trackWishlist,
  trackInterest,
  trackOffer,
  trackOrder,
  flushEvents,
};
