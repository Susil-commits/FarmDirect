import { useState, useEffect } from 'react';
import { MapPin, Heart, Filter, ShoppingCart, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import FilterPanel from '../components/FilterPanel';
import PageTransition from '../components/common/PageTransition.jsx';
import ScrollAnimation from '../components/common/ScrollAnimation';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { cropService } from '../services/appService';
import '../styles/Marketplace.css';

export default function Marketplace() {
  const { navigate } = useRouter();
  const { isAuthenticated } = useAuth();
  const { wishlist, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const [filters, setFilters] = useState({
    cropType: '',
    priceRange: [0, 1000],
    location: '',
  });
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const locations = ['Punjab', 'Himachal', 'Haryana', 'Karnataka', 'Maharashtra', 'Uttar Pradesh', 'Delhi', 'West Bengal'];
  const cropTypes = ['Vegetables', 'Fruits', 'Grains', 'Herbs', 'Organic'];

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
    return priceMatch && locationMatch && typeMatch;
  });

  const toggleWishlist = (crop) => {
    if (isInWishlist(crop.id)) {
      removeFromWishlist(crop.id);
    } else {
      addToWishlist(crop);
    }
  };

  const handleViewCrop = (cropId) => {
    navigate(`/crop/${cropId}`);
  };

  const handleAddToCart = (crop) => {
    // Cart context will handle this
    navigate(`/crop/${crop.id}`);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-linear-to-br from-white via-green-50 to-white py-6 px-4 relative">
        <div className="absolute inset-0 premium-gradient pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          
          {/* Main Header */}
          <ScrollAnimation className="scroll-slide mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 animate-slide-in-left mb-1">Fresh Produce Marketplace</h1>
              <p className="text-gray-600 text-lg flex items-center gap-2">
                <span className="text-2xl">💡</span>
                Browse premium crops at the best prices. <strong>Login only when placing an order.</strong>
              </p>
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
              onReset={() => setFilters({ cropType: '', priceRange: [0, 1000], location: '' })}
              mobileCollapsed={false}
            />

            {/* Main Content */}
            <div className="lg:col-span-3">
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

// Improved Crop Card Component with Enhanced Animations
function CropCard({ crop, isFavorite, onToggleFavorite, onViewCrop, onAddToCart, index }) {
  const staggerDelay = index * 0.08; // Increased stagger for better effect

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
      <div className="p-4 relative group">
        {/* Image Section */}
        <div className="relative mb-4 overflow-hidden rounded-lg">
          <div className="bg-linear-to-br from-green-100 to-emerald-100 rounded-lg p-6 text-center relative min-h-40 flex items-center justify-center group-hover:shadow-lg transition-shadow duration-300">
            <span className="text-6xl animate-bounce-soft group-hover:scale-110 transition-transform duration-300">{crop.image || '🌾'}</span>
            {/* Animated overlay on hover */}
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
          </div>
          
          {/* Wishlist Button with Heart Animation */}
          <button 
            onClick={onToggleFavorite}
            className={`absolute top-4 right-4 transition-all duration-300 z-10 hover-scale ${
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

          {/* Verified Badge with Bounce */}
          {crop.farmer_verified && (
            <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-white px-2 py-1 rounded-full text-xs font-semibold text-green-600 shadow-md animate-bounce-up hover:shadow-lg transition-shadow">
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
          <div className="grid grid-cols-2 gap-2 text-sm animate-slide-in-left" style={{ animationDelay: `${staggerDelay + 0.2}s` }}>
            <div className="bg-blue-50 p-2 rounded text-center group-hover:bg-blue-100 transition-colors">
              <p className="text-gray-600 text-xs">Available</p>
              <p className="font-bold text-gray-900">{crop.quantity} kg</p>
            </div>
            <div className="bg-yellow-50 p-2 rounded text-center group-hover:bg-yellow-100 transition-colors">
              <p className="text-gray-600 text-xs">Rating</p>
              <p className="font-bold text-yellow-600">⭐ {crop.rating || 4.5}</p>
            </div>
          </div>

          {/* Location */}
          <p className="text-gray-600 text-sm flex items-center gap-1 animate-slide-in-left" style={{ animationDelay: `${staggerDelay + 0.25}s` }}>
            <MapPin size={14} className="text-green-600" /> {crop.location || 'Farm Location'}
          </p>

          {/* Farmer Info */}
          <div className="bg-green-50 p-2 rounded text-sm group-hover:bg-green-100 transition-colors animate-slide-in-left" style={{ animationDelay: `${staggerDelay + 0.3}s` }}>
            <p className="text-gray-700">
              <strong>👨‍🌾</strong> {crop.farmer || 'Local Farmer'}
            </p>
          </div>

          {/* Action Buttons with Animations */}
          <div className="space-y-2 pt-2 animate-slide-in-left" style={{ animationDelay: `${staggerDelay + 0.35}s` }}>
            <Button 
              variant="primary" 
              size="sm" 
              className="w-full flex items-center justify-center gap-2 hover-scale"
              onClick={onViewCrop}
            >
              👁️ View Details
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full flex items-center justify-center gap-2 hover-scale"
              onClick={onAddToCart}
            >
              <ShoppingCart size={16} /> Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
