import { useContext } from 'react';
import { RecentlyViewedContext } from '../context/RecentlyViewedContext';

export function useRecentlyViewed() {
  const context = useContext(RecentlyViewedContext);
  if (!context) {
    throw new Error('useRecentlyViewed must be used within RecentlyViewedProvider');
  }
  return context;
}
