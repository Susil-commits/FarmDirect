import { useState, useEffect } from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import Button from './common/Button';
import Card from './common/Card';
import '../styles/FilterPanel.css';

/**
 * Advanced Filter Panel Component with animations
 */
export default function FilterPanel({
  cropTypes = [],
  locations = [],
  priceRange = [0, 1000],
  currentFilters = {},
  onFilterChange = () => {},
  onReset = () => {},
  mobileCollapsed = false,
}) {
  const [localFilters, setLocalFilters] = useState({
    cropType: currentFilters.cropType || '',
    priceRange: currentFilters.priceRange || [0, 1000],
    location: currentFilters.location || '',
  });
  const [isOpen, setIsOpen] = useState(!mobileCollapsed);

  // Sync with parent filters changes
  useEffect(() => {
    setLocalFilters({
      cropType: currentFilters.cropType || '',
      priceRange: currentFilters.priceRange || [0, 1000],
      location: currentFilters.location || '',
    });
  }, [currentFilters]);

  const handleFilterChange = (key, value) => {
    const updated = { ...localFilters, [key]: value };
    setLocalFilters(updated);
    onFilterChange(updated);
  };

  const handlePriceChange = (maxPrice) => {
    const updated = {
      ...localFilters,
      priceRange: [localFilters.priceRange[0], maxPrice],
    };
    setLocalFilters(updated);
    onFilterChange(updated);
  };

  const handleReset = () => {
    const resetFilters = {
      cropType: '',
      priceRange: [0, 1000],
      location: '',
    };
    setLocalFilters(resetFilters);
    onReset();
  };

  return (
    <div>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden mb-4 flex items-center gap-2 px-4 py-2.5 glass rounded-xl transition-smooth hover-lift font-medium cursor-pointer animate-slide-in-down w-full justify-center"
      >
        <Filter size={18} /> 
        {isOpen ? 'Hide Filters' : 'Show Filters'}
      </button>

      {/* Filter Panel */}
      <div
        className={`transition-all duration-300 ease-out origin-top lg:block ${
          isOpen
            ? 'opacity-100 scale-y-100 visible'
            : 'opacity-0 scale-y-95 invisible max-h-0 lg:visible lg:opacity-100 lg:scale-y-100'
        } lg:opacity-100 lg:scale-y-100`}
      >
        <Card variant="light" animated={false} className="animate-slide-in-left">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between animate-fade-in">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <Filter size={18} className="text-green-600" /> Filters
              </h3>
              <button
                onClick={handleReset}
                className="p-1.5 hover:bg-green-100 rounded-lg transition-colors group"
                title="Reset filters"
              >
                <RotateCcw size={18} className="text-gray-600 group-hover:text-green-600 group-hover:animate-rotate-slow" />
              </button>
            </div>

            {/* Crop Type Filter */}
            <div className="animate-slide-in-down" style={{ animationDelay: '0.1s' }}>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                🌱 Crop Type
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-green-50 cursor-pointer transition-colors group">
                  <input
                    type="radio"
                    name="cropType"
                    value=""
                    checked={localFilters.cropType === ''}
                    onChange={(e) => handleFilterChange('cropType', e.target.value)}
                    className="w-4 h-4 text-green-600 cursor-pointer"
                  />
                  <span className="text-gray-700 group-hover:text-green-600 transition-colors">
                    All Types
                  </span>
                </label>
                {cropTypes.map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-green-50 cursor-pointer transition-colors group animate-slide-in-left"
                  >
                    <input
                      type="radio"
                      name="cropType"
                      value={type}
                      checked={localFilters.cropType === type}
                      onChange={(e) => handleFilterChange('cropType', e.target.value)}
                      className="w-4 h-4 text-green-600 cursor-pointer"
                    />
                    <span className="text-gray-700 group-hover:text-green-600 transition-colors">
                      {type}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="animate-slide-in-down" style={{ animationDelay: '0.2s' }}>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                💰 Price Range (₹/kg)
              </label>
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={localFilters.priceRange[1]}
                    onChange={(e) => handlePriceChange(parseInt(e.target.value))}
                    className="w-full h-2 bg-linear-to-r from-green-300 to-emerald-500 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-gray-600 text-xs mb-1">Selected Range</p>
                  <p className="font-bold text-gray-900 text-lg">
                    ₹{localFilters.priceRange[0]} - ₹{localFilters.priceRange[1]}
                  </p>
                </div>
              </div>
            </div>

            {/* Location Filter */}
            <div className="animate-slide-in-down" style={{ animationDelay: '0.3s' }}>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                📍 Location
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-green-50 cursor-pointer transition-colors group">
                  <input
                    type="radio"
                    name="location"
                    value=""
                    checked={localFilters.location === ''}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="w-4 h-4 text-green-600 cursor-pointer"
                  />
                  <span className="text-gray-700 group-hover:text-green-600 transition-colors">
                    All Locations
                  </span>
                </label>
                {locations.map((location) => (
                  <label
                    key={location}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-green-50 cursor-pointer transition-colors group animate-slide-in-left"
                  >
                    <input
                      type="radio"
                      name="location"
                      value={location}
                      checked={localFilters.location === location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                      className="w-4 h-4 text-green-600 cursor-pointer"
                    />
                    <span className="text-gray-700 group-hover:text-green-600 transition-colors">
                      {location}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Reset Button */}
            <Button
              variant="secondary"
              size="sm"
              className="w-full animate-slide-in-down flex items-center justify-center gap-2"
              style={{ animationDelay: '0.4s' }}
              onClick={handleReset}
            >
              <RotateCcw size={16} /> Reset All Filters
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
