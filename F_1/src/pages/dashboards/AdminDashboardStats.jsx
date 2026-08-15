import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../hooks/useRouter';
import { adminService } from '../../services/appService';
import PageTransition from '../../components/common/PageTransition.jsx';
import Card from '../../components/common/Card';
import LogoutConfirmationModal from '../../components/common/LogoutConfirmationModal';
import { BarChart3, Users, Package, AlertTriangle, LogOut, TrendingUp, ShoppingBag } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function AdminDashboardStats() {
  const { user, logout } = useAuth();
  const { navigate } = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    farmers: 0,
    buyers: 0,
    totalCrops: 0,
    pendingFarmers: 0
  });
  const [_loading, _setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
       
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      _setLoading(true);
      const data = await adminService.getDashboardStats();
      setStats({
        totalUsers: data.data?.users?.total || 0,
        farmers: data.data?.users?.farmers || 0,
        buyers: data.data?.users?.buyers || 0,
        admins: data.data?.users?.admins || 0,
        totalCrops: data.data?.crops?.total || 0,
        activeCrops: data.data?.crops?.active || 0,
        pendingFarmers: data.data?.pendingKYC || 0,
        orders: data.data?.orders || { pending: 0, completed: 0, total: 0, totalRevenue: 0 }
      });
    } catch (error) {
      console.error('❌ Error fetching data:', error);
    } finally {
      _setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center px-4 pt-28 pb-12">
          <div className="text-center">
            <AlertTriangle size={48} className="mx-auto mb-4 text-orange-500" />
            <h2 className="text-3xl font-bold text-white mb-4">Access Denied</h2>
            <p className="text-slate-300 mb-8">Only administrators can access this dashboard</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition"
            >
              Return Home
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }

  const statisticsData = stats;

  const revenueData = [
    { name: 'Jan', revenue: 4000 },
    { name: 'Feb', revenue: 3000 },
    { name: 'Mar', revenue: 5000 },
    { name: 'Apr', revenue: 2780 },
    { name: 'May', revenue: 8890 },
    { name: 'Jun', revenue: 10390 },
    { name: 'Jul', revenue: statisticsData.orders?.totalRevenue || 12000 },
  ];

  const orderPieData = [
    { name: 'Completed', value: statisticsData.orders?.completed || 10 },
    { name: 'Pending', value: statisticsData.orders?.pending || 5 },
    { name: 'Cancelled', value: (statisticsData.orders?.total || 15) - (statisticsData.orders?.completed || 10) - (statisticsData.orders?.pending || 5) }
  ].filter(d => d.value > 0);
  
  const COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-28 pb-12">
        {}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-3 sm:px-6 py-4 flex items-center justify-between shadow-sm z-30">
          <div className="flex items-center gap-3 min-w-0">
            <BarChart3 size={28} className="text-green-600 flex-shrink-0" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">Admin Dashboard</h1>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-semibold flex-shrink-0"
          >
            <LogOut size={18} /> <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

        {}
        <div className="p-6">
          <div className="space-y-6 max-w-7xl mx-auto">
            {}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              <Card className="bg-blue-100 border-2 border-blue-600 shadow-xl hover:shadow-2xl transition transform hover:scale-105">
                <div className="p-8">
                  <p className="text-lg font-bold text-black">Total Users</p>
                  <p className="text-3xl sm:text-5xl font-extrabold mt-4 text-blue-700">{statisticsData.totalUsers}</p>
                </div>
              </Card>

              <Card className="bg-green-100 border-2 border-green-600 shadow-xl hover:shadow-2xl transition transform hover:scale-105">
                <div className="p-8">
                  <p className="text-lg font-bold text-black">Farmers</p>
                  <p className="text-3xl sm:text-5xl font-extrabold mt-4 text-green-700">{statisticsData.farmers}</p>
                </div>
              </Card>

              <Card className="bg-purple-100 border-2 border-purple-600 shadow-xl hover:shadow-2xl transition transform hover:scale-105">
                <div className="p-8">
                  <p className="text-lg font-bold text-black">Buyers</p>
                  <p className="text-3xl sm:text-5xl font-extrabold mt-4 text-purple-700">{statisticsData.buyers}</p>
                </div>
              </Card>

              <Card className="bg-orange-100 border-2 border-orange-600 shadow-xl hover:shadow-2xl transition transform hover:scale-105">
                <div className="p-8">
                  <p className="text-lg font-bold text-black">Total Crops</p>
                  <p className="text-3xl sm:text-5xl font-extrabold mt-4 text-orange-700">{statisticsData.totalCrops}</p>
                </div>
              </Card>

              <Card className="bg-indigo-100 border-2 border-indigo-600 shadow-xl hover:shadow-2xl transition transform hover:scale-105">
                <div className="p-8">
                  <p className="text-lg font-bold text-black">Pending KYC</p>
                  <p className="text-3xl sm:text-5xl font-extrabold mt-4 text-indigo-700">{statisticsData.pendingFarmers}</p>
                </div>
              </Card>
            </div>

            {}
            <Card className="bg-white shadow-md rounded-xl border border-slate-200">
              <div className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Users size={28} className="text-green-600" />
                  <h2 className="text-2xl font-bold text-gray-800">Quick Navigation</h2>
                </div>
                <p className="text-gray-600 mb-6">Access other sections of the admin panel:</p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    onClick={() => navigate('/admin/approvals')}
                    className="flex-1 min-w-[180px] p-3 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg hover:shadow-md transition"
                  >
                    <p className="font-bold text-blue-700 text-sm whitespace-nowrap">👤 KYC Approvals</p>
                    <p className="text-xs text-blue-600 mt-0.5 whitespace-nowrap">Approve/Reject pending KYC</p>
                  </button>
                  <button
                    onClick={() => navigate('/admin/management')}
                    className="flex-1 min-w-[180px] p-3 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg hover:shadow-md transition"
                  >
                    <p className="font-bold text-purple-700 text-sm whitespace-nowrap">🛡️ User Management</p>
                    <p className="text-xs text-purple-600 mt-0.5 whitespace-nowrap">Freeze/Delete users</p>
                  </button>
                  <button
                    onClick={() => navigate('/admin/crops')}
                    className="flex-1 min-w-[180px] p-3 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg hover:shadow-md transition"
                  >
                    <p className="font-bold text-green-700 text-sm whitespace-nowrap">🌾 Crop Moderation</p>
                    <p className="text-xs text-green-600 mt-0.5 whitespace-nowrap">Freeze/Delete crops</p>
                  </button>
                  <button
                    onClick={() => navigate('/admin/orders')}
                    className="flex-1 min-w-[180px] p-3 bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-lg hover:shadow-md transition"
                  >
                    <p className="font-bold text-orange-700 text-sm whitespace-nowrap">📦 Order Management</p>
                    <p className="text-xs text-orange-600 mt-0.5 whitespace-nowrap">View all orders & statuses</p>
                  </button>
                </div>
              </div>
            </Card>

            {}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white shadow-md rounded-xl border border-slate-200">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <TrendingUp size={24} className="text-blue-600" />
                    <h2 className="text-xl font-bold text-gray-800">Revenue Growth</h2>
                  </div>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value) => [`₹${value}`, 'Revenue']}
                        />
                        <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Card>

              <Card className="bg-white shadow-md rounded-xl border border-slate-200">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <ShoppingBag size={24} className="text-indigo-600" />
                    <h2 className="text-xl font-bold text-gray-800">Order Distribution</h2>
                  </div>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={orderPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {orderPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

      </div>

      {}
      {showLogoutConfirm && (
        <LogoutConfirmationModal
          onConfirm={async () => {
            setShowLogoutConfirm(false);
            await logout();
            navigate('/');
          }}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </PageTransition>
  );
}
