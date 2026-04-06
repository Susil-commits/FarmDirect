import { createContext, useState, useContext, useEffect } from 'react';

const RouterContext = createContext();

export function RouterProvider({ children }) {
  // Initialize with saved route from localStorage, default to /
  const [currentRoute, setCurrentRoute] = useState(() => {
    return localStorage.getItem('currentRoute') || '/';
  });

  // Save route to localStorage whenever it changes (but skip auth routes)
  useEffect(() => {
    // Don't persist auth routes - always default to home when returning
    if (!currentRoute.includes('/auth/')) {
      localStorage.setItem('currentRoute', currentRoute);
    }
  }, [currentRoute]);

  const navigate = (path) => {
    // Skip loading if already on same page
    console.log('Navigate called:', { from: currentRoute, to: path });
    if (path === currentRoute) {
      console.log('Same route, skipping navigation');
      return;
    }
    
    console.log('Updating route to:', path);
    setCurrentRoute(path);
    window.scrollTo(0, 0);
  };

  return (
    <RouterContext.Provider value={{ currentRoute, navigate }}>
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
