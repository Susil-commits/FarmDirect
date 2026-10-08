
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const originalSetItem = window.localStorage.setItem;
    window.localStorage.setItem = function(key, _value) {
      try {
        originalSetItem.apply(this, arguments);
      } catch (e) {
        if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
          // Attempt eviction of transient cached keys to make room
          try {
            const transientPrefixes = ['temp_', 'cache_', 'recent_', 'search_history'];
            for (let i = window.localStorage.length - 1; i >= 0; i--) {
              const k = window.localStorage.key(i);
              if (k && transientPrefixes.some(p => k.startsWith(p))) {
                window.localStorage.removeItem(k);
              }
            }
            return originalSetItem.apply(this, arguments);
          } catch {
            window.dispatchEvent(new CustomEvent('localstorage-quota-exceeded', { detail: { key } }));
            if (import.meta.env?.DEV) {
              console.warn('LocalStorage quota exceeded! Could not store key:', key);
            }
          }
        } else {
          throw e;
        }
      }
    };
    if (import.meta.env?.DEV) {
      console.log('LocalStorage safety patch applied.');
    }
  }
} catch (err) {
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    console.warn('Could not apply LocalStorage safety patch:', err);
  }
}
