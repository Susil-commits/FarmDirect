/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useMemo, useEffect } from 'react';

export const RouterContext = createContext();

const ROUTE_PATTERNS = [
  { pattern: '/crop/', paramName: 'cropId' },
  { pattern: '/edit-crop/', paramName: 'cropId' },
  { pattern: '/farmer/', paramName: 'farmerId' },
  { pattern: '/order/', paramName: 'id' },
];

function extractParams(routePath) {
  const params = {};

  for (const { pattern, paramName } of ROUTE_PATTERNS) {
    if (routePath.startsWith(pattern)) {
      const value = routePath.slice(pattern.length).split('?')[0].split('#')[0];
      if (value) {
        params[paramName] = value;
      }
      break;
    }
  }

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
  const [currentRoute, setCurrentRoute] = useState(
    window.location.pathname + window.location.search || '/'
  );

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname + window.location.search);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    if (path === -1 || path === '-1') {
      window.history.back();
      return;
    }

    const routePath = String(path);

    if (routePath === currentRoute) {
      return;
    }
    
    window.history.pushState({}, '', routePath);
    setCurrentRoute(routePath);
    window.scrollTo(0, 0);
  };

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
