/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useMemo, useEffect } from 'react';

export const RouterContext = createContext();

// Route pattern definitions for parameter extraction
const ROUTE_PATTERNS = [
  { pattern: '/crop/', paramName: 'cropId' },
  { pattern: '/edit-crop/', paramName: 'cropId' },
  { pattern: '/farmer/', paramName: 'farmerId' },
  { pattern: '/order/', paramName: 'id' },
];

function extractParams(routePath) {
  const params = {};

  // Extract path parameters from known route patterns
  for (const { pattern, paramName } of ROUTE_PATTERNS) {
    if (routePath.startsWith(pattern)) {
      const value = routePath.slice(pattern.length).split('?')[0].split('#')[0];
      if (value) {
        params[paramName] = value;
      }
      break;
    }
  }

  // Extract query parameters (e.g., /search?q=apple)
  const queryIndex = routePath.indexOf('?');
  if (queryIndex !== -1) {
    const queryString = routePath.slice(queryIndex + 1);
    const searchParams = new URLSearchParams(queryString);
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }
  }

  return params;
}

export function RouterProvider({ children }) {
  // Initialize to the current URL path + search params
  const [currentRoute, setCurrentRoute] = useState(
    window.location.pathname + window.location.search || '/'
  );

  // Handle browser's popstate (back/forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname + window.location.search);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    // Handle browser back navigation (navigate(-1))
    if (path === -1 || path === '-1') {
      window.history.back();
      return;
    }

    // Ensure path is a string
    const routePath = String(path);

    // Skip loading if already on same page
    if (routePath === currentRoute) {
      return;
    }
    
    window.history.pushState({}, '', routePath);
    setCurrentRoute(routePath);
    window.scrollTo(0, 0);
  };

  // Compute params from currentRoute whenever it changes
  const params = useMemo(() => extractParams(currentRoute), [currentRoute]);

  return (
    <RouterContext.Provider value={{ currentRoute, navigate, params }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within RouterProvider');
  }
  return context;
}
