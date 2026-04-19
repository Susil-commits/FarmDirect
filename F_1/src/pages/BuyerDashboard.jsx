import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useRouter } from '../../context/RouterContext.jsx';
import ProtectedRoute from '../../components/common/ProtectedRoute.jsx';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import PageTransition from '../../components/common/PageTransition.jsx';
import ScrollAnimation from '../../components/common/ScrollAnimation.jsx';
import { ShoppingBag, Heart, Truck, Star } from 'lucide-react';
import { apiService } from '../../services/appService.js';

/**
 * PHASE 3: BUYER DASHBOARD
 * Buyer view for orders, wishlist, and purchase history
 */
export default function BuyerDashboard() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchBuyerData = async () => {
      try {
        setLoading(true);
        const [ordersRes, wishlistRes] = await Promise.all([
          apiService.get('/api/data/buyer/orders'),
          apiService.get('/api/data/buyer/wishlist')
        ]);

        setOrders(ordersRes.data || []);
        setWishlist(wishlistRes.data || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch buyer data:', err);
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchBuyerData();
  }, []);

  return (
    <ProtectedRoute roles="buyer" requiredKYC={false}>
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-700 text-white py-12 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold mb-2">Buyer Dashboard</h1>
                  <p className="text-blue-50">
                    Welcome back, <span className="font-semibold">{user?.name}</span>
                  </p>
                </div>
                <ShoppingBag size={48} className="text-blue-200" />
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 py-12">
            {/* Tabs */}
            <div className="flex gap-4 mb-8 flex-wrap">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'orders', label: 'Orders', icon: '📦' },
                { id: 'wishlist', label: 'Wishlist', icon: '❤️' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <Card className="bg-red-50 border-2 border-red-200 p-6 mb-8">
                <p className="text-red-700 font-semibold">{error}</p>
              </Card>
            )}

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && !loading && (
              <ScrollAnimation className="scroll-slide">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {/* Total Orders */}
                  <Card hover className="bg-gradient-to-br from-blue-50 to-white p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-gray-700 font-semibold">Total Orders</h3>
                      <ShoppingBag size={32} className="text-blue-600" />
                    </div>
                    <p className="text-4xl font-bold text-gray-900 mb-2">
                      {orders.stats?.totalOrders || 0}
                    </p>
                    <p className="text-sm text-gray-600">
                      ✓ {orders.stats?.completedOrders || 0} completed
                    </p>
                  </Card>

                  {/* Total Spent */}
                  <Card hover className="bg-gradient-to-br from-green-50 to-white p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-gray-700 font-semibold">Total Spent</h3>
                      <Truck size={32} className="text-green-600" />
                    </div>
                    <p className="text-4xl font-bold text-gray-900 mb-2">
                      ₹{(orders.stats?.totalSpent || 0).toLocaleString('en-IN')}
                    </p>
                    <p className="text-sm text-gray-600">
                      Average: ₹{orders.stats?.totalOrders ? 
                        Math.round(orders.stats.totalSpent / orders.stats.totalOrders).toLocaleString('en-IN')
                        : '0'
                      }
                    </p>
                  </Card>

                  {/* Wishlist */}
                  <Card hover className="bg-gradient-to-br from-red-50 to-white p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-gray-700 font-semibold">Wishlist Items</h3>
                      <Heart size={32} className="text-red-600" />
                    </div>
                    <p className="text-4xl font-bold text-gray-900 mb-2">{wishlist.length || 0}</p>
                    <p className="text-sm text-gray-600">Saved for later</p>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 mb-8">
                  <h3 className="text-lg font-bold mb-4 text-gray-900">Quick Actions</h3>
                  <div className="flex gap-4 flex-wrap">
                    <button
                      onClick={() => navigate('/marketplace')}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                    >
                      🛍️ Browse Crops
                    </button>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="px-6 py-2 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 font-semibold"
                    >
                      📦 View Orders
                    </button>
                    <button
                      onClick={() => setActiveTab('wishlist')}
                      className="px-6 py-2 bg-white text-red-600 border-2 border-red-600 rounded-lg hover:bg-red-50 font-semibold"
                    >
                      ❤️ Wishlist
                    </button>
                  </div>
                </Card>

                {/* Recent Activity */}
                {orders.length > 0 && (
                  <Card className="p-6">
                    <h3 className="text-lg font-bold mb-4 text-gray-900">Recent Orders</h3>
                    <div className="space-y-3">
                      {orders.slice(0, 3).map(order => (
                        <div
                          key={order._id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">Order #{order._id.slice(-6)}</p>
                            <p className="text-sm text-gray-600">{order.items?.length} items</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">₹{order.totalPrice}</p>
                            <span className={`text-xs px-2 py-1 rounded ${
                              order.orderStatus === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {order.orderStatus}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </ScrollAnimation>
            )}

            {/* ORDERS TAB */}
            {activeTab === 'orders' && !loading && (
              <ScrollAnimation className="scroll-slide">
                <Card className="p-6">
                  <h3 className="text-2xl font-bold mb-6 text-gray-900">My Orders</h3>
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-600 text-lg mb-6">You haven't placed any orders yet.</p>
                      <button
                        onClick={() => navigate('/marketplace')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                      >
                        Start Shopping
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map(order => (
                        <Card
                          key={order._id}
                          className="border-l-4 border-blue-600 p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">Order #{order._id.slice(-6)}</h4>
                              <p className="text-sm text-gray-600">
                                {order.items?.length} items • {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded text-xs font-semibold ${
                              order.orderStatus === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {order.orderStatus}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-lg font-bold text-gray-900">₹{order.totalPrice}</p>
                            <button
                              onClick={() => navigate(`/order/${order._id}`)}
                              className="text-blue-600 hover:text-blue-700 font-semibold"
                            >
                              View Details →
                            </button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>
              </ScrollAnimation>
            )}

            {/* WISHLIST TAB */}
            {activeTab === 'wishlist' && !loading && (
              <ScrollAnimation className="scroll-slide">
                <Card className="p-6">
                  <h3 className="text-2xl font-bold mb-6 text-gray-900">My Wishlist</h3>
                  {wishlist.length === 0 ? (
                    <div className="text-center py-12">
                      <Heart size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-600 text-lg mb-6">Your wishlist is empty.</p>
                      <button
                        onClick={() => navigate('/marketplace')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                      >
                        Explore Marketplace
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {wishlist.map(crop => (
                        <Card key={crop._id} hover className="overflow-hidden">
                          {crop.images && crop.images[0] && (
                            <img
                              src={crop.images[0]}
                              alt={crop.cropName}
                              className="w-full h-32 object-cover"
                            />
                          )}
                          <div className="p-4">
                            <h4 className="font-bold text-gray-900 mb-2">{crop.cropName}</h4>
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{crop.description}</p>
                            <div className="flex items-center justify-between">
                              <p className="text-2xl font-bold text-blue-600">₹{crop.price}</p>
                              <button
                                onClick={() => navigate('/marketplace')}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                              >
                                Buy
                              </button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>
              </ScrollAnimation>
            )}
          </div>
        </div>
      </PageTransition>
    </ProtectedRoute>
  );
}
