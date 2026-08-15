import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { adminService, authServiceExtended, orderService } from '../services/appService';
import PageTransition from '../components/common/PageTransition.jsx';
import Button from '../components/common/Button';
import Avatar from '../components/common/Avatar';
import FileInput from '../components/common/FileInput';
import Card from '../components/common/Card';
import BackButton from '../components/common/BackButton';
import LogoutConfirmationModal from '../components/common/LogoutConfirmationModal';
import { Camera, Mail, Phone, MapPin, Shield, LogOut, Settings, ShoppingBag, Lock, Bell, AlertTriangle, Package, Heart, Clock, TrendingUp, ChevronRight, Plus, Trash2, Edit3, Check, Monitor, Smartphone } from 'lucide-react';
import '../styles/UserProfile.css';

export default function UserProfile() {
  const { user, logout, updateProfile } = useAuth();
  const { navigate } = useRouter();
  const { addToast } = useToast();
  const { getTotalItems } = useCart();
  const { wishlist } = useWishlist();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: '', street: '', city: '', state: '', pincode: '' });

  useEffect(() => { window.scrollTo(0, 0); }, []);

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

  useEffect(() => {
    if (user) {
      
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || '',
        photo: user.photo || null,
      });
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const response = await orderService.getOrders();
      setOrders(response.data?.orders || response.data || response.orders || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const { userService } = await import('../services/appService');
      const response = await userService.getAddresses();
      setAddresses(response.data?.addresses || response.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    
    if (activeTab === 'orders') fetchOrders();
     
    if (activeTab === 'addresses') fetchAddresses();
  }, [activeTab]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, photo: reader.result }));
      reader.readAsDataURL(file);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    try {
      setIsUploadingPhoto(true);
      if (updateProfile) await updateProfile(formData);
      addToast('Profile updated successfully', 'success');
      setIsEditing(false);
    } catch {
      addToast('Failed to update profile', 'error');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.street || !newAddress.city || !newAddress.state) {
      addToast('Please fill required fields', 'warning');
      return;
    }
    try {
      const { userService } = await import('../services/appService');
      await userService.addAddress(newAddress);
      addToast('Address added', 'success');
      setShowAddAddress(false);
      setNewAddress({ label: '', street: '', city: '', state: '', pincode: '' });
      fetchAddresses();
    } catch {
      addToast('Failed to add address', 'error');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      const { userService } = await import('../services/appService');
      await userService.deleteAddress(addressId);
      addToast('Address removed', 'success');
      fetchAddresses();
    } catch {
      addToast('Failed to remove address', 'error');
    }
  };

  const handleLogout = () => setShowLogoutConfirm(true);
  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    navigate('/');
  };

  const handleFreezeAccount = async () => {
    try {
      await adminService.toggleUserStatus(user.id, 'frozen', 'User requested account freeze');
      addToast('Account frozen. Contact support to reactivate.', 'success');
      setShowFreezeModal(false);
      setTimeout(() => { logout(); navigate('/'); }, 2000);
    } catch (error) {
      addToast(error?.message || 'Failed to freeze account', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation.toLowerCase() !== 'delete my account') {
      addToast('Please type the correct text to confirm', 'error');
      return;
    }
    try {
      await authServiceExtended.deleteAccount();
      addToast('Account permanently deleted.', 'success');
      setShowDeleteModal(false);
      setDeleteConfirmation('');
      setTimeout(() => { logout(); navigate('/'); }, 1500);
    } catch (error) {
      addToast(error?.message || 'Failed to delete account', 'error');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      confirmed: 'bg-blue-100 text-blue-700',
      preparing: 'bg-yellow-100 text-yellow-700',
      ready_for_pickup: 'bg-purple-100 text-purple-700',
      picked_up: 'bg-indigo-100 text-indigo-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const stats = [
    { label: 'Cart Items', value: getTotalItems(), icon: ShoppingBag, color: 'from-blue-500 to-blue-600' },
    { label: 'Wishlist', value: wishlist?.length || 0, icon: Heart, color: 'from-red-500 to-pink-600' },
    { label: 'Orders', value: orders.length, icon: Package, color: 'from-green-500 to-emerald-600' },
    { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A', icon: Clock, color: 'from-purple-500 to-violet-600', isText: true },
  ];

  if (!user) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-28 pb-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Please login to view your profile</h2>
            <Button onClick={() => navigate('/auth/login')} variant="primary">Go to Login</Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#FBF8F3] text-[#132E20] font-sans-body pt-28 pb-16 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 md:px-6 relative z-10 mb-6">
          <BackButton label="Back" />
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-6 mb-8">
          <div className="relative bg-gradient-to-tr from-[#132E20] via-[#1B3B2B] to-[#254D38] overflow-hidden rounded-[36px] p-6 sm:p-10 shadow-2xl border border-white/10">
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#D97736]/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 relative z-10">
              <div className="relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-white shadow-2xl p-2.5 ring-4 ring-white/20">
                  <Avatar user={user} size="xl" className="w-full h-full" />
                </div>
                {isEditing && (
                  <label className="absolute bottom-1 right-1 bg-[#D97736] hover:bg-[#c06528] text-white rounded-full p-2.5 cursor-pointer shadow-lg transition">
                    <Camera size={16} />
                    <input type="file" name="photo" onChange={handleChange} hidden accept="image/*" />
                  </label>
                )}
              </div>
              <div className="text-white min-w-0 text-center sm:text-left">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D97736] bg-[#D97736]/20 px-3 py-1 rounded-full border border-[#D97736]/30 inline-block mb-2">
                  ACCOUNT PROFILE
                </span>
                <h1 className="font-serif-display text-3xl sm:text-5xl font-normal text-[#FBF8F3] break-words">
                  {user?.name || 'User'}
                </h1>
                <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start">
                  <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-white/15 backdrop-blur-sm border border-white/20 text-white">
                    {user?.role?.toUpperCase() || 'BUYER'}
                  </span>
                  {user?.verified && (
                    <span className="inline-flex items-center gap-1 px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 text-emerald-200">
                      <Shield size={14} /> Verified Member
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-12 relative z-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, i) => (
              <div key={i} className="glass-deep border border-white/40 rounded-2xl p-5 premium-hover">
                <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                  <stat.icon size={20} className="text-white" />
                </div>
                <p className="text-2xl font-extrabold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-600 font-semibold mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="glass-light border border-white/50 rounded-2xl p-1 mb-8 flex gap-1 overflow-x-auto">
            {[
              { id: 'profile', label: 'Profile', icon: '👤' },
              { id: 'orders', label: 'Orders', icon: '📦' },
              { id: 'addresses', label: 'Addresses', icon: '📍' },
              { id: 'settings', label: 'Settings', icon: '⚙️' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 rounded-xl font-semibold transition duration-300 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                    : 'text-gray-700 hover:text-gray-900 premium-hover'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'profile' && (
            <div className="space-y-6 pb-12">
              {!isEditing ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Card className="p-0! overflow-hidden hover:shadow-xl transition duration-300">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 border-b border-blue-200">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-blue-500 text-white p-3 rounded-lg"><Mail size={20} /></div>
                          <p className="text-sm font-bold text-gray-700">Email</p>
                        </div>
                        <p className="text-xl font-bold text-gray-900">{formData.email}</p>
                      </div>
                    </Card>
                    <Card className="p-0! overflow-hidden hover:shadow-xl transition duration-300">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 border-b border-green-200">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-green-500 text-white p-3 rounded-lg"><Phone size={20} /></div>
                          <p className="text-sm font-bold text-gray-700">Phone</p>
                        </div>
                        <p className="text-xl font-bold text-gray-900">{formData.phone || 'Not provided'}</p>
                      </div>
                    </Card>
                    <Card className="p-0! overflow-hidden hover:shadow-xl transition duration-300">
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 border-b border-purple-200">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-purple-500 text-white p-3 rounded-lg"><MapPin size={20} /></div>
                          <p className="text-sm font-bold text-gray-700">City</p>
                        </div>
                        <p className="text-xl font-bold text-gray-900">{formData.city || 'Not provided'}</p>
                      </div>
                    </Card>
                    <Card className="p-0! overflow-hidden hover:shadow-xl transition duration-300">
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 border-b border-orange-200">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-orange-500 text-white p-3 rounded-lg"><MapPin size={20} /></div>
                          <p className="text-sm font-bold text-gray-700">State</p>
                        </div>
                        <p className="text-xl font-bold text-gray-900">{formData.state || 'Not provided'}</p>
                      </div>
                    </Card>
                  </div>

                  <Card className="p-0! overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 p-6 border-b border-cyan-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-cyan-500 text-white p-3 rounded-lg"><MapPin size={20} /></div>
                        <p className="text-sm font-bold text-gray-700">Full Address</p>
                      </div>
                      <p className="text-base font-semibold text-gray-900 leading-relaxed">{formData.address || 'Not provided'}</p>
                      {formData.pincode && <p className="text-sm text-gray-600 mt-2">Pincode: {formData.pincode}</p>}
                    </div>
                  </Card>

                  <button onClick={() => setIsEditing(true)} className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 px-6 rounded-xl transition duration-300 shadow-lg hover:shadow-xl">
                    Edit Profile
                  </button>
                </>
              ) : (
                <Card className="p-8!">
                  <h2 className="text-2xl font-bold text-gray-900 mb-8">Edit Personal Information</h2>
                  <form className="space-y-8">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-8 rounded-xl border-2 border-dashed border-green-300">
                      <div className="flex items-center gap-3 mb-4">
                        <Camera size={24} className="text-green-600" />
                        <h3 className="text-lg font-bold text-gray-900">Profile Photo</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-6">Upload a high-quality photo for identity verification</p>
                      <FileInput label="Upload Profile Photo" name="photo" onChange={handleChange} preview={formData.photo} maxSize={5} helperText="JPG or PNG up to 5MB" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">Full Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} autoComplete="off" className="w-full px-5 py-3 border-2 border-gray-200 rounded-lg outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-200 text-base bg-white text-gray-900" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} disabled className="w-full px-5 py-3 border-2 border-gray-200 rounded-lg bg-gray-100 text-gray-600 font-semibold" />
                        <p className="text-xs text-gray-500 mt-2">Email cannot be changed</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">Phone Number</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} autoComplete="off" className="w-full px-5 py-3 border-2 border-gray-200 rounded-lg outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-200 text-base bg-white text-gray-900" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">City</label>
                        <input type="text" name="city" value={formData.city} onChange={handleChange} autoComplete="off" className="w-full px-5 py-3 border-2 border-gray-200 rounded-lg outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-200 text-base bg-white text-gray-900" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">Address</label>
                      <textarea name="address" value={formData.address} onChange={handleChange} autoComplete="off" rows="4" className="w-full px-5 py-3 border-2 border-gray-200 rounded-lg outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-200 resize-none text-base bg-white text-gray-900" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">State</label>
                        <input type="text" name="state" value={formData.state} onChange={handleChange} autoComplete="off" className="w-full px-5 py-3 border-2 border-gray-200 rounded-lg outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-200 text-base bg-white text-gray-900" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">Pincode</label>
                        <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} autoComplete="off" className="w-full px-5 py-3 border-2 border-gray-200 rounded-lg outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-200 text-base bg-white text-gray-900" />
                      </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button onClick={handleSave} type="button" disabled={isUploadingPhoto} className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg transition font-bold shadow-lg hover:shadow-xl">
                        {isUploadingPhoto ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button onClick={() => setIsEditing(false)} type="button" className="flex-1 px-6 py-4 border-2 border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition font-bold">
                        Cancel
                      </button>
                    </div>
                  </form>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="pb-12">
              {ordersLoading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div></div>
              ) : orders.length === 0 ? (
                <Card className="p-12! text-center">
                  <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">No Orders Yet</h2>
                  <p className="text-gray-600 mb-8 text-lg">Start shopping and your orders will appear here</p>
                  <button onClick={() => navigate('/marketplace')} className="inline-block bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 px-8 rounded-xl transition duration-300 shadow-lg hover:shadow-xl">
                    Browse Products
                  </button>
                </Card>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <Card key={order._id} className="p-0! overflow-hidden hover:shadow-lg transition cursor-pointer" onClick={() => navigate(`/order/${order._id}`)}>
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-sm text-gray-500">Order #{order._id?.slice(-8) || order.orderId?.slice(-8)}</p>
                            <p className="font-bold text-gray-900 mt-1">{order.cropName || order.crop?.cropName || 'Crop Order'}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.orderStatus || order.status)}`}>
                            {(order.orderStatus || order.status || 'pending').replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span className="font-bold text-green-600">₹{order.totalAmount || order.price || 0}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="pb-12 space-y-4">
              <button onClick={() => setShowAddAddress(!showAddAddress)} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl transition shadow-lg">
                <Plus size={20} /> Add New Address
              </button>

              {showAddAddress && (
                <Card className="p-6!">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">New Address</h3>
                  <div className="space-y-4">
                    <input type="text" placeholder="Label (e.g. Home, Office)" value={newAddress.label} onChange={e => setNewAddress({ ...newAddress, label: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-4 focus:ring-green-200 text-sm" />
                    <input type="text" placeholder="Street Address *" value={newAddress.street} onChange={e => setNewAddress({ ...newAddress, street: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-4 focus:ring-green-200 text-sm" />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input type="text" placeholder="City *" value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-4 focus:ring-green-200 text-sm" />
                      <input type="text" placeholder="State *" value={newAddress.state} onChange={e => setNewAddress({ ...newAddress, state: e.target.value })} className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-4 focus:ring-green-200 text-sm" />
                      <input type="text" placeholder="Pincode" value={newAddress.pincode} onChange={e => setNewAddress({ ...newAddress, pincode: e.target.value })} className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-4 focus:ring-green-200 text-sm" />
                    </div>
                    <div className="flex gap-3">
                      <button onClick={handleAddAddress} className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition">Save Address</button>
                      <button onClick={() => setShowAddAddress(false)} className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition">Cancel</button>
                    </div>
                  </div>
                </Card>
              )}

              {addresses.length === 0 && !showAddAddress ? (
                <Card className="p-12! text-center">
                  <MapPin size={64} className="mx-auto text-gray-300 mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 mb-2">No Saved Addresses</h2>
                  <p className="text-gray-500">Add a delivery address for faster checkout</p>
                </Card>
              ) : (
                addresses.map((addr, i) => (
                  <Card key={addr._id || i} className="p-5!">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {addr.label && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">{addr.label}</span>}
                          <span className="text-xs text-gray-400">{addr.pincode}</span>
                        </div>
                        <p className="text-gray-900 font-semibold">{addr.street}</p>
                        <p className="text-gray-500 text-sm">{addr.city}, {addr.state}</p>
                      </div>
                      <button onClick={() => handleDeleteAddress(addr._id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="pb-12">
              <div className="space-y-6">
                <Card>
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6 pb-6 border-b-2 border-gray-200">
                      <div className="bg-blue-100 p-3 rounded-lg"><Bell size={24} className="text-blue-600" /></div>
                      <h3 className="text-2xl font-bold text-gray-900">Notifications</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:shadow-md transition">
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">Email Notifications</p>
                          <p className="text-sm text-gray-600">Updates about orders and promotions</p>
                        </div>
                        <input type="checkbox" defaultChecked className="w-6 h-6 cursor-pointer" />
                      </div>
                      <div className="flex items-center justify-between p-5 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg hover:shadow-md transition">
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">SMS Alerts</p>
                          <p className="text-sm text-gray-600">SMS updates for orders and deliveries</p>
                        </div>
                        <input type="checkbox" className="w-6 h-6 cursor-pointer" />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6 pb-6 border-b-2 border-gray-200">
                      <div className="bg-emerald-100 p-3 rounded-lg"><Shield size={24} className="text-emerald-700" /></div>
                      <h3 className="text-2xl font-bold text-gray-900">Security Center</h3>
                    </div>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg hover:shadow-md transition">
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 flex items-center gap-2">Two-Factor Authentication (2FA) <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] font-bold uppercase rounded">Recommended</span></p>
                          <p className="text-sm text-gray-600 mt-1">Protect your account with an extra layer of security.</p>
                        </div>
                        <button className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition">Enable</button>
                      </div>

                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                          <p className="font-bold text-gray-900 text-sm uppercase tracking-wide">Active Sessions</p>
                        </div>
                        <div className="divide-y divide-slate-100">
                          <div className="p-4 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-3">
                              <Monitor size={20} className="text-emerald-600" />
                              <div>
                                <p className="text-sm font-bold text-gray-900">Windows PC - Chrome</p>
                                <p className="text-xs text-gray-500">Mumbai, India • Current Session</p>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Active</span>
                          </div>
                          <div className="p-4 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-3">
                              <Smartphone size={20} className="text-slate-400" />
                              <div>
                                <p className="text-sm font-bold text-gray-900">iPhone 13 - Safari</p>
                                <p className="text-xs text-gray-500">Delhi, India • Last active 2 hours ago</p>
                              </div>
                            </div>
                            <button className="text-xs font-bold text-red-600 hover:underline">Revoke</button>
                          </div>
                        </div>
                      </div>

                      <button className="w-full px-6 py-4 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-bold transition shadow-sm">
                        <Lock size={18} className="inline mr-2" /> Change Password
                      </button>
                    </div>
                  </div>
                </Card>

                <Card className="border-2 border-red-200">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6 pb-6 border-b-2 border-red-200">
                      <div className="bg-red-100 p-3 rounded-lg"><AlertTriangle size={24} className="text-red-600" /></div>
                      <h3 className="text-2xl font-bold text-red-600">Danger Zone</h3>
                    </div>
                    <div className="space-y-3">
                      <button onClick={handleLogout} className="w-full px-6 py-4 bg-gradient-to-r from-orange-100 to-orange-200 hover:from-orange-200 hover:to-orange-300 text-orange-700 rounded-lg font-bold transition shadow-sm hover:shadow-md">
                        <LogOut size={18} className="inline mr-2" /> Logout
                      </button>
                      <button onClick={() => setShowFreezeModal(true)} className="w-full px-6 py-4 bg-gradient-to-r from-yellow-100 to-yellow-200 hover:from-yellow-200 hover:to-yellow-300 text-yellow-700 rounded-lg font-bold transition shadow-sm hover:shadow-md">
                        <Lock size={18} className="inline mr-2" /> Freeze Account Temporarily
                      </button>
                      <button onClick={() => setShowDeleteModal(true)} className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-bold transition shadow-lg hover:shadow-xl">
                        <AlertTriangle size={18} className="inline mr-2" /> Delete Account Permanently
                      </button>
                      <p className="text-xs text-gray-600 mt-4 p-4 bg-red-50 rounded-lg">
                        Warning: Account deletion is permanent and cannot be undone.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      {showFreezeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2"><Lock size={20} /> Freeze Account</h3>
              <p className="text-gray-600 mb-6">This will temporarily freeze your account. Reactivate within 30 days by logging in.</p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800"><strong>Note:</strong> Your data will be preserved while frozen.</p>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setShowFreezeModal(false)} variant="secondary" className="flex-1">Cancel</Button>
                <Button onClick={handleFreezeAccount} variant="warning" className="flex-1">Freeze Account</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2 text-red-600"><AlertTriangle size={20} /> Delete Account</h3>
              <p className="text-gray-600 mb-4">This action is <strong>permanent and irreversible</strong>.</p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-700 mb-3">Type <strong>"delete my account"</strong> to confirm:</p>
                <input type="text" value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)} placeholder="Type here..." className="w-full px-3 py-2 border border-red-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 text-sm" />
              </div>
              <div className="flex gap-3">
                <Button onClick={() => { setShowDeleteModal(false); setDeleteConfirmation(''); }} variant="secondary" className="flex-1">Cancel</Button>
                <Button onClick={handleDeleteAccount} variant="danger" className="flex-1" disabled={deleteConfirmation.toLowerCase() !== 'delete my account'}>Delete Permanently</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showLogoutConfirm && (
        <LogoutConfirmationModal onConfirm={handleConfirmLogout} onCancel={() => setShowLogoutConfirm(false)} />
      )}
    </PageTransition>
  );
}