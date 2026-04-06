import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import PageTransition from '../../components/common/PageTransition.jsx';
import Card from '../../components/common/Card';
import { BarChart3, Users, Package, AlertTriangle, LogOut, Menu } from 'lucide-react';

export default function AdminDashboardStats() {
  const { user, logout } = useAuth();
  const { navigate } = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [allCrops, setAllCrops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const [usersRes, cropsRes] = await Promise.all([
        fetch('/api/admin/users-with-crops', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/crops', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setAllUsers(data.data || []);
      }

      if (cropsRes.ok) {
        const data = await cropsRes.json();
        setAllCrops(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <PageTransition>
        <div className="min-h-screen bg-linear-to-br from-slate-900 to-slate-800 flex items-center justify-center px-4">
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

  const statisticsData = {
    totalUsers: allUsers.length,
    farmers: allUsers.filter(u => u.role === 'farmer').length,
    buyers: allUsers.filter(u => u.role === 'buyer').length,
    totalCrops: allCrops.length,
    activeCrops: allCrops.filter(c => c.status === 'live').length
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-100 flex">
        {/* Sidebar */}
        <div className={`fixed lg:static inset-0 lg:inset-auto transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-20'} bg-linear-to-b from-green-700 to-green-800 text-white flex flex-col z-40 ${sidebarOpen ? '' : 'hidden lg:flex'}`}>
          <div className="p-6 border-b border-green-600">
            <div className="flex items-center justify-between">
              {sidebarOpen && (
                <div>
                  <h2 className="text-2xl font-bold">FarmDirect</h2>
                  <p className="text-xs text-green-200">Admin</p>
                </div>
              )}
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/admin/dashboard' },
              { id: 'users', label: 'Users', icon: Users, path: '/admin/users' },
              { id: 'crops', label: 'Crops', icon: Package, path: '/admin/crops' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition ${
                  item.id === 'dashboard'
                    ? 'bg-green-900 text-white shadow-lg'
                    : 'text-green-100 hover:bg-green-600'
                }`}
              >
                <item.icon size={20} />
                {sidebarOpen && item.label}
              </button>
            ))}
          </nav>

          <div className="border-t border-green-600 p-4">
            {sidebarOpen && (
              <>
                <p className="text-xs text-green-200 uppercase mb-2">Admin</p>
                <p className="font-semibold truncate mb-3">{user?.name}</p>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition text-sm"
                >
                  <LogOut size={16} /> Logout
                </button>
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {/* Top Bar */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-30">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:block text-gray-600 hover:text-gray-900"
              >
                <Menu size={24} />
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            </div>
            <button
              onClick={() => navigate('/admin/profile')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-semibold"
            >
              My Profile
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card className="bg-blue-50 border-l-4 border-blue-500">
                  <div className="p-6">
                    <p className="text-sm text-gray-600 font-semibold">Total Users</p>
                    <p className="text-4xl font-bold text-blue-600 mt-2">{statisticsData.totalUsers}</p>
                  </div>
                </Card>

                <Card className="bg-green-50 border-l-4 border-green-500">
                  <div className="p-6">
                    <p className="text-sm text-gray-600 font-semibold">Farmers</p>
                    <p className="text-4xl font-bold text-green-600 mt-2">{statisticsData.farmers}</p>
                  </div>
                </Card>

                <Card className="bg-purple-50 border-l-4 border-purple-500">
                  <div className="p-6">
                    <p className="text-sm text-gray-600 font-semibold">Buyers</p>
                    <p className="text-4xl font-bold text-purple-600 mt-2">{statisticsData.buyers}</p>
                  </div>
                </Card>

                <Card className="bg-orange-50 border-l-4 border-orange-500">
                  <div className="p-6">
                    <p className="text-sm text-gray-600 font-semibold">Total Crops</p>
                    <p className="text-4xl font-bold text-orange-600 mt-2">{statisticsData.totalCrops}</p>
                  </div>
                </Card>

                <Card className="bg-indigo-50 border-l-4 border-indigo-500">
                  <div className="p-6">
                    <p className="text-sm text-gray-600 font-semibold">Active Crops</p>
                    <p className="text-4xl font-bold text-indigo-600 mt-2">{statisticsData.activeCrops}</p>
                  </div>
                </Card>
              </div>

              <Card className="bg-white">
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Admin Dashboard</h2>
                  <p className="text-gray-600 mb-4">Use the sidebar to navigate between sections:</p>
                  <ul className="space-y-2 text-gray-700">
                    <li>• <strong>Users:</strong> Manage all users, view their details, and take actions</li>
                    <li>• <strong>Crops:</strong> View all active crop listings with details</li>
                    <li>• <strong>Dashboard:</strong> View platform statistics and overview</li>
                  </ul>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
