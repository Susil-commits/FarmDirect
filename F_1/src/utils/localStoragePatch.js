/* eslint-disable no-unused-vars */
/**
 * Global LocalStorage Patch
 * 
 * Intercepts localStorage.setItem globally to catch QuotaExceededError.
 * If the quota is exceeded, it gracefully degrades rather than throwing
 * an uncaught exception which would crash the React application.
 */

try {
  const originalSetItem = window.localStorage.setItem;
  window.localStorage.setItem = function(key, value) {
    try {
      originalSetItem.apply(this, arguments);
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        console.warn('LocalStorage quota exceeded! Gracefully dropping value for key:', key);
        // Optional: Implement an LRU eviction strategy here if needed
      } else {
        throw e;
      }
    }
  };
  console.log('LocalStorage safety patch applied.');
} catch (err) {
  console.warn('Could not apply LocalStorage safety patch:', err);
}
