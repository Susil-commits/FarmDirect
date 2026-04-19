import { createContext, useState, useContext, useEffect } from 'react';

const RouterContext = createContext();

export function RouterProvider({ children }) {
  // Initialize to home (/) on every refresh - routes are NOT persisted
  // This ensures that refreshing any page redirects to home
  const [currentRoute, setCurrentRoute] = useState('/');

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
