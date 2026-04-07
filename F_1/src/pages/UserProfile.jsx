import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { useToast } from '../context/ToastContext';
import PageTransition from '../components/common/PageTransition.jsx';
import Button from '../components/common/Button';
import Avatar from '../components/common/Avatar';
import FileInput from '../components/common/FileInput';
import Card from '../components/common/Card';
import { Camera, Mail, Phone, MapPin, Shield, LogOut, Settings, ShoppingBag, Lock, Bell, AlertTriangle } from 'lucide-react';
import '../styles/UserProfile.css';

export default function UserProfile() {
  const { user, logout, updateProfile } = useAuth();
  const { navigate } = useRouter();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Reset scroll position to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || '',
    photo: user?.photo || null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      // Handle file input - convert to base64
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
      setIsUploadingPhoto(true);
      // In real app, save to backend
      if (updateProfile) {
        await updateProfile(formData);
      }
      addToast('Profile updated successfully', 'success');
      setIsEditing(false);
    } catch (error) {
      addToast('Failed to update profile', 'error');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/');
      addToast('Logged out successfully', 'info');
    }
  };

  if (!user) {
    return (
      <PageTransition>
        <div className="profile-page">
          <div className="container p-xl">
            <div className="not-authenticated">
              <h2>Please login to view your profile</h2>
              <Button
                onClick={() => navigate('/auth/login')}
                className="btn btn-primary"
              >
                Go to Login
              </Button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="profile-page min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50">
        {/* Premium Header Section */}
        <div className="relative h-48 bg-linear-to-r from-green-600 via-emerald-500 to-teal-600 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
          </div>
          <div className="relative h-full flex items-center px-6 md:px-12">
            <div className="flex items-center gap-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-2xl bg-white shadow-2xl p-2 ring-4 ring-white">
                  <Avatar user={user} size="xl" className="w-full h-full" />
                </div>
                {isEditing && (
                  <label className="absolute bottom-2 right-2 bg-green-500 hover:bg-green-600 text-white rounded-full p-3 cursor-pointer shadow-lg transition">
                    <Camera size={18} />
                    <input type="file" name="photo" onChange={handleChange} hidden accept="image/*" />
                  </label>
                )}
              </div>
              <div className="text-white">
                <h1 className="text-4xl font-bold text-white">{user?.name || 'User'}</h1>
                <div className="flex items-center gap-3 mt-3">
                  <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold backdrop-blur-sm ${
                    user?.role === 'farmer' ? 'bg-green-400/30 text-green-100' : 'bg-blue-400/30 text-blue-100'
                  }`}>
                    {user?.role?.toUpperCase() || 'BUYER'}
                  </span>
                  {user?.verified && (
                    <span className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-bold bg-green-400/30 text-green-100">
                      <Shield size={16} /> Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-12 relative z-10">
          {/* Tab Navigation - Premium Style */}
          <div className="bg-white rounded-2xl shadow-lg p-1 mb-8 flex gap-1 overflow-x-auto">
            {[
              { id: 'profile', label: '👤 Profile', icon: '👤' },
              { id: 'orders', label: '📦 Orders', icon: '📦' },
              { id: 'settings', label: '⚙️ Settings', icon: '⚙️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 rounded-xl font-semibold transition duration-300 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-linear-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Profile Tab - Premium */}
          {activeTab === 'profile' && (
            <div className="space-y-6 pb-12">
              {!isEditing ? (
                <>
                  {/* Info Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-0! overflow-hidden hover:shadow-xl transition duration-300">
                      <div className="bg-linear-to-br from-blue-50 to-blue-100 p-6 border-b border-blue-200">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-blue-500 text-white p-3 rounded-lg">
                            <Mail size={20} />
                          </div>
                          <p className="text-sm font-bold text-gray-700">Email</p>
                        </div>
                        <p className="text-xl font-bold text-gray-900">{formData.email}</p>
                      </div>
                    </Card>

                    <Card className="p-0! overflow-hidden hover:shadow-xl transition duration-300">
                      <div className="bg-linear-to-br from-green-50 to-emerald-100 p-6 border-b border-green-200">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-green-500 text-white p-3 rounded-lg">
                            <Phone size={20} />
                          </div>
                          <p className="text-sm font-bold text-gray-700">Phone</p>
                        </div>
                        <p className="text-xl font-bold text-gray-900">{formData.phone || 'Not provided'}</p>
                      </div>
                    </Card>

                    <Card className="p-0! overflow-hidden hover:shadow-xl transition duration-300">
                      <div className="bg-linear-to-br from-purple-50 to-purple-100 p-6 border-b border-purple-200">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-purple-500 text-white p-3 rounded-lg">
                            <MapPin size={20} />
                          </div>
                          <p className="text-sm font-bold text-gray-700">City</p>
                        </div>
                        <p className="text-xl font-bold text-gray-900">{formData.city || 'Not provided'}</p>
                      </div>
                    </Card>

                    <Card className="p-0! overflow-hidden hover:shadow-xl transition duration-300">
                      <div className="bg-linear-to-br from-orange-50 to-orange-100 p-6 border-b border-orange-200">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-orange-500 text-white p-3 rounded-lg">
                            <MapPin size={20} />
                          </div>
                          <p className="text-sm font-bold text-gray-700">State</p>
                        </div>
                        <p className="text-xl font-bold text-gray-900">{formData.state || 'Not provided'}</p>
                      </div>
                    </Card>
                  </div>

                  {/* Full Width Cards */}
                  <Card className="p-0! overflow-hidden hover:shadow-xl transition duration-300">
                    <div className="bg-linear-to-r from-cyan-50 to-cyan-100 p-6 border-b border-cyan-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-cyan-500 text-white p-3 rounded-lg">
                          <MapPin size={20} />
                        </div>
                        <p className="text-sm font-bold text-gray-700">Full Address</p>
                      </div>
                      <p className="text-base font-semibold text-gray-900 leading-relaxed">
                        {formData.address || 'Not provided'}
                      </p>
                      {formData.pincode && (
                        <p className="text-sm text-gray-600 mt-2">Pincode: {formData.pincode}</p>
                      )}
                    </div>
                  </Card>

                  {/* Profile Photo */}
                  {formData.photo && (
                    <Card className="p-0! overflow-hidden">
                      <div className="bg-linear-to-br from-green-50 to-emerald-100 p-8">
                        <p className="text-sm font-bold text-gray-700 mb-4">Profile Photo</p>
                        <img 
                          src={formData.photo} 
                          alt="Profile" 
                          className="w-48 h-48 object-cover rounded-2xl shadow-lg border-4 border-white" 
                        />
                      </div>
                    </Card>
                  )}

                  {/* Edit Button */}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-linear-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 px-6 rounded-xl transition duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    ✏️ Edit Profile
                  </button>
                </>
              ) : (
                <Card className="p-8!">
                  <h2 className="text-2xl font-bold text-gray-900 mb-8">Edit Personal Information</h2>
                  <form className="space-y-8">
                    {/* Photo Upload */}
                    <div className="bg-linear-to-br from-green-50 to-emerald-100 p-8 rounded-xl border-2 border-dashed border-green-300">
                      <div className="flex items-center gap-3 mb-4">
                        <Camera size={24} className="text-green-600" />
                        <h3 className="text-lg font-bold text-gray-900">Profile Photo</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-6">
                        Upload a high-quality photo for identity verification
                      </p>
                      <FileInput
                        label="Upload Profile Photo"
                        name="photo"
                        onChange={handleChange}
                        preview={formData.photo}
                        maxSize={5}
                        helperText="JPG or PNG up to 5MB"
                      />
                    </div>

                    {/* Form Fields Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">Full Name</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          autoComplete="off"
                          className="w-full px-5 py-3 border-2 border-gray-200 rounded-lg outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-200 text-base bg-white text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          disabled
                          className="w-full px-5 py-3 border-2 border-gray-200 rounded-lg bg-gray-100 text-gray-600 font-semibold"
                        />
                        <p className="text-xs text-gray-500 mt-2">Email cannot be changed</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">Phone Number</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          autoComplete="off"
                          className="w-full px-5 py-3 border-2 border-gray-200 rounded-lg outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-200 text-base bg-white text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">City</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          autoComplete="off"
                          className="w-full px-5 py-3 border-2 border-gray-200 rounded-lg outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-200 text-base bg-white text-gray-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">Address</label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        autoComplete="off"
                        rows="4"
                        className="w-full px-5 py-3 border-2 border-gray-200 rounded-lg outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-200 resize-none text-base bg-white text-gray-900"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">State</label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          autoComplete="off"
                          className="w-full px-5 py-3 border-2 border-gray-200 rounded-lg outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-200 text-base bg-white text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">Pincode</label>
                        <input
                          type="text"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleChange}
                          autoComplete="off"
                          className="w-full px-5 py-3 border-2 border-gray-200 rounded-lg outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-200 text-base bg-white text-gray-900"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={handleSave}
                        type="button"
                        disabled={isUploadingPhoto}
                        className="flex-1 px-6 py-4 bg-linear-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg transition font-bold shadow-lg hover:shadow-xl"
                      >
                        {isUploadingPhoto ? '⏳ Saving...' : '✅ Save Changes'}
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        type="button"
                        className="flex-1 px-6 py-4 border-2 border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition font-bold"
                      >
                        ❌ Cancel
                      </button>
                    </div>
                  </form>
                </Card>
              )}
            </div>
          )}

          {/* Orders Tab - Premium */}
          {activeTab === 'orders' && (
            <div className="pb-12">
              <Card className="p-12! text-center">
                <div className="mb-6">
                  <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">No Orders Yet</h2>
                <p className="text-gray-600 mb-8 text-lg">Start shopping and your orders will appear here</p>
                <button
                  onClick={() => navigate('/marketplace')}
                  className="inline-block bg-linear-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 px-8 rounded-xl transition duration-300 shadow-lg hover:shadow-xl"
                >
                  🛒 Browse Products
                </button>
              </Card>
            </div>
          )}

          {/* Settings Tab - Premium */}
          {activeTab === 'settings' && (
            <div className="pb-12">
              <div className="space-y-6">
                {/* Notification Settings */}
                <Card>
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6 pb-6 border-b-2 border-gray-200">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <Bell size={24} className="text-blue-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">Notifications</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-5 bg-linear-to-r from-blue-50 to-blue-100 rounded-lg hover:shadow-md transition">
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">Email Notifications</p>
                          <p className="text-sm text-gray-600">Updates about orders and promotions</p>
                        </div>
                        <input type="checkbox" defaultChecked className="w-6 h-6 cursor-pointer" />
                      </div>
                      <div className="flex items-center justify-between p-5 bg-linear-to-r from-purple-50 to-purple-100 rounded-lg hover:shadow-md transition">
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">SMS Alerts</p>
                          <p className="text-sm text-gray-600">SMS updates for orders and deliveries</p>
                        </div>
                        <input type="checkbox" className="w-6 h-6 cursor-pointer" />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Security Settings */}
                <Card>
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6 pb-6 border-b-2 border-gray-200">
                      <div className="bg-green-100 p-3 rounded-lg">
                        <Shield size={24} className="text-green-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">Security</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-5 bg-linear-to-r from-green-50 to-emerald-100 rounded-lg hover:shadow-md transition">
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">Two-Factor Authentication</p>
                          <p className="text-sm text-gray-600">Enhance account security with 2FA</p>
                        </div>
                        <input type="checkbox" className="w-6 h-6 cursor-pointer" />
                      </div>
                      <button className="w-full px-6 py-4 bg-linear-to-r from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 text-blue-700 rounded-lg font-bold transition shadow-sm hover:shadow-md">
                        <Lock size={18} className="inline mr-2" /> Change Password
                      </button>
                    </div>
                  </div>
                </Card>

                {/* Danger Zone */}
                <Card className="border-2 border-red-200">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6 pb-6 border-b-2 border-red-200">
                      <div className="bg-red-100 p-3 rounded-lg">
                        <AlertTriangle size={24} className="text-red-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-red-600">Danger Zone</h3>
                    </div>
                    <div className="space-y-3">
                      <button
                        onClick={handleLogout}
                        className="w-full px-6 py-4 bg-linear-to-r from-orange-100 to-orange-200 hover:from-orange-200 hover:to-orange-300 text-orange-700 rounded-lg font-bold transition shadow-sm hover:shadow-md"
                      >
                        <LogOut size={18} className="inline mr-2" /> Logout
                      </button>
                      <button className="w-full px-6 py-4 bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-bold transition shadow-lg hover:shadow-xl">
                        <Lock size={18} className="inline mr-2" /> Delete Account Permanently
                      </button>
                      <p className="text-xs text-gray-600 mt-4 p-4 bg-red-50 rounded-lg">
                        ⚠️ Warning: Account deletion is permanent and cannot be undone. All your data, including profile information and order history, will be permanently deleted.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
