import React, { useState } from 'react';
import '../styles/AdvancedSearch.css';

export default function AdvancedSearch({ onFilter }) {
  const [filters, setFilters] = useState({
    priceMin: 0,
    priceMax: 1000,
    rating: 0,
    category: '',
    sortBy: 'popular',
    searchText: '',
    organic: false,
    fresh: false,
  });

  const [showFilters, setShowFilters] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    onFilter({ ...filters, [name]: type === 'checkbox' ? checked : value });
  };

  const resetFilters = () => {
    const defaultFilters = {
      priceMin: 0,
      priceMax: 1000,
      rating: 0,
      category: '',
      sortBy: 'popular',
      searchText: '',
      organic: false,
      fresh: false,
    };
    setFilters(defaultFilters);
    onFilter(defaultFilters);
  };

  const activeFiltersCount = Object.values(filters).filter(v => 
    v !== '' && v !== 0 && v !== false
  ).length;

  return (
    <div className="advanced-search">
      {/* Search Bar */}
      <div className="search-bar card-glass">
        <input
          type="text"
          name="searchText"
          placeholder="Search by crop name, farmer, or keywords..."
          value={filters.searchText}
          onChange={handleChange}
          className="search-input"
        />
        <button className="search-btn btn btn-primary">🔍</button>
      </div>

      {/* Filter Toggle */}
      <div className="filter-toggle">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn btn-outline"
        >
          ⚙️ Filters {activeFiltersCount > 0 && <span className="badge">{activeFiltersCount}</span>}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel card-glass animate-slide-in-down">
          {/* Sort By */}
          <div className="filter-section">
            <h4>Sort By</h4>
            <select
              name="sortBy"
              value={filters.sortBy}
              onChange={handleChange}
              className="filter-select"
            >
              <option value="popular">Most Popular</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>

          <div className="divider-subtle"></div>

          {/* Category Filter */}
          <div className="filter-section">
            <h4>Category</h4>
            <select
              name="category"
              value={filters.category}
              onChange={handleChange}
              className="filter-select"
            >
              <option value="">All Categories</option>
              <option value="vegetables">Vegetables</option>
              <option value="fruits">Fruits</option>
              <option value="grains">Grains</option>
              <option value="spices">Spices</option>
              <option value="dairy">Dairy Products</option>
            </select>
          </div>

          <div className="divider-subtle"></div>

          {/* Price Range */}
          <div className="filter-section">
            <h4>Price Range</h4>
            <div className="price-inputs">
              <input
                type="number"
                name="priceMin"
                placeholder="Min"
                value={filters.priceMin}
                onChange={handleChange}
                className="price-input"
              />
              <span className="separator">-</span>
              <input
                type="number"
                name="priceMax"
                placeholder="Max"
                value={filters.priceMax}
                onChange={handleChange}
                className="price-input"
              />
            </div>
            <div className="price-slider">
              <input
                type="range"
                min="0"
                max="1000"
                name="priceMin"
                value={filters.priceMin}
                onChange={handleChange}
                className="slider"
              />
              <input
                type="range"
                min="0"
                max="1000"
                name="priceMax"
                value={filters.priceMax}
                onChange={handleChange}
                className="slider"
              />
            </div>
          </div>

          <div className="divider-subtle"></div>

          {/* Rating Filter */}
          <div className="filter-section">
            <h4>Minimum Rating</h4>
            <div className="rating-options">
              {[5, 4, 3, 2, 1].map(stars => (
                <label key={stars} className="rating-option">
                  <input
                    type="radio"
                    name="rating"
                    value={stars}
                    checked={filters.rating === String(stars)}
                    onChange={handleChange}
                  />
                  <span className="stars">{'⭐'.repeat(stars)}</span>
                  <span className="label">& up</span>
                </label>
              ))}
              <label className="rating-option">
                <input
                  type="radio"
                  name="rating"
                  value="0"
                  checked={filters.rating === '' || filters.rating === 0}
                  onChange={() => {
                    setFilters(prev => ({ ...prev, rating: 0 }));
                    onFilter({ ...filters, rating: 0 });
                  }}
                />
                <span className="label">All ratings</span>
              </label>
            </div>
          </div>

          <div className="divider-subtle"></div>

          {/* Attributes */}
          <div className="filter-section">
            <h4>Attributes</h4>
            <div className="checkbox-group">
              <label className="checkbox-wrapper">
                <input
                  type="checkbox"
                  name="organic"
                  checked={filters.organic}
                  onChange={handleChange}
                />
                <span className="checkbox-box"></span>
                <span className="checkbox-label">Organic Only</span>
              </label>
              <label className="checkbox-wrapper">
                <input
                  type="checkbox"
                  name="fresh"
                  checked={filters.fresh}
                  onChange={handleChange}
                />
                <span className="checkbox-box"></span>
                <span className="checkbox-label">Fresh Delivery</span>
              </label>
            </div>
          </div>

          <div className="divider-subtle"></div>

          {/* Reset Button */}
          <button
            onClick={resetFilters}
            className="btn btn-ghost w-full cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
