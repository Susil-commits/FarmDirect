import { useState, useEffect } from 'react';
import { MapPin, Heart, Filter, Loader, AlertCircle, Check, TrendingUp, Star, Search, X, SlidersHorizontal, Flame, ShoppingCart, Eye, Mic, MicOff } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import RecentlyViewedCarousel from '../components/RecentlyViewedCarousel';
import FilterPanel from '../components/FilterPanel';
import PageTransition from '../components/common/PageTransition.jsx';
import ScrollAnimation from '../components/common/ScrollAnimation';
import SkeletonLoader from '../components/common/SkeletonLoader';
import ErrorBoundary from '../components/common/ErrorBoundary';
import TiltCard from '../components/common/TiltCard';
import LiveActivityTicker from '../components/common/LiveActivityTicker';
import { useRouter } from '../context/RouterContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { cropService } from '../services/appService';
import { getImageUrl, getCropFallbackImage } from '../utils/formatters';
import { useVoiceSearch } from '../hooks/useVoiceSearch';
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
    sortBy: 'newest',
    searchQuery: ''
  });
  const [crops, setCrops] = useState([]);
  const [trendingCrops, setTrendingCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quickCategory, setQuickCategory] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [quickViewCrop, setQuickViewCrop] = useState(null);

  const { isListening, supported, startListening, stopListening } = useVoiceSearch((text) => {
    setFilters(prev => ({ ...prev, searchQuery: text }));
    addToast('Voice recognized: ' + text, 'info');
  });

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
    const searchMatch = !filters.searchQuery || crop.cropName?.toLowerCase().includes(filters.searchQuery.toLowerCase()) || crop.description?.toLowerCase().includes(filters.searchQuery.toLowerCase());
    return priceMatch && locationMatch && typeMatch && verifiedMatch && organicMatch && searchMatch;
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
    setFilters({ cropType: '', priceRange: [0, 1000], location: '', verifiedFarmersOnly: false, organicOnly: false, sortBy: 'newest', searchQuery: '' });
    setQuickCategory('');
  };

  return (
    <ErrorBoundary>
    <PageTransition>
      <div className="min-h-screen bg-[#FBF8F3] pt-28 pb-16 font-sans-body">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <ScrollAnimation className="scroll-slide">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100/80 px-3 py-1 rounded-full mb-3 inline-block">
                  Direct Harvest Marketplace
                </span>
                <h1 className="text-4xl sm:text-5xl font-serif-display font-extrabold text-[#132E20] tracking-tight">
                  Fresh Produce <span className="text-[#D97736]">Marketplace</span>
                </h1>
                <p className="text-stone-600 mt-2 text-base sm:text-lg max-w-xl">
                  Buy directly from verified local farmers. Transparent pricing, zero middleman markups.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden flex items-center gap-2 px-5 py-3 bg-white border border-stone-200 rounded-xl text-[#132E20] font-bold hover:border-emerald-500 transition shadow-sm cursor-pointer min-h-[44px]"
                >
                  <SlidersHorizontal size={18} className="text-emerald-600" />
                  Filters {activeFilterCount > 0 && <span className="bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-full">{activeFilterCount}</span>}
                </button>
              </div>
            </div>

            {/* Smart Search Bar */}
            <div className="mb-8 relative max-w-2xl">
              <div className="relative group">
                <div className={`absolute inset-0 bg-emerald-500/20 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity ${isListening ? 'animate-pulse opacity-70' : ''}`}></div>
                <div className="relative flex items-center bg-white border border-stone-200/90 rounded-2xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent transition-all">
                  <Search className="text-stone-400 ml-3 mr-2" size={22} />
                  <input
                    type="text"
                    placeholder="Search organic tomatoes, basmati rice, apples..."
                    value={filters.searchQuery}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                    className="flex-1 bg-transparent border-none focus:outline-none text-stone-800 placeholder-stone-400 py-2.5 text-base"
                  />
                  {filters.searchQuery && (
                    <button onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))} className="p-2 text-stone-400 hover:text-stone-600 transition cursor-pointer">
                      <X size={18} />
                    </button>
                  )}
                  {supported && (
                    <button
                      onClick={isListening ? stopListening : startListening}
                      className={`p-3 rounded-xl ml-1 transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center ${isListening ? 'bg-red-100 text-red-600' : 'bg-stone-100 text-stone-600 hover:bg-emerald-100 hover:text-emerald-700'}`}
                      title={isListening ? "Stop listening" : "Voice Search"}
                    >
                      {isListening ? <MicOff size={20} className="animate-pulse" /> : <Mic size={20} />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </ScrollAnimation>

          {/* 3D Quick Category & Instant Filter Scroll */}
          <ScrollAnimation className="scroll-slide">
            <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-3 pt-1 scrollbar-none">
              <button
                onClick={() => { setQuickCategory(''); setFilters(prev => ({ ...prev, cropType: '' })); }}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer min-h-[44px] flex items-center gap-2 border ${
                  !quickCategory && !filters.cropType
                    ? 'bg-[#132E20] text-white border-[#132E20] shadow-lg scale-[1.02]'
                    : 'bg-white text-stone-700 border-stone-200 hover:border-emerald-400 hover:text-emerald-800'
                }`}
              >
                <span>🌾</span> All Produce
              </button>
              {QUICK_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleQuickCategory(cat.id)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-2 shrink-0 cursor-pointer min-h-[44px] border ${
                    quickCategory === cat.id || filters.cropType === cat.id
                      ? 'bg-[#132E20] text-white border-[#132E20] shadow-lg scale-[1.02]'
                      : 'bg-white text-stone-700 border-stone-200 hover:border-emerald-400 hover:text-emerald-800'
                  }`}
                >
                  <span className="text-base">{cat.icon}</span> {cat.label}
                </button>
              ))}

              <div className="h-6 w-[1px] bg-stone-300 mx-1 shrink-0"></div>

              {/* Instant Quick Filter Badges */}
              <button
                onClick={() => setFilters(prev => ({ ...prev, verifiedFarmersOnly: !prev.verifiedFarmersOnly }))}
                className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shrink-0 cursor-pointer min-h-[44px] border ${
                  filters.verifiedFarmersOnly
                    ? 'bg-[#D97736] text-white border-[#D97736] shadow-md'
                    : 'bg-white text-stone-700 border-stone-200 hover:border-[#D97736]'
                }`}
              >
                <span>🛡️</span> Verified Farmers
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, organicOnly: !prev.organicOnly }))}
                className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shrink-0 cursor-pointer min-h-[44px] border ${
                  filters.organicOnly
                    ? 'bg-[#D97736] text-white border-[#D97736] shadow-md'
                    : 'bg-white text-stone-700 border-stone-200 hover:border-[#D97736]'
                }`}
              >
                <span>🌿</span> Certified Organic
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, priceRange: prev.priceRange[1] === 200 ? [0, 1000] : [0, 200] }))}
                className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shrink-0 cursor-pointer min-h-[44px] border ${
                  filters.priceRange[1] === 200
                    ? 'bg-[#132E20] text-white border-[#132E20] shadow-md'
                    : 'bg-white text-stone-700 border-stone-200 hover:border-emerald-400'
                }`}
              >
                <span>⚡</span> Under ₹200
              </button>
            </div>
          </ScrollAnimation>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Desktop Filters Sidebar */}
            <div className="hidden lg:block">
              <FilterPanel
                cropTypes={cropTypes}
                locations={locations}
                currentFilters={filters}
                onFilterChange={setFilters}
                onReset={resetFilters}
              />
            </div>

            {/* Mobile Filter Slide-up Drawer Overlay */}
            {showMobileFilters && (
              <div
                className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={() => setShowMobileFilters(false)}
              >
                <div
                  className="w-full bg-[#FBF8F3] max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-t-[36px] shadow-2xl animate-slide-up border-t border-stone-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto mb-4"></div>
                  <FilterPanel
                    cropTypes={cropTypes}
                    locations={locations}
                    currentFilters={filters}
                    onFilterChange={setFilters}
                    onReset={resetFilters}
                    onCloseMobile={() => setShowMobileFilters(false)}
                  />
                </div>
              </div>
            )}

            {/* Marketplace Main Grid */}
            <div className="lg:col-span-3">
              <RecentlyViewedCarousel />

              {error && (
                <Card variant="warning" className="mb-6">
                  <div className="p-4 flex items-center gap-3">
                    <AlertCircle size={24} className="text-amber-600 shrink-0" />
                    <div>
                      <p className="font-bold text-stone-900">Unable to load crops</p>
                      <p className="text-stone-600 text-sm">{error}</p>
                    </div>
                  </div>
                </Card>
              )}

              {loading ? (
                <SkeletonLoader variant="card-grid" count={6} />
              ) : (
                <>
                  {trendingCrops.length > 0 && !quickCategory && !filters.cropType && (
                    <div className="mb-10">
                      <div className="flex items-center gap-2 mb-4">
                        <Flame size={22} className="text-[#D97736]" />
                        <h2 className="text-2xl font-serif-display font-bold text-[#132E20]">Trending Listings</h2>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        {trendingCrops?.map((crop, index) => (
                          <TiltCard key={crop._id || crop.id} maxTilt={6} scale={1.02}>
                            <TrendingCard
                              crop={crop}
                              index={index}
                              onView={() => handleViewCrop(crop._id || crop.id)}
                              onToggleWishlist={() => toggleWishlist(crop)}
                              isFavorite={isInWishlist(crop._id || crop.id)}
                              onQuickAdd={(e) => handleQuickAddToCart(crop, e)}
                            />
                          </TiltCard>
                        )) ?? []}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-white rounded-2xl border border-stone-200/80 shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Sort by:</span>
                      <select
                        value={filters.sortBy}
                        onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                        className="px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 font-bold cursor-pointer hover:border-emerald-400 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      >
                        {sortOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-3">
                      {activeFilterCount > 0 && (
                        <button onClick={resetFilters} className="text-sm text-red-500 hover:text-red-600 font-bold flex items-center gap-1 cursor-pointer">
                          <X size={14} /> Clear ({activeFilterCount})
                        </button>
                      )}
                      <span className="text-sm text-stone-600 font-bold">
                        {filteredCrops.length} {filteredCrops.length === 1 ? 'crop' : 'crops'} available
                      </span>
                    </div>
                  </div>

                  {filteredCrops.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredCrops?.map((crop, index) => (
                        <TiltCard key={crop._id || crop.id} maxTilt={6}>
                          <CropCardEnhanced
                            crop={crop}
                            isFavorite={isInWishlist(crop._id || crop.id)}
                            onToggleFavorite={() => toggleWishlist(crop)}
                            onViewCrop={() => handleViewCrop(crop._id || crop.id)}
                            onQuickAdd={(e) => handleQuickAddToCart(crop, e)}
                            index={index}
                          />
                        </TiltCard>
                      )) ?? []}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-stone-300 p-8 shadow-xs">
                      <div className="text-6xl mb-4">🌾</div>
                      <h3 className="text-2xl font-serif-display font-bold text-[#132E20] mb-2">No matching crops found</h3>
                      <p className="text-stone-500 mb-6 max-w-sm mx-auto">Try loosening your search filters or browse all fresh produce.</p>
                      <Button variant="primary" onClick={resetFilters} className="bg-[#132E20] hover:bg-[#1B3B2B] text-white font-bold rounded-xl px-6 py-3 min-h-[44px]">
                        Reset All Filters
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick View Modal */}
        {quickViewCrop && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs" onClick={() => setQuickViewCrop(null)}>
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-100" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                    {quickViewCrop.category || quickViewCrop.cropType || 'Produce'}
                  </span>
                  <h3 className="text-2xl font-serif-display font-bold text-[#132E20] mt-1">{quickViewCrop.cropName || quickViewCrop.name}</h3>
                </div>
                <button onClick={() => setQuickViewCrop(null)} className="p-2 hover:bg-stone-100 rounded-full transition cursor-pointer">
                  <X size={20} className="text-stone-500" />
                </button>
              </div>
              <div className="h-52 bg-stone-100 rounded-2xl mb-4 flex items-center justify-center overflow-hidden">
                <img 
                  src={getImageUrl(quickViewCrop.images?.[0] || quickViewCrop.image, quickViewCrop.category || quickViewCrop.cropName || quickViewCrop.name)} 
                  alt={quickViewCrop.cropName || 'Crop image'} 
                  className="w-full h-full object-cover" 
                  loading="lazy" 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = getCropFallbackImage(quickViewCrop.category || quickViewCrop.cropName || quickViewCrop.name);
                  }}
                />
              </div>
              <p className="text-3xl font-extrabold text-emerald-700 mb-2">₹{quickViewCrop.price} <span className="text-sm font-normal text-stone-500">/ {quickViewCrop.unit || 'kg'}</span></p>
              <p className="text-stone-600 text-sm mb-6 line-clamp-3">{quickViewCrop.description || 'Fresh produce harvested directly from farm.'}</p>
              <div className="flex gap-3">
                <button onClick={() => { setQuickViewCrop(null); handleViewCrop(quickViewCrop._id || quickViewCrop.id); }} className="flex-1 px-5 py-3 bg-[#132E20] text-white rounded-xl font-bold hover:bg-[#1B3B2B] transition min-h-[44px] cursor-pointer">
                  View Full Details
                </button>
                <button onClick={(e) => { setQuickViewCrop(null); handleQuickAddToCart(quickViewCrop, e); }} className="px-5 py-3 bg-emerald-100 text-emerald-800 rounded-xl font-bold hover:bg-emerald-200 transition min-h-[44px] flex items-center justify-center cursor-pointer" title="Add to Cart">
                  <ShoppingCart size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <LiveActivityTicker />
    </PageTransition>
    </ErrorBoundary>
  );
}

function TrendingCard({ crop, onView, onToggleWishlist, isFavorite, onQuickAdd }) {
  const cropImage = crop.images?.[0] || crop.image;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer border border-stone-200/80 flex flex-col" onClick={onView}>
      <div className="relative h-40 bg-stone-100 flex items-center justify-center overflow-hidden">
        <img 
          src={getImageUrl(cropImage, crop.category || crop.cropName || crop.name)} 
          alt={crop.cropName || crop.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          loading="lazy" 
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = getCropFallbackImage(crop.category || crop.cropName || crop.name);
          }} 
        />
        <button onClick={(e) => { e.stopPropagation(); onToggleWishlist(); }} className={`absolute top-2.5 right-2.5 p-2 rounded-full transition-all cursor-pointer ${isFavorite ? 'bg-red-500 text-white shadow-md' : 'bg-white/90 text-stone-500 hover:bg-white hover:text-red-500'}`}>
          <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
        <div className="absolute top-2.5 left-2.5">
          <span className="px-2.5 py-1 bg-[#D97736] text-white text-[11px] font-bold rounded-full flex items-center gap-1 shadow-xs">
            <TrendingUp size={12} /> Trending
          </span>
        </div>
      </div>
      <div className="p-3.5 flex flex-col flex-1">
        <h4 className="font-bold text-[#132E20] text-sm truncate">{crop.cropName || crop.name}</h4>
        <div className="flex items-center justify-between mt-1 mb-2">
          <p className="text-emerald-700 font-extrabold text-base">₹{crop.price}<span className="text-xs font-normal text-stone-500">/{crop.unit || 'kg'}</span></p>
          <div className="flex items-center gap-1 text-amber-500 text-xs font-bold bg-amber-50 px-2 py-0.5 rounded-md">
            <Star size={12} fill="currentColor" />
            <span>{crop.rating || 4.5}</span>
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onQuickAdd(e); }} className="w-full mt-auto px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[36px]">
          <ShoppingCart size={14} /> Quick Add
        </button>
      </div>
    </div>
  );
}

function CropCardEnhanced({ crop, isFavorite, onToggleFavorite, onViewCrop, onQuickAdd }) {
  const cropImage = crop.images?.[0] || crop.image;

  return (
    <div className="group bg-white rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 border border-stone-200/80 flex flex-col h-full">
      <div className="relative h-56 bg-stone-100 flex items-center justify-center overflow-hidden cursor-pointer" onClick={onViewCrop}>
        <img 
          src={getImageUrl(cropImage, crop.category || crop.cropName || crop.name)} 
          alt={crop.cropName || crop.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          loading="lazy" 
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = getCropFallbackImage(crop.category || crop.cropName || crop.name);
          }} 
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[75%]">
          {crop.farmer_verified && (
            <span className="px-2.5 py-1 bg-emerald-700 text-white text-[11px] font-bold rounded-full flex items-center gap-1 shadow-xs">
              <Check size={12} /> Verified
            </span>
          )}
          {crop.cropType && (
            <span className="px-2.5 py-1 bg-stone-900/80 backdrop-blur-xs text-white text-[11px] font-bold rounded-full capitalize">{crop.cropType}</span>
          )}
        </div>
        <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }} className={`absolute top-3 right-3 p-2.5 rounded-full transition-all z-10 cursor-pointer ${isFavorite ? 'bg-red-500 text-white shadow-md' : 'bg-white/90 text-stone-500 hover:bg-white hover:text-red-500'}`}>
          <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 pt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center">
          <button onClick={(e) => { e.stopPropagation(); onViewCrop(); }} className="w-full px-4 py-2.5 bg-white text-[#132E20] rounded-xl font-bold text-sm hover:bg-emerald-50 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm">
            <Eye size={16} /> Quick View
          </button>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-serif-display font-bold text-[#132E20] text-xl mb-1 line-clamp-1 group-hover:text-emerald-700 transition-colors">{crop.cropName || crop.name}</h3>

        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 bg-[#132E20] rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
            {crop.farmerName?.[0]?.toUpperCase() || 'F'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-stone-800 truncate">{crop.farmerName || 'Local Farmer'}</p>
            <p className="text-[11px] text-stone-500 flex items-center gap-1 truncate">
              <MapPin size={11} className="text-emerald-600 shrink-0" /> {crop.pickupLocation || crop.location || 'Farm Direct'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex text-amber-400 text-sm">
            {[...Array(5)].map((_, i) => (
              <span key={i}>{i < Math.floor(crop?.rating || 4.5) ? '★' : '☆'}</span>
            ))}
          </div>
          <span className="text-xs text-stone-500 font-medium">({crop?.totalReviews || 12})</span>
        </div>

        <div className="bg-emerald-50/60 rounded-2xl p-3.5 mb-4 border border-emerald-100">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-0.5">Price / {crop.unit || 'kg'}</p>
          <p className="text-2xl font-extrabold text-[#132E20]">₹{Math.floor(crop.price)}</p>
        </div>

        <div className="flex gap-2 mt-auto pt-2">
          <button onClick={onViewCrop} className="flex-1 px-4 py-3 bg-[#132E20] hover:bg-[#1B3B2B] text-white font-bold rounded-xl transition text-sm min-h-[44px] cursor-pointer">
            View Details
          </button>
          <button onClick={onQuickAdd} className="px-4 py-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-xl transition text-sm flex items-center justify-center cursor-pointer min-h-[44px]" title="Add to Cart">
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}