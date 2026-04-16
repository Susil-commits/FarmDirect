import { useState, useEffect } from 'react';
import { MapPin, Heart, ShoppingCart, Star, User, MessageSquare, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Timeline from '../components/common/Timeline';
import FarmerDetailCard from '../components/common/FarmerDetailCard';
import RelatedProducts from '../components/common/RelatedProducts';
import PageTransition from '../components/common/PageTransition.jsx';
import ScrollAnimation from '../components/common/ScrollAnimation';
import LoginPrompt from '../components/modals/LoginPrompt';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import { useToast } from '../context/ToastContext';
import { cropService } from '../services/appService';
import '../styles/CropDetail.css';

export default function CropDetail() {
  const { navigate, params } = useRouter();
  const { isAuthenticated, setRedirectPath } = useAuth();
  const { addToCart } = useCart();
  const { addToRecentlyViewed } = useRecentlyViewed();
  const { addToast } = useToast();

  const cropId = params?.cropId || 1;
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const [crop, setCrop] = useState(null);
  const [farmer, setFarmer] = useState(null);

  // Sample data for testing
  const sampleCrop = {
    id: 1,
    name: 'Fresh Organic Tomatoes',
    price: 45,
    quantity: 150,
    rating: 4.8,
    reviews: 24,
    harvestDate: '22 Mar, 2026',
    farmLocation: 'Punjab, India',
    image: 'https://images.unsplash.com/photo-1592841496694-e91a2dbe3534?w=800&h=800&fit=crop',
    description: 'Fresh, organic tomatoes harvested directly from our farm. No chemical pesticides or fertilizers used. Sourced from sustainable farming practices.',
    certifications: ['Organic', 'Farm Fresh', 'Pesticide Free', 'Non-GMO'],
    specifications: {
      'Harvest Date': '22 Mar, 2026',
      'Weight per Unit': '1 kg',
      'Shelf Life': '7-10 days',
      'Storage': 'Room Temperature',
      'Origin': 'Punjab, India',
    },
    reviews_list: [
      {
        name: 'Rajesh Kumar',
        rating: 5,
        text: 'Excellent quality tomatoes! Very fresh and delivered within 2 days. Will order again.',
      },
      {
        name: 'Priya Singh',
        rating: 4.5,
        text: 'Great taste and good freshness. Reasonable price for organic produce.',
      },
    ],
  };

  const sampleFarmer = {
    name: 'Rajesh Kumar Singh',
    location: 'Ludhiana, Punjab',
    joinedDate: 'Jan 2023',
    totalListings: 12,
    followers: 234,
    rating: 4.8,
    verified: true,
    image: '👨‍🌾',
    bio: 'Dedicated organic farmer with 15+ years of experience. Using sustainable farming methods to produce high-quality vegetables.',
  };

  const timeline = [
    { title: 'Harvested', completed: true, timestamp: '22 Mar, 6:00 AM' },
    { title: 'Packed & Ready to Ship', completed: true, timestamp: 'Today 9:00 AM' },
    { title: 'In Transit', completed: false },
    { title: 'Delivered to You', completed: false },
  ];

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
        let cropData;
        // Try to fetch from API
        try {
          const response = await cropService.getCropById(cropId);
          cropData = response.data || response;
          setCrop(cropData);
        } catch (apiErr) {
          // Use sample data for demo
          console.log('Using sample crop data');
          cropData = sampleCrop;
          setCrop(cropData);
        }
        
        // Track this view in recently viewed
        if (cropData) {
          addToRecentlyViewed(cropData);
        }
        
        setFarmer(sampleFarmer);
      } catch (err) {
        console.error('Failed to fetch crop:', err);
        setError('Unable to load crop details');
      } finally {
        setLoading(false);
      }
    };

    fetchCropDetails();
  }, [cropId, addToRecentlyViewed]);

  // Load wishlist from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('farm-wishlist');
    if (saved) {
      try {
        const wishlist = new Set(JSON.parse(saved));
        setIsWishlisted(wishlist.has(parseInt(cropId)));
      } catch (e) {
        console.error('Failed to load wishlist:', e);
      }
    }
  }, [cropId]);

  const toggleWishlist = () => {
    const saved = localStorage.getItem('farm-wishlist');
    const wishlist = saved ? new Set(JSON.parse(saved)) : new Set();

    if (isWishlisted) {
      wishlist.delete(parseInt(cropId));
      setIsWishlisted(false);
      addToast('Removed from wishlist', 'info');
    } else {
      wishlist.add(parseInt(cropId));
      setIsWishlisted(true);
      addToast('Added to wishlist!', 'success');
    }

    localStorage.setItem('farm-wishlist', JSON.stringify([...wishlist]));
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      // Save redirect path for post-login
      setRedirectPath(`/crop/${cropId}`);
      setShowLoginPrompt(true);
      return;
    }
    // Proceed to checkout
    navigate('/checkout');
  };

  const handleAddToCart = () => {
    if (!crop) return;

    addToCart({
      id: crop.id,
      name: crop.name,
      price: crop.price,
      quantity: quantity,
      icon: crop.image,
      farmer: farmer?.name || 'Farmer',
    });

    setAddedToCart(true);
    addToast(`${crop.name} added to cart! (${quantity} kg)`, 'success');

    // Reset after 2 seconds
    setTimeout(() => {
      setAddedToCart(false);
    }, 2000);
  };

  const handleLoginClick = () => {
    setShowLoginPrompt(false);
    navigate('/auth/login');
  };

  const handleRegisterClick = () => {
    setShowLoginPrompt(false);
    navigate('/auth/register');
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-linear-to-br from-white via-green-50 to-white py-12 px-4 flex items-center justify-center">
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
        <div className="min-h-screen bg-linear-to-br from-white via-green-50 to-white py-12 px-4">
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
      <div className="min-h-screen bg-linear-to-br from-white via-green-50 to-white py-12 px-4 relative">
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
                <div className="bg-linear-to-br from-green-100 to-emerald-100 rounded-t-lg flex items-center justify-center hover-lift relative overflow-hidden" style={{ minHeight: '400px' }}>
                  {crop.image && crop.image.startsWith('http') ? (
                    // Real image from Cloudinary
                    <img
                      src={crop.image}
                      alt={crop.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    // Fallback: emoji
                    <span className="text-9xl animate-bounce-soft">{crop.image || '🌾'}</span>
                  )}
                </div>
                <div className="p-6">
                  <h1 className="text-4xl font-bold text-gray-900 mb-2 animate-slide-in-down">{crop.name}</h1>
                  <div className="flex items-center gap-4 mb-4 animate-slide-in-down flex-wrap" style={{ animationDelay: '0.1s' }}>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400 animate-float">⭐</span>
                      <span className="font-semibold text-gray-900">{crop.rating}</span>
                      <span className="text-gray-600 text-sm">({crop.reviews} reviews)</span>
                    </div>
                    <Badge label="In Stock" variant="success" />
                    {farmer?.verified && (
                      <Badge label="Verified Farmer" variant="primary" icon="✓" />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b animate-slide-in-down" style={{ animationDelay: '0.2s' }}>
                    <div>
                      <p className="text-gray-600 text-sm mb-1">PRICE</p>
                      <p className="text-4xl font-bold text-green-600">₹{crop.price}/kg</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm mb-1">AVAILABLE</p>
                      <p className="text-xl font-semibold text-gray-900">{crop.quantity} kg</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6 animate-slide-in-down" style={{ animationDelay: '0.3s' }}>
                    <p><strong>📅 Harvest Date:</strong> {crop.harvestDate}</p>
                    <p className="flex items-center gap-2"><MapPin size={18} className="text-green-600" /> <strong>{crop.farmLocation}</strong></p>
                  </div>

                  <p className="text-gray-700 mb-6 leading-relaxed animate-fade-in" style={{ animationDelay: '0.4s' }}>
                    {crop.description}
                  </p>

                  {/* Certifications */}
                  {crop.certifications && crop.certifications.length > 0 && (
                    <ScrollAnimation className="scroll-slide mb-6">
                      <p className="font-semibold text-gray-900 mb-3">✓ Certifications & Guarantees</p>
                      <div className="flex flex-wrap gap-2">
                        {crop.certifications.map(cert => (
                          <Badge key={cert} label={cert} variant="primary" size="sm" />
                        ))}
                      </div>
                    </ScrollAnimation>
                  )}

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

                  {/* Delivery Timeline */}
                  <ScrollAnimation className="scroll-slide">
                    <p className="font-semibold text-gray-900 mb-4">🚚 Expected Delivery Timeline</p>
                    <Timeline steps={timeline} />
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

              {/* Related Products Section */}
              <RelatedProducts
                products={[
                  {
                    id: 2,
                    name: 'Organic Cucumbers',
                    price: 35,
                    quantity: 80,
                    rating: 4.6,
                    reviews: 18,
                    image: 'https://images.unsplash.com/photo-1609137144813-2e231ebd96e3?w=400&h=400&fit=crop',
                    farmer: crop.farmer || 'Local Farmer',
                    farmer_verified: true,
                  },
                  {
                    id: 3,
                    name: 'Fresh Bell Peppers',
                    price: 60,
                    quantity: 50,
                    rating: 4.7,
                    reviews: 22,
                    image: 'https://images.unsplash.com/photo-1599599810694-b9efb4ffd8b0?w=400&h=400&fit=crop',
                    farmer: crop.farmer || 'Local Farmer',
                    farmer_verified: true,
                  },
                  {
                    id: 4,
                    name: 'Organic Lettuce',
                    price: 25,
                    quantity: 100,
                    rating: 4.5,
                    reviews: 15,
                    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop',
                    farmer: crop.farmer || 'Local Farmer',
                    farmer_verified: true,
                  },
                  {
                    id: 5,
                    name: 'Fresh Carrots',
                    price: 40,
                    quantity: 120,
                    rating: 4.9,
                    reviews: 28,
                    image: 'https://images.unsplash.com/photo-1447621334519-51cf6537b839?w=400&h=400&fit=crop',
                    farmer: crop.farmer || 'Local Farmer',
                    farmer_verified: true,
                  },
                ]}
                title="More from this Farmer"
                onProductClick={(id) => navigate(`/crop/${id}`)}
                onAddToCart={(product) => {
                  addToCart(product);
                  addToast(`${product.name} added to cart!`, 'success');
                }}
                showFarmer={false}
              />
            </div>

            {/* Sidebar - Order & Farmer Info */}
            <div className="space-y-6">
              {/* Order Card */}
              <Card variant="deep" animated={false} className="animate-slide-in-right sticky top-24">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 animate-fade-in">🛒 Order Now</h3>

                  <div className="space-y-4 mb-6 animate-slide-in-down" style={{ animationDelay: '0.1s' }}>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity (kg)</label>
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
                          max={crop.quantity}
                        />
                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          className="w-10 h-10 glass hover:bg-green-50 flex items-center justify-center transition-smooth active:scale-95 font-semibold text-gray-700 rounded-lg border border-green-200 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="p-4 glass-green rounded-xl border-2 border-green-400">
                      <p className="text-gray-600 text-sm mb-1 font-medium">💰 Total Price</p>
                      <p className="text-3xl font-bold text-green-600">₹{crop.price * quantity}</p>
                    </div>
                  </div>

                  {!isAuthenticated && (
                    <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded animate-slide-in-down" style={{ animationDelay: '0.2s' }}>
                      <p className="text-sm text-blue-800 font-medium">
                        👉 <strong>Login required to place order</strong>
                      </p>
                    </div>
                  )}

                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full flex items-center gap-2 justify-center mb-3 animate-slide-in-down"
                    style={{ animationDelay: '0.2s' }}
                    onClick={handleAddToCart}
                    disabled={addedToCart}
                  >
                    {addedToCart ? (
                      <>
                        <CheckCircle size={20} /> Added to Cart!
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={20} /> Add to Cart
                      </>
                    )}
                  </Button>

                  <Button
                    variant="success"
                    size="lg"
                    className="w-full flex items-center gap-2 justify-center mb-3 animate-slide-in-down"
                    style={{ animationDelay: '0.25s' }}
                    onClick={handleBuyNow}
                  >
                    💳 {isAuthenticated ? 'Buy Now' : 'Login & Buy'}
                  </Button>

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
                </div>
              </Card>

              {/* Farmer Info Card - Enhanced with FarmerDetailCard */}
              {farmer && (
                <FarmerDetailCard
                  farmer={farmer}
                  onViewProfile={() => navigate(`/farmer/${farmer.id || 1}`)}
                  onMessage={() => addToast('Farmer messaging coming soon!', 'info')}
                  onViewAllProducts={() => navigate(`/farmer/${farmer.id || 1}/products`)}
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
        message="Please login to place an order and complete your purchase securely"
      />
    </PageTransition>
  );
}
