import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import PageTransition from '../../components/common/PageTransition.jsx';
import Card from '../../components/common/Card';
import LogoutConfirmationModal from '../../components/common/LogoutConfirmationModal';
import { AlertTriangle, Menu, Trash2, Pause, Eye, LogOut } from 'lucide-react';

export default function AdminManagement() {
  const { user, logout } = useAuth();
  const { navigate } = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('farmers'); // farmers, buyers, suspended
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [freezeReason, setFreezeReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [activeTab, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let url = '/api/admin/users';

      if (activeTab === 'farmers') {
        url = `/api/admin/users/approved/farmers?search=${searchTerm}`;
      } else if (activeTab === 'buyers') {
        url = `/api/admin/users/approved/buyers?search=${searchTerm}`;
      } else if (activeTab === 'suspended') {
        url = `/api/admin/users/suspended?search=${searchTerm}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFreezeClick = (user) => {
    setSelectedUser(user);
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
      const response = await fetch(`/api/admin/users/${selectedUser._id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'suspended', reason: freezeReason })
      });

      if (response.ok) {
        alert(`✅ ${selectedUser.firstName} account has been frozen`);
        setShowFreezeModal(false);
        setFreezeReason('');
        await fetchUsers();
      } else {
        const data = await response.json();
        alert(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error freezing user:', error);
      alert('❌ Error freezing user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
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
      const response = await fetch(`/api/admin/users/${selectedUser._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: deleteReason })
      });

      if (response.ok) {
        alert(`✅ ${selectedUser.firstName} account has been deleted`);
        setShowDeleteModal(false);
        setDeleteReason('');
        await fetchUsers();
      } else {
        const data = await response.json();
        alert(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('❌ Error deleting user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfreeze = async (user) => {
    if (!window.confirm(`Unfreeze ${user.firstName}?`)) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${user._id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'active' })
      });

      if (response.ok) {
        alert(`✅ ${user.firstName} account has been unfroze`);
        await fetchUsers();
      } else {
        const data = await response.json();
        alert(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error unfreezing:', error);
      alert('❌ Error unfreezing user');
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
            <button onClick={() => navigate('/')} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold">
              Return Home
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-100 flex">
        {/* Sidebar */}
        <div className={`fixed lg:static inset-0 lg:inset-auto transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-20'} bg-gradient-to-b from-purple-700 to-purple-800 text-white flex flex-col z-40`}>
          <div className="p-6 border-b border-purple-600">
            <div className="flex items-center justify-between">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
                <Menu size={24} />
              </button>
              {sidebarOpen && (
                <div>
                  <h2 className="text-2xl font-bold">FarmDirect</h2>
                  <p className="text-xs text-purple-200">Admin Panel</p>
                </div>
              )}
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {[
              { label: 'Dashboard', path: '/admin/dashboard' },
              { label: 'Approvals', path: '/admin/approvals' },
              { label: 'Management', path: '/admin/management' },
              { label: 'Crops', path: '/admin/crops' },
              { label: 'Notifications', path: '/notifications' }
            ].map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full text-left px-4 py-2 rounded hover:bg-purple-600 transition"
              >
                {sidebarOpen ? item.label : item.label.charAt(0)}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-purple-600">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition"
            >
              {sidebarOpen ? 'Logout' : '↪'}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">User Management</h1>
                  <p className="text-gray-600 mt-1">View, freeze, or delete user accounts</p>
                </div>
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 bg-gray-200 rounded"
                >
                  <Menu size={24} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-8 flex-wrap">
                {[
                  { id: 'farmers', label: 'Farmers' },
                  { id: 'buyers', label: 'Buyers' },
                  { id: 'suspended', label: 'Suspended' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-3 rounded-lg font-bold transition ${
                      activeTab === tab.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 border-2 border-gray-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Content */}
              {loading ? (
                <Card><p className="text-center py-8">Loading...</p></Card>
              ) : users.length === 0 ? (
                <Card className="text-center py-8 bg-gray-50">
                  <Eye size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No users found</p>
                </Card>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-200 border-b-2 border-gray-300">
                        <th className="px-6 py-3 text-left font-bold text-gray-900">Name</th>
                        <th className="px-6 py-3 text-left font-bold text-gray-900">Email</th>
                        {activeTab === 'farmers' && <th className="px-6 py-3 text-left font-bold text-gray-900">Farm</th>}
                        {activeTab === 'farmers' && <th className="px-6 py-3 text-left font-bold text-gray-900">Crops</th>}
                        {activeTab === 'buyers' && <th className="px-6 py-3 text-left font-bold text-gray-900">Orders</th>}
                        <th className="px-6 py-3 text-left font-bold text-gray-900">Status</th>
                        <th className="px-6 py-3 text-left font-bold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user._id} className="border-b hover:bg-gray-50">
                          <td className="px-6 py-4 font-semibold text-gray-900">{user.firstName} {user.lastName}</td>
                          <td className="px-6 py-4 text-gray-700">{user.email}</td>
                          {activeTab === 'farmers' && <td className="px-6 py-4 text-gray-700">{user.farmName || 'N/A'}</td>}
                          {activeTab === 'farmers' && <td className="px-6 py-4 text-gray-700">0</td>}
                          {activeTab === 'buyers' && <td className="px-6 py-4 text-gray-700">0</td>}
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              user.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : user.status === 'suspended'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 space-x-2">
                            {activeTab === 'suspended' ? (
                              <>
                                <button
                                  onClick={() => handleUnfreeze(user)}
                                  disabled={actionLoading}
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded text-xs font-bold"
                                >
                                  Unfreeze
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(user)}
                                  disabled={actionLoading}
                                  className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded text-xs font-bold"
                                >
                                  Delete
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleFreezeClick(user)}
                                  disabled={actionLoading}
                                  className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white rounded text-xs font-bold"
                                >
                                  <Pause size={14} className="inline mr-1" />
                                  Freeze
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(user)}
                                  disabled={actionLoading}
                                  className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded text-xs font-bold"
                                >
                                  <Trash2 size={14} className="inline mr-1" />
                                  Delete
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Freeze Modal */}
        {showFreezeModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Freeze Account</h3>
                <p className="text-sm text-gray-600 mb-6">
                  You are about to freeze the account for <strong>{selectedUser.firstName} {selectedUser.lastName}</strong>
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
                    <option value="Suspicious activity">Suspicious activity</option>
                    <option value="Payment issues">Payment issues</option>
                    <option value="Terms violation">Terms violation</option>
                    <option value="Other">Other</option>
                  </select>
                  {freezeReason === 'Other' && (
                    <textarea
                      placeholder="Please specify..."
                      onChange={(e) => setFreezeReason(e.target.value)}
                      className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                      rows="2"
                      disabled={actionLoading}
                    />
                  )}
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
        {showDeleteModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Account</h3>
                <p className="text-sm text-gray-600 mb-6">
                  ⚠️ <strong>WARNING:</strong> This action is permanent. You are about to delete the account for <strong>{selectedUser.firstName} {selectedUser.lastName}</strong>
                </p>
                
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reason for Deletion *
                  </label>
                  <textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="Enter the reason for account deletion..."
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
