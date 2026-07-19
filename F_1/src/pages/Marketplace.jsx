import { useState, useEffect } from 'react';
import { MapPin, Heart, Filter, Loader, AlertCircle, Check, TrendingUp, Star, Search, X, SlidersHorizontal, Flame, ShoppingCart, Eye } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import RecentlyViewedCarousel from '../components/RecentlyViewedCarousel';
import FilterPanel from '../components/FilterPanel';
import PageTransition from '../components/common/PageTransition.jsx';
import ScrollAnimation from '../components/common/ScrollAnimation';
import { useRouter } from '../context/RouterContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { cropService } from '../services/appService';
import { getImageUrl } from '../utils/formatters';
import '../styles/Marketplace.css';

const QUICK_CATEGORIES = [
  { id: 'vegetables', label: 'Vegetables', icon: '🥬', color: 'from-green-400 to-emerald-500' },
  { id: 'fruits', label: 'Fruits', icon: '🍎', color: 'from-red-400 to-orange-500' },
  { id: 'grains', label: 'Grains', icon: '🌾', color: 'from-amber-400 to-yellow-500' },
  { id: 'herbs', label: 'Herbs', icon: '🌿', color: 'from-teal-400 to-cyan-500' },
  { id: 'other', label: 'Other', icon: '🌽', color: 'from-purple-400 to-pink-500' },
];

