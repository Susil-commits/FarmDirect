/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

export const RecentlyViewedContext = createContext();

export function RecentlyViewedProvider({ children }) {
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('farm-recently-viewed');
    if (saved) {
      try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
        setRecentlyViewed(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load recently viewed:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('farm-recently-viewed', JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  const addToRecentlyViewed = (product) => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(item => item.id !== product.id);
      
      const updatedProduct = {
        ...product,
        viewedAt: new Date().toISOString()
      };
      
      return [updatedProduct, ...filtered].slice(0, 10);
    });
  };

  const removeFromRecentlyViewed = (productId) => {
    setRecentlyViewed(prev => prev.filter(item => item.id !== productId));
  };

  const clearRecentlyViewed = () => {
    setRecentlyViewed([]);
  };

  const getRecentlyViewed = () => {
    return recentlyViewed;
  };

  return (
    <RecentlyViewedContext.Provider
      value={{
        recentlyViewed,
        addToRecentlyViewed,
        removeFromRecentlyViewed,
        clearRecentlyViewed,
        getRecentlyViewed,
      }}
    >
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed() {
  const context = useContext(RecentlyViewedContext);
  if (!context) {
    throw new Error('useRecentlyViewed must be used within RecentlyViewedProvider');
  }
  return context;
}
