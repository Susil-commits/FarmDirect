import { useState, useEffect } from 'react';
import { MapPin, Heart, Filter, ShoppingCart, Loader, AlertCircle, CheckCircle, Check } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import FarmerBadge from '../components/common/FarmerBadge';
import QuantitySelector from '../components/QuantitySelector';
import ProductBadge from '../components/ProductBadge';
import RecentlyViewedCarousel from '../components/RecentlyViewedCarousel';
import FilterPanel from '../components/FilterPanel';
import PageTransition from '../components/common/PageTransition.jsx';
import ScrollAnimation from '../components/common/ScrollAnimation';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { calculateBadges } from '../utils/badgeCalculation';
import { cropService } from '../services/appService';
import '../styles/Marketplace.css';

export default function Marketplace() {
  const { navigate } = useRouter();
  const { _isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { wishlist, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [toast, setToast] = useState(null);
  
  const [filters, setFilters] = useState({
    cropType: '',
    priceRange: [0, 1000],
    location: '',
    verifiedFarmersOnly: false,
    organicOnly: false,
    sortBy: 'newest' // 'newest', 'popular', 'rating', 'price-low', 'price-high'
  });
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [marketplaceStats, setMarketplaceStats] = useState({
    farmers: 0,
    products: 0,
    reviews: 0
  });

  const locations = ['Punjab', 'Himachal', 'Haryana', 'Karnataka', 'Maharashtra', 'Uttar Pradesh', 'Delhi', 'West Bengal'];
  const cropTypes = ['Vegetables', 'Fruits', 'Grains', 'Herbs', 'Organic'];
  const sortOptions = [
    { value: 'newest', label: '🆕 Newest First' },
    { value: 'popular', label: '🔥 Most Popular' },
    { value: 'rating', label: '⭐ Highest Rated' },
    { value: 'price-low', label: '💰 Price: Low to High' },
    { value: 'price-high', label: '💳 Price: High to Low' },
  ];

  // Toast notifications
  const showToast = (message, type = 'success', duration = 3000) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), duration);
  };

  // Reset scroll position to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch marketplace stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const usersRes = await fetch('/api/admin/users', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }).then(r => r.ok ? r.json() : null);
        
        const farmers = usersRes?.data?.filter(u => u.role === 'farmer')?.length || 0;
        const products = crops.length;
        
        setMarketplaceStats({
          farmers: farmers || 10,
          products: products || 25,
          reviews: crops.reduce((sum, c) => sum + (c.totalReviews || 0), 0)
        });
      } catch (error) {
        console.error('Error fetching marketplace stats:', error);
      }
    };

    fetchStats();
  }, [crops]);

  // Fetch crops from API
  useEffect(() => {
    const fetchCrops = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await cropService.getAllCrops({
          category: filters.cropType || undefined,
          minPrice: filters.priceRange[0],
          maxPrice: filters.priceRange[1],
          location: filters.location || undefined,
        });
        setCrops(response.data?.crops || response.crops || []);
      } catch (err) {
        console.error('Failed to fetch crops:', err);
        setError('Unable to load crops. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCrops();
  }, [filters]);

  const filteredCrops = crops.filter(crop => {
    const priceMatch = crop.price >= filters.priceRange[0] && crop.price <= filters.priceRange[1];
    const locationMatch = !filters.location || crop.location === filters.location;
    const typeMatch = !filters.cropType || crop.category === filters.cropType;
    const verifiedMatch = !filters.verifiedFarmersOnly || crop.farmer_verified;
    const organicMatch = !filters.organicOnly || crop.certifications?.includes('Organic') || crop.category === 'Organic';
    
    return priceMatch && locationMatch && typeMatch && verifiedMatch && organicMatch;
  }).sort((a, b) => {
    switch(filters.sortBy) {
      case 'popular':
        return (b.totalReviews || 0) - (a.totalReviews || 0);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'newest':
      default:
        return (b.id || 0) - (a.id || 0);
    }
  });

  // Count active filters
  const activeFilterCount = Object.entries(filters).filter(([key, val]) => {
    if (key === 'sortBy') return false;
    if (key === 'priceRange') return val[0] !== 0 || val[1] !== 1000;
    if (key === 'verifiedFarmersOnly' || key === 'organicOnly') return val === true;
    return val !== '';
  }).length;

  const toggleWishlist = (crop) => {
    if (isInWishlist(crop.id)) {
      removeFromWishlist(crop.id);
      showToast(`Removed from wishlist`, 'info');
    } else {
      addToWishlist(crop);
      showToast(`❤️ Added to wishlist`, 'success');
    }
  };

  const handleViewCrop = (cropId) => {
    navigate(`/crop/${cropId}`);
  };

  const handleAddToCart = (crop, quantity = 1) => {
    addToCart(crop, quantity);
    showToast(`✅ ${quantity}x ${crop.name} added to cart!`, 'success');
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-white py-6 px-4 relative">
        <div className="absolute inset-0 premium-gradient pointer-events-none"></div>
        
        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 animate-slide-in-right ${
            toast.type === 'success' ? 'bg-green-500' :
            toast.type === 'error' ? 'bg-red-500' :
            'bg-blue-500'
          } text-white font-medium flex items-center gap-2`}>
            {toast.message}
          </div>
        )}
        
        <div className="max-w-7xl mx-auto relative z-10">
          
          {/* Main Header */}
          <ScrollAnimation className="scroll-slide mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 animate-slide-in-left mb-1">Fresh Produce Marketplace</h1>
              <p className="text-gray-600 text-lg flex items-center gap-2">
                <span className="text-2xl">💡</span>
                Browse premium crops at the best prices. <strong>Login only when placing an order.</strong>
              </p>
              
              {/* Trust Badges */}
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-xl">👨‍🌾</span>
                  <div>
                    <p className="font-bold text-gray-900">{marketplaceStats.farmers}+</p>
                    <p className="text-xs text-gray-600">Verified Farmers</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-xl">🛒</span>
                  <div>
                    <p className="font-bold text-gray-900">{marketplaceStats.products}+</p>
                    <p className="text-xs text-gray-600">Fresh Products</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 rounded-lg border border-yellow-200">
                  <span className="text-xl">⭐</span>
                  <div>
                    <p className="font-bold text-gray-900">{marketplaceStats.reviews}+</p>
                    <p className="text-xs text-gray-600">Customer Reviews</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollAnimation>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-3">
            {/* Advanced Filter Panel */}
            <FilterPanel
              cropTypes={cropTypes}
              locations={locations}
              priceRange={[0, 1000]}
              currentFilters={filters}
              onFilterChange={setFilters}
              onReset={() => setFilters({ 
                cropType: '', 
                priceRange: [0, 1000], 
                location: '',
                verifiedFarmersOnly: false,
                organicOnly: false,
                sortBy: 'newest'
              })}
              mobileCollapsed={false}
            />

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Recently Viewed Carousel */}
              <RecentlyViewedCarousel />
              
              {/* Error State */}
              {error && (
                <Card variant="warning" className="mb-6 animate-slide-in-down">
                  <div className="p-4 flex items-center gap-3">
                    <AlertCircle size={24} className="text-amber-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Unable to load crops</p>
                      <p className="text-gray-600 text-sm">{error}</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Loading State */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader size={48} className="text-green-600 animate-spin mb-4" />
                  <p className="text-gray-600 text-lg font-semibold">Loading fresh crops...</p>
                  <p className="text-gray-500 text-sm mt-2">Finding the best produce for you</p>
                </div>
              ) : (
                <>
                  {/* Sorting & Filters Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-green-50 rounded-lg border border-green-200 animate-slide-in-down">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-700">Sort by:</span>
                      <select
                        value={filters.sortBy}
                        onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                        className="px-3 py-2 rounded-lg border border-green-300 bg-white text-gray-700 font-medium cursor-pointer hover:border-green-500 transition-colors"
                      >
                        {sortOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Active Filters Badge */}
                    {activeFilterCount > 0 && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-green-100 rounded-lg border border-green-300 animate-bounce-soft">
                        <span className="text-sm font-semibold text-green-700">🎯 {activeFilterCount} active</span>
                        <button 
                          onClick={() => setFilters({ 
                            cropType: '', 
                            priceRange: [0, 1000], 
                            location: '',
                            verifiedFarmersOnly: false,
                            organicOnly: false,
                            sortBy: 'newest'
                          })}
                          className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-semibold"
                        >
                          Clear All
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Results Count */}
                  <p className="text-gray-600 mb-6 animate-fade-in font-semibold">
                    ✅ Showing {filteredCrops.length} fresh crops
                  </p>

                  {/* Crops Grid */}
                  {filteredCrops.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredCrops.map((crop, index) => (
                        <CropCard
                          key={crop.id}
                          crop={crop}
                          isFavorite={isInWishlist(crop.id)}
                          onToggleFavorite={() => toggleWishlist(crop)}
                          onViewCrop={() => handleViewCrop(crop.id)}
                          onAddToCart={() => handleAddToCart(crop)}
                          index={index}
                        />
                      ))}
                    </div>
                  ) : (
                    <Card animated={false} className="animate-fade-in">
                      <div className="p-12 text-center">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No crops found</h3>
                        <p className="text-gray-600 mb-4">Try adjusting your filters or browse all crops</p>
                        <Button
                          variant="primary"
                          onClick={() => setFilters({ cropType: '', priceRange: [0, 1000], location: '' })}
                        >
                          Reset Filters
                        </Button>
                      </div>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

// Enhanced Crop Card Component - Clean Design
function CropCard({ crop, isFavorite, onToggleFavorite, onViewCrop, onAddToCart, index }) {
  const staggerDelay = index * 0.08;
  const availableQty = crop.quantity || 100;

  return (
    <Card 
      hover 
      animated={true}
      className="crop-card stagger-item"
      style={{ 
        animationDelay: `${staggerDelay}s`,
        '--card-delay': staggerDelay
      }}
    >
      <div className="p-4 relative group flex flex-col h-full">
        {/* Dark Background Image Section */}
        <div className="relative mb-4 overflow-hidden rounded-lg group -m-4 mb-4 bg-gradient-to-br from-slate-800 to-slate-900 min-h-48 flex items-center justify-center cursor-pointer"
             onClick={onViewCrop}>
          {crop.image && crop.image.startsWith('http') ? (
            <img
              src={crop.image}
              alt={crop.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={(e) => e.target.style.display = 'none'}
            />
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full">
              <span className="text-7xl animate-bounce-soft group-hover:scale-110 transition-transform duration-300">
                {crop.image || '🌾'}
              </span>
            </div>
          )}
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300"></div>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-2 z-10">
            {crop.farmer_verified && (
              <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <Check size={12} /> Verified
              </div>
            )}
          </div>

          {/* Wishlist Button */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={`absolute top-2 right-2 transition-all duration-300 z-20 p-2 rounded-full ${
              isFavorite 
                ? 'bg-red-500 text-white' 
                : 'bg-white/80 hover:bg-white text-gray-600'
            }`}
          >
            <Heart 
              size={20} 
              fill={isFavorite ? 'currentColor' : 'none'}
            />
          </button>
        </div>

        {/* Content Section */}
        <div className="space-y-3 flex-1 flex flex-col">
          {/* Product Name */}
          <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
            {crop.name}
          </h3>
          
          {/* Farmer Badge */}
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {crop.farmerName?.[0]?.toUpperCase() || 'F'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate">
                {crop.farmerName || 'Farmer'}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin size={12} /> {crop.location || 'Location'}
              </p>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 text-sm">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <span key={i}>
                  {i < Math.floor(crop.rating || 4) ? '⭐' : '☆'}
                </span>
              ))}
            </div>
            <span className="text-gray-600 text-xs">({crop.totalReviews || 0})</span>
          </div>

          {/* Price Box */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
            <p className="text-xs text-gray-600 font-medium">Price per {crop.unit || 'kg'}</p>
            <p className="text-2xl font-bold text-green-700 mt-1">₹{Math.floor(crop.price)}</p>
          </div>

          {/* Stock Status */}
          <div className={`text-xs font-bold rounded-lg p-2 text-center ${
            availableQty > 20 
              ? 'bg-green-100 text-green-700' 
              : availableQty > 5 
              ? 'bg-yellow-100 text-yellow-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {availableQty > 20 ? '✅ In Stock' : availableQty > 0 ? '⚠️ Limited' : '❌ Out of Stock'}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3 border-t border-gray-200 mt-auto">
            <button
              onClick={() => onAddToCart(crop)}
              disabled={availableQty <= 0}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm"
            >
              <ShoppingCart size={16} className="inline mr-1" /> Add
            </button>
            <button
              onClick={onViewCrop}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-3 rounded-lg transition-colors text-sm"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
