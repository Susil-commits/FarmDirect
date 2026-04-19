import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import PageTransition from '../../components/common/PageTransition.jsx';
import Card from '../../components/common/Card';
import LogoutConfirmationModal from '../../components/common/LogoutConfirmationModal';
import { BarChart3, Users, Package, AlertTriangle, LogOut } from 'lucide-react';

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
  const [error, setError] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Reset scroll position to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      _setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/admin/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Dashboard stats fetched:', data);
        
        setStats({
          totalUsers: data.data?.users?.total || 0,
          farmers: data.data?.users?.farmers || 0,
          buyers: data.data?.users?.buyers || 0,
          admins: data.data?.users?.admins || 0,
          totalCrops: data.data?.crops?.total || 0,
          activeCrops: data.data?.crops?.active || 0,
          pendingFarmers: data.data?.pendingKYC || 0
        });
      } else {
        console.error('❌ Failed to fetch stats:', response.status);
        setError('Failed to load dashboard stats');
      }
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      setError(error.message);
    } finally {
      _setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center px-4">
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

  // Use stats directly
  const statisticsData = stats;

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Top Navigation Bar */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-30">
          <div className="flex items-center gap-3">
            <BarChart3 size={28} className="text-green-600" />
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-semibold"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card className="bg-blue-100 border-2 border-blue-600 shadow-xl hover:shadow-2xl transition transform hover:scale-105">
                <div className="p-8">
                  <p className="text-lg font-bold text-black">Total Users</p>
                  <p className="text-5xl font-extrabold mt-4 text-blue-700">{statisticsData.totalUsers}</p>
                </div>
              </Card>

              <Card className="bg-green-100 border-2 border-green-600 shadow-xl hover:shadow-2xl transition transform hover:scale-105">
                <div className="p-8">
                  <p className="text-lg font-bold text-black">Farmers</p>
                  <p className="text-5xl font-extrabold mt-4 text-green-700">{statisticsData.farmers}</p>
                </div>
              </Card>

              <Card className="bg-purple-100 border-2 border-purple-600 shadow-xl hover:shadow-2xl transition transform hover:scale-105">
                <div className="p-8">
                  <p className="text-lg font-bold text-black">Buyers</p>
                  <p className="text-5xl font-extrabold mt-4 text-purple-700">{statisticsData.buyers}</p>
                </div>
              </Card>

              <Card className="bg-orange-100 border-2 border-orange-600 shadow-xl hover:shadow-2xl transition transform hover:scale-105">
                <div className="p-8">
                  <p className="text-lg font-bold text-black">Total Crops</p>
                  <p className="text-5xl font-extrabold mt-4 text-orange-700">{statisticsData.totalCrops}</p>
                </div>
              </Card>

              <Card className="bg-indigo-100 border-2 border-indigo-600 shadow-xl hover:shadow-2xl transition transform hover:scale-105">
                <div className="p-8">
                  <p className="text-lg font-bold text-black">Pending KYC</p>
                  <p className="text-5xl font-extrabold mt-4 text-indigo-700">{statisticsData.pendingFarmers}</p>
                </div>
              </Card>
            </div>

            {/* Dashboard Info */}
            <Card className="bg-white shadow-md rounded-xl border border-slate-200">
              <div className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Users size={28} className="text-green-600" />
                  <h2 className="text-2xl font-bold text-gray-800">Quick Navigation</h2>
                </div>
                <p className="text-gray-600 mb-6">Access other sections of the admin panel:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => navigate('/admin/approvals')}
                    className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg hover:shadow-md transition"
                  >
                    <p className="font-bold text-blue-700 text-lg">👤 KYC Approvals</p>
                    <p className="text-sm text-blue-600 mt-1">Approve/Reject pending KYC</p>
                  </button>
                  <button
                    onClick={() => navigate('/admin/management')}
                    className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg hover:shadow-md transition"
                  >
                    <p className="font-bold text-purple-700 text-lg">🛡️ User Management</p>
                    <p className="text-sm text-purple-600 mt-1">Freeze/Delete users</p>
                  </button>
                  <button
                    onClick={() => navigate('/admin/crops')}
                    className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg hover:shadow-md transition"
                  >
                    <p className="font-bold text-green-700 text-lg">🌾 Crop Moderation</p>
                    <p className="text-sm text-green-600 mt-1">Freeze/Delete crops</p>
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>


      </div>

      {/* Logout Confirmation Modal */}
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
