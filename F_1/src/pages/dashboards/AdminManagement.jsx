import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import { adminService } from '../../services/appService';
import PageTransition from '../../components/common/PageTransition.jsx';
import Card from '../../components/common/Card';
import LogoutConfirmationModal from '../../components/common/LogoutConfirmationModal';
import {
  AlertTriangle, Menu, Trash2, Pause, LogOut,
  ChevronDown, ChevronRight, FileText, Image as ImageIcon,
  X, Phone, MapPin, Calendar,
  Sprout, Home, Shield, Clock, CheckCircle, XCircle,
  Users, Package, ShoppingCart, IndianRupee, AlertCircle, Search,
  UserCheck, UserX, BarChart3
} from 'lucide-react';
import api from '../../services/api.js';
import { useToast } from '../../context/ToastContext';

// ─── Document URL Helpers (DO NOT MODIFY — document preview is working) ───

import { getImageUrl } from '../../utils/formatters';

const resolveDocUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return getImageUrl(url) || url;
};

// Uses VITE_API_BASE_URL to bypass Vercel's SPA catch-all in production
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const getProxyUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}/admin/documents/proxy?url=${encodeURIComponent(url)}`;
};

// ─── Document Thumbnail Card ───

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

// ─── Stats Card Component ───

const StatsCard = ({ icon, label, value, sub, color, gradient }) => {
  const IconComponent = icon;
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
          <p className={`text-3xl font-extrabold mt-1 ${color || 'text-gray-900'}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${gradient || 'bg-gray-100'}`}>
          <IconComponent size={22} className={color || 'text-gray-600'} />
        </div>
      </div>
    </div>
  );
};

// ─── KYC Status Badge ───

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

// ─── Main Component ───

export default function AdminManagement() {
  const { user, logout } = useAuth();
  const { navigate } = useRouter();
  const { addToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
  const [activeTab, setActiveTab] = useState('farmers');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [freezeReason, setFreezeReason] = useState('');
  const [freezeCustomReason, setFreezeCustomReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [previewImageError, setPreviewImageError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Expand/collapse state
  const [expandedUsers, setExpandedUsers] = useState({});
  const [docLoadingUsers, setDocLoadingUsers] = useState({});
  const [userDocuments, setUserDocuments] = useState({});
  const [previewDoc, setPreviewDoc] = useState(null);

  // Dashboard stats (real data from backend)
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Tab counts
  const [tabCounts, setTabCounts] = useState({ farmers: 0, buyers: 0, suspended: 0 });

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchStats();
  }, []);

  useEffect(() => {
    fetchUsers();
    setExpandedUsers({});
    setUserDocuments({});
  }, [activeTab, searchTerm]);

  // ─── Fetch dashboard stats ───

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await adminService.getDashboardStats();
      const data = response.data?.data || response.data || {};
      setStats(data);

      // Derive tab counts from stats
      setTabCounts({
        farmers: data.users?.farmers || 0,
        buyers: data.users?.buyers || 0,
        suspended: 0, // Will be populated by fetchUsers for suspended tab
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // ─── Fetch users ───

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let response;
      if (activeTab === 'farmers') {
        response = await adminService.getApprovedFarmers(searchTerm);
      } else if (activeTab === 'buyers') {
        response = await adminService.getApprovedBuyers(searchTerm);
      } else if (activeTab === 'suspended') {
        response = await adminService.getSuspendedUsers(searchTerm);
      } else {
        response = await adminService.getUsers();
      }
      const userList = response.data?.data || response.data || [];
      setUsers(userList);

      // Update suspended count from actual data
      if (activeTab === 'suspended') {
        setTabCounts(prev => ({
          ...prev,
          suspended: response.data?.pagination?.total || userList.length,
        }));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // ─── Expand/collapse user ───

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

  // ─── Freeze ───

  const handleFreezeClick = (user) => {
    setSelectedUser(user);
    setFreezeReason('');
    setFreezeCustomReason('');
    setShowFreezeModal(true);
  };

  const handleSubmitFreeze = async () => {
    const reason = freezeReason === 'Other' ? freezeCustomReason : freezeReason;
    if (!reason.trim()) {
      addToast('Please provide a reason for freezing', 'warning');
      return;
    }

    try {
      setActionLoading(true);
      await adminService.toggleUserStatus(selectedUser._id, 'suspended', reason);
      addToast(`${selectedUser.firstName} account has been frozen`, 'success');
      setShowFreezeModal(false);
      setFreezeReason('');
      setFreezeCustomReason('');
      await fetchUsers();
      await fetchStats();
    } catch (error) {
      console.error('Error freezing user:', error);
      addToast(error.response?.data?.message || 'Error freezing user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Delete ───

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setDeleteReason('');
    setShowDeleteModal(true);
  };

  const handleSubmitDelete = async () => {
    if (!deleteReason.trim()) {
      addToast('Please provide a reason for deletion', 'warning');
      return;
    }

    try {
      setActionLoading(true);
      await adminService.deleteUser(selectedUser._id, deleteReason);
      addToast(`${selectedUser.firstName} account has been deleted`, 'success');
      setShowDeleteModal(false);
      setDeleteReason('');
      setExpandedUsers(prev => {
        const next = { ...prev };
        delete next[selectedUser._id];
        return next;
      });
      setUserDocuments(prev => {
        const next = { ...prev };
        delete next[selectedUser._id];
        return next;
      });
      await fetchUsers();
      await fetchStats();
    } catch (error) {
      console.error('Error deleting user:', error);
      addToast(error.response?.data?.message || 'Error deleting user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Unfreeze ───

  const handleUnfreeze = async (user) => {
    if (!window.confirm(`Unfreeze ${user.firstName}?`)) return;

    try {
      setActionLoading(true);
      await adminService.toggleUserStatus(user.id || user._id, 'active');
      addToast(`${user.firstName} account has been unfrozen`, 'success');
      await fetchUsers();
      await fetchStats();
    } catch (error) {
      console.error('Error unfreezing:', error);
      addToast(error.response?.data?.message || 'Error unfreezing user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Helpers ───

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
    if (role === 'buyer') return 'from-blue-500 to-indigo-600';
    return 'from-gray-500 to-gray-600';
  };

  const formatCurrency = (amount) => {
    if (amount == null) return '₹0';
    return '₹' + Number(amount).toLocaleString('en-IN');
  };

  // ─── Access control ───

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

  // ─── Render ───

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 flex">
        {/* Mobile Backdrop */}
        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        {/* ─── Sidebar ─── */}
        <aside className={`fixed lg:static inset-y-0 left-0 transition-all duration-300 z-40 ${sidebarOpen ? 'w-72' : 'w-20'} bg-gradient-to-b from-purple-700 via-purple-800 to-indigo-900 text-white flex flex-col shadow-2xl ${sidebarOpen ? '' : 'hidden lg:flex'}`}>
          <div className="p-6 border-b border-purple-600/50">
            <div className="flex items-center justify-between">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-1 hover:bg-purple-600 rounded">
                <Menu size={24} />
              </button>
              {sidebarOpen && (
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">FarmDirect</h2>
                  <p className="text-xs text-purple-200 mt-0.5">Admin Panel</p>
                </div>
              )}
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            {[
              { label: 'Dashboard', path: '/admin/dashboard', icon: BarChart3 },
              { label: 'Approvals', path: '/admin/approvals', icon: UserCheck },
              { label: 'Management', path: '/admin/management', icon: Users, active: true },
              { label: 'Crops', path: '/admin/crops', icon: Sprout },
              { label: 'Notifications', path: '/admin/notifications', icon: AlertCircle },
            ].map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                  item.active
                    ? 'bg-white/20 text-white shadow-lg shadow-purple-900/20'
                    : 'text-purple-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon size={18} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-purple-600/50">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-xl transition text-sm font-medium"
            >
              <LogOut size={16} />
              {sidebarOpen && 'Logout'}
            </button>
          </div>
        </aside>

        {/* ─── Main Content ─── */}
        <div className="flex-1 overflow-auto min-h-screen">
          <div className="p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {/* ─── Header ─── */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900"><Menu size={24} /></button>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">
                    User Management
                  </h1>
                  <p className="text-gray-500 mt-1 text-sm">
                    Manage verified users, review KYC details, and handle account actions
                  </p>
                </div>
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition"
                >
                  <Menu size={20} className="text-gray-600" />
                </button>
              </div>

              {/* ─── Stats Cards ─── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatsCard
                  icon={Users}
                  label="Verified Users"
                  value={statsLoading ? '...' : (stats?.users?.total || 0)}
                  sub={`${stats?.users?.farmers || 0} farmers · ${stats?.users?.buyers || 0} buyers`}
                  color="text-purple-600"
                  gradient="bg-purple-100"
                />
                <StatsCard
                  icon={AlertCircle}
                  label="Pending KYC"
                  value={statsLoading ? '...' : (stats?.pendingKYC || 0)}
                  sub="Awaiting review"
                  color="text-amber-600"
                  gradient="bg-amber-100"
                />
                <StatsCard
                  icon={Package}
                  label="Active Crops"
                  value={statsLoading ? '...' : (stats?.crops?.active || 0)}
                  sub={`of ${stats?.crops?.total || 0} total`}
                  color="text-green-600"
                  gradient="bg-green-100"
                />
                <StatsCard
                  icon={IndianRupee}
                  label="Total Revenue"
                  value={statsLoading ? '...' : formatCurrency(stats?.orders?.totalRevenue)}
                  sub={`${stats?.orders?.completed || 0} completed orders`}
                  color="text-blue-600"
                  gradient="bg-blue-100"
                />
              </div>

              {/* ─── Tabs ─── */}
              <div className="flex gap-2 mb-6 flex-wrap">
                {[
                  { id: 'farmers', label: 'Farmers', icon: Sprout, count: tabCounts.farmers },
                  { id: 'buyers', label: 'Buyers', icon: ShoppingCart, count: tabCounts.buyers },
                  { id: 'suspended', label: 'Suspended', icon: UserX, count: tabCounts.suspended },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 scale-105'
                        : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-purple-300 hover:text-purple-600'
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                      activeTab === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* ─── Search ─── */}
              <div className="relative mb-6">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or farm name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-50 text-sm transition-all"
                />
              </div>

              {/* ─── Content ─── */}
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-200" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-1/3" />
                          <div className="h-3 bg-gray-100 rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : users.length === 0 ? (
                <Card className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                    {activeTab === 'farmers' ? (
                      <Sprout size={32} className="text-gray-400" />
                    ) : activeTab === 'buyers' ? (
                      <ShoppingCart size={32} className="text-gray-400" />
                    ) : (
                      <UserX size={32} className="text-gray-400" />
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-700 mb-1">
                    {searchTerm
                      ? `No ${activeTab} match "${searchTerm}"`
                      : activeTab === 'suspended'
                        ? 'No suspended users'
                        : `No ${activeTab} found`}
                  </h3>
                  <p className="text-sm text-gray-400 max-w-md mx-auto">
                    {searchTerm
                      ? 'Try adjusting your search terms or clear the search to see all users.'
                      : activeTab === 'suspended'
                        ? 'All user accounts are currently in good standing.'
                        : activeTab === 'farmers'
                          ? 'Verified farmers will appear here after KYC approval.'
                          : 'Verified buyers will appear here after KYC approval.'}
                  </p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="mt-4 px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition"
                    >
                      Clear Search
                    </button>
                  )}
                </Card>
              ) : (
                <div className="space-y-4">
                  {users.map(userItem => {
                    const isExpanded = expandedUsers[userItem._id];
                    const docs = userDocuments[userItem._id];
                    const docsLoading = docLoadingUsers[userItem._id];

                    return (
                      <div
                        key={userItem._id}
                        className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
                      >
                        {/* ─── Main Row ─── */}
                        <div className="p-5">
                          <div className="flex flex-col sm:flex-row items-start gap-4">
                            <div className="flex items-start gap-4 min-w-0 flex-1">
                            {/* Expand Toggle */}
                            <button
                              onClick={() => toggleExpandUser(userItem._id)}
                              className="mt-3 p-1.5 hover:bg-purple-50 rounded-xl transition-colors flex-shrink-0 group"
                              title={isExpanded ? 'Collapse details' : 'Expand to view KYC details & documents'}
                            >
                              {isExpanded ? (
                                <ChevronDown size={20} className="text-purple-600" />
                              ) : (
                                <ChevronRight size={20} className="text-gray-400 group-hover:text-purple-500 transition-colors" />
                              )}
                            </button>

                            {/* Avatar */}
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getAvatarGradient(userItem.role)} flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md`}>
                              {getUserInitials(userItem)}
                            </div>

                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2.5 flex-wrap mb-1">
                                <h3 className="text-base font-bold text-gray-900">
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
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                  userItem.status === 'active'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : userItem.status === 'suspended'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {userItem.status}
                                </span>
                              </div>
                              <p className="text-gray-500 text-sm">{userItem.email}</p>

                              {/* Quick Info */}
                              <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
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
                                {userItem.kycSubmittedAt && (
                                  <span className="flex items-center gap-1">
                                    <Calendar size={12} /> KYC: {new Date(userItem.kycSubmittedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                              {activeTab === 'suspended' ? (
                                <>
                                  <button
                                    onClick={() => handleUnfreeze(userItem)}
                                    disabled={actionLoading}
                                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl text-xs font-bold transition-all hover:shadow-lg hover:shadow-blue-200"
                                  >
                                    Unfreeze
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(userItem)}
                                    disabled={actionLoading}
                                    className="px-3.5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all hover:shadow-lg hover:shadow-red-200"
                                  >
                                    <Trash2 size={14} />
                                    Delete
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleFreezeClick(userItem)}
                                    disabled={actionLoading}
                                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-400 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all hover:shadow-lg hover:shadow-amber-200"
                                  >
                                    <Pause size={14} />
                                    Freeze
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(userItem)}
                                    disabled={actionLoading}
                                    className="px-3.5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all hover:shadow-lg hover:shadow-red-200"
                                  >
                                    <Trash2 size={14} />
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* ─── Expanded KYC Details Panel ─── */}
                        {isExpanded && (
                          <div className="border-t-2 border-purple-100 bg-gradient-to-b from-purple-50/40 to-white">
                            {docsLoading ? (
                              <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
                                <p className="text-sm text-gray-500">Loading documents...</p>
                              </div>
                            ) : (
                              <div className="p-6 space-y-6">
                                {/* KYC Personal Details */}
                                <div>
                                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                                      <Shield size={14} className="text-purple-600" />
                                    </div>
                                    KYC Personal Details
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-white rounded-xl border border-gray-200 p-4">
                                    <div>
                                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Aadhar</p>
                                      <p className="text-sm font-bold text-gray-900 mt-0.5">
                                        {userItem.kycDetails?.aadharNumber || '—'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">KYC Status</p>
                                      <div className="mt-0.5"><KYCStatusBadge status={userItem.kycStatus} /></div>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Submitted</p>
                                      <p className="text-sm font-bold text-gray-900 mt-0.5">
                                        {userItem.kycSubmittedAt
                                          ? new Date(userItem.kycSubmittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                          : '—'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Verified</p>
                                      <p className="text-sm font-bold text-gray-900 mt-0.5">
                                        {userItem.kycVerifiedAt
                                          ? new Date(userItem.kycVerifiedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                          : '—'}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Role-Specific Details */}
                                {userItem.role === 'farmer' && (
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                                        <Sprout size={14} className="text-green-600" />
                                      </div>
                                      Farm Details
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-green-50/50 rounded-xl border border-green-200 p-4">
                                      <div>
                                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Farm Name</p>
                                        <p className="text-sm font-bold text-gray-900 mt-0.5">{userItem.farmName || '—'}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Farm Area</p>
                                        <p className="text-sm font-bold text-gray-900 mt-0.5">{userItem.farmArea ? `${userItem.farmArea} acres` : '—'}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Experience</p>
                                        <p className="text-sm font-bold text-gray-900 mt-0.5">{userItem.experience ? `${userItem.experience} years` : '—'}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Crops Grown</p>
                                        <p className="text-sm font-bold text-gray-900 mt-0.5">
                                          {userItem.cropsGrown?.length ? userItem.cropsGrown.join(', ') : '—'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {userItem.role === 'buyer' && (
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <MapPin size={14} className="text-blue-600" />
                                      </div>
                                      Address Details
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-blue-50/50 rounded-xl border border-blue-200 p-4">
                                      <div className="col-span-2">
                                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Street Address</p>
                                        <p className="text-sm font-bold text-gray-900 mt-0.5">
                                          {userItem.addresses?.[0]?.streetAddress || '—'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">City</p>
                                        <p className="text-sm font-bold text-gray-900 mt-0.5">
                                          {userItem.addresses?.[0]?.city || '—'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">State</p>
                                        <p className="text-sm font-bold text-gray-900 mt-0.5">
                                          {userItem.addresses?.[0]?.state || '—'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Pincode</p>
                                        <p className="text-sm font-bold text-gray-900 mt-0.5">
                                          {userItem.addresses?.[0]?.pincode || '—'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* KYC Documents Section */}
                                <div>
                                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                                      <FileText size={14} className="text-indigo-600" />
                                    </div>
                                    KYC Documents
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
                                    <div className={`rounded-xl border p-4 text-center ${
                                      userItem.kycStatus === 'pending'
                                        ? 'bg-amber-50 border-amber-200'
                                        : userItem.kycStatus === 'rejected'
                                        ? 'bg-red-50 border-red-200'
                                        : userItem.kycStatus === 'verified'
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-gray-50 border-gray-200'
                                    }`}>
                                      {userItem.kycStatus === 'pending' ? (
                                        <>
                                          <Clock size={20} className="mx-auto mb-1.5 text-amber-500" />
                                          <p className="text-sm font-semibold text-amber-800">KYC Pending Review</p>
                                          <p className="text-xs text-amber-600 mt-0.5">
                                            Documents have been submitted and are awaiting admin approval.
                                          </p>
                                        </>
                                      ) : userItem.kycStatus === 'rejected' ? (
                                        <>
                                          <XCircle size={20} className="mx-auto mb-1.5 text-red-500" />
                                          <p className="text-sm font-semibold text-red-800">KYC Was Rejected</p>
                                          <p className="text-xs text-red-600 mt-0.5">
                                            Previous submission was rejected. User may resubmit.
                                          </p>
                                        </>
                                      ) : userItem.kycStatus === 'verified' ? (
                                        <>
                                          <CheckCircle size={20} className="mx-auto mb-1.5 text-green-500" />
                                          <p className="text-sm font-semibold text-green-800">KYC Verified</p>
                                          <p className="text-xs text-green-600 mt-0.5">
                                            Documents are stored and accessible via the document API.
                                          </p>
                                        </>
                                      ) : (
                                        <>
                                          <FileText size={20} className="mx-auto mb-1.5 text-gray-400" />
                                          <p className="text-sm font-semibold text-gray-700">No Documents</p>
                                          <p className="text-xs text-gray-500 mt-0.5">
                                            This user has not submitted any KYC documents yet.
                                          </p>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Farm Images (farmers only) */}
                                {userItem.role === 'farmer' && docs && !docs.error && docs.documents?.farmImages?.length > 0 && (
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                                        <ImageIcon size={14} className="text-green-600" />
                                      </div>
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

                                {/* Rejection Reason */}
                                {userItem.kycStatus === 'rejected' && userItem.kycRejectionReason && (
                                  <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4">
                                    <p className="text-sm font-bold text-red-800 mb-1">Rejection Reason</p>
                                    <p className="text-sm text-red-700">{userItem.kycRejectionReason}</p>
                                  </div>
                                )}

                                {/* Admin Comments */}
                                {userItem.kycComments && (
                                  <div className="bg-blue-50 border-l-4 border-blue-500 rounded-xl p-4">
                                    <p className="text-sm font-bold text-blue-800 mb-1">Admin Comments</p>
                                    <p className="text-sm text-blue-700">{userItem.kycComments}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Document Preview Modal (DO NOT MODIFY) ─── */}
        {previewDoc && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setPreviewDoc(null); setPreviewImageError(false); }}>
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{previewDoc.fileName}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {previewDoc.type || 'Document'} · {formatFileSize(previewDoc.fileSize)}
                  </p>
                </div>
                <button
                  onClick={() => { setPreviewDoc(null); setPreviewImageError(false); }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              <div className="p-4 overflow-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
                {isImageDoc(previewDoc) && !previewImageError ? (
                  <img
                    src={resolveDocUrl(previewDoc.url)}
                    alt={previewDoc.fileName}
                    className="w-full h-auto rounded-xl"
                    onError={() => setPreviewImageError(true)}
                  />
                ) : /\.pdf$/i.test(previewDoc.fileName || '') || previewDoc.mimeType === 'application/pdf' ? (
                  <iframe
                    src={getProxyUrl(previewDoc.url)}
                    className="w-full rounded-xl border border-gray-200"
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
                      className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition text-sm shadow-lg shadow-indigo-200"
                    >
                      Open Document
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── Freeze Modal ─── */}
        {showFreezeModal && selectedUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Pause size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Freeze Account</h3>
                    <p className="text-xs text-gray-500">
                      <strong>{selectedUser.firstName} {selectedUser.lastName}</strong> · {selectedUser.email}
                    </p>
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reason for Freezing <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={freezeReason}
                    onChange={(e) => setFreezeReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50 text-sm transition"
                    disabled={actionLoading}
                  >
                    <option value="">Select a reason...</option>
                    <option value="Suspicious activity detected">Suspicious activity detected</option>
                    <option value="Payment fraud or chargebacks">Payment fraud or chargebacks</option>
                    <option value="Terms of service violation">Terms of service violation</option>
                    <option value="Multiple user reports">Multiple user reports</option>
                    <option value="Fake or misleading listings">Fake or misleading listings</option>
                    <option value="Other">Other (custom reason)</option>
                  </select>
                  {freezeReason === 'Other' && (
                    <textarea
                      placeholder="Please specify the reason..."
                      value={freezeCustomReason}
                      onChange={(e) => setFreezeCustomReason(e.target.value)}
                      className="w-full mt-2.5 px-3.5 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-400 text-sm resize-none transition"
                      rows="3"
                      disabled={actionLoading}
                    />
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowFreezeModal(false);
                      setFreezeReason('');
                      setFreezeCustomReason('');
                    }}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition disabled:bg-gray-100 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitFreeze}
                    disabled={actionLoading || (!freezeReason || (freezeReason === 'Other' && !freezeCustomReason.trim()))}
                    className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-400 text-white rounded-xl font-semibold transition text-sm shadow-lg shadow-amber-200"
                  >
                    {actionLoading ? 'Processing...' : 'Confirm Freeze'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Delete Modal ─── */}
        {showDeleteModal && selectedUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                    <Trash2 size={20} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Delete Account</h3>
                    <p className="text-xs text-gray-500">
                      <strong>{selectedUser.firstName} {selectedUser.lastName}</strong> · {selectedUser.email}
                    </p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-5">
                  <p className="text-sm text-red-700 font-medium">
                    This action is permanent and cannot be undone. All associated data including crops, orders, and documents will be removed.
                  </p>
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reason for Deletion <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="Enter the reason for account deletion..."
                    className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50 text-sm resize-none transition"
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
                    className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition disabled:bg-gray-100 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitDelete}
                    disabled={actionLoading || !deleteReason.trim()}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-xl font-semibold transition text-sm shadow-lg shadow-red-200"
                  >
                    {actionLoading ? 'Deleting...' : 'Delete Permanently'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Logout Confirmation ─── */}
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
