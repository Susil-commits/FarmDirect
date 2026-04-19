import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import PageTransition from '../../components/common/PageTransition.jsx';
import Card from '../../components/common/Card';
import LogoutConfirmationModal from '../../components/common/LogoutConfirmationModal';
import { CheckCircle, XCircle, Eye, FileText, AlertTriangle, Menu, LogOut } from 'lucide-react';

export default function AdminApprovals() {
  const { user, logout } = useAuth();
  const { navigate } = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [roleTab, setRoleTab] = useState('farmers'); // farmers or buyers
  const [statusTab, setStatusTab] = useState('pending'); // pending or rejected
  const [pendingUsers, setPendingUsers] = useState([]);
  const [rejectedUsers, setRejectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [adminComments, setAdminComments] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (statusTab === 'pending') {
      fetchPendingUsers();
    } else {
      fetchRejectedUsers();
    }
  }, [roleTab, statusTab]);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/kyc/pending?role=${roleTab}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Pending KYC users:', data);
        setPendingUsers(data.data || []);
      } else {
        console.error('❌ Error fetching pending KYC:', response.status);
      }
    } catch (error) {
      console.error('Error fetching pending KYC:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRejectedUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/kyc/rejected?role=${roleTab}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Rejected KYC users:', data);
        setRejectedUsers(data.data || []);
      } else {
        console.error('❌ Error fetching rejected KYC:', response.status);
      }
    } catch (error) {
      console.error('Error fetching rejected KYC:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocuments = (user) => {
    setSelectedUser(user);
    setShowDocumentModal(true);
  };

  const handleApproveFarmer = async (userId, userName) => {
    if (!window.confirm(`Approve KYC for ${userName}?`)) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/kyc/${userId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comments: adminComments })
      });

      if (response.ok) {
        alert(`✅ ${userName} KYC approved!`);
        setAdminComments('');
        await fetchPendingUsers();
      } else {
        const data = await response.json();
        alert(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error approving:', error);
      alert('❌ Error approving KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClick = (user) => {
    setSelectedUser(user);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleSubmitReject = async () => {
    if (!rejectionReason.trim()) {
      alert('⚠️ Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/kyc/${selectedUser._id}/reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectionReason })
      });

      if (response.ok) {
        alert(`❌ ${selectedUser.firstName} KYC rejected`);
        setShowRejectModal(false);
        setRejectionReason('');
        await fetchPendingUsers();
      } else {
        const data = await response.json();
        alert(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('❌ Error rejecting KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone and will remove all associated data.`)) {
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert(`✅ ${userName} account and all associated data have been deleted`);
        if (statusTab === 'pending') {
          await fetchPendingUsers();
        } else {
          await fetchRejectedUsers();
        }
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

  if (!user || user.role !== 'admin') {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center px-4">
          <div className="text-center">
            <AlertTriangle size={48} className="mx-auto mb-4 text-orange-500" />
            <h2 className="text-3xl font-bold text-white mb-4">Access Denied</h2>
            <p className="text-slate-300 mb-8">Only administrators can access this page</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
            >
              Return Home
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Determine which users to display based on statusTab
  const sourceUsers = statusTab === 'pending' ? pendingUsers : rejectedUsers;
  const displayedUsers = sourceUsers.filter(u => {
    if (roleTab === 'farmers') return u.role === 'farmer';
    return u.role === 'buyer';
  });

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-100 flex">
        {/* Sidebar */}
        <div className={`fixed lg:static inset-0 lg:inset-auto transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-20'} bg-gradient-to-b from-blue-700 to-blue-800 text-white flex flex-col z-40`}>
          <div className="p-6 border-b border-blue-600">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                <Menu size={24} />
              </button>
              {sidebarOpen && (
                <div>
                  <h2 className="text-2xl font-bold">FarmDirect</h2>
                  <p className="text-xs text-blue-200">Admin Panel</p>
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
                className="w-full text-left px-4 py-2 rounded hover:bg-blue-600 transition"
              >
                {sidebarOpen ? item.label : item.label.charAt(0)}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-blue-600">
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
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">KYC Approvals</h1>
                  <p className="text-gray-600 mt-1">Review and approve pending farmer/buyer registrations</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => fetchPendingUsers()}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded font-semibold transition"
                  >
                    {loading ? 'Refreshing...' : 'Refresh'}
                  </button>
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden p-2 bg-gray-200 rounded"
                  >
                    <Menu size={24} />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="mb-8">
                {/* Status Tabs (Pending / Rejected) */}
                <div className="flex gap-4 mb-4 flex-wrap items-center">
                  <button
                    onClick={() => setStatusTab('pending')}
                    className={`px-6 py-3 rounded-lg font-bold transition ${
                      statusTab === 'pending'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-white text-gray-700 border-2 border-yellow-200'
                    }`}
                  >
                    ⏳ Pending ({pendingUsers.filter(u => {
                      if (roleTab === 'farmers') return u.role === 'farmer';
                      return u.role === 'buyer';
                    }).length})
                  </button>
                  <button
                    onClick={() => setStatusTab('rejected')}
                    className={`px-6 py-3 rounded-lg font-bold transition ${
                      statusTab === 'rejected'
                        ? 'bg-red-600 text-white'
                        : 'bg-white text-gray-700 border-2 border-red-200'
                    }`}
                  >
                    ❌ Rejected ({rejectedUsers.filter(u => {
                      if (roleTab === 'farmers') return u.role === 'farmer';
                      return u.role === 'buyer';
                    }).length})
                  </button>
                </div>

                {/* Role Tabs (Farmers / Buyers) */}
                <div className="flex gap-4 flex-wrap items-center">
                  <button
                    onClick={() => setRoleTab('farmers')}
                    className={`px-6 py-3 rounded-lg font-bold transition ${
                      roleTab === 'farmers'
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-gray-700 border-2 border-green-200'
                    }`}
                  >
                    👨‍🌾 Farmers
                  </button>
                  <button
                    onClick={() => setRoleTab('buyers')}
                    className={`px-6 py-3 rounded-lg font-bold transition ${
                      roleTab === 'buyers'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border-2 border-blue-200'
                    }`}
                  >
                    🛒 Buyers
                  </button>
                  <div className="ml-auto px-4 py-2 bg-orange-100 border-l-4 border-orange-600 rounded">
                    <p className="text-sm font-bold text-orange-800">
                      {statusTab === 'pending' 
                        ? `Pending: ${pendingUsers.filter(u => {
                          if (roleTab === 'farmers') return u.role === 'farmer';
                          return u.role === 'buyer';
                        }).length}`
                        : `Rejected: ${rejectedUsers.filter(u => {
                          if (roleTab === 'farmers') return u.role === 'farmer';
                          return u.role === 'buyer';
                        }).length}`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              {loading ? (
                <Card className="text-center py-8">
                  <p className="text-gray-600">Loading...</p>
                </Card>
              ) : displayedUsers.length === 0 ? (
                <Card className="bg-green-50 border-l-4 border-green-500">
                  <div className="p-8 text-center">
                    <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
                    <p className="text-gray-600">
                      No {statusTab} {roleTab} KYC requests at the moment.
                    </p>
                    
                    {/* Debug Helper */}
                    <div className="mt-6 pt-6 border-t border-green-200">
                      <p className="text-sm text-gray-600 mb-3">🔍 Troubleshooting:</p>
                      <button
                        onClick={() => {
                          const token = localStorage.getItem('token');
                          fetch('/api/admin/debug/users-kyc-status', {
                            headers: { 'Authorization': `Bearer ${token}` }
                          })
                            .then(r => r.json())
                            .then(data => {
                              console.log('📊 All Users KYC Status:', data);
                              alert(`📊 Check Console (F12) for detailed breakdown:\n\nTotal Users: ${data.summary.total}\nPending: ${data.summary.byKYCStatus['pending'] || 0}\nVerified: ${data.summary.byKYCStatus['verified'] || 0}`);
                            });
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold"
                      >
                        View All Users Debug Info
                      </button>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="space-y-6">
                  {displayedUsers.map(user => (
                    <Card key={user._id} className="hover:shadow-lg transition">
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
                          <div>
                            <p className="text-sm text-gray-600 font-semibold">Name</p>
                            <p className="text-lg font-bold text-gray-900">{user.firstName} {user.lastName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-semibold">Email</p>
                            <p className="text-gray-700 break-all">{user.email}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-semibold">Role</p>
                            <p className={`text-sm font-bold px-3 py-1 rounded w-fit ${
                              user.role === 'farmer'
                                ? 'bg-green-200 text-green-800'
                                : 'bg-blue-200 text-blue-800'
                            }`}>
                              {user.role?.toUpperCase()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-semibold">Status</p>
                            <p className={`text-sm font-bold px-3 py-1 rounded w-fit ${
                              user.kycStatus === 'pending'
                                ? 'bg-yellow-200 text-yellow-800'
                                : user.kycStatus === 'verified'
                                ? 'bg-green-200 text-green-800'
                                : 'bg-red-200 text-red-800'
                            }`}>
                              {user.kycStatus?.toUpperCase() || 'PENDING'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-semibold">Submitted</p>
                            <p className="text-gray-700">
                              {user.kycSubmittedAt 
                                ? new Date(user.kycSubmittedAt).toLocaleDateString()
                                : new Date(user.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {roleTab === 'farmers' && (
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 pb-6 border-b bg-green-50 p-4 rounded">
                            <div>
                              <p className="text-sm text-gray-600 font-semibold">Phone</p>
                              <p className="text-gray-700">{user.phone || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 font-semibold">Farm Name</p>
                              <p className="text-gray-700">{user.farmName || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 font-semibold">Farm Area</p>
                              <p className="text-gray-700">{user.farmArea || 'N/A'} acres</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 font-semibold">Experience</p>
                              <p className="text-gray-700">{user.experience || 0} years</p>
                            </div>
                          </div>
                        )}
                        {roleTab === 'buyers' && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pb-6 border-b bg-blue-50 p-4 rounded">
                            <div>
                              <p className="text-sm text-gray-600 font-semibold">Phone</p>
                              <p className="text-gray-700">{user.phone || 'N/A'}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-sm text-gray-600 font-semibold">Address</p>
                              <p className="text-gray-700">{user.addresses?.[0]?.streetAddress || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 font-semibold">City</p>
                              <p className="text-gray-700">{user.addresses?.[0]?.city || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 font-semibold">State</p>
                              <p className="text-gray-700">{user.addresses?.[0]?.state || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 font-semibold">Pincode</p>
                              <p className="text-gray-700">{user.addresses?.[0]?.pincode || 'N/A'}</p>
                            </div>
                          </div>
                        )}

                        {/* Rejection Reason (for rejected users) */}
                        {statusTab === 'rejected' && user.kycRejectionReason && (
                          <div className="mb-6 pb-6 border-b bg-red-50 p-4 rounded border-l-4 border-red-500">
                            <p className="text-sm text-gray-600 font-semibold mb-2">❌ Rejection Reason:</p>
                            <p className="text-gray-700">{user.kycRejectionReason}</p>
                          </div>
                        )}

                        {statusTab === 'pending' && (
                          <div className="mb-6 pb-6 border-b">
                            <p className="text-sm text-gray-600 font-semibold mb-3">Admin Comments (Optional)</p>
                            <textarea
                              value={adminComments}
                              onChange={(e) => setAdminComments(e.target.value)}
                              placeholder="Add any comments or notes about this KYC application..."
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              rows="3"
                            />
                          </div>
                        )}

                        {statusTab === 'pending' ? (
                          <div className="flex gap-3 flex-wrap">
                            <button
                              onClick={() => handleViewDocuments(user)}
                              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold transition"
                            >
                              <Eye size={18} />
                              View Documents
                            </button>
                            <button
                              onClick={() => handleApproveFarmer(user._id, `${user.firstName} ${user.lastName}`)}
                              disabled={actionLoading}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded font-semibold transition"
                            >
                              <CheckCircle size={18} />
                              {actionLoading ? 'Processing...' : 'Approve KYC'}
                            </button>
                            <button
                              onClick={() => handleRejectClick(user)}
                              disabled={actionLoading}
                              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded font-semibold transition"
                            >
                              <XCircle size={18} />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-3 flex-wrap">
                            <button
                              onClick={() => handleViewDocuments(user)}
                              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold transition"
                            >
                              <Eye size={18} />
                              View Documents
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user._id, `${user.firstName} ${user.lastName}`)}
                              disabled={actionLoading}
                              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded font-semibold transition ml-auto"
                            >
                              <XCircle size={18} />
                              {actionLoading ? 'Deleting...' : 'Delete Account'}
                            </button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Document Modal */}
        {showDocumentModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    KYC Documents - {selectedUser.firstName} {selectedUser.lastName}
                  </h3>
                  <button
                    onClick={() => setShowDocumentModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="mb-6 pb-6 border-b">
                  <h4 className="font-bold text-gray-900 mb-4">User Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-semibold text-gray-900">{selectedUser.firstName} {selectedUser.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold text-gray-900">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold text-gray-900">{selectedUser.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Registration Date</p>
                      <p className="font-semibold text-gray-900">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Documents Submitted</p>
                      <p className="font-semibold text-gray-900">
                        {selectedUser.kycSubmittedAt 
                          ? new Date(selectedUser.kycSubmittedAt).toLocaleDateString()
                          : new Date(selectedUser.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Role</p>
                      <p className="font-semibold text-gray-900 capitalize bg-blue-100 px-3 py-1 rounded w-fit">{selectedUser.role}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="font-semibold text-gray-900 capitalize">{selectedUser.status}</p>
                    </div>
                  </div>
                </div>

                {/* KYC Personal Details */}
                <div className="mb-6 pb-6 border-b bg-indigo-50 p-4 rounded">
                  <h4 className="font-bold text-gray-900 mb-4">📋 KYC Personal Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Aadhar Number</p>
                      <p className="font-semibold text-gray-900">{selectedUser.kycDetails?.aadharNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">City</p>
                      <p className="font-semibold text-gray-900">{selectedUser.addresses?.[0]?.city || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">State</p>
                      <p className="font-semibold text-gray-900">{selectedUser.addresses?.[0]?.state || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pincode</p>
                      <p className="font-semibold text-gray-900">{selectedUser.addresses?.[0]?.pincode || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* KYC Documents Submitted */}
                <div className="mb-6 pb-6 border-b bg-yellow-50 p-4 rounded">
                  <h4 className="font-bold text-gray-900 mb-4">📄 Documents Uploaded</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Government ID</p>
                      <p className="font-semibold text-green-700">{selectedUser.kycDocuments?.governmentId?.fileName || '✗ Not uploaded'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Profile Photo</p>
                      <p className="font-semibold text-green-700">{selectedUser.kycDocuments?.profilePhoto?.fileName || '✗ Not uploaded'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Address Proof</p>
                      <p className="font-semibold text-green-700">{selectedUser.kycDocuments?.addressProof?.fileName || '✗ Not uploaded'}</p>
                    </div>
                    {selectedUser.role === 'farmer' && (
                      <>
                        <div>
                          <p className="text-sm text-gray-600">Land Ownership</p>
                          <p className="font-semibold text-green-700">{selectedUser.kycDocuments?.landOwnership?.fileName || '✗ Not uploaded'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Farm Registration</p>
                          <p className="font-semibold text-green-700">{selectedUser.kycDocuments?.farmRegistration?.fileName || '✗ Not uploaded'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Farmer-Specific Info */}
                {selectedUser.role === 'farmer' && (
                  <div className="mb-6 pb-6 border-b bg-green-50 p-4 rounded">
                    <h4 className="font-bold text-gray-900 mb-4">Farm Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Farm Name</p>
                        <p className="font-semibold text-gray-900">{selectedUser.farmName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Farm Area</p>
                        <p className="font-semibold text-gray-900">{selectedUser.farmArea || 'N/A'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-semibold text-gray-900">{selectedUser.location || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Experience</p>
                        <p className="font-semibold text-gray-900">{selectedUser.experience || 0} years</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Crops Grown</p>
                        <p className="font-semibold text-gray-900">{selectedUser.cropsGrown?.join(', ') || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Buyer-Specific Info */}
                {selectedUser.role === 'buyer' && (
                  <div className="mb-6 pb-6 border-b bg-purple-50 p-4 rounded">
                    <h4 className="font-bold text-gray-900 mb-4">Buyer Address</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="font-semibold text-gray-900">{selectedUser.addresses?.[0]?.streetAddress || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">City</p>
                        <p className="font-semibold text-gray-900">{selectedUser.addresses?.[0]?.city || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">State</p>
                        <p className="font-semibold text-gray-900">{selectedUser.addresses?.[0]?.state || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Pincode</p>
                        <p className="font-semibold text-gray-900">{selectedUser.addresses?.[0]?.pincode || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bio/Additional Info */}
                {selectedUser.bio && (
                  <div className="mb-6 pb-6 border-b">
                    <h4 className="font-bold text-gray-900 mb-2">Bio</h4>
                    <p className="text-gray-700">{selectedUser.bio}</p>
                  </div>
                )}

                <div className="mb-6">
                  <h4 className="font-bold text-gray-900 mb-4">Admin Comments</h4>
                  <textarea
                    value={adminComments}
                    onChange={(e) => setAdminComments(e.target.value)}
                    placeholder="Add comments for internal notes..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows="3"
                  />
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
                  <p className="text-sm text-blue-900">
                    <FileText className="inline mr-2" size={18} />
                    Documents uploaded: Review all documents carefully before approving
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDocumentModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleApproveFarmer(selectedUser._id, `${selectedUser.firstName} ${selectedUser.lastName}`);
                      setShowDocumentModal(false);
                    }}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition"
                  >
                    {actionLoading ? 'Processing...' : 'Approve'}
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Rejection Modal */}
        {showRejectModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Reject KYC Application</h3>
                <p className="text-sm text-gray-600 mb-6">
                  You are about to reject the KYC application for <strong>{selectedUser.firstName} {selectedUser.lastName}</strong>
                </p>
                
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter the reason for rejection..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none"
                    rows="4"
                    disabled={actionLoading}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectionReason('');
                    }}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition disabled:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReject}
                    disabled={actionLoading || !rejectionReason.trim()}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition"
                  >
                    {actionLoading ? 'Processing...' : 'Reject'}
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