export default function Marketplace() {
  const { navigate } = useRouter();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToast } = useToast();
  const { addToCart } = useCart();

  const [filters, setFilters] = useState({
    cropType: '',
    priceRange: [0, 1000],
    location: '',
    verifiedFarmersOnly: false,
    organicOnly: false,
    sortBy: 'newest'
  });
  const [crops, setCrops] = useState([]);
  const [trendingCrops, setTrendingCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quickCategory, setQuickCategory] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [quickViewCrop, setQuickViewCrop] = useState(null);

  const locations = ['Punjab', 'Himachal', 'Haryana', 'Karnataka', 'Maharashtra', 'Uttar Pradesh', 'Delhi', 'West Bengal'];
  const cropTypes = ['vegetables', 'fruits', 'grains', 'herbs', 'other'];
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
    // Fetch trending crops once on mount (independent of active filters)
    cropService.getTrendingCrops(4).then((res) => {
      setTrendingCrops(res.crops || res.data?.crops || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchCrops = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await cropService.getAllCrops({
          category: filters.cropType || quickCategory || undefined,
          minPrice: filters.priceRange[0],
          maxPrice: filters.priceRange[1],
          location: filters.location || undefined,
        });
        setCrops(response.crops || response.data?.crops || []);
      } catch (err) {
        console.error('Failed to fetch crops:', err);
        setError('Unable to load crops. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchCrops();
  }, [filters, quickCategory]);

  const filteredCrops = crops.filter(crop => {
    const priceMatch = crop.price >= filters.priceRange[0] && crop.price <= filters.priceRange[1];
    const locationMatch = !filters.location || crop.location === filters.location || crop.pickupLocation === filters.location;
    const typeMatch = !filters.cropType || crop.category === filters.cropType || crop.cropType === filters.cropType;
    const verifiedMatch = !filters.verifiedFarmersOnly || crop.farmer_verified;
    const organicMatch = !filters.organicOnly || crop.certifications?.includes('Organic') || crop.category === 'Organic';
    return priceMatch && locationMatch && typeMatch && verifiedMatch && organicMatch;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'popular': return (b.totalReviews || 0) - (a.totalReviews || 0);
      case 'rating': return (b.rating || 0) - (a.rating || 0);
      case 'price-low': return a.price - b.price;
      case 'price-high': return b.price - a.price;
      case 'newest':
      default: return (b.id || 0) - (a.id || 0);
    }
  });

  const activeFilterCount = Object.entries(filters).filter(([key, val]) => {
    if (key === 'sortBy') return false;
    if (key === 'priceRange') return val[0] !== 0 || val[1] !== 1000;
    if (key === 'verifiedFarmersOnly' || key === 'organicOnly') return val === true;
    return val !== '';
  }).length;

  const handleQuickCategory = (catId) => {
    if (quickCategory === catId) {
      setQuickCategory('');
      setFilters(prev => ({ ...prev, cropType: '' }));
    } else {
      setQuickCategory(catId);
      setFilters(prev => ({ ...prev, cropType: '' }));
    }
  };

  const toggleWishlist = (crop) => {
    const cropId = crop._id || crop.id;
    if (isInWishlist(cropId)) {
      removeFromWishlist(cropId);
      addToast('Removed from wishlist', 'info');
    } else {
      addToWishlist(crop);
      addToast('Added to wishlist', 'success');
    }
  };

  const handleQuickAddToCart = (crop, e) => {
    e.stopPropagation();
    const cartProduct = {
      _id: crop._id,
      id: crop._id,
      cropName: crop.cropName || crop.name,
      cropType: crop.cropType || crop.category,
      category: crop.category,
      price: crop.price,
      unit: crop.unit || 'kg',
      images: crop.images || [],
      farmerId: crop.farmerId,
      pickupLocation: crop.pickupLocation,
      description: crop.description,
      status: crop.status,
      farmerName: crop.farmerName || '',
      quantity: crop.quantity,
    };
    addToCart(cartProduct, 1);
    addToast(`${cartProduct.cropName} added to cart`, 'success');
  };

  const handleViewCrop = (cropId) => {
    navigate(`/crop/${cropId}`);
  };

  const resetFilters = () => {
    setFilters({ cropType: '', priceRange: [0, 1000], location: '', verifiedFarmersOnly: false, organicOnly: false, sortBy: 'newest' });
    setQuickCategory('');
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <ScrollAnimation className="scroll-slide">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                  Fresh Produce <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">Marketplace</span>
                </h1>
                <p className="text-gray-500 mt-2 text-lg">Direct from farms. Zero middlemen. Fair prices.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 font-semibold hover:border-green-300 transition shadow-sm"
                >
                  <SlidersHorizontal size={18} />
                  Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                </button>
              </div>
            </div>
          </ScrollAnimation>

          <ScrollAnimation className="scroll-slide">
            <div className="flex flex-wrap gap-2 mb-8">
              <button
                onClick={() => { setQuickCategory(''); setFilters(prev => ({ ...prev, cropType: '' })); }}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  !quickCategory && !filters.cropType
                    ? 'bg-green-600 text-white shadow-lg shadow-green-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-green-300 hover:text-green-600'
                }`}
              >
                All
              </button>
              {QUICK_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleQuickCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                    quickCategory === cat.id || filters.cropType === cat.id
                      ? 'bg-green-600 text-white shadow-lg shadow-green-200'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-green-300 hover:text-green-600'
                  }`}
                >
                  <span>{cat.icon}</span> {cat.label}
                </button>
              ))}
            </div>
          </ScrollAnimation>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className={`${showMobileFilters ? 'block' : 'hidden'} lg:block`}>
              <FilterPanel
                cropTypes={cropTypes}
                locations={locations}
                priceRange={[0, 1000]}
                currentFilters={filters}
                onFilterChange={setFilters}
                onReset={resetFilters}
                mobileCollapsed={false}
              />
            </div>

            <div className="lg:col-span-3">
              <RecentlyViewedCarousel />

              {error && (
                <Card variant="warning" className="mb-6">
                  <div className="p-4 flex items-center gap-3">
                    <AlertCircle size={24} className="text-amber-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Unable to load crops</p>
                      <p className="text-gray-600 text-sm">{error}</p>
                    </div>
                  </div>
                </Card>
              )}

              {loading ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                        <div className="h-48 bg-gray-200" />
                        <div className="p-5 space-y-3">
                          <div className="h-5 bg-gray-200 rounded w-3/4" />
                          <div className="h-4 bg-gray-200 rounded w-1/2" />
                          <div className="h-10 bg-gray-200 rounded w-full mt-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {trendingCrops.length > 0 && !quickCategory && !filters.cropType && (
                    <div className="mb-10">
                      <div className="flex items-center gap-2 mb-4">
                        <Flame size={20} className="text-orange-500" />
                        <h2 className="text-xl font-bold text-gray-900">Trending Now</h2>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        {trendingCrops.map((crop, index) => (
                          <TrendingCard
                            key={crop._id || crop.id}
                            crop={crop}
                            index={index}
                            onView={() => handleViewCrop(crop._id || crop.id)}
                            onToggleWishlist={() => toggleWishlist(crop)}
                            isFavorite={isInWishlist(crop._id || crop.id)}
                            onQuickAdd={(e) => handleQuickAddToCart(crop, e)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-500">Sort:</span>
                      <select
                        value={filters.sortBy}
                        onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                        className="px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 font-semibold cursor-pointer hover:border-green-300 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                      >
                        {sortOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-3">
                      {activeFilterCount > 0 && (
                        <button onClick={resetFilters} className="text-sm text-red-500 hover:text-red-600 font-semibold flex items-center gap-1">
                          <X size={14} /> Clear ({activeFilterCount})
                        </button>
                      )}
                      <span className="text-sm text-gray-500 font-semibold">
                        {filteredCrops.length} crops found
                      </span>
                    </div>
                  </div>

                  {filteredCrops.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredCrops.map((crop, index) => (
                        <CropCardEnhanced
                          key={crop._id || crop.id}
                          crop={crop}
                          isFavorite={isInWishlist(crop._id || crop.id)}
                          onToggleFavorite={() => toggleWishlist(crop)}
                          onViewCrop={() => handleViewCrop(crop._id || crop.id)}
                          onQuickAdd={(e) => handleQuickAddToCart(crop, e)}
                          index={index}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                      <div className="text-6xl mb-4">🔍</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">No crops found</h3>
                      <p className="text-gray-500 mb-6">Try adjusting your filters or browse all crops</p>
                      <Button variant="primary" onClick={resetFilters}>Reset Filters</Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {quickViewCrop && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setQuickViewCrop(null)}>
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">{quickViewCrop.cropName || quickViewCrop.name}</h3>
                <button onClick={() => setQuickViewCrop(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              <div className="h-48 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl mb-4 flex items-center justify-center">
                {quickViewCrop.images?.[0] ? (
                  <img src={getImageUrl(quickViewCrop.images[0])} alt={quickViewCrop.cropName || 'Crop image'} className="w-full h-full object-cover rounded-xl" loading="lazy" />
                ) : (
                  <span className="text-7xl">🌾</span>
                )}
              </div>
              <p className="text-2xl font-bold text-green-600 mb-2">₹{quickViewCrop.price}/{quickViewCrop.unit || 'kg'}</p>
              <p className="text-gray-600 text-sm mb-4">{quickViewCrop.description?.slice(0, 120)}...</p>
              <div className="flex gap-2">
                <button onClick={() => { setQuickViewCrop(null); handleViewCrop(quickViewCrop._id || quickViewCrop.id); }} className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition">
                  View Details
                </button>
                <button onClick={(e) => { setQuickViewCrop(null); handleQuickAddToCart(quickViewCrop, e); }} className="px-4 py-2.5 bg-green-100 text-green-700 rounded-xl font-bold hover:bg-green-200 transition">
                  <ShoppingCart size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

function TrendingCard({ crop, onView, onToggleWishlist, isFavorite, onQuickAdd }) {
  const [imgError, setImgError] = useState(false);
  const cropImage = crop.images?.[0] || crop.image;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100" onClick={onView}>
      <div className="relative h-36 bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center overflow-hidden">
        {cropImage && !imgError ? (
          <img src={getImageUrl(cropImage)} alt={crop.cropName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" onError={() => setImgError(true)} />
        ) : (
          <span className="text-5xl group-hover:scale-110 transition-transform duration-300">🌾</span>
        )}
        <button onClick={(e) => { e.stopPropagation(); onToggleWishlist(); }} className={`absolute top-2 right-2 p-2 rounded-full transition-all ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-500 hover:bg-white'}`}>
          <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
        <div className="absolute top-2 left-2">
          <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
            <TrendingUp size={10} /> Trending
          </span>
        </div>
      </div>
      <div className="p-3">
        <h4 className="font-bold text-gray-900 text-sm truncate">{crop.cropName || crop.name}</h4>
        <div className="flex items-center justify-between mt-1">
          <p className="text-green-600 font-bold">₹{crop.price}/{crop.unit || 'kg'}</p>
          <div className="flex items-center gap-0.5 text-yellow-400 text-xs">
            <Star size={12} fill="currentColor" />
            <span className="text-gray-600">{crop.rating || 4}</span>
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onQuickAdd(e); }} className="w-full mt-2 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1">
          <ShoppingCart size={12} /> Quick Add
        </button>
      </div>
    </div>
  );
}

function CropCardEnhanced({ crop, isFavorite, onToggleFavorite, onViewCrop, onQuickAdd, index }) {
  const [imgError, setImgError] = useState(false);
  const cropImage = crop.images?.[0] || crop.image;
  const staggerDelay = index * 0.06;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col" style={{ animationDelay: `${staggerDelay}s` }}>
      <div className="relative h-52 bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center overflow-hidden cursor-pointer" onClick={onViewCrop}>
        {cropImage && !imgError ? (
          <img src={getImageUrl(cropImage)} alt={crop.cropName || crop.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" onError={() => setImgError(true)} />
        ) : (
          <span className="text-7xl group-hover:scale-110 transition-transform duration-300">🌾</span>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {crop.farmer_verified && (
            <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
              <Check size={10} /> Verified
            </span>
          )}
          {crop.cropType && (
            <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full capitalize">{crop.cropType}</span>
          )}
        </div>
        <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }} className={`absolute top-3 right-3 p-2 rounded-full transition-all z-10 ${isFavorite ? 'bg-red-500 text-white shadow-lg' : 'bg-white/80 text-gray-500 hover:bg-white hover:shadow-md'}`}>
          <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button onClick={(e) => { e.stopPropagation(); onViewCrop(); }} className="w-full px-4 py-2 bg-white text-gray-900 rounded-lg font-bold text-sm hover:bg-green-50 transition flex items-center justify-center gap-2">
            <Eye size={16} /> Quick View
          </button>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-1">{crop.cropName || crop.name}</h3>

        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {crop.farmerName?.[0]?.toUpperCase() || 'F'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-700 truncate">{crop.farmerName || 'Farmer'}</p>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <MapPin size={10} /> {crop.pickupLocation || crop.location || 'Location'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex text-yellow-400 text-sm">
            {[...Array(5)].map((_, i) => (
              <span key={i}>{i < Math.floor(crop.rating || 4) ? '★' : '☆'}</span>
            ))}
          </div>
          <span className="text-xs text-gray-400">({crop.totalReviews || 0})</span>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 mb-3 border border-green-100">
          <p className="text-xs text-gray-500 mb-0.5">Price per {crop.unit || 'kg'}</p>
          <p className="text-2xl font-extrabold text-green-700">₹{Math.floor(crop.price)}</p>
        </div>

        <div className="flex gap-2 mt-auto pt-3 border-t border-gray-100">
          <button onClick={onViewCrop} className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition text-sm">
            View Details
          </button>
          <button onClick={onQuickAdd} className="px-4 py-2.5 bg-green-50 hover:bg-green-100 text-green-700 font-bold rounded-xl transition text-sm flex items-center gap-1.5">
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}