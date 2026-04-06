import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import PageTransition from '../../components/common/PageTransition.jsx';
import Card from '../../components/common/Card';
import { Users, AlertTriangle, LogOut, Menu, Search, Eye, EyeOff, Trash2, Ban, Lock } from 'lucide-react';

export default function AdminUsers() {
  const { user, logout } = useAuth();
  const { navigate } = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const usersRes = await fetch('/api/admin/users-with-crops', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (usersRes.ok) {
        const data = await usersRes.json();
        setAllUsers(data.data || []);
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

  const [showPasswords, setShowPasswords] = useState({});

  const togglePasswordVisibility = (userId) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleHideUser = async (userId) => {
    if (!window.confirm('Hide this user from the platform?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'hidden' })
      });
      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error hiding user:', error);
    }
  };

  const filteredUsers = allUsers.filter(u => {
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const matchesSearch = !searchQuery || 
      u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

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
              { id: 'dashboard', label: 'Dashboard', icon: () => <span>📊</span>, path: '/admin/dashboard' },
              { id: 'users', label: 'Users', icon: Users, path: '/admin/users' },
              { id: 'crops', label: 'Crops', icon: () => <span>🌾</span>, path: '/admin/crops' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition ${
                  item.id === 'users'
                    ? 'bg-green-900 text-white shadow-lg'
                    : 'text-green-100 hover:bg-green-600'
                }`}
              >
                {typeof item.icon === 'function' ? <item.icon size={20} /> : <item.icon size={20} />}
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
              <h1 className="text-2xl font-bold text-gray-800">Users Management</h1>
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
              <Card className="bg-white">
                <div className="p-4 flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">All Users</option>
                    <option value="farmer">Farmers</option>
                    <option value="buyer">Buyers</option>
                  </select>
                </div>
              </Card>

              {loading ? (
                <Card className="text-center py-12">
                  <p className="text-gray-600">Loading users...</p>
                </Card>
              ) : filteredUsers.length === 0 ? (
                <Card className="text-center py-12">
                  <p className="text-gray-600">No users found</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredUsers.map(usr => (
                    <Card key={usr._id} className="bg-white">
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{usr.firstName} {usr.lastName}</h3>
                            <p className="text-sm text-gray-600">{usr.email}</p>
                          </div>
                          <div className="flex gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              usr.status === 'active' ? 'bg-green-100 text-green-700' :
                              usr.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {usr.status?.toUpperCase() || 'ACTIVE'}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              usr.role === 'farmer' ? 'bg-green-100 text-green-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {usr.role?.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                          <div>
                            <p className="text-xs text-gray-600 font-semibold">Email</p>
                            <p className="text-sm text-gray-900">{usr.email}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-semibold">Phone</p>
                            <p className="text-sm text-gray-900">{usr.phone || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-semibold">KYC Status</p>
                            <p className="text-sm text-gray-900">{usr.kycStatus || 'Pending'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-semibold">Member Since</p>
                            <p className="text-sm text-gray-900">{usr.createdAt ? new Date(usr.createdAt).toLocaleDateString() : 'N/A'}</p>
                          </div>
                        </div>

                        {/* Password Field */}
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-blue-700 font-semibold mb-1">Password</p>
                              <code className="text-sm text-blue-900 font-mono bg-blue-100 px-2 py-1 rounded">
                                {showPasswords[usr._id] ? (usr.password || 'N/A') : '••••••••••'}
                              </code>
                            </div>
                            <button
                              onClick={() => togglePasswordVisibility(usr._id)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                              title="Toggle password visibility"
                            >
                              {showPasswords[usr._id] ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>

                        {usr.farmName && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
                            <p className="text-sm font-semibold text-green-700">Farm: {usr.farmName}</p>
                            {usr.farmArea && <p className="text-xs text-green-600">Area: {usr.farmArea}</p>}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleHideUser(usr._id)}
                            className="flex items-center gap-1 px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg transition text-sm font-semibold"
                            title="Hide this user"
                          >
                            <Ban size={16} /> Hide
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(usr._id)}
                            className="flex items-center gap-1 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition text-sm font-semibold"
                            title="Delete this user"
                          >
                            <Trash2 size={16} /> Remove
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
