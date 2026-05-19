import { useState, useEffect } from 'react';
import { MapPin, Heart, Star, User, CheckCircle, AlertCircle, Loader, Phone, Leaf, Package, MessageCircle, ShoppingCart } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Timeline from '../components/common/Timeline';
import FarmerDetailCard from '../components/common/FarmerDetailCard';
import PageTransition from '../components/common/PageTransition.jsx';
import ScrollAnimation from '../components/common/ScrollAnimation';
import LoginPrompt from '../components/modals/LoginPrompt';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { cropService, wishlistService, userService } from '../services/appService';
import '../styles/CropDetail.css';

export default function CropDetail() {
  const { navigate, params } = useRouter();
  const { isAuthenticated, setRedirectPath, user } = useAuth();
  const { addToRecentlyViewed } = useRecentlyViewed();
  const { addToast } = useToast();
  const { addToCart } = useCart();

  const cropId = params?.cropId || 1;
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isInterested, setIsInterested] = useState(false);
  const [interestLoading, setInterestLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const [crop, setCrop] = useState(null);
  const [farmer, setFarmer] = useState(null);
  const [farmerUserId, setFarmerUserId] = useState(null);

  const getTimeline = (cropData) => {
    if (!cropData) return [];
    const steps = [
      { title: 'Listed by Farmer', completed: true, timestamp: cropData.createdAt ? new Date(cropData.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : null },
      { title: 'Available for Interest', completed: cropData.availability === 'available', timestamp: null },
    ];
    if (cropData.availability === 'not_available') {
      steps.push({ title: 'Sold Out', completed: true, timestamp: null });
    }
    return steps;
  };

  // Reset scroll position to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch crop details
  useEffect(() => {
    const fetchCropDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await cropService.getCropById(cropId);
        const cropData = response.crop || response.data?.crop || response.data || response;
        setCrop(cropData);

        // Track this view in recently viewed
        if (cropData) {
          addToRecentlyViewed(cropData);
        }

        // Fetch farmer details if farmerId is available
        // farmerId from populate() is an object, so extract _id or use the string directly
        const rawFarmerId = cropData?.farmerId;
        const farmerId = (typeof rawFarmerId === 'object' && rawFarmerId !== null)
          ? (rawFarmerId._id || rawFarmerId.id)
          : (rawFarmerId || cropData?.farmer?._id || cropData?.farmer);
        if (farmerId && typeof farmerId === 'string') {
          setFarmerUserId(farmerId);
          try {
            const farmerRes = await userService.getFarmerProfile(farmerId);
            const farmerData = farmerRes.data?.data || farmerRes.data || farmerRes;
            setFarmer({
              name: farmerData.name || `${farmerData.firstName || ''} ${farmerData.lastName || ''}`.trim() || farmerData.farmName || 'Farmer',
              location: [farmerData.city, farmerData.state].filter(Boolean).join(', ') || farmerData.address || 'India',
              joinedDate: farmerData.createdAt ? new Date(farmerData.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A',
              totalListings: farmerData.totalListings ?? 0,
              totalSales: farmerData.totalSales ?? 0,
              rating: farmerData.rating ?? 0,
              reviewCount: farmerData.totalReviews ?? 0,
              verified: farmerData.kycStatus === 'verified' || farmerData.verified || false,
              image: farmerData.profilePicture || null,
              bio: farmerData.bio || 'Dedicated farmer providing fresh, quality produce.',
              id: farmerData._id || farmerId,
            });
          } catch (err) {
            console.error('Could not fetch farmer profile, using populated data:', err);
            // Fallback: use the already-populated farmer data from the crop response
            const populatedFarmer = (typeof cropData?.farmerId === 'object' && cropData?.farmerId !== null)
              ? cropData.farmerId
              : null;
            setFarmer({
              name: populatedFarmer
                ? (populatedFarmer.name || `${populatedFarmer.firstName || ''} ${populatedFarmer.lastName || ''}`.trim() || populatedFarmer.farmName || 'Farmer')
                : 'Farmer',
              location: populatedFarmer
                ? ([populatedFarmer.city, populatedFarmer.state].filter(Boolean).join(', ') || populatedFarmer.location || 'India')
                : (cropData?.pickupLocation || 'India'),
              joinedDate: 'N/A',
              totalListings: 0,
              totalSales: 0,
              rating: populatedFarmer?.rating || cropData?.rating || 0,
              reviewCount: 0,
              verified: false,
              image: populatedFarmer?.avatar || null,
              bio: 'Fresh produce from local farming.',
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch crop:', err);
        setError('Unable to load crop details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCropDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cropId]);

  // Check wishlist status from API
  useEffect(() => {
    const checkWishlistStatus = async () => {
      try {
        const response = await wishlistService.checkWishlist(cropId);
        setIsWishlisted(response.inWishlist || response.data?.inWishlist || false);
      } catch {
        setIsWishlisted(false);
      }
    };
    if (cropId) checkWishlistStatus();
  }, [cropId]);

  // Check if user is interested in this crop
  useEffect(() => {
    const checkInterestStatus = async () => {
      if (!isAuthenticated || user?.role !== 'buyer') return;
      try {
        const response = await cropService.getMyInterestedCrops();
        const interestedCrops = response.crops || response.data?.crops || [];
        const found = interestedCrops.some(c => (c._id || c.id) === cropId);
        setIsInterested(found);
      } catch {
        setIsInterested(false);
      }
    };
    if (cropId && isAuthenticated) checkInterestStatus();
  }, [cropId, isAuthenticated, user]);

  const toggleWishlist = async () => {
    try {
      if (isWishlisted) {
        await wishlistService.removeFromWishlist(cropId);
        setIsWishlisted(false);
        addToast('Removed from wishlist', 'info');
      } else {
        await wishlistService.addToWishlist(cropId);
        setIsWishlisted(true);
        addToast('Added to wishlist!', 'success');
      }
    } catch {
      addToast('Failed to update wishlist. Please try again.', 'error');
    }
  };

  const handleMarkInterested = async () => {
    if (!isAuthenticated) {
      setRedirectPath(`/crop/${cropId}`);
      setShowLoginPrompt(true);
      return;
    }

    if (user?.role !== 'buyer') {
      addToast('Only buyers can mark interest in crops', 'warning');
      return;
    }

    if (user?.kycStatus !== 'verified') {
      addToast('Please complete your KYC verification first', 'warning');
      return;
    }

    try {
      setInterestLoading(true);
      const response = await cropService.toggleInterest(cropId);
      const newState = response.data?.interested ?? !isInterested;
      setIsInterested(newState);
      addToast(
        newState
          ? 'Interest marked! The farmer will be notified.'
          : 'Interest removed.',
        newState ? 'success' : 'info'
      );
    } catch {
      addToast('Failed to update interest. Please try again.', 'error');
    } finally {
      setInterestLoading(false);
    }
  };

  const handleLoginClick = () => {
    setShowLoginPrompt(false);
    navigate('/auth/login');
  };

  const handleRegisterClick = () => {
    setShowLoginPrompt(false);
    navigate('/auth/register');
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }

    if (user?.role !== 'buyer') {
      addToast('Only buyers can add items to cart', 'warning');
      return;
    }

    const cartProduct = {
      _id: crop._id,
      id: crop._id,
      cropName: crop.cropName,
      cropType: crop.cropType,
      category: crop.category,
      price: crop.price,
      originalPrice: crop.originalPrice,
      unit: crop.unit,
      images: crop.images || [],
      farmerId: crop.farmerId,
      pickupLocation: crop.pickupLocation,
      description: crop.description,
      discount: crop.discount,
      specifications: crop.specifications,
      rating: crop.rating,
      totalReviews: crop.totalReviews,
      status: crop.status,
      farmerName: farmer?.name || farmer?.firstName || '',
      farmerFarmName: farmer?.farmName || '',
      farmerRating: farmer?.rating || 0,
      quantity: crop.quantity,
    };

    addToCart(cartProduct, quantity);
    addToast(`${crop.cropName} added to cart (${quantity} ${crop.unit})`, 'success');
  };

  const handleChatWithFarmer = async () => {
    if (!isAuthenticated) {
      setRedirectPath(window.location.pathname + window.location.search);
      setShowLoginPrompt(true);
      return;
    }

    if (user?.role === 'farmer') {
      addToast('Farmers can chat via the Messages page from your dashboard.', 'info');
      return;
    }

    if (user?.kycStatus !== 'verified') {
      addToast('KYC verification is required to message farmers. Please complete your verification first.', 'warning');
      return;
    }

    if (!farmerUserId) {
      addToast('Farmer information not available.', 'error');
      return;
    }

    // Navigate to Messages page where the conversation will be initiated with the farmer
    navigate(`/messages?receiver=${farmerUserId}&crop=${cropId}&name=${encodeURIComponent(farmer?.name || 'Farmer')}`);
  };

  // Derived values from crop data
  const cropName = crop?.cropName || crop?.name || 'Unknown Crop';
  const cropImage = crop?.images?.[0] || crop?.image || null;
  const cropPrice = crop?.price || 0;
  const cropQuantity = crop?.quantity || 0;
  const cropUnit = crop?.unit || 'kg';
  const cropType = crop?.cropType || crop?.category || null;
  const pickupLocation = crop?.pickupLocation || crop?.farmLocation || 'Location not specified';
  const contactNumber = crop?.contactNumber || null;
  const availability = crop?.availability || 'available';
  const isAvailable = availability === 'available';

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-white py-12 px-4 flex items-center justify-center">
          <div className="text-center">
            <Loader size={48} className="text-green-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-semibold">Loading crop details...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error || !crop) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-white py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <Card variant="warning">
              <div className="p-8 flex items-center gap-4">
                <AlertCircle size={32} className="text-amber-600 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">Unable to load crop</p>
                  <p className="text-gray-600">{error}</p>
                </div>
              </div>
            </Card>
            <Button
              variant="primary"
              className="mt-6"
              onClick={() => navigate('/marketplace')}
            >
              Back to Marketplace
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-white py-12 px-4 relative">
        <div className="absolute inset-0 premium-gradient pointer-events-none"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          
          {/* Back Button */}
          <button
            onClick={() => navigate('/marketplace')}
            className="mb-6 text-green-600 hover:text-green-700 font-semibold flex items-center gap-2 transition cursor-pointer"
          >
            ← Back to Marketplace
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Product Images & Info */}
            <div className="lg:col-span-2">
              {/* Main Image */}
              <Card className="mb-6 animate-slide-in-left">
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-t-lg flex items-center justify-center hover-lift relative overflow-hidden" style={{ minHeight: '400px' }}>
                  {cropImage ? (
                    <img
                      src={cropImage}
                      alt={cropName}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-9xl animate-bounce-soft">
                      {cropType === 'vegetables' ? '🥬' : cropType === 'crops' ? '🌾' : '🌿'}
                    </span>
                  )}
                  {!isAvailable && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-red-600 text-white px-6 py-3 rounded-lg text-xl font-bold">Sold Out</span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h1 className="text-4xl font-bold text-gray-900 animate-slide-in-down">{cropName}</h1>
                    {cropType && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full capitalize">
                        {cropType}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mb-4 animate-slide-in-down flex-wrap" style={{ animationDelay: '0.1s' }}>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400 animate-float">⭐</span>
                      <span className="font-semibold text-gray-900">{crop.rating || 0}</span>
                      <span className="text-gray-600 text-sm">({crop.totalReviews || 0} reviews)</span>
                    </div>
                    {isAvailable ? (
                      <Badge label="Available" variant="success" />
                    ) : (
                      <Badge label="Not Available" variant="danger" />
                    )}
                    {farmer?.verified && (
                      <Badge label="Verified Farmer" variant="primary" icon="✓" />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b animate-slide-in-down" style={{ animationDelay: '0.2s' }}>
                    <div>
                      <p className="text-gray-600 text-sm mb-1">PRICE</p>
                      <p className="text-4xl font-bold text-green-600">₹{cropPrice}/{cropUnit}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm mb-1">AVAILABLE QTY</p>
                      <p className="text-xl font-semibold text-gray-900">{cropQuantity} {cropUnit}</p>
                    </div>
                  </div>

                  {/* Location & Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 animate-slide-in-down" style={{ animationDelay: '0.3s' }}>
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                      <MapPin size={18} className="text-blue-600 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Pickup Location</p>
                        <p className="font-semibold text-gray-900 text-sm">{pickupLocation}</p>
                      </div>
                    </div>
                    {contactNumber && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                        <Phone size={18} className="text-green-600 shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Contact Number</p>
                          <p className="font-semibold text-gray-900 text-sm">{contactNumber}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat with Farmer Button - visible after marking interest */}
                  {isAvailable && farmerUserId && (
                    <div className="mb-6 animate-slide-in-down" style={{ animationDelay: '0.35s' }}>
                      {isAuthenticated && isInterested ? (
                        <>
                          <button
                            onClick={handleChatWithFarmer}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
                          >
                            <MessageCircle size={20} />
                            💬 Chat with Farmer
                          </button>
                          {user?.kycStatus !== 'verified' && (
                            <p className="text-xs text-amber-600 mt-1 text-center">
                              ⚠️ KYC verification required to message farmers
                            </p>
                          )}
                        </>
                      ) : isAuthenticated ? (
                        <button
                          onClick={handleMarkInterested}
                          disabled={interestLoading}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-green-50 text-gray-700 hover:text-green-700 font-semibold rounded-lg border border-gray-300 hover:border-green-400 transition-all duration-200"
                        >
                          <MessageCircle size={20} />
                          {interestLoading ? 'Updating...' : '🌟 Mark Interest to Chat with Farmer'}
                        </button>
                      ) : (
                        <button
                          onClick={() => { setRedirectPath(`/crop/${cropId}`); setShowLoginPrompt(true); }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
                        >
                          <MessageCircle size={20} />
                          💬 Login to Chat with Farmer
                        </button>
                      )}
                    </div>
                  )}

                  <p className="text-gray-700 mb-6 leading-relaxed animate-fade-in" style={{ animationDelay: '0.4s' }}>
                    {crop.description || 'No description provided.'}
                  </p>

                  {/* Specifications */}
                  {crop.specifications && Object.keys(crop.specifications).length > 0 && (
                    <ScrollAnimation className="scroll-slide mb-6 pb-6 border-b">
                      <p className="font-semibold text-gray-900 mb-3">📋 Specifications</p>
                      <div className="space-y-2 text-sm">
                        {Object.entries(crop.specifications).map(([key, value], i) => (
                          <div key={key} className="flex justify-between stagger-item" style={{ animationDelay: `${i * 0.05}s` }}>
                            <span className="text-gray-600">{key}</span>
                            <span className="font-semibold text-gray-900">{value}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollAnimation>
                  )}

                  {/* Availability Timeline */}
                  <ScrollAnimation className="scroll-slide">
                    <p className="font-semibold text-gray-900 mb-4">📦 Crop Status</p>
                    <Timeline steps={getTimeline(crop)} />
                  </ScrollAnimation>
                </div>
              </Card>

              {/* Reviews Section */}
              {crop.reviews_list && crop.reviews_list.length > 0 && (
                <ScrollAnimation className="scroll-slide">
                  <Card variant="light" animated={false}>
                    <div className="p-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6 animate-slide-in-left">⭐ Customer Reviews</h2>
                      <div className="space-y-6">
                        {crop.reviews_list.map((review, i) => (
                          <div key={i} className="pb-6 border-b last:border-b-0 stagger-item" style={{ animationDelay: `${i * 0.1}s` }}>
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-semibold animate-scale-in">
                                {review.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{review.name}</p>
                                <p className="text-yellow-400 text-sm">⭐ {review.rating}</p>
                              </div>
                            </div>
                            <p className="text-gray-700">{review.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </ScrollAnimation>
              )}

            </div>

            {/* Sidebar - Interest & Farmer Info */}
            <div className="space-y-6 lg:sticky lg:top-24">
              {/* Interest Card */}
              <Card variant="deep" animated={false} className="animate-slide-in-right">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 animate-fade-in">
                    {isAvailable ? '🌿 Interested in this crop?' : '🚫 Currently Unavailable'}
                  </h3>

                  {isAvailable && (
                    <div className="space-y-4 mb-6 animate-slide-in-down" style={{ animationDelay: '0.1s' }}>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Estimated Quantity ({cropUnit})
                        </label>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-10 h-10 glass hover:bg-green-50 flex items-center justify-center transition-smooth active:scale-95 font-semibold text-gray-700 rounded-lg border border-green-200 cursor-pointer"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            className="glass-input flex-1 px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-green-400 transition-smooth"
                            min="1"
                            max={cropQuantity}
                          />
                          <button
                            onClick={() => setQuantity(Math.min(cropQuantity, quantity + 1))}
                            className="w-10 h-10 glass hover:bg-green-50 flex items-center justify-center transition-smooth active:scale-95 font-semibold text-gray-700 rounded-lg border border-green-200 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="p-4 glass-green rounded-xl border-2 border-green-400">
                        <p className="text-gray-600 text-sm mb-1 font-medium">💰 Estimated Total</p>
                        <p className="text-3xl font-bold text-green-600">₹{cropPrice * quantity}</p>
                        <p className="text-xs text-gray-500 mt-1">Final price to be discussed with farmer</p>
                      </div>
                    </div>
                  )}

                  {!isAuthenticated && (
                    <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded animate-slide-in-down" style={{ animationDelay: '0.2s' }}>
                      <p className="text-sm text-blue-800 font-medium">
                        👉 <strong>Login required to mark interest</strong>
                      </p>
                    </div>
                  )}

                  {isAuthenticated && user?.role === 'farmer' && (
                    <div className="mb-4 p-3 bg-amber-50 border-l-4 border-amber-400 rounded">
                      <p className="text-sm text-amber-800">
                        ℹ️ As a farmer, you can view listings but only buyers can mark interest.
                      </p>
                    </div>
                  )}

                  {/* Mark Interested Button */}
                  <Button
                    variant={isInterested ? 'outline' : 'primary'}
                    size="lg"
                    className={`w-full flex items-center gap-2 justify-center mb-3 animate-slide-in-down ${
                      isInterested ? 'border-green-500 text-green-700 hover:bg-green-50' : ''
                    }`}
                    style={{ animationDelay: '0.2s' }}
                    onClick={handleMarkInterested}
                    disabled={interestLoading || !isAvailable}
                  >
                    {interestLoading ? (
                      <>
                        <Loader size={20} className="animate-spin" /> Updating...
                      </>
                    ) : isInterested ? (
                      <>
                        <CheckCircle size={20} className="text-green-600" /> Interested ✓
                      </>
                    ) : isAvailable ? (
                      <>
                        <Leaf size={20} /> Mark Interested
                      </>
                    ) : (
                      <>
                        <Package size={20} /> Sold Out
                      </>
                    )}
                  </Button>

                  {isInterested && (
                    <div className="mb-3 p-3 bg-green-50 border-l-4 border-green-500 rounded animate-fade-in">
                      <p className="text-sm text-green-800">
                        ✅ You've marked interest! The farmer has been notified with your details. They will contact you to finalize the order.
                      </p>
                    </div>
                  )}

                  {/* Wishlist Button */}
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full flex items-center gap-2 justify-center animate-slide-in-down"
                    style={{ animationDelay: '0.3s' }}
                    onClick={toggleWishlist}
                  >
                    <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} className={isWishlisted ? 'animate-scale-in text-red-600' : ''} />
                    {isWishlisted ? 'Saved ❤️' : 'Save for Later'}
                  </Button>

                  {/* Add to Cart Button */}
                  {isAvailable && (
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full flex items-center gap-2 justify-center animate-slide-in-down bg-green-600 hover:bg-green-700"
                      style={{ animationDelay: '0.35s' }}
                      onClick={handleAddToCart}
                    >
                      <ShoppingCart size={20} />
                      Add to Cart
                    </Button>
                  )}

                  {contactNumber && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center animate-fade-in">
                      <p className="text-xs text-gray-500 mb-1">Need to talk directly?</p>
                      <a
                        href={`tel:${contactNumber}`}
                        className="text-green-600 font-bold text-lg hover:text-green-700 flex items-center justify-center gap-2"
                      >
                        <Phone size={16} /> {contactNumber}
                      </a>
                    </div>
                  )}
                </div>
              </Card>

              {/* Farmer Info Card */}
              {farmer && (
                <FarmerDetailCard
                  farmer={farmer}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Login Prompt Modal */}
      <LoginPrompt
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onLogin={handleLoginClick}
        onRegister={handleRegisterClick}
        message="Please login to mark interest in this crop and connect with the farmer"
      />
    </PageTransition>
  );
}
