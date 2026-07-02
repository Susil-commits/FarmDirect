import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import { adminService } from '../../services/appService';
import PageTransition from '../../components/common/PageTransition.jsx';
import Card from '../../components/common/Card';
import LogoutConfirmationModal from '../../components/common/LogoutConfirmationModal';
import {
  CheckCircle, XCircle, Eye, FileText, AlertTriangle, Menu, LogOut,
  ChevronDown, ChevronRight, X, User, Phone, MapPin, Calendar,
  Award, Sprout, Home, Hash, Shield, Clock, Image as ImageIcon
} from 'lucide-react';
import api from '../../services/api.js';
import { getImageUrl } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

// Resolve document URL for display — local /uploads/ paths use getImageUrl
// to prepend the backend origin in production.
// cloud URLs (http/https) are used directly. PDFs use the backend proxy endpoint
// for proper Content-Type headers and inline viewing.
const resolveDocUrl = (url) => {
  if (!url) return '';
  // Cloud URLs (DigitalOcean Spaces, Cloudinary, etc.) — use directly
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Local upload paths — prefix with backend origin via getImageUrl
  return getImageUrl(url) || url;
};

// Get the proxy URL for PDF/document inline viewing via the backend proxy endpoint
// Uses VITE_API_BASE_URL to bypass Vercel's SPA catch-all in production
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const getProxyUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}/admin/documents/proxy?url=${encodeURIComponent(url)}`;
};

// Standalone Document Thumbnail Card (module-level for stable React identity)
const DocThumbnail = ({ doc, onPreview, formatFileSize, isImageDoc }) => {
  const [imgError, setImgError] = useState(false);
  const isImage = isImageDoc(doc);
  return (
    <div
      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onPreview(doc)}
    >
      {isImage && !imgError ? (
        <div className="h-24 bg-gray-100 overflow-hidden">
          <img
            src={resolveDocUrl(doc.url)}
            alt={doc.fileName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <div className="h-24 bg-gray-100 flex items-center justify-center">
          <FileText size={24} className="text-gray-400" />
        </div>
      )}
      <div className="p-2">
        <p className="text-xs font-semibold text-gray-700 truncate">{doc.fileName}</p>
        <p className="text-xs text-gray-400">{formatFileSize(doc.fileSize)}</p>
      </div>
    </div>
  );
};

export default function AdminApprovals() {
  const { user, logout } = useAuth();
  const { navigate } = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
  const [roleTab, setRoleTab] = useState('farmers');
  const [statusTab, setStatusTab] = useState('pending');
  const [pendingUsers, setPendingUsers] = useState([]);
  const [rejectedUsers, setRejectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [adminComments, setAdminComments] = useState('');
  const [previewImageError, setPreviewImageError] = useState(false);
  const { addToast } = useToast();

  // Expand/collapse state for user detail rows
  const [expandedUsers, setExpandedUsers] = useState({});
  // Document loading state per user
  const [docLoadingUsers, setDocLoadingUsers] = useState({});
  // Fetched documents per user
  const [userDocuments, setUserDocuments] = useState({});
  // Document preview modal
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (statusTab === 'pending') {
      fetchPendingUsers();
    } else {
      fetchRejectedUsers();
    }
    // Clear expanded state when tab changes
    setExpandedUsers({});
    setUserDocuments({});
  }, [roleTab, statusTab]);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getPendingKYC({ role: roleTab });
      console.log('✅ Pending KYC users:', data);
      setPendingUsers(data.data || []);
    } catch (error) {
      console.error('Error fetching pending KYC:', error);
      const status = error?.response?.status || error?.status;
      const message = error?.response?.data?.message || error?.message || 'Unknown error';

      if (status === 403) {
        console.warn('⚠️ 403 Forbidden — trying test endpoint fallback...');
        try {
          const testData = await adminService.getPendingKYCTest({ role: roleTab });
          console.log('✅ Test endpoint fallback succeeded:', testData);
          setPendingUsers(testData.data || []);
          setError('Using debug mode — data shown via test endpoint. Create an admin account for production use.');
          return;
        } catch (testErr) {
          console.error('Test endpoint fallback also failed:', testErr);
        }
      }

      setError(`Failed to load ${statusTab} ${roleTab}: ${message} (HTTP ${status || 'Network Error'})`);
    } finally {
      setLoading(false);
    }
  };

  const fetchRejectedUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getRejectedKYC({ role: roleTab });
      console.log('✅ Rejected KYC users:', data);
      setRejectedUsers(data.data || []);
    } catch (error) {
      console.error('Error fetching rejected KYC:', error);
      const status = error?.response?.status || error?.status;
      const message = error?.response?.data?.message || error?.message || 'Unknown error';

      if (status === 403) {
        console.warn('⚠️ 403 Forbidden on rejected — trying test endpoint fallback...');
        try {
          const testData = await adminService.getRejectedKYCTest({ role: roleTab });
          console.log('✅ Test endpoint fallback for rejected succeeded:', testData);
          setRejectedUsers(testData.data || []);
          setError('Using debug mode — data shown via test endpoint.');
          return;
        } catch (testErr) {
          console.error('Test endpoint fallback also failed:', testErr);
        }
      }

      setError(`Failed to load ${statusTab} ${roleTab}: ${message} (HTTP ${status || 'Network Error'})`);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandUser = async (userId) => {
    const isCurrentlyExpanded = expandedUsers[userId];

    if (isCurrentlyExpanded) {
      setExpandedUsers(prev => ({ ...prev, [userId]: false }));
      return;
    }

    setExpandedUsers(prev => ({ ...prev, [userId]: true }));

    if (!userDocuments[userId]) {
      try {
        setDocLoadingUsers(prev => ({ ...prev, [userId]: true }));
        const response = await api.get(`/admin/documents/${userId}`);
        setUserDocuments(prev => ({ ...prev, [userId]: response.data || null }));
      } catch (err) {
        console.error('Failed to fetch user documents:', err);
        setUserDocuments(prev => ({ ...prev, [userId]: { error: true } }));
      } finally {
        setDocLoadingUsers(prev => ({ ...prev, [userId]: false }));
      }
    }
  };

  const handleApproveFarmer = async (userId, userName) => {
    if (!window.confirm(`Approve KYC for ${userName}?`)) return;

    try {
      setActionLoading(true);
      await adminService.approveUserKYC(userId, { comments: adminComments });
      addToast(`${userName} KYC approved!`, 'success');
      setAdminComments('');
      // Remove from expanded/docs state
      setExpandedUsers(prev => { const next = { ...prev }; delete next[userId]; return next; });
      setUserDocuments(prev => { const next = { ...prev }; delete next[userId]; return next; });
      await fetchPendingUsers();
    } catch (error) {
      console.error('Error approving:', error);
      addToast(error.response?.data?.message || 'Error approving KYC', 'error');
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
      addToast('Please provide a rejection reason', 'warning');
      return;
    }

    try {
      setActionLoading(true);
      await adminService.rejectUserKYC(selectedUser._id, { reason: rejectionReason });
      addToast(`${selectedUser.firstName} KYC rejected`, 'success');
      setShowRejectModal(false);
      setRejectionReason('');
      // Remove from expanded/docs state
      setExpandedUsers(prev => { const next = { ...prev }; delete next[selectedUser._id]; return next; });
      setUserDocuments(prev => { const next = { ...prev }; delete next[selectedUser._id]; return next; });
      await fetchPendingUsers();
    } catch (error) {
      console.error('Error rejecting:', error);
      addToast(error.response?.data?.message || 'Error rejecting KYC', 'error');
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
      await adminService.deleteUser(userId);
      addToast(`${userName} account and all associated data have been deleted`, 'success');
      setExpandedUsers(prev => { const next = { ...prev }; delete next[userId]; return next; });
      setUserDocuments(prev => { const next = { ...prev }; delete next[userId]; return next; });
      if (statusTab === 'pending') {
        await fetchPendingUsers();
      } else {
        await fetchRejectedUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      addToast(error.response?.data?.message || 'Error deleting user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const getDocTypeLabel = (type) => {
    const labels = {
      governmentId: 'Government ID',
      profilePhoto: 'Profile Photo',
      addressProof: 'Address Proof',
      landOwnership: 'Land Ownership',
      farmRegistration: 'Farm Registration',
    };
    return labels[type] || type;
  };

  const isImageDoc = (doc) => {
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    return imageTypes.includes(doc?.mimeType) || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(doc?.fileName || '');
  };

  const getUserInitials = (userItem) => {
    const first = (userItem.firstName || '').charAt(0).toUpperCase();
    const last = (userItem.lastName || '').charAt(0).toUpperCase();
    return first + last || '?';
  };

  const getAvatarGradient = (role) => {
    if (role === 'farmer') return 'from-green-500 to-emerald-600';
    return 'from-blue-500 to-indigo-600';
  };

  // KYC Status Badge
  const KYCStatusBadge = ({ status }) => {
    if (status === 'verified') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-bold">
          <CheckCircle size={12} /> Verified
        </span>
      );
    } else if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-bold">
          <XCircle size={12} /> Rejected
        </span>
      );
    } else if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
          <Clock size={12} /> Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
        <Shield size={12} /> {status || 'N/A'}
      </span>
    );
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

  const sourceUsers = statusTab === 'pending' ? pendingUsers : rejectedUsers;
  const displayedUsers = sourceUsers.filter(u => {
    if (roleTab === 'farmers') return u.role === 'farmer';
    return u.role === 'buyer';
  });

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-100 flex">
        {/* Mobile Backdrop */}
        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        {/* Sidebar */}
        <div className={`fixed lg:static inset-y-0 left-0 lg:inset-auto transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-20'} bg-gradient-to-b from-blue-700 to-blue-800 text-white flex flex-col z-40 ${sidebarOpen ? '' : 'hidden lg:flex'}`}>
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
              { label: 'Notifications', path: '/admin/notifications' }
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
                <div className="flex items-center gap-3">
                  <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900"><Menu size={24} /></button>
                  <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">KYC Approvals</h1>
                  <p className="text-gray-600 mt-1">Review and approve pending farmer/buyer registrations</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => statusTab === 'pending' ? fetchPendingUsers() : fetchRejectedUsers()}
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
                <div className="flex gap-4 mb-4 flex-wrap items-center">
                  <button
                    onClick={() => setStatusTab('pending')}
                    className={`px-6 py-3 rounded-lg font-bold transition ${
                      statusTab === 'pending'
                        ? 'bg-yellow-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 border-2 border-yellow-200 hover:border-yellow-400'
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
                        ? 'bg-red-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 border-2 border-red-200 hover:border-red-400'
                    }`}
                  >
                    ❌ Rejected ({rejectedUsers.filter(u => {
                      if (roleTab === 'farmers') return u.role === 'farmer';
                      return u.role === 'buyer';
                    }).length})
                  </button>
                </div>

                <div className="flex gap-4 flex-wrap items-center">
                  <button
                    onClick={() => setRoleTab('farmers')}
                    className={`px-6 py-3 rounded-lg font-bold transition ${
                      roleTab === 'farmers'
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 border-2 border-green-200 hover:border-green-400'
                    }`}
                  >
                    👨‍🌾 Farmers
                  </button>
                  <button
                    onClick={() => setRoleTab('buyers')}
                    className={`px-6 py-3 rounded-lg font-bold transition ${
                      roleTab === 'buyers'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 border-2 border-blue-200 hover:border-blue-400'
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

              {/* Error Banner */}
              {error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-red-800 mb-1">⚠️ Data Loading Error</p>
                      <p className="text-sm text-red-700">{error}</p>
                      <p className="text-xs text-red-600 mt-2">
                        This usually means no admin user exists in the database. Run the admin seed script to create one.
                      </p>
                    </div>
                    <button
                      onClick={() => setError(null)}
                      className="text-red-400 hover:text-red-600 flex-shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Content */}
              {loading ? (
                <Card className="text-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading users...</p>
                </Card>
              ) : displayedUsers.length === 0 ? (
                <Card className={`${error ? 'bg-yellow-50 border-l-4 border-yellow-500' : 'bg-green-50 border-l-4 border-green-500'}`}>
                  <div className="p-8 text-center">
                    {error ? (
                      <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
                    ) : (
                      <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                    )}
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {error ? 'Unable to Load Data' : 'All Caught Up!'}
                    </h3>
                    <p className="text-gray-600">
                      {error
                        ? 'Check the error message above. The most common fix is creating an admin user.'
                        : `No ${statusTab} ${roleTab} KYC requests at the moment.`
                      }
                    </p>

                    <div className="mt-6 pt-6 border-t border-green-200">
                      <p className="text-sm text-gray-600 mb-3">🔍 Troubleshooting:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <button
                          onClick={async () => {
                            try {
                              const data = await adminService.debugKYCStatus();
                              console.log('📊 All Users KYC Status:', data);
                              addToast('Check Console (F12) for detailed breakdown', 'info');
                            } catch {
                              addToast('Debug endpoint failed. Is the backend running?', 'error');
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold"
                        >
                          View All Users Debug Info
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const data = await adminService.getPendingKYCTest({ role: roleTab });
                              console.log('📊 Test endpoint result:', data);
                              if (data.data && data.data.length > 0) {
                                setPendingUsers(data.data);
                                setError('✅ Data loaded via test endpoint (bypasses auth). Create an admin user for production.');
                              } else {
                                addToast(`Test endpoint returned 0 ${roleTab} with pending KYC.`, 'warning');
                              }
                            } catch {
                              addToast('Test endpoint also failed. Is the backend running on port 5000?', 'error');
                            }
                          }}
                          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded font-semibold"
                        >
                          Try Test Endpoint (No Auth)
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="space-y-4">
                  {displayedUsers.map(userItem => {
                    const isExpanded = expandedUsers[userItem._id];
                    const docs = userDocuments[userItem._id];
                    const docsLoading = docLoadingUsers[userItem._id];

                    return (
                      <Card key={userItem._id} className="overflow-hidden hover:shadow-md transition-shadow">
                        {/* Main Row */}
                        <div className="p-5">
                          <div className="flex flex-col sm:flex-row items-start gap-4">
                            <div className="flex items-start gap-4 min-w-0 flex-1">
                            {/* Expand Toggle */}
                            <button
                              onClick={() => toggleExpandUser(userItem._id)}
                              className="mt-3 p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                              title={isExpanded ? 'Collapse details' : 'Expand to view documents & details'}
                            >
                              {isExpanded ? (
                                <ChevronDown size={20} className="text-blue-600" />
                              ) : (
                                <ChevronRight size={20} className="text-gray-400" />
                              )}
                            </button>

                            {/* Avatar */}
                            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarGradient(userItem.role)} flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md`}>
                              {getUserInitials(userItem)}
                            </div>

                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 flex-wrap mb-1">
                                <h3 className="text-lg font-bold text-gray-900">
                                  {userItem.firstName} {userItem.lastName}
                                </h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                  userItem.role === 'farmer'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {userItem.role?.toUpperCase()}
                                </span>
                                <KYCStatusBadge status={userItem.kycStatus} />
                              </div>
                              <p className="text-gray-600 text-sm">{userItem.email}</p>

                              {/* Quick Info Row */}
                              <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                                {userItem.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone size={12} /> {userItem.phone}
                                  </span>
                                )}
                                {userItem.role === 'farmer' && userItem.farmName && (
                                  <span className="flex items-center gap-1">
                                    <Home size={12} /> {userItem.farmName}
                                  </span>
                                )}
                                {userItem.role === 'buyer' && userItem.addresses?.[0]?.city && (
                                  <span className="flex items-center gap-1">
                                    <MapPin size={12} /> {userItem.addresses[0].city}, {userItem.addresses[0].state}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar size={12} />
                                  Submitted: {userItem.kycSubmittedAt
                                    ? new Date(userItem.kycSubmittedAt).toLocaleDateString()
                                    : new Date(userItem.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                              {statusTab === 'pending' ? (
                                <>
                                  <button
                                    onClick={() => handleApproveFarmer(userItem._id, `${userItem.firstName} ${userItem.lastName}`)}
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 transition shadow-sm"
                                  >
                                    <CheckCircle size={16} />
                                    {actionLoading ? '...' : 'Approve'}
                                  </button>
                                  <button
                                    onClick={() => handleRejectClick(userItem)}
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 transition shadow-sm"
                                  >
                                    <XCircle size={16} />
                                    Reject
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleDeleteUser(userItem._id, `${userItem.firstName} ${userItem.lastName}`)}
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 transition shadow-sm"
                                  >
                                    <XCircle size={16} />
                                    {actionLoading ? 'Deleting...' : 'Delete'}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expanded KYC Details Panel */}
                        {isExpanded && (
                          <div className="border-t-2 border-blue-100 bg-gradient-to-b from-blue-50/50 to-white">
                            {docsLoading ? (
                              <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                                <p className="text-sm text-gray-500">Loading documents from server...</p>
                              </div>
                            ) : (
                              <div className="p-6 space-y-6">
                                {/* KYC Personal Details */}
                                <div>
                                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Shield size={16} className="text-blue-600" />
                                    KYC Personal Details
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-white rounded-lg border border-gray-200 p-4">
                                    <div>
                                      <p className="text-xs text-gray-500 font-semibold">Aadhar Number</p>
                                      <p className="text-sm font-bold text-gray-900">
                                        {userItem.kycDetails?.aadharNumber || 'N/A'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500 font-semibold">KYC Status</p>
                                      <KYCStatusBadge status={userItem.kycStatus} />
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500 font-semibold">Submitted</p>
                                      <p className="text-sm font-bold text-gray-900">
                                        {userItem.kycSubmittedAt
                                          ? new Date(userItem.kycSubmittedAt).toLocaleDateString()
                                          : 'N/A'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500 font-semibold">Phone</p>
                                      <p className="text-sm font-bold text-gray-900">{userItem.phone || 'N/A'}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Role-Specific Details */}
                                {userItem.role === 'farmer' && (
                                  <div>
                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                      <Sprout size={16} className="text-green-600" />
                                      Farm Details
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-green-50 rounded-lg border border-green-200 p-4">
                                      <div>
                                        <p className="text-xs text-gray-500 font-semibold">Farm Name</p>
                                        <p className="text-sm font-bold text-gray-900">{userItem.farmName || 'N/A'}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500 font-semibold">Farm Area</p>
                                        <p className="text-sm font-bold text-gray-900">{userItem.farmArea || 'N/A'} acres</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500 font-semibold">Experience</p>
                                        <p className="text-sm font-bold text-gray-900">{userItem.experience || 0} years</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500 font-semibold">Crops Grown</p>
                                        <p className="text-sm font-bold text-gray-900">
                                          {userItem.cropsGrown?.length ? userItem.cropsGrown.join(', ') : 'N/A'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {userItem.role === 'buyer' && (
                                  <div>
                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                      <MapPin size={16} className="text-blue-600" />
                                      Address Details
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-blue-50 rounded-lg border border-blue-200 p-4">
                                      <div className="col-span-2">
                                        <p className="text-xs text-gray-500 font-semibold">Street Address</p>
                                        <p className="text-sm font-bold text-gray-900">
                                          {userItem.addresses?.[0]?.streetAddress || 'N/A'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500 font-semibold">City</p>
                                        <p className="text-sm font-bold text-gray-900">
                                          {userItem.addresses?.[0]?.city || 'N/A'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500 font-semibold">State</p>
                                        <p className="text-sm font-bold text-gray-900">
                                          {userItem.addresses?.[0]?.state || 'N/A'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500 font-semibold">Pincode</p>
                                        <p className="text-sm font-bold text-gray-900">
                                          {userItem.addresses?.[0]?.pincode || 'N/A'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* KYC Documents Section */}
                                <div>
                                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <FileText size={16} className="text-indigo-600" />
                                    KYC Documents Uploaded
                                  </h4>

                                  {/* Inline KYC docs from user object */}
                                  {userItem.kycDocuments && Object.keys(userItem.kycDocuments).length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                      {Object.entries(userItem.kycDocuments).map(([docType, docData]) => {
                                        if (!docData || !docData.url) return null;
                                        return (
                                          <DocThumbnail
                                            key={docType}
                                            doc={{
                                              ...docData,
                                              type: getDocTypeLabel(docType),
                                              docType
                                            }}
                                            onPreview={(doc) => { setPreviewDoc(doc); setPreviewImageError(false); }}
                                            formatFileSize={formatFileSize}
                                            isImageDoc={isImageDoc}
                                          />
                                        );
                                      })}
                                    </div>
                                  ) : docs && !docs.error && docs.documents?.kycDocuments?.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                      {docs.documents.kycDocuments.map((doc, idx) => (
                                        <DocThumbnail key={idx} doc={doc} onPreview={(doc) => { setPreviewDoc(doc); setPreviewImageError(false); }} formatFileSize={formatFileSize} isImageDoc={isImageDoc} />
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                                      <p className="text-sm text-yellow-700">
                                        No KYC documents found. The user may not have uploaded documents yet.
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Farm Images (farmers only) */}
                                {userItem.role === 'farmer' && docs && !docs.error && docs.documents?.farmImages?.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                      <ImageIcon size={16} className="text-green-600" />
                                      Farm Images ({docs.documents.farmImages.length})
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                      {docs.documents.farmImages.map((imgUrl, idx) => (
                                        <div
                                          key={idx}
                                          className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                                          onClick={() => { setPreviewImageError(false); setPreviewDoc({
                                            fileName: `farm-image-${idx + 1}.jpg`,
                                            url: imgUrl,
                                            mimeType: 'image/jpeg',
                                            fileSize: 0,
                                            type: 'Farm Image'
                                          });}}
                                        >
                                          <div className="h-24 bg-gray-100 overflow-hidden">
                                            <img
                                              src={resolveDocUrl(imgUrl)}
                                              alt={`Farm ${idx + 1}`}
                                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                              onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                          </div>
                                          <div className="p-2">
                                            <p className="text-xs text-gray-500">Farm Image {idx + 1}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Rejection Reason (for rejected users) */}
                                {statusTab === 'rejected' && userItem.kycRejectionReason && (
                                  <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                                    <p className="text-sm font-bold text-red-800 mb-1">❌ Rejection Reason:</p>
                                    <p className="text-sm text-red-700">{userItem.kycRejectionReason}</p>
                                  </div>
                                )}

                                {/* Admin Comments for pending */}
                                {statusTab === 'pending' && (
                                  <div>
                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                      <FileText size={16} className="text-gray-600" />
                                      Admin Comments (Optional)
                                    </h4>
                                    <textarea
                                      value={adminComments}
                                      onChange={(e) => setAdminComments(e.target.value)}
                                      placeholder="Add any comments or notes about this KYC application..."
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                                      rows="3"
                                    />
                                  </div>
                                )}

                                {/* Action Buttons in expanded view */}
                                <div className="flex gap-3 pt-2 border-t border-gray-100">
                                  {statusTab === 'pending' ? (
                                    <>
                                      <button
                                        onClick={() => handleApproveFarmer(userItem._id, `${userItem.firstName} ${userItem.lastName}`)}
                                        disabled={actionLoading}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-bold transition shadow-sm"
                                      >
                                        <CheckCircle size={18} />
                                        {actionLoading ? 'Processing...' : 'Approve KYC'}
                                      </button>
                                      <button
                                        onClick={() => handleRejectClick(userItem)}
                                        disabled={actionLoading}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-bold transition shadow-sm"
                                      >
                                        <XCircle size={18} />
                                        Reject KYC
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => handleDeleteUser(userItem._id, `${userItem.firstName} ${userItem.lastName}`)}
                                      disabled={actionLoading}
                                      className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-bold transition shadow-sm"
                                    >
                                      <XCircle size={18} />
                                      {actionLoading ? 'Deleting...' : 'Delete Account Permanently'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Document Preview Modal */}
        {previewDoc && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => { setPreviewDoc(null); setPreviewImageError(false); }}>
            <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{previewDoc.fileName}</h3>
                  <p className="text-xs text-gray-500">
                    {previewDoc.type || 'Document'} • {formatFileSize(previewDoc.fileSize)}
                  </p>
                </div>
                <button
                  onClick={() => { setPreviewDoc(null); setPreviewImageError(false); }}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              <div className="p-4 overflow-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
                {isImageDoc(previewDoc) && !previewImageError ? (
                  <img
                    src={resolveDocUrl(previewDoc.url)}
                    alt={previewDoc.fileName}
                    className="w-full h-auto rounded-lg"
                    onError={() => setPreviewImageError(true)}
                  />
                ) : /\.pdf$/i.test(previewDoc.fileName || '') || previewDoc.mimeType === 'application/pdf' ? (
                  <iframe
                    src={getProxyUrl(previewDoc.url)}
                    className="w-full rounded-lg border border-gray-200"
                    style={{ height: 'calc(90vh - 160px)', minHeight: '500px' }}
                    title={previewDoc.fileName}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <FileText size={64} className="mb-4" />
                    <p className="font-semibold text-gray-600">Document Preview</p>
                    <p className="text-sm mt-1">This file type cannot be previewed inline.</p>
                    <a
                      href={getProxyUrl(previewDoc.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition text-sm"
                    >
                      Open Document
                    </a>
                  </div>
                )}
              </div>
            </div>
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
