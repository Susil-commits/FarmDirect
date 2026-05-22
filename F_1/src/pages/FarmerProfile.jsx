import { useState, useEffect } from 'react';
import { MapPin, Mail, PhoneCall, Award, TrendingUp, Users, Star, ArrowLeft, ShoppingCart, Heart, Shield, CheckCircle, Zap, CalendarDays, Package, Activity } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import PageTransition from '../components/common/PageTransition.jsx';
import ScrollAnimation from '../components/common/ScrollAnimation';
import Avatar from '../components/common/Avatar';
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
  const [activeTab, setActiveTab] = useState('products');

  useEffect(() => {
    const fetchFarmerData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const farmerResponse = await userService.getFarmerProfile(farmerId);
        const farmerData = farmerResponse.data || farmerResponse;
        setFarmer(farmerData);
        
        const cropsResponse = await cropService.getFarmerCrops(farmerId);
        const cropsData = cropsResponse.crops || cropsResponse.data?.crops || [];
        setCrops(cropsData);
      } catch (err) {
        console.error('Failed to fetch farmer profile:', err);
        setError(err?.message || 'Failed to load farmer profile');
      } finally {
        setLoading(false);
      }
    };

    fetchFarmerData();
  }, [farmerId]);

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-4 border-slate-600 border-t-emerald-400 animate-spin mx-auto mb-4"></div>
            <p className="text-slate-300 font-medium">Loading farmer profile...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error && !farmer) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Premium Header Section */}
        <div className="relative h-64 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-white rounded-full filter blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-emerald-400 rounded-full filter blur-3xl animate-pulse"></div>
          </div>

          {/* Header Content */}
          <div className="relative h-full flex items-center px-6 md:px-12">
            <div className="flex items-center gap-8 w-full">
              {/* Avatar */}
              <div className="relative">
                <div className="w-40 h-40 rounded-3xl bg-white shadow-2xl p-3 ring-4 ring-white transform hover:scale-105 transition duration-300">
                  <Avatar user={farmer} size="xl" className="w-full h-full" />
                </div>
              </div>

              {/* Info */}
              <div className="text-white flex-1">
                <h1 className="text-5xl font-black mb-2">{farmer?.name || 'Farmer'}</h1>
                <div className="flex items-center gap-3 flex-wrap mb-4">
                  <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition">
                    <Shield size={16} /> Verified Farmer
                  </span>
                  {farmer?.verified && (
                    <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold bg-green-400/20 backdrop-blur-sm border border-green-400/30 text-green-100">
                      <CheckCircle size={16} /> KYC Verified
                    </span>
                  )}
                  <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold bg-emerald-400/20 backdrop-blur-sm border border-emerald-400/30 text-emerald-100">
                    <Zap size={16} /> Active Farmer
                  </span>
                </div>
                <div className="flex items-center gap-4 text-emerald-100 text-sm flex-wrap">
                  {farmer?.location && (
                    <span className="flex items-center gap-1"><MapPin size={14} /> {farmer.location}</span>
                  )}
                  {farmer?.email && (
                    <span className="flex items-center gap-1"><Mail size={14} /> {farmer.email}</span>
                  )}
                  {farmer?.phone && (
                    <span className="flex items-center gap-1"><PhoneCall size={14} /> {farmer.phone}</span>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="hidden lg:grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wide">Rating</p>
                  <p className="text-3xl font-bold text-white mt-1">⭐ {farmer?.stats?.rating || '4.8'}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wide">Listings</p>
                  <p className="text-3xl font-bold text-white mt-1">{farmer?.stats?.activeListings || crops.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-8 pb-12 relative z-10">
          {/* Tab Navigation */}
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-2xl shadow-2xl p-2 mb-8 flex gap-2 overflow-x-auto border border-slate-600">
            {[
              { id: 'products', label: '🌾 Products', icon: Package },
              { id: 'about', label: '📖 About', icon: Shield },
              { id: 'stats', label: '📊 Stats', icon: Activity },
              { id: 'certifications', label: '🏆 Certs', icon: Award }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 rounded-xl font-bold transition duration-300 whitespace-nowrap transform hover:scale-105 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
                }`}
              >
                {tab.icon && <tab.icon size={18} />}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span>🌾</span> All Products from {farmer?.name || 'This Farmer'}
                </h2>
                <span className="text-slate-400 text-sm">{crops.length} products</span>
              </div>

              {crops.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {crops.map((crop, idx) => (
                    <div key={crop.id || crop._id || idx} className="bg-slate-700/50 border border-slate-600 rounded-xl overflow-hidden hover:shadow-2xl hover:border-emerald-500/50 transition duration-300 transform hover:scale-[1.02]">
                      <div className="p-4 relative group">
                        {/* Image */}
                        <div className="relative mb-4 overflow-hidden rounded-lg">
                          <div className="bg-gradient-to-br from-emerald-900/50 to-green-900/50 rounded-lg relative min-h-40 flex items-center justify-center group-hover:shadow-lg transition-shadow">
                            {crop.image && (crop.image.startsWith('http') || crop.image.startsWith('/')) ? (
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
                              if (isInWishlist(crop.id || crop._id)) {
                                removeFromWishlist(crop.id || crop._id);
                              } else {
                                addToWishlist(crop);
                              }
                            }}
                            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-red-500/20 transition-colors z-10 backdrop-blur-sm"
                          >
                            <Heart 
                              size={20} 
                              fill={isInWishlist(crop.id || crop._id) ? 'currentColor' : 'none'}
                              className={isInWishlist(crop.id || crop._id) ? 'text-red-400' : 'text-slate-300'}
                            />
                          </button>
                        </div>

                        {/* Info */}
                        <h3 className="font-bold text-white mb-1">{crop.name}</h3>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-lg font-bold text-emerald-400">₹{crop.price}/kg</span>
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-400">⭐</span>
                            <span className="text-sm font-semibold text-slate-300">{crop.rating || '4.5'}</span>
                            <span className="text-xs text-slate-500">({crop.reviews || 0})</span>
                          </div>
                        </div>

                        <Button 
                          variant="primary" 
                          size="sm" 
                          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                          onClick={() => navigate(`/crop/${crop.id || crop._id}`)}
                        >
                          <ShoppingCart size={16} /> View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-700/50 border border-slate-600 rounded-xl">
                  <div className="p-12 text-center">
                    <Package size={48} className="text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">No products available at the moment</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && farmer && (
            <div className="space-y-6">
              {/* Bio Card */}
              <div className="bg-slate-700/50 border border-slate-600 rounded-xl text-white">
                <div className="p-8">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <span>📖</span> About {farmer.name}
                  </h2>
                  <p className="text-slate-300 leading-relaxed text-lg mb-8">{farmer.bio || 'A dedicated farmer committed to providing fresh, quality produce.'}</p>

                  {/* Contact Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-700/20 border border-emerald-500/30 rounded-xl p-6 hover:shadow-lg transition">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-emerald-500/30 p-3 rounded-lg">
                          <MapPin size={20} className="text-emerald-400" />
                        </div>
                        <p className="text-sm font-bold text-emerald-200 uppercase tracking-wide">Location</p>
                      </div>
                      <p className="text-xl font-bold">{farmer.location || 'Not specified'}</p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 border border-blue-500/30 rounded-xl p-6 hover:shadow-lg transition">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-blue-500/30 p-3 rounded-lg">
                          <Mail size={20} className="text-blue-400" />
                        </div>
                        <p className="text-sm font-bold text-blue-200 uppercase tracking-wide">Email</p>
                      </div>
                      <p className="text-xl font-bold break-all">{farmer.email || 'Not provided'}</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 border border-purple-500/30 rounded-xl p-6 hover:shadow-lg transition">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-purple-500/30 p-3 rounded-lg">
                          <PhoneCall size={20} className="text-purple-400" />
                        </div>
                        <p className="text-sm font-bold text-purple-200 uppercase tracking-wide">Phone</p>
                      </div>
                      <p className="text-xl font-bold">{farmer.phone || 'Not provided'}</p>
                    </div>
                  </div>

                  {/* About Details */}
                  {farmer.about && Object.keys(farmer.about).length > 0 && (
                    <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {Object.entries(farmer.about).map(([key, value]) => (
                        <div key={key} className="p-4 bg-slate-800/50 rounded-lg border border-slate-600">
                          <p className="text-xs font-semibold text-slate-400 uppercase mb-1">{key.replace(/([A-Z])/g, ' $1')}</p>
                          <p className="font-bold text-white">{value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button variant="primary" className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600">
                  Follow Farmer
                </Button>
                <Button variant="outline" className="flex-1 border-slate-500 text-slate-300 hover:bg-slate-700">
                  Message
                </Button>
              </div>
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && farmer && (
            <div className="space-y-6">
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 border-0 text-white rounded-xl overflow-hidden hover:shadow-2xl transition duration-300 transform hover:scale-105 cursor-pointer">
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                        <TrendingUp size={28} />
                      </div>
                      <TrendingUp size={24} className="text-emerald-200" />
                    </div>
                    <p className="text-emerald-100 text-sm font-semibold uppercase tracking-wide">Total Sales</p>
                    <p className="text-5xl font-black mt-2">{farmer.stats?.totalSales || '0'}</p>
                    <p className="text-emerald-200 text-xs mt-3">Completed orders</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-600 to-teal-700 border-0 text-white rounded-xl overflow-hidden hover:shadow-2xl transition duration-300 transform hover:scale-105 cursor-pointer">
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                        <Package size={28} />
                      </div>
                      <TrendingUp size={24} className="text-teal-200" />
                    </div>
                    <p className="text-teal-100 text-sm font-semibold uppercase tracking-wide">Active Listings</p>
                    <p className="text-5xl font-black mt-2">{farmer.stats?.activeListings || crops.length}</p>
                    <p className="text-teal-200 text-xs mt-3">Products on marketplace</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-600 to-orange-700 border-0 text-white rounded-xl overflow-hidden hover:shadow-2xl transition duration-300 transform hover:scale-105 cursor-pointer">
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                        <Star size={28} />
                      </div>
                      <TrendingUp size={24} className="text-orange-200" />
                    </div>
                    <p className="text-orange-100 text-sm font-semibold uppercase tracking-wide">Rating</p>
                    <p className="text-5xl font-black mt-2">⭐ {farmer.stats?.rating || '4.8'}</p>
                    <p className="text-orange-200 text-xs mt-3">From {farmer.stats?.reviewCount || '0'} reviews</p>
                  </div>
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div className="bg-slate-700/50 border border-slate-600 text-white rounded-xl">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-gradient-to-br from-emerald-400 to-green-600 p-3 rounded-lg">
                        <Users size={24} />
                      </div>
                      <h3 className="text-xl font-bold">Followers</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Total Followers</span>
                        <span className="text-2xl font-bold text-emerald-400">{farmer.stats?.followers || '0'}</span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div className="bg-gradient-to-r from-emerald-400 to-green-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                      <p className="text-xs text-slate-400">Growing community</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-700/50 border border-slate-600 text-white rounded-xl">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-gradient-to-br from-blue-400 to-indigo-600 p-3 rounded-lg">
                        <CalendarDays size={24} />
                      </div>
                      <h3 className="text-xl font-bold">Member Since</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Joined</span>
                        <span className="text-2xl font-bold text-blue-400">{farmer.joinedDate || 'Jan 2024'}</span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div className="bg-gradient-to-r from-blue-400 to-indigo-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                      <p className="text-xs text-slate-400">Active member</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-700/50 border border-slate-600 text-white rounded-xl">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-gradient-to-br from-purple-400 to-pink-600 p-3 rounded-lg">
                        <Award size={24} />
                      </div>
                      <h3 className="text-xl font-bold">Certifications</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Total Certs</span>
                        <span className="text-2xl font-bold text-purple-400">{farmer.certifications?.length || '0'}</span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div className="bg-gradient-to-r from-purple-400 to-pink-500 h-2 rounded-full" style={{ width: `${Math.min((farmer.certifications?.length || 0) * 25, 100)}%` }}></div>
                      </div>
                      <p className="text-xs text-slate-400">Quality assured</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Certifications Tab */}
          {activeTab === 'certifications' && farmer && (
            <div className="space-y-6">
              <div className="bg-slate-700/50 border border-slate-600 rounded-xl text-white">
                <div className="p-8">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Award size={24} className="text-amber-400" /> Certifications & Achievements
                  </h2>
                  
                  {farmer.certifications && farmer.certifications.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {farmer.certifications.map((cert, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-4 bg-gradient-to-br from-amber-600/20 to-amber-700/20 border border-amber-500/30 rounded-xl hover:shadow-lg transition">
                          <div className="bg-amber-500/30 p-3 rounded-lg">
                            <span className="text-3xl">🏆</span>
                          </div>
                          <div>
                            <p className="font-bold text-white text-lg">{cert}</p>
                            <p className="text-amber-300 text-sm">Verified Certification</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Award size={48} className="text-slate-500 mx-auto mb-4" />
                      <p className="text-slate-400 text-lg">No certifications listed yet</p>
                      <p className="text-slate-500 text-sm mt-2">Certifications will appear here once added</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
