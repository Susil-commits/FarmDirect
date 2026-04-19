import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useRouter } from '../../context/RouterContext.jsx';
import ProtectedRoute, { KYCVerified } from '../../components/common/ProtectedRoute.jsx';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import PageTransition from '../../components/common/PageTransition.jsx';
import ScrollAnimation from '../../components/common/ScrollAnimation.jsx';
import { TrendingUp, Package, Crop, AlertCircle } from 'lucide-react';
import { apiService } from '../../services/appService.js';

/**
 * PHASE 3: FARMER DASHBOARD
 * Farmer view for crops, orders, and earnings
 */
export default function FarmerDashboard() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [crops, setCrops] = useState([]);
  const [orders, setOrders] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchFarmerData = async () => {
      try {
        setLoading(true);
        const [cropsRes, ordersRes, earningsRes] = await Promise.all([
          apiService.get('/api/data/farmer/crops'),
          apiService.get('/api/data/farmer/orders'),
          apiService.get('/api/data/farmer/earnings')
        ]);

        setCrops(cropsRes.data || []);
        setOrders(ordersRes.data || []);
        setEarnings(earningsRes.data || {});
        setError(null);
      } catch (err) {
        console.error('Failed to fetch farmer data:', err);
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchFarmerData();
  }, []);

  return (
    <ProtectedRoute roles="farmer" requiredKYC={false}>
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 text-white py-12 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold mb-2">Farmer Dashboard</h1>
                  <p className="text-green-50">
                    Welcome back, <span className="font-semibold">{user?.name}</span>
                  </p>
                  {user?.kycStatus !== 'verified' && (
                    <div className="mt-4 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-lg w-fit">
                      <AlertCircle size={20} />
                      <span>⚠️ Complete KYC verification to list crops</span>
                    </div>
                  )}
                </div>
                <Crop size={48} className="text-green-200" />
              </div>
            </div>
          </div>

          {/* KYC Verification Banner */}
          {user?.kycStatus !== 'verified' && (
            <ScrollAnimation className="scroll-slide">
              <div className="max-w-6xl mx-auto px-4 py-6">
                <Card className="bg-yellow-50 border-2 border-yellow-300 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-yellow-900 mb-2">KYC Verification Required</h3>
                      <p className="text-yellow-800 text-sm">
                        Complete your KYC verification to start listing crops and earning from sales.
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/verification')}
                      className="px-6 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 font-semibold whitespace-nowrap"
                    >
                      Start Verification
                    </button>
                  </div>
                </Card>
              </div>
            </ScrollAnimation>
          )}

          <div className="max-w-6xl mx-auto px-4 py-12">
            {/* Tabs */}
            <div className="flex gap-4 mb-8 flex-wrap">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'crops', label: 'My Crops', icon: '🌾' },
                { id: 'orders', label: 'Orders', icon: '📦' },
                { id: 'earnings', label: 'Earnings', icon: '💰' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-green-600 text-white shadow-lg'
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
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div>
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
                  {/* Total Crops */}
                  <Card hover className="bg-gradient-to-br from-blue-50 to-white p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-gray-700 font-semibold">Total Crops</h3>
                      <Crop size={32} className="text-blue-600" />
                    </div>
                    <p className="text-4xl font-bold text-gray-900 mb-2">{crops.length}</p>
                    <p className="text-sm text-gray-600">Listed for sale</p>
                  </Card>

                  {/* Active Orders */}
                  <Card hover className="bg-gradient-to-br from-green-50 to-white p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-gray-700 font-semibold">Orders</h3>
                      <Package size={32} className="text-green-600" />
                    </div>
                    <p className="text-4xl font-bold text-gray-900 mb-2">
                      {orders.stats?.totalOrders || 0}
                    </p>
                    <p className="text-sm text-gray-600">
                      ✓ {orders.stats?.completedOrders || 0} completed
                    </p>
                  </Card>

                  {/* Total Earnings */}
                  <Card hover className="bg-gradient-to-br from-purple-50 to-white p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-gray-700 font-semibold">Total Earnings</h3>
                      <TrendingUp size={32} className="text-purple-600" />
                    </div>
                    <p className="text-4xl font-bold text-gray-900 mb-2">
                      ₹{(earnings.totalEarnings || 0).toLocaleString('en-IN')}
                    </p>
                    <p className="text-sm text-gray-600">
                      Avg: ₹{(earnings.averagePerOrder || 0).toLocaleString('en-IN')}
                    </p>
                  </Card>
                </div>

                {/* Quick Actions */}
                {user?.kycStatus === 'verified' && (
                  <KYCVerified fallback={null}>
                    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 mb-8">
                      <h3 className="text-lg font-bold mb-4 text-gray-900">Quick Actions</h3>
                      <div className="flex gap-4 flex-wrap">
                        <button
                          onClick={() => navigate('/create-crop')}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                        >
                          + Add New Crop
                        </button>
                        <button
                          onClick={() => setActiveTab('crops')}
                          className="px-6 py-2 bg-white text-green-600 border-2 border-green-600 rounded-lg hover:bg-green-50 font-semibold"
                        >
                          View All Crops
                        </button>
                        <button
                          onClick={() => setActiveTab('orders')}
                          className="px-6 py-2 bg-white text-green-600 border-2 border-green-600 rounded-lg hover:bg-green-50 font-semibold"
                        >
                          View Orders
                        </button>
                      </div>
                    </Card>
                  </KYCVerified>
                )}
              </ScrollAnimation>
            )}

            {/* CROPS TAB */}
            {activeTab === 'crops' && !loading && (
              <ScrollAnimation className="scroll-slide">
                <Card className="p-6">
                  <h3 className="text-2xl font-bold mb-6 text-gray-900">My Crops</h3>
                  {crops.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">
                      No crops listed yet.{' '}
                      <button
                        onClick={() => navigate('/create-crop')}
                        className="text-green-600 font-semibold hover:underline"
                      >
                        Create your first crop
                      </button>
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b-2 border-gray-200">
                          <tr>
                            <th className="pb-4">Crop Name</th>
                            <th className="pb-4">Price</th>
                            <th className="pb-4">Quantity</th>
                            <th className="pb-4">Status</th>
                            <th className="pb-4">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {crops.map(crop => (
                            <tr key={crop._id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-4 font-semibold">{crop.cropName}</td>
                              <td className="py-4">₹{crop.price}</td>
                              <td className="py-4">{crop.quantity} units</td>
                              <td className="py-4">
                                <span className={`px-3 py-1 rounded text-xs font-semibold ${
                                  crop.listingApprovalStatus === 'approved'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {crop.listingApprovalStatus}
                                </span>
                              </td>
                              <td className="py-4">
                                <button
                                  onClick={() => navigate(`/crop/${crop._id}`)}
                                  className="text-green-600 hover:text-green-700 font-semibold"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </ScrollAnimation>
            )}

            {/* ORDERS TAB */}
            {activeTab === 'orders' && !loading && (
              <ScrollAnimation className="scroll-slide">
                <Card className="p-6">
                  <h3 className="text-2xl font-bold mb-6 text-gray-900">Orders</h3>
                  {orders.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">No orders yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {orders.map(order => (
                        <Card
                          key={order._id}
                          className="border-l-4 border-green-600 p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">Order #{order._id.slice(-6)}</h4>
                            <span className={`px-3 py-1 rounded text-xs font-semibold ${
                              order.orderStatus === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {order.orderStatus}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {order.items?.length} items • ₹{order.totalPrice}
                          </p>
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>
              </ScrollAnimation>
            )}

            {/* EARNINGS TAB */}
            {activeTab === 'earnings' && !loading && (
              <ScrollAnimation className="scroll-slide">
                <Card className="bg-gradient-to-br from-purple-50 to-white p-6">
                  <h3 className="text-2xl font-bold mb-6 text-gray-900">Earnings Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-white rounded-lg border-2 border-purple-200">
                      <p className="text-gray-600 font-semibold mb-2">Total Earnings</p>
                      <p className="text-4xl font-bold text-purple-600">
                        ₹{(earnings.totalEarnings || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="p-6 bg-white rounded-lg border-2 border-green-200">
                      <p className="text-gray-600 font-semibold mb-2">Total Orders</p>
                      <p className="text-4xl font-bold text-green-600">{earnings.orderCount || 0}</p>
                    </div>
                    <div className="p-6 bg-white rounded-lg border-2 border-blue-200">
                      <p className="text-gray-600 font-semibold mb-2">Average Order Value</p>
                      <p className="text-4xl font-bold text-blue-600">
                        ₹{(earnings.averagePerOrder || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </Card>
              </ScrollAnimation>
            )}
          </div>
        </div>
      </PageTransition>
    </ProtectedRoute>
  );
}
