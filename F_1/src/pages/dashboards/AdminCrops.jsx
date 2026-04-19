import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import PageTransition from '../../components/common/PageTransition.jsx';
import Card from '../../components/common/Card';
import LogoutConfirmationModal from '../../components/common/LogoutConfirmationModal';
import { Package, AlertTriangle, LogOut, Menu, Search, Eye, Trash2, Users, BarChart3, Lock, Unlock } from 'lucide-react';

export default function AdminCrops() {
  const { user, logout } = useAuth();
  const { navigate } = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [allCrops, setAllCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [freezeReason, setFreezeReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const cropsRes = await fetch('/api/admin/crops', {
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

  const handleDeleteClick = (crop) => {
    setSelectedCrop(crop);
    setDeleteReason('');
    setShowDeleteModal(true);
  };

  const handleSubmitDelete = async () => {
    if (!deleteReason.trim()) {
      alert('⚠️ Please provide a reason for deletion');
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/crops/${selectedCrop._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: deleteReason })
      });

      if (response.ok) {
        alert(`✅ Crop "${selectedCrop.cropName}" has been deleted`);
        setShowDeleteModal(false);
        setDeleteReason('');
        await fetchData();
      } else {
        const data = await response.json();
        alert(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error deleting crop:', error);
      alert('❌ Error deleting crop');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFreezeClick = (crop) => {
    setSelectedCrop(crop);
    setFreezeReason('');
    setShowFreezeModal(true);
  };

  const handleSubmitFreeze = async () => {
    if (!freezeReason.trim()) {
      alert('⚠️ Please provide a reason for freezing');
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/crops/${selectedCrop._id}/freeze`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: freezeReason })
      });

      if (response.ok) {
        alert(`✅ Crop "${selectedCrop.cropName}" has been frozen`);
        setShowFreezeModal(false);
        setFreezeReason('');
        await fetchData();
      } else {
        const data = await response.json();
        alert(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error freezing crop:', error);
      alert('❌ Error freezing crop');
    } finally {
      setActionLoading(false);
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

  const filteredCrops = allCrops.filter(crop =>
    !searchQuery ||
    crop.cropName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    crop.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-100 flex">
        {/* Sidebar */}
        <div className={`fixed lg:static inset-0 lg:inset-auto transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-20'} bg-gradient-to-b from-green-700 to-green-800 text-white flex flex-col z-40 ${sidebarOpen ? '' : 'hidden lg:flex'}`}>
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
                  onClick={() => setShowLogoutConfirm(true)}
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
                            onClick={() => handleFreezeClick(crop)}
                            disabled={actionLoading}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-yellow-100 hover:bg-yellow-200 disabled:bg-gray-200 text-yellow-700 rounded-lg transition text-sm font-semibold"
                            title="Freeze crop"
                          >
                            <Lock size={16} /> Freeze
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(crop)}
                            disabled={actionLoading}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-100 hover:bg-red-200 disabled:bg-gray-200 text-red-700 rounded-lg transition text-sm font-semibold"
                            title="Delete crop"
                          >
                            <Trash2 size={16} /> Delete
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

      {/* Freeze Modal */}
      {showFreezeModal && selectedCrop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Freeze Crop</h3>
              <p className="text-sm text-gray-600 mb-6">
                You are about to freeze <strong>{selectedCrop.cropName}</strong>
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason for Freezing *
                </label>
                <select
                  value={freezeReason}
                  onChange={(e) => setFreezeReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  disabled={actionLoading}
                >
                  <option value="">Select a reason...</option>
                  <option value="Low quality">Low quality</option>
                  <option value="Misleading information">Misleading information</option>
                  <option value="Duplicate listing">Duplicate listing</option>
                  <option value="Suspicious activity">Suspicious activity</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowFreezeModal(false);
                    setFreezeReason('');
                  }}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition disabled:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitFreeze}
                  disabled={actionLoading || !freezeReason}
                  className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition"
                >
                  {actionLoading ? 'Processing...' : 'Freeze'}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedCrop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Crop</h3>
              <p className="text-sm text-gray-600 mb-6">
                ⚠️ <strong>WARNING:</strong> This action is permanent. You are about to delete <strong>{selectedCrop.cropName}</strong>
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason for Deletion *
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Enter the reason for deletion..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none"
                  rows="4"
                  disabled={actionLoading}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteReason('');
                  }}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition disabled:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitDelete}
                  disabled={actionLoading || !deleteReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition"
                >
                  {actionLoading ? 'Processing...' : 'Delete'}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

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
