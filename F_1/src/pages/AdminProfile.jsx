import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { useToast } from '../context/ToastContext';
import PageTransition from '../components/common/PageTransition.jsx';
import Button from '../components/common/Button';
import Avatar from '../components/common/Avatar';
import Card from '../components/common/Card';
import {
  Shield, Mail, Phone, MapPin, Clock, Users, TrendingUp, Activity,
  Settings, LogOut, Camera, Lock, Bell, FileText, BarChart3,
  CalendarDays, Zap, Award, CheckCircle, AlertTriangle
} from 'lucide-react';

export default function AdminProfile() {
  const { user, logout, updateProfile } = useAuth();
  const { navigate } = useRouter();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 1250,
    totalFarmers: 380,
    totalBuyers: 870,
    totalOrders: 450,
    totalRevenue: 125000,
    activeSessions: 42
  });

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: 'Platform Administration',
    joinDate: '2024-01-15',
    photo: user?.photo || null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    try {
      if (updateProfile) {
        await updateProfile(formData);
      }
      addToast('Profile updated successfully', 'success');
      setIsEditing(false);
    } catch (error) {
      addToast('Failed to update profile', 'error');
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/');
      addToast('Logged out successfully', 'info');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <PageTransition>
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
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
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Premium Header Section */}
        <div className="relative h-64 bg-linear-to-br from-blue-600 via-indigo-600 to-purple-700 overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-white rounded-full filter blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-indigo-400 rounded-full filter blur-3xl animate-pulse"></div>
          </div>

          {/* Header Content */}
          <div className="relative h-full flex items-center px-6 md:px-12">
            <div className="flex items-center gap-8 w-full">
              {/* Avatar */}
              <div className="relative">
                <div className="w-40 h-40 rounded-3xl bg-white shadow-2xl p-3 ring-4 ring-white transform hover:scale-105 transition duration-300">
                  <Avatar user={user} size="xl" className="w-full h-full" />
                </div>
                {isEditing && (
                  <label className="absolute bottom-2 right-2 bg-linear-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-full p-3 cursor-pointer shadow-lg transition transform hover:scale-110">
                    <Camera size={20} />
                    <input type="file" name="photo" onChange={handleChange} hidden accept="image/*" />
                  </label>
                )}
              </div>

              {/* Info */}
              <div className="text-white flex-1">
                <h1 className="text-5xl font-black mb-2">{user?.name || 'Administrator'}</h1>
                <div className="flex items-center gap-3 flex-wrap mb-4">
                  <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition">
                    <Shield size={16} /> Platform Administrator
                  </span>
                  <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold bg-green-400/20 backdrop-blur-sm border border-green-400/30 text-green-100">
                    <CheckCircle size={16} /> Active & Verified
                  </span>
                  <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold bg-blue-400/20 backdrop-blur-sm border border-blue-400/30 text-blue-100">
                    <Zap size={16} /> Super Admin
                  </span>
                </div>
                <p className="text-blue-100 text-sm">Member since {formData.joinDate}</p>
              </div>

              {/* Quick Stats */}
              <div className="hidden lg:grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <p className="text-blue-100 text-xs font-semibold uppercase tracking-wide">Active Sessions</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.activeSessions}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <p className="text-blue-100 text-xs font-semibold uppercase tracking-wide">Total Users</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.totalUsers.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-8 pb-12 relative z-10">
          {/* Tab Navigation */}
          <div className="bg-linear-to-r from-slate-700 to-slate-800 rounded-2xl shadow-2xl p-2 mb-8 flex gap-2 overflow-x-auto border border-slate-600">
            {[
              { id: 'overview', label: '📊 Overview', icon: BarChart3 },
              { id: 'profile', label: '👤 Profile Info', icon: Shield },
              { id: 'activity', label: '⚡ Activity', icon: Activity },
              { id: 'settings', label: '⚙️ Settings', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 rounded-xl font-bold transition duration-300 whitespace-nowrap transform hover:scale-105 ${
                  activeTab === tab.id
                    ? 'bg-linear-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105'
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
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-linear-to-br from-blue-600 to-blue-700 border-0 text-white overflow-hidden hover:shadow-2xl transition duration-300 transform hover:scale-105 cursor-pointer">
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                        <Users size={28} />
                      </div>
                      <TrendingUp size={24} className="text-blue-200" />
                    </div>
                    <p className="text-blue-100 text-sm font-semibold uppercase tracking-wide">Total Users</p>
                    <p className="text-5xl font-black mt-2">{stats.totalUsers.toLocaleString()}</p>
                    <p className="text-blue-200 text-xs mt-3">+12% from last month</p>
                  </div>
                </Card>

                <Card className="bg-linear-to-br from-green-600 to-emerald-700 border-0 text-white overflow-hidden hover:shadow-2xl transition duration-300 transform hover:scale-105 cursor-pointer">
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                        <Activity size={28} />
                      </div>
                      <TrendingUp size={24} className="text-emerald-200" />
                    </div>
                    <p className="text-emerald-100 text-sm font-semibold uppercase tracking-wide">Active Orders</p>
                    <p className="text-5xl font-black mt-2">{stats.totalOrders.toLocaleString()}</p>
                    <p className="text-emerald-200 text-xs mt-3">+8% from last week</p>
                  </div>
                </Card>

                <Card className="bg-linear-to-br from-purple-600 to-pink-700 border-0 text-white overflow-hidden hover:shadow-2xl transition duration-300 transform hover:scale-105 cursor-pointer">
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                        <TrendingUp size={28} />
                      </div>
                      <CheckCircle size={24} className="text-pink-200" />
                    </div>
                    <p className="text-pink-100 text-sm font-semibold uppercase tracking-wide">Total Revenue</p>
                    <p className="text-5xl font-black mt-2">₹{(stats.totalRevenue / 100000).toFixed(1)}L</p>
                    <p className="text-pink-200 text-xs mt-3">+25% growth</p>
                  </div>
                </Card>
              </div>

              {/* User Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-slate-700/50 border border-slate-600 text-white">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-linear-to-br from-emerald-400 to-green-600 p-3 rounded-lg">
                        <Users size={24} />
                      </div>
                      <h3 className="text-xl font-bold">Farmer Accounts</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Total Farmers</span>
                        <span className="text-2xl font-bold text-emerald-400">{stats.totalFarmers}</span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div className="bg-linear-to-r from-emerald-400 to-green-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                      </div>
                      <p className="text-xs text-slate-400">30% of total user base</p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-slate-700/50 border border-slate-600 text-white">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-linear-to-br from-blue-400 to-indigo-600 p-3 rounded-lg">
                        <Users size={24} />
                      </div>
                      <h3 className="text-xl font-bold">Buyer Accounts</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Total Buyers</span>
                        <span className="text-2xl font-bold text-blue-400">{stats.totalBuyers}</span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div className="bg-linear-to-r from-blue-400 to-indigo-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                      </div>
                      <p className="text-xs text-slate-400">70% of total user base</p>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-linear-to-br from-blue-600/20 to-blue-700/20 border border-blue-500/30 text-white hover:shadow-2xl transition duration-300">
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

                    <Card className="bg-linear-to-br from-emerald-600/20 to-emerald-700/20 border border-emerald-500/30 text-white hover:shadow-2xl transition duration-300">
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

                    <Card className="bg-linear-to-br from-purple-600/20 to-purple-700/20 border border-purple-500/30 text-white hover:shadow-2xl transition duration-300">
                      <div className="p-8">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="bg-purple-500/30 p-4 rounded-lg backdrop-blur-sm border border-purple-400/30">
                            <Shield size={24} />
                          </div>
                          <p className="text-sm font-bold text-purple-200 uppercase tracking-wide">Admin Level</p>
                        </div>
                        <p className="text-2xl font-bold">Super Admin</p>
                        <p className="text-xs text-purple-200 mt-3">Full platform access</p>
                      </div>
                    </Card>

                    <Card className="bg-linear-to-br from-orange-600/20 to-orange-700/20 border border-orange-500/30 text-white hover:shadow-2xl transition duration-300">
                      <div className="p-8">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="bg-orange-500/30 p-4 rounded-lg backdrop-blur-sm border border-orange-400/30">
                            <CalendarDays size={24} />
                          </div>
                          <p className="text-sm font-bold text-orange-200 uppercase tracking-wide">Member Since</p>
                        </div>
                        <p className="text-2xl font-bold">{formData.joinDate}</p>
                        <p className="text-xs text-orange-200 mt-3">~2 years active</p>
                      </div>
                    </Card>
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-linear-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-4 px-6 rounded-xl transition duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 text-lg"
                  >
                    ✏️ Edit Profile Information
                  </button>
                </>
              ) : (
                <Card className="bg-slate-700/50 border border-slate-600 text-white">
                  <div className="p-8">
                    <h2 className="text-3xl font-bold mb-8 bg-linear-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                      Edit Admin Profile
                    </h2>

                    <form className="space-y-8">
                      {/* Form Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <div className="bg-linear-to-br from-blue-600/20 to-indigo-600/20 p-8 rounded-xl border-2 border-dashed border-blue-500/50">
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
                          <label htmlFor="photo-input" className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg cursor-pointer hover:from-blue-700 hover:to-indigo-700 transition">
                            Choose Photo
                          </label>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-4">
                        <button
                          onClick={handleSave}
                          className="flex-1 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 shadow-lg text-base"
                        >
                          ✅ Save Changes
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="flex-1 bg-linear-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-bold py-3 px-6 rounded-lg transition duration-300 shadow-lg text-base"
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
              <Card className="bg-slate-700/50 border border-slate-600">
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-white mb-8">Recent Admin Activity</h2>

                  <div className="space-y-4">
                    {[
                      { action: 'Verified 5 farmers', time: '2 hours ago', icon: CheckCircle, color: 'emerald' },
                      { action: 'Reviewed user complaints', time: '5 hours ago', icon: AlertTriangle, color: 'orange' },
                      { action: 'Updated system settings', time: '1 day ago', icon: Settings, color: 'blue' },
                      { action: 'Generated monthly report', time: '2 days ago', icon: FileText, color: 'indigo' },
                      { action: 'Monitored platform activity', time: '3 days ago', icon: Activity, color: 'purple' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition border border-slate-600/50">
                        <div className={`bg-${item.color}-500/20 p-3 rounded-lg`}>
                          <item.icon size={20} className={`text-${item.color}-400`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-semibold">{item.action}</p>
                          <p className="text-slate-400 text-sm">{item.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Security Settings */}
                <Card className="bg-linear-to-br from-red-600/20 to-red-700/20 border border-red-500/30">
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
                <Card className="bg-linear-to-br from-blue-600/20 to-blue-700/20 border border-blue-500/30">
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
                className="w-full bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 px-6 rounded-xl transition duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 text-lg flex items-center justify-center gap-3"
              >
                <LogOut size={24} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
