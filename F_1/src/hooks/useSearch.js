import { useState, useCallback, useMemo } from 'react';

const DEBOUNCE_DELAY = 300;

export function useSearch(crops = []) {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('farm-recent-searches') || '[]');
    } catch {
      return [];
    }
  });

  // Debounce search query
  const performSearch = useCallback((value) => {
    setQuery(value);
  }, []);

  // Filter crops based on query
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    
    return crops.filter(crop => {
      const nameMatch = crop.name?.toLowerCase().includes(lowerQuery);
      const descMatch = crop.description?.toLowerCase().includes(lowerQuery);
      const categoryMatch = crop.category?.toLowerCase().includes(lowerQuery);
      const farmerMatch = crop.farmer?.toLowerCase().includes(lowerQuery);
      
      return nameMatch || descMatch || categoryMatch || farmerMatch;
    }).slice(0, 10); // Return top 10 results
  }, [query, crops]);

  // Add to recent searches
  const addToRecentSearches = useCallback((searchTerm) => {
    if (!searchTerm.trim()) return;

    setRecentSearches(prev => {
      const filtered = prev.filter(s => s !== searchTerm);
      const updated = [searchTerm, ...filtered].slice(0, 5); // Keep last 5
      localStorage.setItem('farm-recent-searches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('farm-recent-searches');
  }, []);

  // Clear query
  const clearQuery = useCallback(() => {
    setQuery('');
  }, []);

  return {
    query,
    setQuery: performSearch,
    searchResults,
    recentSearches,
    addToRecentSearches,
    clearRecentSearches,
    clearQuery,
    hasQuery: query.trim().length > 0
  };
}
