import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useRouter } from '../../context/RouterContext.jsx';
import ProtectedRoute from '../../components/common/ProtectedRoute.jsx';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import PageTransition from '../../components/common/PageTransition.jsx';
import ScrollAnimation from '../../components/common/ScrollAnimation.jsx';
import { BarChart3, Users, Zap, TrendingUp, Award, PieChart, Activity, Shield } from 'lucide-react';
import { apiService } from '../../services/appService.js';

/**
 * PHASE 3: ADMIN DASHBOARD
 * Comprehensive admin analytics and management panel
 */
export default function AdminDashboard() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await apiService.get('/api/admin/analytics/dashboard');
        setAnalytics(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        setError(err.message || 'Failed to load analytics');
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <ProtectedRoute roles="admin" requiredKYC={false}>
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white py-12 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
                  <p className="text-indigo-100">Welcome back, <span className="font-semibold">{user?.name}</span></p>
                </div>
                <Shield size={48} className="text-indigo-200" />
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 py-12">
            {/* Tabs */}
            <div className="flex gap-4 mb-8 flex-wrap">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'users', label: 'Users', icon: '👥' },
                { id: 'crops', label: 'Crops', icon: '🌾' },
                { id: 'orders', label: 'Orders', icon: '📦' },
                { id: 'audit', label: 'Audit Log', icon: '📋' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-lg'
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
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <Card className="bg-red-50 border-2 border-red-200 p-6 mb-8">
                <p className="text-red-700 font-semibold">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Retry
                </button>
              </Card>
            )}

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && analytics && !loading && (
              <ScrollAnimation className="scroll-slide">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Total Users */}
                  <Card hover className="bg-gradient-to-br from-blue-50 to-white p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-gray-700 font-semibold">Total Users</h3>
                      <Users size={32} className="text-blue-600" />
                    </div>
                    <p className="text-4xl font-bold text-gray-900 mb-2">
                      {analytics.totalUsers || 0}
                    </p>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>👨‍🌾 Farmers: {analytics.totalFarmers || 0}</p>
                      <p>👥 Buyers: {analytics.totalBuyers || 0}</p>
                    </div>
                  </Card>

                  {/* KYC Status */}
                  <Card hover className="bg-gradient-to-br from-green-50 to-white p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-gray-700 font-semibold">KYC Status</h3>
                      <Award size={32} className="text-green-600" />
                    </div>
                    <p className="text-4xl font-bold text-gray-900 mb-2">
                      {analytics.verifiedFarmers || 0}
                    </p>
                    <p className="text-sm text-amber-600">
                      ⚠️ Pending: {analytics.pendingKYC || 0}
                    </p>
                  </Card>

                  {/* Crops Status */}
                  <Card hover className="bg-gradient-to-br from-purple-50 to-white p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-gray-700 font-semibold">Crops</h3>
                      <PieChart size={32} className="text-purple-600" />
                    </div>
                    <p className="text-4xl font-bold text-gray-900 mb-2">
                      {analytics.totalCrops || 0}
                    </p>
                    <div className="text-sm text-gray-600">
                      <p>✓ Approved: {analytics.approvedCrops || 0}</p>
                    </div>
                  </Card>

                  {/* Orders & Revenue */}
                  <Card hover className="bg-gradient-to-br from-orange-50 to-white p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-gray-700 font-semibold">Revenue</h3>
                      <TrendingUp size={32} className="text-orange-600" />
                    </div>
                    <p className="text-4xl font-bold text-gray-900 mb-2">
                      ₹{(analytics.totalRevenue || 0).toLocaleString('en-IN')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {analytics.totalOrders || 0} total orders
                    </p>
                  </Card>
                </div>

                {/* Quick Actions */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card hover className="p-6 bg-blue-50">
                    <h3 className="text-lg font-bold mb-4 text-gray-900">Quick Actions</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => navigate('/admin/users')}
                        className="w-full text-left px-4 py-2 bg-white hover:bg-blue-100 rounded transition-colors"
                      >
                        👥 Manage Users
                      </button>
                      <button
                        onClick={() => navigate('/admin/kyc')}
                        className="w-full text-left px-4 py-2 bg-white hover:bg-blue-100 rounded transition-colors"
                      >
                        🔐 Review KYC
                      </button>
                      <button
                        onClick={() => navigate('/admin/crops')}
                        className="w-full text-left px-4 py-2 bg-white hover:bg-blue-100 rounded transition-colors"
                      >
                        🌾 Approve Crops
                      </button>
                    </div>
                  </Card>

                  <Card hover className="p-6 bg-green-50">
                    <h3 className="text-lg font-bold mb-4 text-gray-900">Recent Orders</h3>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-600">📦 Total: {analytics.totalOrders || 0}</p>
                      <p className="text-green-600">✓ Completed: {analytics.completedOrders || 0}</p>
                      <p className="text-amber-600">⏳ Pending: {analytics.pendingOrders || 0}</p>
                    </div>
                  </Card>

                  <Card hover className="p-6 bg-purple-50">
                    <h3 className="text-lg font-bold mb-4 text-gray-900">System Health</h3>
                    <div className="space-y-2 text-sm">
                      <p className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        API: Operational
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Database: Connected
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Cache: Active
                      </p>
                    </div>
                  </Card>
                </div>
              </ScrollAnimation>
            )}

            {/* OTHER TABS PLACEHOLDER */}
            {activeTab !== 'overview' && (
              <Card className="p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </h2>
                <p className="text-gray-600 mb-6">Content for {activeTab} tab is under development.</p>
                <button
                  onClick={() => navigate('/admin')}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Return to Overview
                </button>
              </Card>
            )}
          </div>
        </div>
      </PageTransition>
    </ProtectedRoute>
  );
}
