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
  const { isAuthenticated } = useAuth();
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
      <div className="min-h-screen bg-linear-to-br from-white via-green-50 to-white py-6 px-4 relative">
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

// Enhanced Crop Card Component with Quick-Add Overlay
function CropCard({ crop, isFavorite, onToggleFavorite, onViewCrop, onAddToCart, index }) {
  const [quantity, setQuantity] = useState(1);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const staggerDelay = index * 0.08;
  const availableQty = crop.quantity || 100;

  const handleQuickAdd = () => {
    onAddToCart(crop, quantity);
    setShowQuickAdd(false);
    setQuantity(1);
  };

  return (
    <Card 
      hover 
      animated={true}
      className="crop-card stagger-item relative"
      style={{ 
        animationDelay: `${staggerDelay}s`,
        '--card-delay': staggerDelay
      }}
    >
      <div className="p-4 relative group">
        {/* Image Section */}
        <div className="relative mb-4 overflow-hidden rounded-lg group">
          <div className="bg-linear-to-br from-green-100 to-emerald-100 rounded-lg relative min-h-48 flex items-center justify-center group-hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer"
               onClick={() => setShowQuickAdd(true)}>
            {crop.image && crop.image.startsWith('http') ? (
              // Real image from Cloudinary or external URL
              <img
                src={crop.image}
                alt={crop.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              // Fallback: emoji or placeholder
              <span className="text-6xl animate-bounce-soft group-hover:scale-110 transition-transform duration-300">
                {crop.image || '🌾'}
              </span>
            )}
            
            {/* Quick-Add Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
              <div className="bg-white rounded-lg shadow-xl p-4 w-4/5 max-w-xs animate-scale-in pointer-events-auto">
                <h4 className="font-bold text-gray-900 mb-3 text-center text-sm">{crop.name}</h4>
                
                {/* Quantity Selector */}
                <div className="mb-4 flex justify-center">
                  <QuantitySelector
                    quantity={quantity}
                    onQuantityChange={setQuantity}
                    min={1}
                    max={Math.min(availableQty, 100)}
                    size="sm"
                  />
                </div>

                {/* Price Info */}
                <p className="text-center text-green-600 font-bold text-lg mb-3">
                  ₹{(crop.price * quantity).toFixed(2)}
                </p>

                {/* Quick Add Button */}
                <button
                  onClick={handleQuickAdd}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 mb-2"
                >
                  <ShoppingCart size={16} /> Add to Cart
                </button>

                {/* View Details Link */}
                <button
                  onClick={onViewCrop}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
                >
                  View Details
                </button>
              </div>
            </div>

            {/* Animated overlay on hover */}
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"></div>
          </div>
          
          {/* Wishlist Button with Heart Animation */}
          <button 
            onClick={onToggleFavorite}
            className={`absolute top-4 right-4 transition-all duration-300 z-20 hover-scale ${
              isFavorite 
                ? 'text-red-600 animate-scale-in' 
                : 'text-gray-400 hover:text-red-600'
            }`}
            title={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart 
              size={24} 
              fill={isFavorite ? 'currentColor' : 'none'}
              className={isFavorite ? 'animate-pulse-soft' : ''}
            />
          </button>

          {/* Product Badges */}
          <div className="absolute top-4 left-4 flex gap-2 z-10">
            {calculateBadges(crop).map((badgeType) => (
              <ProductBadge key={badgeType} badgeType={badgeType} />
            ))}
          </div>

          {/* Verified Badge with Bounce */}
          {crop.farmer_verified && (
            <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-white px-2 py-1 rounded-full text-xs font-semibold text-green-600 shadow-md animate-bounce-up hover:shadow-lg transition-shadow z-10">
              <CheckCircle size={14} className="text-green-600" /> Verified
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="space-y-3">
          <div className="animate-slide-in-left" style={{ animationDelay: `${staggerDelay + 0.1}s` }}>
            <h3 className="font-bold text-lg text-gray-900 mb-1">{crop.name}</h3>
            <p className="text-gray-600 text-sm">{crop.description || 'Fresh from farm'}</p>
          </div>

          {/* Price with Animation */}
          <div className="flex items-baseline gap-2 animate-slide-in-left" style={{ animationDelay: `${staggerDelay + 0.15}s` }}>
            <p className="text-green-600 font-bold text-2xl group-hover:text-green-700 transition-colors">₹{crop.price}</p>
            <p className="text-gray-600 text-sm">/kg</p>
          </div>

          {/* Stats with Hover Effects */}
          <div className="grid grid-cols-3 gap-2 text-sm animate-slide-in-left" style={{ animationDelay: `${staggerDelay + 0.2}s` }}>
            <div className="bg-blue-50 p-2 rounded text-center group-hover:bg-blue-100 transition-colors">
              <p className="text-gray-600 text-xs">Available</p>
              <p className="font-bold text-gray-900">{crop.quantity || 10} kg</p>
            </div>
            <div className="bg-yellow-50 p-2 rounded text-center group-hover:bg-yellow-100 transition-colors">
              <p className="text-gray-600 text-xs">Rating</p>
              <p className="font-bold text-yellow-600">⭐ {crop.rating || 4.5}</p>
            </div>
            <div className="bg-purple-50 p-2 rounded text-center group-hover:bg-purple-100 transition-colors">
              <p className="text-gray-600 text-xs">Reviews</p>
              <p className="font-bold text-purple-600">{crop.totalReviews || 0}</p>
            </div>
          </div>

          {/* Location */}
          <p className="text-gray-600 text-sm flex items-center gap-1 animate-slide-in-left" style={{ animationDelay: `${staggerDelay + 0.25}s` }}>
            <MapPin size={14} className="text-green-600" /> {crop.location || 'Farm Location'}
          </p>

          {/* Farmer Info */}
          <div className="animate-slide-in-left" style={{ animationDelay: `${staggerDelay + 0.3}s` }}>
            <FarmerBadge 
              farmer={crop.farmer}
              compact={true}
            />
          </div>

          {/* Action Buttons with Animations */}
          <div className="space-y-2 pt-2 animate-slide-in-left" style={{ animationDelay: `${staggerDelay + 0.35}s` }}>
            <Button 
              variant="primary" 
              size="sm" 
              className="w-full hidden md:flex items-center justify-center gap-2 hover-scale"
              onClick={() => setShowQuickAdd(true)}
            >
              <ShoppingCart size={16} /> Quick Add
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              className="w-full flex md:hidden items-center justify-center gap-2 hover-scale"
              onClick={() => setShowQuickAdd(true)}
            >
              <ShoppingCart size={16} /> Add to Cart
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full flex items-center justify-center gap-2 hover-scale"
              onClick={onViewCrop}
            >
              👁️ View Details
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
