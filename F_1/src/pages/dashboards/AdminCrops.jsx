import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import PageTransition from '../../components/common/PageTransition.jsx';
import Card from '../../components/common/Card';
import { Package, AlertTriangle, LogOut, Menu, Search, Eye, Trash2, Users, BarChart3, Lock, Unlock } from 'lucide-react';

export default function AdminCrops() {
  const { user, logout } = useAuth();
  const { navigate } = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [allCrops, setAllCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [frozenCrops, setFrozenCrops] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const cropsRes = await fetch('/api/crops', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

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

  const handleDeleteCrop = async (cropId) => {
    if (!window.confirm('Are you sure you want to delete this crop? This action cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/crops/${cropId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error deleting crop:', error);
    }
  };

  const handleFreezeCrop = (cropId) => {
    setFrozenCrops(prev => ({
      ...prev,
      [cropId]: !prev[cropId]
    }));
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

  const filteredCrops = allCrops.filter(crop =>
    !searchQuery ||
    crop.cropName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    crop.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                  item.id === 'crops'
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
              <h1 className="text-2xl font-bold text-gray-800">Crops Management</h1>
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
                <div className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search crops by name or category..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </Card>

              {loading ? (
                <Card className="text-center py-12">
                  <p className="text-gray-600">Loading crops...</p>
                </Card>
              ) : filteredCrops.length === 0 ? (
                <Card className="text-center py-12">
                  <p className="text-gray-600">No crops found</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCrops.map(crop => (
                    <Card key={crop._id} className="bg-white overflow-hidden">
                      <div className="relative h-40 bg-gray-200">
                        {crop.images && crop.images.length > 0 ? (
                          <img
                            src={crop.images[0]}
                            alt={crop.cropName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-300">
                            <Package size={32} className="text-gray-500" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            crop.status === 'live' ? 'bg-green-500 text-white' :
                            'bg-gray-500 text-white'
                          }`}>
                            {crop.status?.toUpperCase() || 'LISTED'}
                          </span>
                        </div>
                      </div>

                      <div className="p-4">
                        <h3 className="font-bold text-lg text-gray-900 mb-2">{crop.cropName}</h3>

                        <div className="space-y-2 mb-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Category</span>
                            <span className="font-semibold text-gray-900">{crop.category}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Price</span>
                            <span className="font-semibold text-green-600">₹{crop.price}/{crop.unit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Quantity</span>
                            <span className="font-semibold text-gray-900">{crop.quantity} {crop.unit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Farmer</span>
                            <span className="font-semibold text-gray-900">{crop.farmerId?.firstName || 'Unknown'}</span>
                          </div>
                        </div>

                        {crop.description && (
                          <p className="text-xs text-gray-600 line-clamp-2 mb-4">{crop.description}</p>
                        )}

                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleFreezeCrop(crop._id)}
                            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg transition text-sm font-semibold ${
                              frozenCrops[crop._id]
                                ? 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                                : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                            }`}
                            title={frozenCrops[crop._id] ? "Unfreeze crop" : "Freeze crop"}
                          >
                            {frozenCrops[crop._id] ? (
                              <>
                                <Unlock size={16} /> Unfreeze
                              </>
                            ) : (
                              <>
                                <Lock size={16} /> Freeze
                              </>
                            )}
                          </button>
                          <button 
                            onClick={() => handleDeleteCrop(crop._id)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition text-sm font-semibold"
                            title="Delete crop"
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
