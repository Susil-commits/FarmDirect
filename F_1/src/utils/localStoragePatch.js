
try {
  const originalSetItem = window.localStorage.setItem;
  window.localStorage.setItem = function(key, value) {
    try {
      originalSetItem.apply(this, arguments);
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        console.warn('LocalStorage quota exceeded! Gracefully dropping value for key:', key);
        
      } else {
        throw e;
      }
    }
  };
  console.log('LocalStorage safety patch applied.');
} catch (err) {
  console.warn('Could not apply LocalStorage safety patch:', err);
}
