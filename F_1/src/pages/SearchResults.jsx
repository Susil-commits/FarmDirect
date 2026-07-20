import React, { useState, useEffect } from 'react';
import { useRouter } from '../hooks/useRouter';
import { useCart } from '../hooks/useCart';
import { useToast } from '../hooks/useToast';
import PageTransition from '../components/common/PageTransition';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import ScrollAnimation from '../components/common/ScrollAnimation';
import PageLoader from '../components/common/PageLoader';
import { cropService } from '../services/appService';
import {
  Search, X, Heart, MapPin, Star, IndianRupee, Filter,
  ChevronDown, GridIcon, List, ArrowUpDown
} from 'lucide-react';
import SkeletonLoader from '../components/common/SkeletonLoader';
import ErrorBoundary from '../components/common/ErrorBoundary';
import '../styles/SearchResults.css';

export default function SearchResults() {
  const { navigate, params } = useRouter();
  const { _cart, addToCart } = useCart();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [_results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [page, setPage] = useState(1);
  const resultsPerPage = 12;

  // Filters
  const [filters, setFilters] = useState({
    category: 'all',
    priceRange: 'all',
    rating: 0,
    location: 'all',
    sortBy: 'popular'
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    // Get search query from URL params or localStorage
    const query = localStorage.getItem('searchQuery') || params?.q || '';
    if (query) {
       
       
       
       
       
       
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchQuery(query);
       
      // eslint-disable-next-line react-hooks/immutability
      performSearch(query, filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Map UI sort values → backend sortBy + sortOrder params
  const mapSort = (sortBy) => {
    switch (sortBy) {
      case 'price-asc': return { sortBy: 'price', sortOrder: 'asc' };
      case 'price-desc': return { sortBy: 'price', sortOrder: 'desc' };
      case 'rating': return { sortBy: 'rating', sortOrder: 'desc' };
      case 'newest': return { sortBy: 'createdAt', sortOrder: 'desc' };
      default: return { sortBy: 'sold', sortOrder: 'desc' }; // popular
    }
  };

  const performSearch = async (query, filterValues = filters) => {
    if (!query.trim()) {
      addToast('Please enter a search term', 'error');
      return;
    }

    try {
      setLoading(true);
      const { sortBy, sortOrder } = mapSort(filterValues.sortBy);

      const params = {
        search: query,
        page: 1,
        limit: 100,
        sortBy,
        sortOrder,
      };

      if (filterValues.category !== 'all') params.category = filterValues.category;
      if (filterValues.rating > 0) params.rating = filterValues.rating;
      if (filterValues.location !== 'all') params.location = filterValues.location;

      if (filterValues.priceRange !== 'all') {
        const [min, max] = filterValues.priceRange.split('-').map(Number);
        params.minPrice = min;
        if (max < 9999) params.maxPrice = max;
      }

      const data = await cropService.getAllCrops(params);
      const crops = data.crops || data.data?.crops || [];
      setResults(crops);
      setFilteredResults(crops);
      setPage(1);
      localStorage.setItem('searchQuery', query);
    } catch (error) {
      console.error('Search error:', error);
      addToast('Error performing search', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    setPage(1);
    // Re-fetch from the backend with updated filters (server-side filtering/sorting)
    performSearch(searchQuery, newFilters);
  };

  const categories = ['all', 'vegetables', 'fruits', 'grains', 'pulses', 'spices', 'dairy', 'meat', 'seeds', 'herbs', 'other'];
  const priceRanges = [
    { label: 'All Prices', value: 'all' },
    { label: '₹0 - ₹100', value: '0-100' },
    { label: '₹100 - ₹500', value: '100-500' },
    { label: '₹500 - ₹1000', value: '500-1000' },
    { label: '₹1000+', value: '1000-9999' }
  ];

  const totalPages = Math.ceil(filteredResults.length / resultsPerPage);
  const paginatedResults = filteredResults.slice((page - 1) * resultsPerPage, page * resultsPerPage);

  if (loading) {
    return (
      <PageTransition>
        <SkeletonLoader variant="marketplace" />
      </PageTransition>
    );
  }

  return (
    <ErrorBoundary>
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <ScrollAnimation className="scroll-slide mb-8">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => navigate('/')} className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition">← Back</button>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Search Results</h1>
            <p className="text-gray-600">Found <strong>{filteredResults.length}</strong> results for "<strong>{searchQuery}</strong>"</p>
          </ScrollAnimation>

          {/* Search Bar */}
          <ScrollAnimation className="scroll-slide mb-8">
            <Card className="p-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search crops, vegetables, fruits..."
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                    onKeyPress={(e) => e.key === 'Enter' && performSearch(searchQuery)}
                  />
                </div>
                <Button onClick={() => performSearch(searchQuery)} variant="primary">Search</Button>
              </div>
            </Card>
          </ScrollAnimation>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <ScrollAnimation className="scroll-slide lg:col-span-1">
              <Card className="p-6 sticky top-4">
                <div className="flex items-center justify-between mb-6 lg:hidden">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2"><Filter className="w-5 h-5" />Filters</h3>
                  <button onClick={() => setShowFilters(!showFilters)} className="text-gray-600 hover:text-gray-900">
                    {showFilters ? <X className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                  {/* Category Filter */}
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3">Category</h4>
                    <select
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat === 'all' ? 'all' : cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price Filter */}
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3">Price Range</h4>
                    <div className="space-y-2">
                      {priceRanges.map(range => (
                        <label key={range.value} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="priceRange"
                            value={range.value}
                            checked={filters.priceRange === range.value}
                            onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-700">{range.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3">Rating</h4>
                    <div className="space-y-2">
                      {[0, 4, 4.5].map(rating => (
                        <label key={rating} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="rating"
                            value={rating}
                            checked={filters.rating === rating}
                            onChange={(e) => handleFilterChange('rating', Number(e.target.value))}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-700">
                            {rating === 0 ? 'All Ratings' : `${rating}⭐ & above`}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Sort By */}
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3">Sort By</h4>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                    >
                      <option value="popular">Most Popular</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="rating">Highest Rated</option>
                      <option value="newest">Newest First</option>
                    </select>
                  </div>
                </div>
              </Card>
            </ScrollAnimation>

            {/* Results */}
            <div className="lg:col-span-3">
              <ScrollAnimation className="scroll-slide">
                {/* View Mode Toggle */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition ${
                      viewMode === 'grid' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <GridIcon className="w-4 h-4" />
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition ${
                      viewMode === 'list' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <List className="w-4 h-4" />
                    List
                  </button>
                </div>

                {filteredResults.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No crops found matching your search</p>
                    <Button onClick={() => navigate('/marketplace')} variant="primary">Browse All</Button>
                  </Card>
                ) : (
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                    {paginatedResults.map(crop => (
                      <Card key={crop._id} className={`p-6 hover:shadow-lg transition ${viewMode === 'list' ? 'flex items-center gap-6' : ''}`}>
                        {/* Crop Image Placeholder */}
                        {viewMode === 'grid' && <div className="w-full h-48 bg-gradient-to-br from-green-100 to-green-200 rounded-lg mb-4 flex items-center justify-center text-3xl">🌾</div>}

                        <div className={viewMode === 'list' ? 'flex-1' : ''}>
                          {/* Crop Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900">{crop.name}</h3>
                              <p className="text-sm text-gray-600">{crop.category}</p>
                            </div>
                            <button className="text-red-600 hover:text-red-700">
                              <Heart className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Rating */}
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < Math.floor(crop.rating || 0)
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-600">({crop.reviews?.length || 0})</span>
                          </div>

                          {/* Description */}
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{crop.description}</p>

                          {/* Farmer Info */}
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                            <MapPin className="w-4 h-4" />
                            <span>{crop.farmerId?.location || 'Location unavailable'}</span>
                          </div>

                          {/* Price & Actions */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                              <p className="text-xs text-gray-600">Price per kg</p>
                              <p className="text-2xl font-bold text-green-600">₹{crop.price}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                onClick={() => navigate(`/crop/${crop._id}`)}
                                variant="outline"
                                className="text-sm"
                              >
                                View
                              </Button>
                              <Button
                                onClick={() => {
                                  addToCart({
                                    ...crop,
                                    quantity: 1
                                  });
                                  addToast('Added to cart', 'success');
                                }}
                                variant="primary"
                                className="text-sm"
                              >
                                Add to Cart
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollAnimation>
            </div>
          </div>

          {/* Pagination */}
          {filteredResults.length > resultsPerPage && (
            <ScrollAnimation className="scroll-slide mt-12">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ← Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? 'primary' : 'outline'}
                    className="w-10 h-10 p-0"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next →
                </Button>
              </div>
            </ScrollAnimation>
          )}
        </div>
      </div>
    </PageTransition>
    </ErrorBoundary>
  );
}
