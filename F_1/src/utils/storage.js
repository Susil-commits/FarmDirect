
const memoryStore = new Map();

function isStorageAvailable() {
  try {
    const test = '__storage_test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

const storageAvailable = isStorageAvailable();

export const safeStorage = {
  setItem(key, value) {
    if (storageAvailable) {
      try {
        window.localStorage.setItem(key, value);
        
        memoryStore.set(key, value); 
      } catch (e) {
        console.warn(`localStorage setItem failed for key "${key}", falling back to memory store:`, e);
        
        memoryStore.set(key, value);
      }
    } else {
      memoryStore.set(key, value);
    }
  },

  getItem(key) {
    if (storageAvailable) {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        console.warn(`localStorage getItem failed for key "${key}":`, e);
      }
    }
    return memoryStore.get(key) || null;
  },

  removeItem(key) {
    if (storageAvailable) {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {
        console.warn(`localStorage removeItem failed for key "${key}":`, e);
      }
    }
    memoryStore.delete(key);
  },

  clear() {
    if (storageAvailable) {
      try {
        window.localStorage.clear();
      } catch (e) {
        console.warn('localStorage clear failed:', e);
      }
    }
    memoryStore.clear();
  }
};
