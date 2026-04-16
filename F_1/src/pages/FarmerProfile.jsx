import { useState, useEffect } from 'react';
import { MapPin, Mail, PhoneCall, Award, TrendingUp, Users, Star, ArrowLeft, ShoppingCart, Heart } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import PageTransition from '../components/common/PageTransition.jsx';
import ScrollAnimation from '../components/common/ScrollAnimation';
import Avatar from '../components/common/Avatar';
import RelatedProducts from '../components/common/RelatedProducts';
import { useRouter } from '../context/RouterContext';
import { useWishlist } from '../context/WishlistContext';
import { cropService, userService } from '../services/appService';

export default function FarmerProfile() {
  const { navigate, params } = useRouter();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const farmerId = params?.farmerId || 1;

  const [farmer, setFarmer] = useState(null);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sample farmer data
  const sampleFarmer = {
    id: farmerId,
    name: 'Rajesh Kumar Singh',
    email: 'rajesh@farm.com',
    phone: '+91-98765-43210',
    location: 'Ludhiana, Punjab',
    joinedDate: 'Jan 2023',
    yearsExperience: 15,
    verified: true,
    bio: 'Dedicated organic farmer with 15+ years of experience in vegetable cultivation. Using sustainable farming methods and latest agricultural techniques to produce high-quality produce.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    stats: {
      totalSales: 1245,
      activeListings: 12,
      followers: 342,
      rating: 4.8,
      reviewCount: 186,
    },
    certifications: ['Organic Certified', 'ISO 22000', 'APEDA Registered', 'FPO Member'],
    about: {
      farmSize: '25 acres',
      cropTypes: 'Vegetables, Herbs, Organic Produce',
      methods: 'Organic, Natural, Sustainable',
      serviceArea: 'Pan-India delivery available',
    }
  };

  // Sample crops
  const sampleCrops = [
    { id: 1, name: 'Fresh Organic Tomatoes', price: 45, rating: 4.8, reviews: 24, image: 'https://images.unsplash.com/photo-1592841496694-e91a2dbe3534?w=400&h=400&fit=crop', quantity: 150, farmer_verified: true, certifications: ['Organic'] },
    { id: 2, name: 'Organic Cucumbers', price: 35, rating: 4.6, reviews: 18, image: 'https://images.unsplash.com/photo-1609137144813-2e231ebd96e3?w=400&h=400&fit=crop', quantity: 80, farmer_verified: true },
    { id: 3, name: 'Fresh Bell Peppers', price: 60, rating: 4.7, reviews: 22, image: 'https://images.unsplash.com/photo-1599599810694-b9efb4ffd8b0?w=400&h=400&fit=crop', quantity: 50, farmer_verified: true },
    { id: 4, name: 'Organic Lettuce', price: 25, rating: 4.5, reviews: 15, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop', quantity: 100, farmer_verified: true },
    { id: 5, name: 'Fresh Carrots', price: 40, rating: 4.9, reviews: 28, image: 'https://images.unsplash.com/photo-1447621334519-51cf6537b839?w=400&h=400&fit=crop', quantity: 120, farmer_verified: true },
    { id: 6, name: 'Organic Spinach', price: 30, rating: 4.7, reviews: 16, image: 'https://images.unsplash.com/photo-1511621776486-a01980e01a18?w=400&h=400&fit=crop', quantity: 60, farmer_verified: true },
  ];

  useEffect(() => {
    const fetchFarmerData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // In real app: const response = await userService.getFarmerProfile(farmerId);
        // For now, use sample data
        setFarmer(sampleFarmer);
        
        // Fetch farmer's crops
        const cropsResponse = await cropService.getFarmerCrops(farmerId);
        setCrops(cropsResponse.data?.crops || sampleCrops);
      } catch (err) {
        console.error('Failed to fetch farmer profile:', err);
        setFarmer(sampleFarmer);
        setCrops(sampleCrops);
      } finally {
        setLoading(false);
      }
    };

    fetchFarmerData();
  }, [farmerId]);

  if (error && !farmer) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-linear-to-br from-white via-green-50 to-white py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
              <ArrowLeft size={16} /> Go Back
            </Button>
            <Card variant="warning">
              <div className="p-8 text-center">
                <p className="font-semibold text-gray-900 mb-4">Unable to load farmer profile</p>
                <Button variant="primary" onClick={() => navigate('/marketplace')}>
                  Back to Marketplace
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-linear-to-br from-white via-green-50 to-white py-8 px-4 relative">
        <div className="absolute inset-0 premium-gradient pointer-events-none"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          
          {/* Back Button */}
          <ScrollAnimation className="scroll-slide mb-6">
            <Button variant="outline" onClick={() => navigate(-1)} className="inline-flex items-center gap-2">
              <ArrowLeft size={16} /> Go Back
            </Button>
          </ScrollAnimation>

          {/* Farmer Header Card */}
          {farmer && (
            <ScrollAnimation className="scroll-slide mb-8">
              <Card variant="deep" animated={false} className="overflow-hidden">
                <div className="relative h-40 bg-linear-to-r from-green-400 to-emerald-500">
                  <div className="absolute inset-0 opacity-10 pattern-bg"></div>
                </div>

                <div className="px-6 py-8 pb-12 relative -mt-12 flex flex-col sm:flex-row items-start sm:items-end gap-6">
                  {/* Farmer Avatar */}
                  <div className="shrink-0">
                    <Avatar 
                      user={farmer} 
                      size="xl" 
                      className="border-4 border-white shadow-lg"
                    />
                  </div>

                  {/* Farmer Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900">{farmer.name}</h1>
                      {farmer.verified && (
                        <Badge label="✓ Verified" variant="primary" size="md" />
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 mb-4 text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin size={18} className="text-green-600" />
                        {farmer.location}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={18} className="text-green-600" />
                        {farmer.email}
                      </div>
                      {farmer.phone && (
                        <div className="flex items-center gap-2">
                          <PhoneCall size={18} className="text-green-600" />
                          {farmer.phone}
                        </div>
                      )}
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 font-semibold mb-1">Sales</p>
                        <p className="text-lg font-bold text-blue-600">{farmer.stats.totalSales}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 font-semibold mb-1">Listings</p>
                        <p className="text-lg font-bold text-green-600">{farmer.stats.activeListings}</p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 font-semibold mb-1">Followers</p>
                        <p className="text-lg font-bold text-purple-600">{farmer.stats.followers}</p>
                      </div>
                      <div className="bg-amber-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 font-semibold mb-1">Rating</p>
                        <p className="text-lg font-bold text-amber-600">⭐ {farmer.stats.rating}</p>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 font-semibold mb-1">Reviews</p>
                        <p className="text-lg font-bold text-red-600">{farmer.stats.reviewCount}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="primary" className="flex-1 sm:flex-none">
                      Follow Farmer
                    </Button>
                    <Button variant="outline" className="flex-1 sm:flex-none">
                      Message
                    </Button>
                  </div>
                </div>
              </Card>
            </ScrollAnimation>
          )}

          {/* Farmer Details Grid */}
          {farmer && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              {/* Bio & About */}
              <ScrollAnimation className="scroll-slide lg:col-span-2">
                <Card variant="light" animated={false}>
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span>📖</span> About
                    </h2>
                    <p className="text-gray-700 leading-relaxed mb-6">{farmer.bio}</p>

                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(farmer.about).map(([key, value]) => (
                        <div key={key} className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-xs font-semibold text-gray-600 uppercase mb-1">{key.replace(/([A-Z])/g, ' $1')}</p>
                          <p className="font-bold text-gray-900">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </ScrollAnimation>

              {/* Certifications */}
              <ScrollAnimation className="scroll-slide">
                <Card variant="light" animated={false}>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Award size={20} className="text-amber-500" /> Certifications
                    </h3>
                    <div className="space-y-3">
                      {farmer.certifications.map((cert, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <span className="text-2xl">🏆</span>
                          <div>
                            <p className="font-semibold text-gray-900">{cert}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </ScrollAnimation>
            </div>
          )}

          {/* Farmer's Products Section */}
          <ScrollAnimation className="scroll-slide">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2">
              <span>🌾</span> All Products from {farmer?.name || 'This Farmer'}
            </h2>

            {crops.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {crops.map((crop, idx) => (
                  <Card key={crop.id} hover animated={true} className="stagger-item" style={{ animationDelay: `${idx * 0.08}s` }}>
                    <div className="p-4 relative group">
                      {/* Image */}
                      <div className="relative mb-4 overflow-hidden rounded-lg">
                        <div className="bg-linear-to-br from-green-100 to-emerald-100 rounded-lg relative min-h-40 flex items-center justify-center group-hover:shadow-lg transition-shadow">
                          {crop.image && crop.image.startsWith('http') ? (
                            <img
                              src={crop.image}
                              alt={crop.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <span className="text-5xl">{crop.image || '🌾'}</span>
                          )}
                        </div>

                        {/* Wishlist */}
                        <button 
                          onClick={() => {
                            if (isInWishlist(crop.id)) {
                              removeFromWishlist(crop.id);
                            } else {
                              addToWishlist(crop);
                            }
                          }}
                          className="absolute top-4 right-4 p-2 rounded-full bg-white hover:bg-red-50 transition-colors z-10"
                        >
                          <Heart 
                            size={20} 
                            fill={isInWishlist(crop.id) ? 'currentColor' : 'none'}
                            className={isInWishlist(crop.id) ? 'text-red-600' : 'text-gray-400'}
                          />
                        </button>
                      </div>

                      {/* Info */}
                      <h3 className="font-bold text-gray-900 mb-1">{crop.name}</h3>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-lg font-bold text-green-600">₹{crop.price}/kg</span>
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">⭐</span>
                          <span className="text-sm font-semibold">{crop.rating}</span>
                          <span className="text-xs text-gray-500">({crop.reviews})</span>
                        </div>
                      </div>

                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => navigate(`/crop/${crop.id}`)}
                      >
                        <ShoppingCart size={16} /> View Details
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card variant="light">
                <div className="p-12 text-center">
                  <p className="text-gray-500 text-lg">No products available at the moment</p>
                </div>
              </Card>
            )}
          </ScrollAnimation>
        </div>
      </div>
    </PageTransition>
  );
}
