// Pure in-memory access token storage to prevent XSS token theft.
// Rehydration happens via httpOnly refresh cookie on app boot (AuthContext.jsx)
// and silent refresh interceptors (api.js).
let accessToken = null;

// Defensive cleanup of any legacy persisted token from previous sessions
if (typeof window !== 'undefined') {
  try {
    window.localStorage?.removeItem('token');
    window.sessionStorage?.removeItem('token');
  } catch {}
}

export const getAccessToken = () => {
  return accessToken;
};

export const setAccessToken = (token) => {
  accessToken = token || null;
};

export const clearAccessToken = () => {
  accessToken = null;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage?.removeItem('token');
      window.sessionStorage?.removeItem('token');
    } catch {}
  }
};

export default {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
};
