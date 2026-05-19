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

  // Filter crops based on query — prioritizes prefix (startsWith) matches
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();

    // Safely extract the crop name from either cropName (DB field) or name (transformed)
    const getCropName = (crop) => (crop.cropName || crop.name || '').toLowerCase();
    const getDescription = (crop) => (crop.description || '').toLowerCase();
    const getCategory = (crop) => (crop.category || '').toLowerCase();

    // Farmer name can come from populated farmerId object or a flat farmer string
    const getFarmerText = (crop) => {
      const f = crop.farmerId;
      if (f && typeof f === 'object') {
        return [f.firstName, f.lastName, f.name, f.farmName]
          .filter(Boolean).join(' ').toLowerCase();
      }
      return (crop.farmer || '').toLowerCase();
    };

    // Split into prefix matches (startsWith) and substring matches (includes)
    const prefixMatches = [];
    const substringMatches = [];

    for (const crop of crops) {
      const nameText = getCropName(crop);
      const descText = getDescription(crop);
      const catText = getCategory(crop);
      const farmerText = getFarmerText(crop);

      const isPrefixMatch =
        nameText.startsWith(lowerQuery) ||
        descText.startsWith(lowerQuery) ||
        catText.startsWith(lowerQuery) ||
        farmerText.startsWith(lowerQuery);

      const isSubstringMatch =
        nameText.includes(lowerQuery) ||
        descText.includes(lowerQuery) ||
        catText.includes(lowerQuery) ||
        farmerText.includes(lowerQuery);

      if (isPrefixMatch) {
        prefixMatches.push(crop);
      } else if (isSubstringMatch) {
        substringMatches.push(crop);
      }
    }

    // Prefix matches first, then substring matches — limit to 10 total
    return [...prefixMatches, ...substringMatches].slice(0, 10);
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
