import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../hooks/useRouter';
import { useToast } from '../hooks/useToast';
import PageTransition from '../components/common/PageTransition.jsx';
import Button from '../components/common/Button';
import Avatar from '../components/common/Avatar';
import Card from '../components/common/Card';
import LogoutConfirmationModal from '../components/common/LogoutConfirmationModal';
import { adminService } from '../services/appService.js';
import { uploadService } from '../services/uploadService.js';
import {
  Shield, Mail, Phone, Users, TrendingUp, Activity,
  Settings, LogOut, Camera, Lock, Bell, BarChart3, Package,
  CalendarDays, Zap, CheckCircle, AlertTriangle, Loader2,
  UserCheck, Sprout, ShoppingCart, Star, Clock3, Globe
} from 'lucide-react';

export default function AdminProfile() {
  const { user, logout, updateProfile } = useAuth();
  const { navigate } = useRouter();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFarmers: 0,
    totalBuyers: 0,
    totalCrops: 0,
    totalOrders: 0,
    totalReviews: 0,
    pendingFarmers: 0,
    activeSessions: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);

  // Derive real user data — no hardcoded values
  const joinDate = user?.createdAt 
    ? new Date(user.createdAt).toISOString().split('T')[0]
    : null;
  
  const membershipDuration = user?.createdAt
    ? (() => {
        const created = new Date(user.createdAt);
        const now = new Date();
        const diffMs = now - created;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays < 30) return `${diffDays} days`;
        const diffMonths = Math.floor(diffDays / 30);
        if (diffMonths < 12) return `~${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
        const years = Math.floor(diffMonths / 12);
        const months = diffMonths % 12;
        return `~${years} year${years > 1 ? 's' : ''}${months > 0 ? ` ${months} month${months > 1 ? 's' : ''}` : ''}`;
      })()
    : null;

  const adminLevel = user?.role === 'admin' ? 'Super Admin' : 'Administrator';
  const department = user?.department || user?.bio || 'Platform Administration';

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: department,
    joinDate: joinDate || '',
    photo: user?.photo || user?.profilePicture || null,
  });

  // Sync formData when user data loads
  useEffect(() => {
    if (user) {
      const actualJoinDate = user?.createdAt 
        ? new Date(user.createdAt).toISOString().split('T')[0]
        : '';
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        department: user?.department || user?.bio || 'Platform Administration',
        joinDate: actualJoinDate,
        photo: user?.photo || user?.profilePicture || null,
      });
    }
  }, [user]);

  const [photoFile, setPhotoFile] = useState(null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      const file = files[0];
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        addToast('File size must be less than 5MB', 'error');
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, photo: reader.result }));
      reader.onerror = () => addToast('Error reading file', 'error');
      reader.readAsDataURL(file);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    try {
      if (photoFile) {
        const result = await uploadService.uploadProfilePicture(photoFile);
        if (result?.url) {
       
      // eslint-disable-next-line react-hooks/immutability
          formData.photo = result.url;
        }
      }
      if (updateProfile) {
        await updateProfile(formData);
      }
      addToast('Profile updated successfully', 'success');
      setIsEditing(false);
      setPhotoFile(null);
    } catch {
      addToast('Failed to update profile', 'error');
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    navigate('/');
    addToast('Logged out successfully', 'info');
  };

  // Fetch real-time stats from backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        setStatsError(null);

        const statsRes = await adminService.getDashboardStats();
        const statsData = statsRes.data?.data || statsRes.data || {};

        // Extract values from the dashboard stats response
        const users = statsData.users || {};
        const crops = statsData.crops || {};
        const orders = statsData.orders || {};
        const reviews = statsData.reviews || {};

        // Count active sessions from login history
        let activeSessions = 0;
        try {
          const loginHistory = JSON.parse(localStorage.getItem('loginHistory') || '[]');
          const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
          activeSessions = loginHistory.filter(entry => entry.timestamp > oneDayAgo).length;
        } catch {
          activeSessions = 1; // at least current session
        }

        setStats({
          totalUsers: users.total || 0,
          totalFarmers: users.farmers || 0,
          totalBuyers: users.buyers || 0,
          totalCrops: crops.total || 0,
          totalOrders: orders.total || 0,
          totalReviews: reviews.total || 0,
          pendingFarmers: users.pendingKYC || 0,
          activeSessions: activeSessions
        });
        setStatsLoading(false);
      } catch (error) {
        console.error('Error fetching stats:', error?.message || error);
        setStatsError(error?.message || 'Failed to load dashboard stats');
        setStatsLoading(false);
      }
    };

    fetchStats();
    let active = true;
    const interval = setInterval(() => { if (active) fetchStats(); }, 30000);
    const onVis = () => { active = !document.hidden; if (active) fetchStats(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  // Fetch real activity logs from audit trail
  useEffect(() => {
    const fetchActivity = async () => {
      if (activeTab !== 'activity') return;
      try {
        setActivityLoading(true);
        const res = await adminService.getAuditLogs({ limit: 10 });
        setActivityLogs(res.data?.logs || []);
      } catch (err) {
        console.warn('Activity logs unavailable:', err.message);
        setActivityLogs([]);
      } finally {
        setActivityLoading(false);
      }
    };

    fetchActivity();
  }, [activeTab]);

  // Format relative time
  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  };

  // Map audit action to display text and icon
  const getActivityDisplay = (log) => {
    const actionMap = {
      'approve_kyc': { label: 'Approved KYC verification', icon: CheckCircle, bgClass: 'bg-emerald-500/20', textClass: 'text-emerald-400' },
      'reject_kyc': { label: 'Rejected KYC verification', icon: AlertTriangle, bgClass: 'bg-orange-500/20', textClass: 'text-orange-400' },
      'freeze_user': { label: 'Froze user account', icon: Lock, bgClass: 'bg-red-500/20', textClass: 'text-red-400' },
      'unfreeze_user': { label: 'Unfroze user account', icon: CheckCircle, bgClass: 'bg-green-500/20', textClass: 'text-green-400' },
      'delete_user': { label: 'Deleted user account', icon: AlertTriangle, bgClass: 'bg-red-500/20', textClass: 'text-red-400' },
      'approve_crop': { label: 'Approved crop listing', icon: Sprout, bgClass: 'bg-emerald-500/20', textClass: 'text-emerald-400' },
      'reject_crop': { label: 'Rejected crop listing', icon: AlertTriangle, bgClass: 'bg-orange-500/20', textClass: 'text-orange-400' },
      'freeze_crop': { label: 'Froze crop listing', icon: Lock, bgClass: 'bg-red-500/20', textClass: 'text-red-400' },
      'delete_crop': { label: 'Deleted crop listing', icon: AlertTriangle, bgClass: 'bg-red-500/20', textClass: 'text-red-400' },
      'update_order': { label: 'Updated order status', icon: ShoppingCart, bgClass: 'bg-blue-500/20', textClass: 'text-blue-400' },
      'send_announcement': { label: 'Sent platform announcement', icon: Globe, bgClass: 'bg-indigo-500/20', textClass: 'text-indigo-400' },
      'change_role': { label: 'Changed user role', icon: Shield, bgClass: 'bg-purple-500/20', textClass: 'text-purple-400' },
    };

    const mapped = actionMap[log.action] || { label: log.action?.replace(/_/g, ' ') || 'Admin action', icon: Activity, bgClass: 'bg-slate-500/20', textClass: 'text-slate-400' };
    return mapped;
  };

  if (!user || user.role !== 'admin') {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 pt-28 pb-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-8">This page is only accessible to administrators</p>
            <Button onClick={() => navigate('/')} className="btn btn-primary">
              Return to Home
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#FBF8F3] text-[#132E20] font-sans-body pt-28 pb-16">
        {/* Premium Header Section */}
        <div className="relative min-h-64 bg-gradient-to-tr from-[#132E20] via-[#1B3B2B] to-[#254D38] overflow-hidden rounded-[36px] max-w-7xl mx-auto shadow-2xl border border-white/10">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#D97736]/20 rounded-full blur-3xl pointer-events-none"></div>

          {/* Header Content */}
          <div className="relative h-full flex items-center py-10 px-6 md:px-12">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 w-full">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-3xl bg-white shadow-2xl p-2.5 ring-4 ring-white/20">
                  <Avatar user={user} size="xl" className="w-full h-full" />
                </div>
                {isEditing && (
                  <label className="absolute bottom-1 right-1 bg-[#D97736] hover:bg-[#c06528] text-white rounded-full p-2.5 cursor-pointer shadow-lg transition">
                    <Camera size={16} />
                    <input type="file" name="photo" onChange={handleChange} hidden accept="image/*" />
                  </label>
                )}
              </div>

              {/* Info */}
              <div className="text-white flex-1 min-w-0 text-center sm:text-left">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D97736] bg-[#D97736]/20 px-3 py-1 rounded-full border border-[#D97736]/30 inline-block mb-2">
                  ADMINISTRATOR CONTROL
                </span>
                <h1 className="font-serif-display text-3xl sm:text-5xl font-normal text-[#FBF8F3] mb-2 break-words">
                  {user?.name || 'Administrator'}
                </h1>
                <div className="flex items-center gap-2 flex-wrap mb-3 justify-center sm:justify-start">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-white/15 backdrop-blur-sm border border-white/20 text-white">
                    <Shield size={14} className="text-[#D97736]" /> {department}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 text-emerald-200">
                    <CheckCircle size={14} /> Active & Verified
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 backdrop-blur-sm border border-amber-400/30 text-amber-200">
                    <Zap size={14} /> {adminLevel}
                  </span>
                </div>
                {joinDate && (
                  <p className="text-stone-300 text-xs">Member since {joinDate} &bull; {membershipDuration} active</p>
                )}
              </div>

              {/* Quick Stats */}
              <div className="hidden lg:grid grid-cols-2 gap-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/15 text-center">
                  <p className="text-stone-300 text-[10px] font-bold uppercase tracking-wider">Active Sessions</p>
                  <p className="font-serif-display text-3xl font-bold text-white mt-0.5">{stats.activeSessions}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/15 text-center">
                  <p className="text-stone-300 text-[10px] font-bold uppercase tracking-wider">Total Users</p>
                  <p className="font-serif-display text-3xl font-bold text-[#FBF8F3] mt-0.5">{statsLoading ? '...' : stats.totalUsers.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-8 pb-12 relative z-10">
          {/* Tab Navigation */}
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-2xl shadow-2xl p-2 mb-8 flex gap-2 overflow-x-auto border border-slate-600">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'profile', label: 'Profile Info', icon: Shield },
              { id: 'activity', label: 'Activity', icon: Activity },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 rounded-xl font-bold transition duration-300 whitespace-nowrap transform hover:scale-105 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
                }`}
              >
                {tab.icon && <tab.icon size={18} />}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Error Banner */}
              {statsError && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3">
                  <AlertTriangle size={20} className="text-amber-400 flex-shrink-0" />
                  <p className="text-amber-200 text-sm">{statsError} — showing available data</p>
                </div>
              )}

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <Card _glass={false} className="bg-gradient-to-br from-blue-600 to-blue-700 border-0 text-white overflow-hidden hover:shadow-2xl transition duration-300 transform hover:scale-105 cursor-pointer">
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                        <Users size={28} />
                      </div>
                      <TrendingUp size={24} className="text-blue-200" />
                    </div>
                    <p className="text-blue-100 text-sm font-semibold uppercase tracking-wide">Total Users</p>
                    <p className="text-5xl font-black mt-2">{statsLoading ? <Loader2 size={36} className="animate-spin" /> : stats.totalUsers.toLocaleString()}</p>
                    <p className="text-blue-200 text-xs mt-3">Farmers: {stats.totalFarmers} | Buyers: {stats.totalBuyers}</p>
                  </div>
                </Card>

                <Card _glass={false} className="bg-gradient-to-br from-green-600 to-emerald-700 border-0 text-white overflow-hidden hover:shadow-2xl transition duration-300 transform hover:scale-105 cursor-pointer">
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                        <Package size={28} />
                      </div>
                      <TrendingUp size={24} className="text-emerald-200" />
                    </div>
                    <p className="text-emerald-100 text-sm font-semibold uppercase tracking-wide">Total Crops</p>
                    <p className="text-5xl font-black mt-2">{statsLoading ? <Loader2 size={36} className="animate-spin" /> : stats.totalCrops.toLocaleString()}</p>
                    <p className="text-emerald-200 text-xs mt-3">Active listings on platform</p>
                  </div>
                </Card>

                <Card _glass={false} className="bg-gradient-to-br from-purple-600 to-pink-700 border-0 text-white overflow-hidden hover:shadow-2xl transition duration-300 transform hover:scale-105 cursor-pointer">
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                        <UserCheck size={28} />
                      </div>
                      <TrendingUp size={24} className="text-pink-200" />
                    </div>
                    <p className="text-pink-100 text-sm font-semibold uppercase tracking-wide">Pending Verification</p>
                    <p className="text-5xl font-black mt-2">{statsLoading ? <Loader2 size={36} className="animate-spin" /> : stats.pendingFarmers.toLocaleString()}</p>
                    <p className="text-pink-200 text-xs mt-3">Farmer approvals pending</p>
                  </div>
                </Card>
              </div>

              {/* Additional Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <Card _glass={false} className="bg-gradient-to-br from-amber-600 to-orange-700 border-0 text-white overflow-hidden hover:shadow-2xl transition duration-300 transform hover:scale-105 cursor-pointer">
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                        <ShoppingCart size={28} />
                      </div>
                    </div>
                    <p className="text-amber-100 text-sm font-semibold uppercase tracking-wide">Total Orders</p>
                    <p className="text-5xl font-black mt-2">{statsLoading ? <Loader2 size={36} className="animate-spin" /> : stats.totalOrders.toLocaleString()}</p>
                    <p className="text-amber-200 text-xs mt-3">Platform transactions</p>
                  </div>
                </Card>

                <Card _glass={false} className="bg-gradient-to-br from-cyan-600 to-teal-700 border-0 text-white overflow-hidden hover:shadow-2xl transition duration-300 transform hover:scale-105 cursor-pointer">
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                        <Star size={28} />
                      </div>
                    </div>
                    <p className="text-cyan-100 text-sm font-semibold uppercase tracking-wide">Total Reviews</p>
                    <p className="text-5xl font-black mt-2">{statsLoading ? <Loader2 size={36} className="animate-spin" /> : stats.totalReviews.toLocaleString()}</p>
                    <p className="text-cyan-200 text-xs mt-3">User feedback & ratings</p>
                  </div>
                </Card>

                <Card _glass={false} className="bg-gradient-to-br from-rose-600 to-red-700 border-0 text-white overflow-hidden hover:shadow-2xl transition duration-300 transform hover:scale-105 cursor-pointer">
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                        <Clock3 size={28} />
                      </div>
                    </div>
                    <p className="text-rose-100 text-sm font-semibold uppercase tracking-wide">Membership</p>
                    <p className="text-3xl font-black mt-2">{membershipDuration || 'New'}</p>
                    <p className="text-rose-200 text-xs mt-3">Since {joinDate || 'joining'}</p>
                  </div>
                </Card>
              </div>

              {/* User Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <Card _glass={false} className="bg-slate-700 border border-slate-600 text-white">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-gradient-to-br from-emerald-400 to-green-600 p-3 rounded-lg">
                        <Users size={24} />
                      </div>
                      <h3 className="text-xl font-bold">Farmer Accounts</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Total Farmers</span>
                        <span className="text-2xl font-bold text-emerald-400">{statsLoading ? '...' : stats.totalFarmers}</span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-emerald-400 to-green-500 h-2 rounded-full transition-all duration-700" 
                          style={{ width: stats.totalUsers > 0 ? `${(stats.totalFarmers / stats.totalUsers) * 100}%` : '0%' }}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-400">
                        {stats.totalUsers > 0 ? `${((stats.totalFarmers / stats.totalUsers) * 100).toFixed(1)}%` : '0%'} of total users
                      </p>
                    </div>
                  </div>
                </Card>

                <Card _glass={false} className="bg-slate-700 border border-slate-600 text-white">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-gradient-to-br from-blue-400 to-indigo-600 p-3 rounded-lg">
                        <Users size={24} />
                      </div>
                      <h3 className="text-xl font-bold">Buyer Accounts</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Total Buyers</span>
                        <span className="text-2xl font-bold text-blue-400">{statsLoading ? '...' : stats.totalBuyers}</span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-400 to-indigo-500 h-2 rounded-full transition-all duration-700" 
                          style={{ width: stats.totalUsers > 0 ? `${(stats.totalBuyers / stats.totalUsers) * 100}%` : '0%' }}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-400">
                        {stats.totalUsers > 0 ? `${((stats.totalBuyers / stats.totalUsers) * 100).toFixed(1)}%` : '0%'} of total users
                      </p>
                    </div>
                  </div>
                </Card>

                <Card _glass={false} className="bg-slate-700 border border-slate-600 text-white">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-gradient-to-br from-orange-400 to-pink-600 p-3 rounded-lg">
                        <Package size={24} />
                      </div>
                      <h3 className="text-xl font-bold">Active Crops</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Total Listings</span>
                        <span className="text-2xl font-bold text-orange-400">{statsLoading ? '...' : stats.totalCrops}</span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-orange-400 to-pink-500 h-2 rounded-full transition-all duration-700" 
                          style={{ width: stats.totalFarmers > 0 ? Math.min((stats.totalCrops / (stats.totalFarmers * 2)) * 100, 100) : '0%' }}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-400">
                        Avg {stats.totalFarmers > 0 ? (stats.totalCrops / stats.totalFarmers).toFixed(1) : '0'} per farmer
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Profile Info Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {!isEditing ? (
                <>
                  {/* Info Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Card _glass={false} className="bg-gradient-to-br from-blue-600 to-blue-700 border border-blue-500/30 text-white hover:shadow-2xl transition duration-300">
                      <div className="p-8">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="bg-blue-500/30 p-4 rounded-lg backdrop-blur-sm border border-blue-400/30">
                            <Mail size={24} />
                          </div>
                          <p className="text-sm font-bold text-blue-200 uppercase tracking-wide">Email Address</p>
                        </div>
                        <p className="text-2xl font-bold break-all">{formData.email}</p>
                        <p className="text-xs text-blue-200 mt-3">Primary contact email</p>
                      </div>
                    </Card>

                    <Card _glass={false} className="bg-gradient-to-br from-emerald-600 to-emerald-700 border border-emerald-500/30 text-white hover:shadow-2xl transition duration-300">
                      <div className="p-8">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="bg-emerald-500/30 p-4 rounded-lg backdrop-blur-sm border border-emerald-400/30">
                            <Phone size={24} />
                          </div>
                          <p className="text-sm font-bold text-emerald-200 uppercase tracking-wide">Phone Number</p>
                        </div>
                        <p className="text-2xl font-bold">{formData.phone || 'Not provided'}</p>
                        <p className="text-xs text-emerald-200 mt-3">For urgent admin alerts</p>
                      </div>
                    </Card>

                    <Card _glass={false} className="bg-gradient-to-br from-purple-600 to-purple-700 border border-purple-500/30 text-white hover:shadow-2xl transition duration-300">
                      <div className="p-8">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="bg-purple-500/30 p-4 rounded-lg backdrop-blur-sm border border-purple-400/30">
                            <Shield size={24} />
                          </div>
                          <p className="text-sm font-bold text-purple-200 uppercase tracking-wide">Admin Level</p>
                        </div>
                        <p className="text-2xl font-bold">{adminLevel}</p>
                        <p className="text-xs text-purple-200 mt-3">Full platform access</p>
                      </div>
                    </Card>

                    <Card _glass={false} className="bg-gradient-to-br from-orange-600 to-orange-700 border border-orange-500/30 text-white hover:shadow-2xl transition duration-300">
                      <div className="p-8">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="bg-orange-500/30 p-4 rounded-lg backdrop-blur-sm border border-orange-400/30">
                            <CalendarDays size={24} />
                          </div>
                          <p className="text-sm font-bold text-orange-200 uppercase tracking-wide">Member Since</p>
                        </div>
                        <p className="text-2xl font-bold">{formData.joinDate || 'N/A'}</p>
                        <p className="text-xs text-orange-200 mt-3">{membershipDuration ? `${membershipDuration} active` : 'Recently joined'}</p>
                      </div>
                    </Card>
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-4 px-6 rounded-xl transition duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 text-lg"
                  >
                    ✏️ Edit Profile Information
                  </button>
                </>
              ) : (
                <Card _glass={false} className="bg-slate-700 border border-slate-600 text-white">
                  <div className="p-8">
                    <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                      Edit Admin Profile
                    </h2>

                    <form className="space-y-8">
                      {/* Form Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-slate-300 mb-3 uppercase tracking-wide">Full Name</label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-5 py-3 bg-slate-800 border-2 border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition outline-none text-base"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-300 mb-3 uppercase tracking-wide">Email</label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            disabled
                            className="w-full px-5 py-3 bg-slate-900 border-2 border-slate-600 rounded-lg text-slate-400 font-semibold"
                          />
                          <p className="text-xs text-slate-400 mt-2">Email cannot be changed</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-slate-300 mb-3 uppercase tracking-wide">Phone Number</label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+91 XXXXX XXXXX"
                            className="w-full px-5 py-3 bg-slate-800 border-2 border-slate-600 rounded-lg text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition outline-none text-base"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-300 mb-3 uppercase tracking-wide">Department</label>
                          <input
                            type="text"
                            value={formData.department}
                            disabled
                            className="w-full px-5 py-3 bg-slate-900 border-2 border-slate-600 rounded-lg text-slate-400 font-semibold"
                          />
                        </div>
                      </div>

                      {/* Photo Upload */}
                      <div className="bg-gradient-to-br from-blue-600/40 to-indigo-600/40 p-8 rounded-xl border-2 border-dashed border-blue-500/50">
                        <div className="text-center">
                          <Camera size={40} className="mx-auto mb-4 text-blue-400" />
                          <h3 className="text-lg font-bold text-white mb-2">Upload Profile Photo</h3>
                          <p className="text-slate-300 text-sm mb-6">
                            Drag and drop or click to select a new profile photo
                          </p>
                          <input
                            type="file"
                            name="photo"
                            onChange={handleChange}
                            accept="image/*"
                            className="hidden"
                            id="photo-input"
                          />
                          <label htmlFor="photo-input" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg cursor-pointer hover:from-blue-700 hover:to-indigo-700 transition">
                            Choose Photo
                          </label>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-4">
                        <button
                          onClick={handleSave}
                          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 shadow-lg text-base"
                        >
                          ✅ Save Changes
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="flex-1 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-bold py-3 px-6 rounded-lg transition duration-300 shadow-lg text-base"
                        >
                          ❌ Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <Card _glass={false} className="bg-slate-700 border border-slate-600">
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-white mb-8">Recent Admin Activity</h2>

                  {activityLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 size={32} className="animate-spin text-blue-400" />
                      <span className="ml-3 text-slate-300">Loading activity logs...</span>
                    </div>
                  ) : activityLogs.length > 0 ? (
                    <div className="space-y-4">
                      {activityLogs.slice(0, 10).map((log, idx) => {
                        const display = getActivityDisplay(log);
                        return (
                          <div key={log._id || idx} className="flex items-center gap-4 p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition border border-slate-600">
                            <div className={`${display.bgClass} p-3 rounded-lg`}>
                              <display.icon size={20} className={display.textClass} />
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-semibold">{display.label}</p>
                              <p className="text-slate-400 text-sm">
                                {log.adminEmail && <span className="text-blue-400">{log.adminEmail}</span>}
                                {log.resourceType && <span> &bull; {log.resourceType}</span>}
                                {log.reason && <span className="text-slate-500"> — "{log.reason}"</span>}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-slate-400 text-xs">{getRelativeTime(log.timestamp)}</p>
                              {log.status && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  log.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {log.status}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Activity size={48} className="mx-auto mb-4 text-slate-500" />
                      <p className="text-slate-400 text-lg font-semibold">No activity logs available</p>
                      <p className="text-slate-500 text-sm mt-2">Audit trail will appear here as you perform admin actions</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Security Settings */}
                <Card _glass={false} className="bg-gradient-to-br from-red-600/40 to-red-700/40 border border-red-500/30">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <Lock className="text-red-400" size={28} />
                      <h3 className="text-xl font-bold text-white">Security</h3>
                    </div>
                    <div className="space-y-3">
                      <button className="w-full px-4 py-3 bg-red-600/50 hover:bg-red-600 text-white rounded-lg transition font-semibold text-sm">
                        🔐 Change Password
                      </button>
                      <button className="w-full px-4 py-3 bg-red-600/50 hover:bg-red-600 text-white rounded-lg transition font-semibold text-sm">
                        🔑 Two-Factor Authentication
                      </button>
                    </div>
                  </div>
                </Card>

                {/* Notification Settings */}
                <Card _glass={false} className="bg-gradient-to-br from-blue-600/40 to-blue-700/40 border border-blue-500/30">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <Bell className="text-blue-400" size={28} />
                      <h3 className="text-xl font-bold text-white">Notifications</h3>
                    </div>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" defaultChecked className="w-5 h-5" />
                        <span className="text-white group-hover:text-blue-400 transition">System Alerts</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" defaultChecked className="w-5 h-5" />
                        <span className="text-white group-hover:text-blue-400 transition">User Reports</span>
                      </label>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 px-6 rounded-xl transition duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 text-lg flex items-center justify-center gap-3"
              >
                <LogOut size={24} /> Logout
              </button>
            </div>
          )}
        </div>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <LogoutConfirmationModal
            onConfirm={handleConfirmLogout}
            onCancel={() => setShowLogoutConfirm(false)}
          />
        )}
      </div>
    </PageTransition>
  );
}
