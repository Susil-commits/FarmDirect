import { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, Zap } from 'lucide-react';
import { useRouter } from '../context/RouterContext';
import { useSearch } from '../hooks/useSearch';
import { cropService } from '../services/appService';
import './SearchBar.css';

export default function SearchBar() {
  const [crops, setCrops] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const { navigate } = useRouter();
  const {
    query,
    setQuery,
    searchResults,
    recentSearches,
    addToRecentSearches,
    clearRecentSearches,
    clearQuery,
    hasQuery
  } = useSearch(crops);

  // Fetch crops on mount
  useEffect(() => {
    const fetchCrops = async () => {
      try {
        const response = await cropService.getAllCrops();
        setCrops(response.data?.crops || response.crops || []);
      } catch (error) {
        console.error('Failed to fetch crops for search:', error);
      }
    };
    fetchCrops();
  }, []);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchTerm) => {
    addToRecentSearches(searchTerm);
    navigate(`/marketplace?search=${encodeURIComponent(searchTerm)}`);
    setIsOpen(false);
    clearQuery();
  };

  const handleResultClick = (crop) => {
    addToRecentSearches(crop.name);
    navigate(`/crop/${crop.id}`);
    setIsOpen(false);
    clearQuery();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (query.trim()) {
        handleSearch(query);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  return (
    <div className="search-bar-container">
      <div className="search-bar-wrapper">
        <div className="search-input-group">
          <Search size={18} className="search-icon" aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search crops, farmers..."
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(true)}
            className="search-input"
            aria-label="Search for crops and farmers"
            aria-autocomplete="list"
            role="combobox"
            aria-expanded={isOpen}
          />
          {hasQuery && (
            <button
              onClick={clearQuery}
              className="search-clear"
              title="Clear search"
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div ref={dropdownRef} className="search-dropdown" role="listbox">
            {/* Recent Searches */}
            {!hasQuery && recentSearches.length > 0 && (
              <div className="dropdown-section">
                <div className="dropdown-section-header">
                  <Clock size={14} />
                  <span>Recent Searches</span>
                </div>
                <div className="dropdown-list">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(search);
                        setIsOpen(true);
                      }}
                      className="dropdown-item recent-item"
                      role="option"
                    >
                      <Clock size={14} className="text-gray-400" />
                      <span>{search}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={clearRecentSearches}
                  className="dropdown-action"
                >
                  Clear recent searches
                </button>
              </div>
            )}

            {/* Search Results */}
            {hasQuery && (
              <>
                {searchResults.length > 0 ? (
                  <div className="dropdown-section">
                    <div className="dropdown-section-header">
                      <Zap size={14} />
                      <span>Search Results ({searchResults.length})</span>
                    </div>
                    <div className="dropdown-list">
                      {searchResults.map((crop) => (
                        <button
                          key={crop.id}
                          onClick={() => handleResultClick(crop)}
                          className="dropdown-item result-item"
                          role="option"
                        >
                          <div className="result-image">
                            {crop.image && crop.image.startsWith('http') ? (
                              <img src={crop.image} alt={crop.name} />
                            ) : (
                              <span>{crop.image || '🥬'}</span>
                            )}
                          </div>
                          <div className="result-info">
                            <p className="result-name">{crop.name}</p>
                            <p className="result-meta">
                              {crop.category} • ₹{crop.price}/kg
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="dropdown-empty">
                    <div className="empty-icon">🔍</div>
                    <p className="empty-text">No results for "{query}"</p>
                    <p className="empty-hint">Try searching with different keywords</p>
                  </div>
                )}

                {/* Go to search results */}
                <div className="dropdown-footer">
                  <button
                    onClick={() => handleSearch(query)}
                    className="search-all-btn"
                  >
                    Search "{query}" in marketplace
                  </button>
                </div>
              </>
            )}

            {/* Empty state when no query and no recent */}
            {!hasQuery && recentSearches.length === 0 && (
              <div className="dropdown-empty">
                <div className="empty-icon">💡</div>
                <p className="empty-text">Start typing to search</p>
                <p className="empty-hint">Search crops, farmers, or categories</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
