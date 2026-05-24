import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { cropService, orderService } from '../services/appService';
import PageTransition from '../components/common/PageTransition';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import ScrollAnimation from '../components/common/ScrollAnimation';
import CancelWithReason from '../components/modals/CancelWithReason';
import {
  Package, TrendingUp, ShoppingCart, AlertCircle, Eye, Edit2, Trash2,
  IndianRupee, BarChart3, PieChart, TrendingDown, CheckCircle, Clock,
  Users, Phone, MapPin, Truck, XCircle, Play, Ban, Loader, Plus,
  Mail, Shield, FileText, Star, Calendar, UserCheck, Image, Award, Hash, BadgeCheck
} from 'lucide-react';
import '../styles/FarmerDashboard.css';
import { getImageUrl } from '../utils/formatters';

const ORDER_STATUS_FLOW = ['confirmed', 'preparing', 'ready_for_pickup', 'picked_up', 'completed'];

const STATUS_LABELS = {
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready for Pickup',
  picked_up: 'Picked Up',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

const STATUS_COLORS = {
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-yellow-100 text-yellow-800',
  ready_for_pickup: 'bg-orange-100 text-orange-800',
  picked_up: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

export default function FarmerDashboardNew() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('inventory');
  const [crops, setCrops] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalSales: 0,
    pendingOrders: 0,
    completedOrders: 0,
    averageOrderValue: 0,
    totalInventory: 0
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [statusUpdating, setStatusUpdating] = useState({});
  const [expandedCrop, setExpandedCrop] = useState(null);
  const [startOrderLoading, setStartOrderLoading] = useState({});

  // Cancel/Deny modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTargetOrder, setCancelTargetOrder] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [denyModalOpen, setDenyModalOpen] = useState(false);
  const [denyTargetOrder, setDenyTargetOrder] = useState(null);
  const [denyLoading, setDenyLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (user?.role === 'farmer') {
      fetchFarmerData();
    }
  }, [user]);

  const fetchFarmerData = async () => {
    try {
      setLoading(true);
      const [cropsData, ordersData] = await Promise.all([
        cropService.getMyListings(),
        orderService.getOrders()
      ]);

      const cropsArray = cropsData.crops || cropsData.data?.crops || [];
      setCrops(cropsArray);
      const totalInventory = cropsArray.reduce((sum, crop) => sum + (crop.quantity || 0), 0);

      const ordersArray = ordersData.orders || ordersData.data?.orders || [];
      setOrders(ordersArray);

      const totalRevenue = ordersArray
        .filter(o => o.orderStatus === 'completed')
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      const completedOrders = ordersArray.filter(o => o.orderStatus === 'completed').length;
      const pendingOrders = ordersArray.filter(o => !['completed', 'cancelled'].includes(o.orderStatus)).length;
      const averageOrderValue = ordersArray.length > 0 ? Math.round(totalRevenue / (completedOrders || 1)) : 0;

      setAnalytics({
        totalInventory,
        totalRevenue,
        totalSales: ordersArray.length,
        pendingOrders,
        completedOrders,
        averageOrderValue
      });
    } catch (error) {
      console.error('Error:', error);
      addToast('Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCrop = async (cropId) => {
    if (window.confirm('Delete this crop? This action cannot be undone.')) {
      try {
        await cropService.deleteCrop(cropId);
        setCrops(crops.filter(c => c._id !== cropId));
        addToast('Crop deleted', 'success');
        // Dispatch global event so cart & wishlist contexts remove this crop
        window.dispatchEvent(new CustomEvent('crop-deleted', { detail: { cropId } }));
      } catch {
        addToast('Error deleting crop', 'error');
      }
    }
  };

  const handleStartOrder = async (cropId, buyerId) => {
    try {
      setStartOrderLoading(prev => ({ ...prev, [buyerId]: true }));
      const result = await orderService.startOrder({ cropId, buyerId });
      // api.js interceptor unwraps to response.data, so result = { message, order }
      const createdOrder = result.order;
      addToast(result.message || 'Order started successfully! Buyer has been notified.', 'success');
      if (createdOrder?._id) {
        localStorage.setItem('lastOrderId', createdOrder._id);
        // Navigate to OrderConfirmation for the congratulations/success UI
        navigate('/order-confirmation');
      } else {
        await fetchFarmerData();
        setExpandedCrop(null);
      }
    } catch (err) {
      // Error is already unwrapped by api.js interceptor: err = { message: '...' }
      addToast(err?.message || 'Failed to start order', 'error');
    } finally {
      setStartOrderLoading(prev => ({ ...prev, [buyerId]: false }));
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      setStatusUpdating(prev => ({ ...prev, [orderId]: true }));
      await orderService.updateOrderStatus(orderId, newStatus);
      
      setOrders(prev => prev.map(o => 
        o._id === orderId ? { ...o, orderStatus: newStatus } : o
      ));
      
      addToast(`Order status updated to ${STATUS_LABELS[newStatus]}`, 'success');
      
      // Refresh data to get updated analytics
      fetchFarmerData();
    } catch {
      addToast('Failed to update order status', 'error');
    } finally {
      setStatusUpdating(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleCancelWithReason = (order) => {
    setCancelTargetOrder(order);
    setCancelModalOpen(true);
  };

  const handleCancelConfirm = async (reason) => {
    if (!cancelTargetOrder) return;
    setCancelLoading(true);
    try {
      await orderService.cancelOrder(cancelTargetOrder._id, reason);
      addToast('Order cancelled successfully. Buyer has been notified.', 'success');
      await fetchFarmerData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to cancel order', 'error');
    } finally {
      setCancelLoading(false);
      setCancelModalOpen(false);
      setCancelTargetOrder(null);
    }
  };

  const handleDenyWithReason = (order) => {
    setDenyTargetOrder(order);
    setDenyModalOpen(true);
  };

  const handleDenyConfirm = async (reason) => {
    if (!denyTargetOrder) return;
    setDenyLoading(true);
    try {
      await orderService.denyOrder(denyTargetOrder._id, reason);
      addToast('Order denied. Buyer has been notified.', 'success');
      await fetchFarmerData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to deny order', 'error');
    } finally {
      setDenyLoading(false);
      setDenyModalOpen(false);
      setDenyTargetOrder(null);
    }
  };

  const getNextStatus = (currentStatus) => {
    const idx = ORDER_STATUS_FLOW.indexOf(currentStatus);
    if (idx >= 0 && idx < ORDER_STATUS_FLOW.length - 1) {
      return ORDER_STATUS_FLOW[idx + 1];
    }
    return null;
  };

  const filteredCrops = filterStatus === 'all' 
    ? crops 
    : filterStatus === 'active' 
      ? crops.filter(c => c.availability !== 'not_available' && c.quantity > 0)
      : crops.filter(c => c.availability === 'not_available' || c.quantity === 0);

  const getInterestedBuyersCount = (crop) => {
    return (crop.interestedBuyers || []).filter(b => b.status === 'interested').length;
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-white py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <Card className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <p className="text-gray-600 mt-4">Loading dashboard...</p>
            </Card>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <ScrollAnimation className="scroll-slide mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Farmer Dashboard</h1>
            <p className="text-gray-600">Manage inventory, view interested buyers & track orders</p>
          </ScrollAnimation>

          <ScrollAnimation className="scroll-slide mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-white">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-600">Total Revenue</p>
                  <IndianRupee className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">₹{analytics.totalRevenue.toLocaleString()}</p>
              </Card>
              <Card className="p-6 bg-gradient-to-br from-emerald-50 to-white">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-600">Total Orders</p>
                  <ShoppingCart className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalSales}</p>
              </Card>
              <Card className="p-6 bg-gradient-to-br from-orange-50 to-white">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-600">Pending</p>
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{analytics.pendingOrders}</p>
              </Card>
              <Card className="p-6 bg-gradient-to-br from-green-50 to-white">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-600">Completed</p>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{analytics.completedOrders}</p>
              </Card>
              <Card className="p-6 bg-gradient-to-br from-purple-50 to-white">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-600">Inventory</p>
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalInventory}</p>
              </Card>
              <Card className="p-6 bg-gradient-to-br from-indigo-50 to-white">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-600">Avg Order</p>
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">₹{analytics.averageOrderValue.toLocaleString()}</p>
              </Card>
            </div>
          </ScrollAnimation>

          <ScrollAnimation className="scroll-slide mb-8">
            <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
              {['inventory', 'orders', 'analytics'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 font-semibold whitespace-nowrap transition-all border-b-2 ${activeTab === tab ? 'border-green-600 text-green-600' : 'border-transparent text-gray-600'}`}>
                  {tab === 'inventory' && '📦 Inventory'}{tab === 'orders' && '📋 Orders'}{tab === 'analytics' && '📊 Analytics'}
                </button>
              ))}
            </div>
          </ScrollAnimation>

          {activeTab === 'inventory' && (
            <ScrollAnimation className="scroll-slide space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-2">
                  {['all', 'active', 'inactive'].map(status => (
                    <button key={status} onClick={() => setFilterStatus(status)} className={`px-4 py-2 rounded-lg font-semibold transition ${filterStatus === status ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                      {status === 'all' ? 'All' : status === 'active' ? 'Active' : 'Not Available'}
                    </button>
                  ))}
                </div>
                <Button onClick={() => navigate('/create-crop')} variant="primary" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Crop
                </Button>
              </div>
              {filteredCrops.length === 0 ? (
                <Card className="p-12 text-center"><Package className="w-12 h-12 text-gray-400 mx-auto mb-4" /><p className="text-gray-600">No crops found</p><Button onClick={() => navigate('/create-crop')} variant="primary" className="mt-4">Add Your First Crop</Button></Card>
              ) : (
                <div className="space-y-4">
                  {filteredCrops.map(crop => {
                    const interestedCount = getInterestedBuyersCount(crop);
                    const isExpanded = expandedCrop === crop._id;
                    return (
                      <Card key={crop._id} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            {(crop.images?.[0] || crop.image) && (
                              <img
                                src={getImageUrl(crop.images?.[0] || crop.image)}
                                alt={crop.cropName || crop.name}
                                className="w-16 h-16 rounded-lg object-cover"
                                onError={(e) => e.target.style.display = 'none'}
                              />
                            )}
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">{crop.cropName || crop.name}</h3>
                              <p className="text-sm text-gray-600">{crop.cropType || crop.category} • {crop.pickupLocation || crop.location}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {interestedCount > 0 && (
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold flex items-center gap-1">
                                <Users className="w-4 h-4" /> {interestedCount} interested
                              </span>
                            )}
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${crop.availability !== 'not_available' && crop.quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {crop.availability !== 'not_available' && crop.quantity > 0 ? 'Available' : 'Not Available'}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-gray-200">
                          <div><p className="text-xs text-gray-600 mb-1">Price</p><p className="text-lg font-bold">₹{crop.price}/{crop.unit || 'kg'}</p></div>
                          <div><p className="text-xs text-gray-600 mb-1">Quantity</p><p className="text-lg font-bold">{crop.quantity} {crop.unit || 'kg'}</p></div>
                          <div><p className="text-xs text-gray-600 mb-1">Pickup</p><p className="text-sm font-semibold flex items-center gap-1"><MapPin className="w-3 h-3" />{crop.pickupLocation || 'N/A'}</p></div>
                          <div><p className="text-xs text-gray-600 mb-1">Contact</p><p className="text-sm font-semibold flex items-center gap-1"><Phone className="w-3 h-3" />{crop.contactNumber || 'N/A'}</p></div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{crop.description}</p>
                        
                        {/* Interested Buyers Section */}
                        {interestedCount > 0 && (
                          <div className="mb-4">
                            <button 
                              onClick={() => setExpandedCrop(isExpanded ? null : crop._id)}
                              className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <Users className="w-4 h-4" />
                              {isExpanded ? 'Hide' : 'View'} Interested Buyers ({interestedCount})
                            </button>
                            {isExpanded && (
                              <div className="mt-3 space-y-3">
                                {(crop.interestedBuyers || [])
                                  .filter(b => b.status === 'interested')
                                  .map((buyer, idx) => {
                                    const buyerData = typeof buyer.buyerId === 'object' ? buyer.buyerId : {};
                                    const buyerId = buyer.buyerId?._id || buyer.buyerId;
                                    const isStarting = startOrderLoading[buyerId];
                                    const fullName = [buyerData.firstName, buyerData.lastName].filter(Boolean).join(' ') || buyerData.name || 'Buyer';
                                    const kycDocs = buyerData.kycDocuments || {};
                                    const kycDetails = buyerData.kycDetails || {};
                                    const kycStatus = buyerData.kycStatus || 'not_submitted';
                                    const profilePic = buyerData.profilePicture || buyerData.profilePhotoUrl || kycDetails?.profilePhotoUrl;

                                    return (
                                      <div key={idx} className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                        {/* Header: Avatar + Name + KYC Badge */}
                                        <div className="flex items-start gap-3 mb-3">
                                          {profilePic ? (
                                            <img src={profilePic} alt={fullName} className="w-12 h-12 rounded-full object-cover border-2 border-green-200" />
                                          ) : (
                                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-lg border-2 border-green-200">
                                              {(buyerData.firstName || buyerData.name || '?').charAt(0).toUpperCase()}
                                            </div>
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <h4 className="font-bold text-gray-900 text-base">{fullName}</h4>
                                              {kycStatus === 'verified' && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                                  <BadgeCheck className="w-3 h-3" /> KYC Verified
                                                </span>
                                              )}
                                              {kycStatus === 'pending' && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                                                  <Clock className="w-3 h-3" /> KYC Pending
                                                </span>
                                              )}
                                              {kycStatus === 'rejected' && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                                                  <XCircle className="w-3 h-3" /> KYC Rejected
                                                </span>
                                              )}
                                              {kycStatus === 'not_submitted' && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                                                  <Shield className="w-3 h-3" /> No KYC
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                              Interested on {new Date(buyer.interestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                          </div>
                                        </div>

                                        {/* Contact Details Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 p-3 bg-gray-50 rounded-lg">
                                          <div className="flex items-center gap-2 text-sm">
                                            <Phone className="w-4 h-4 text-green-600 shrink-0" />
                                            <span className="text-gray-700">{buyerData.phone || 'N/A'}</span>
                                          </div>
                                          <div className="flex items-center gap-2 text-sm">
                                            <Mail className="w-4 h-4 text-green-600 shrink-0" />
                                            <span className="text-gray-700 truncate">{buyerData.email || 'N/A'}</span>
                                          </div>
                                          {(buyerData.city || buyerData.state || buyerData.address) && (
                                            <div className="flex items-start gap-2 text-sm sm:col-span-2">
                                              <MapPin className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                                              <span className="text-gray-700">
                                                {[buyerData.address, buyerData.city, buyerData.state, buyerData.pincode].filter(Boolean).join(', ') || 'Location N/A'}
                                              </span>
                                            </div>
                                          )}
                                        </div>

                                        {/* KYC Documents Section */}
                                        {(kycDocs.aadharCard || kycDocs.panCard || kycDocs.governmentId || kycDetails?.aadharNumber || kycDetails?.governmentIdNumber) && (
                                          <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                            <h5 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-1">
                                              <FileText className="w-4 h-4" /> KYC Documents
                                            </h5>
                                            <div className="space-y-1.5 text-sm">
                                              {kycDetails?.aadharNumber && (
                                                <div className="flex items-center gap-2">
                                                  <Hash className="w-3.5 h-3.5 text-blue-600" />
                                                  <span className="text-gray-700">Aadhar: ****{kycDetails.aadharNumber.slice(-4)}</span>
                                                </div>
                                              )}
                                              {kycDetails?.governmentIdType && (
                                                <div className="flex items-center gap-2">
                                                  <Award className="w-3.5 h-3.5 text-blue-600" />
                                                  <span className="text-gray-700">{kycDetails.governmentIdType}: {kycDetails.governmentIdNumber ? '****' + kycDetails.governmentIdNumber.slice(-4) : 'N/A'}</span>
                                                </div>
                                              )}
                                              {kycDetails?.dateOfBirth && (
                                                <div className="flex items-center gap-2">
                                                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                                  <span className="text-gray-700">DOB: {new Date(kycDetails.dateOfBirth).toLocaleDateString('en-IN')}</span>
                                                </div>
                                              )}
                                            </div>
                                            {/* Doc Links */}
                                            {Object.entries(kycDocs).filter(([,v]) => v && typeof v === 'string' && v.startsWith('http')).length > 0 && (
                                              <div className="flex flex-wrap gap-2 mt-2">
                                                {Object.entries(kycDocs).filter(([,v]) => v && typeof v === 'string' && v.startsWith('http')).map(([key, url]) => (
                                                  <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-blue-300 rounded text-xs text-blue-700 hover:bg-blue-100 transition">
                                                    <Image className="w-3 h-3" /> {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                                                  </a>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {/* Verification & Account Stats */}
                                        <div className="flex flex-wrap items-center gap-3 mb-3 text-xs text-gray-600">
                                          <span className="flex items-center gap-1">
                                            <UserCheck className="w-3.5 h-3.5" />
                                            {buyerData.verified ? 'Account Verified' : 'Not Verified'}
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <Mail className="w-3.5 h-3.5" />
                                            {buyerData.emailVerified ? 'Email Verified' : 'Email Unverified'}
                                          </span>
                                          {buyerData.rating > 0 && (
                                            <span className="flex items-center gap-1">
                                              <Star className="w-3.5 h-3.5 text-yellow-500" />
                                              {buyerData.rating?.toFixed(1)} ({buyerData.totalReviews || 0} reviews)
                                            </span>
                                          )}
                                          {buyerData.createdAt && (
                                            <span className="flex items-center gap-1">
                                              <Calendar className="w-3.5 h-3.5" />
                                              Member since {new Date(buyerData.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                            </span>
                                          )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 pt-2 border-t border-gray-100">
                                          <button
                                            onClick={() => handleStartOrder(crop._id, buyerId)}
                                            disabled={isStarting}
                                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm flex items-center justify-center gap-2 transition"
                                          >
                                            {isStarting ? (
                                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                              <Play className="w-4 h-4" />
                                            )}
                                            Start Order
                                          </button>
                                          {buyerData.phone && (
                                            <a
                                              href={`tel:${buyerData.phone}`}
                                              className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-semibold text-sm flex items-center gap-1 transition"
                                            >
                                              <Phone className="w-4 h-4" /> Call
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button onClick={() => navigate(`/crop/${crop._id}`)} className="flex-1 px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 font-semibold flex items-center justify-center gap-2"><Eye className="w-4 h-4" />View</button>
                          <button onClick={() => navigate(`/edit-crop/${crop._id}`)} className="flex-1 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 font-semibold flex items-center justify-center gap-2"><Edit2 className="w-4 h-4" />Edit</button>
                          <button onClick={() => handleDeleteCrop(crop._id)} className="flex-1 px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-semibold flex items-center justify-center gap-2"><Trash2 className="w-4 h-4" />Delete</button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollAnimation>
          )}

          {activeTab === 'orders' && (
            <ScrollAnimation className="scroll-slide space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><ShoppingCart className="w-6 h-6" />Orders ({orders.length})</h2>
              {orders.length === 0 ? (
                <Card className="p-12 text-center"><ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" /><p className="text-gray-600">No orders yet</p></Card>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => {
                    const nextStatus = getNextStatus(order.orderStatus);
                    const isUpdating = statusUpdating[order._id];
                    return (
                      <Card key={order._id} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-green-100 flex items-center justify-center shrink-0">
                              {order.cropId?.images?.[0] ? (
                                <img
                                  src={getImageUrl(order.cropId.images[0])}
                                  alt={order.cropName || 'Crop'}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                />
                              ) : null}
                              <span
                                className="text-2xl"
                                style={{ display: order.cropId?.images?.[0] ? 'none' : 'flex' }}
                              >
                                🌾
                              </span>
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-lg">
                                Order #{order.orderNumber || order._id?.slice(-6)}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {order.cropName || 'Crop'} • {order.quantity} {order.unit || 'kg'} • ₹{order.totalAmount?.toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                Buyer: {order.buyerId?.firstName || order.buyerId?.name || 'N/A'} •
                                <Phone className="w-3 h-3 inline mx-1" />
                                {order.buyerContact || order.buyerId?.phone || 'N/A'}
                              </p>
                              {order.pickupLocation && (
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> Pickup: {order.pickupLocation}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-800'}`}>
                              {STATUS_LABELS[order.orderStatus] || order.orderStatus}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Order Status Update Buttons */}
                        {nextStatus && order.orderStatus !== 'completed' && order.orderStatus !== 'cancelled' && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-sm text-gray-600 mb-2">Update status to:</p>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                onClick={() => handleUpdateOrderStatus(order._id, nextStatus)}
                                disabled={isUpdating}
                                variant="primary"
                                className="flex items-center gap-2"
                              >
                                {isUpdating ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Truck className="w-4 h-4" />
                                )}
                                {STATUS_LABELS[nextStatus]}
                              </Button>
                              {/* Cancel with Reason - available for all active orders */}
                              <Button
                                onClick={() => handleCancelWithReason(order)}
                                disabled={isUpdating}
                                variant="outline"
                                className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
                              >
                                {cancelLoading && cancelTargetOrder?._id === order._id ? (
                                  <Loader className="w-4 h-4 animate-spin" />
                                ) : (
                                  <XCircle className="w-4 h-4" />
                                )}
                                Cancel with Reason
                              </Button>
                              {/* Deny Order - for cart-based orders in confirmed state */}
                              {order.orderStatus === 'confirmed' && (
                                <Button
                                  onClick={() => handleDenyWithReason(order)}
                                  disabled={isUpdating}
                                  variant="outline"
                                  className="flex items-center gap-2 text-orange-600 border-orange-300 hover:bg-orange-50"
                                >
                                  {denyLoading && denyTargetOrder?._id === order._id ? (
                                    <Loader className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Ban className="w-4 h-4" />
                                  )}
                                  Deny Order
                                </Button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Order Timeline */}
                        {order.timeline && order.timeline.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-2 font-semibold">Order Timeline</p>
                            <div className="space-y-1">
                              {order.timeline.slice(-3).map((event, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                  <span className="font-medium">{event.status?.replace(/_/g, ' ')}</span>
                                  <span className="text-gray-400">
                                    {event.timestamp ? new Date(event.timestamp).toLocaleString() : ''}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <button 
                          onClick={() => navigate(`/order/${order._id}`)} 
                          className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          View Full Details →
                        </button>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollAnimation>
          )}

          {activeTab === 'analytics' && (
            <ScrollAnimation className="scroll-slide space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Order Status Breakdown</h3>
                  <div className="space-y-3">
                    {ORDER_STATUS_FLOW.map(status => {
                      const count = orders.filter(o => o.orderStatus === status).length;
                      return (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-3 h-3 rounded-full ${STATUS_COLORS[status]?.split(' ')[0]?.replace('bg-', 'bg-') || 'bg-gray-500'}`} />
                            <span className="text-gray-700 font-semibold">{STATUS_LABELS[status]}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${STATUS_COLORS[status]?.split(' ')[0] || 'bg-gray-500'}`} 
                                style={{ width: `${analytics.totalSales > 0 ? (count / analytics.totalSales) * 100 : 0}%` }} 
                              />
                            </div>
                            <span className="text-sm font-bold text-gray-900 w-8 text-right">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-gray-700 font-semibold">Cancelled</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {orders.filter(o => o.orderStatus === 'cancelled').length}
                      </span>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Crop Performance</h3>
                  <div className="space-y-3">
                    {crops.slice(0, 5).map(crop => {
                      const cropOrders = orders.filter(o => 
                        (o.cropId?._id || o.cropId) === crop._id
                      );
                      const completedForCrop = cropOrders.filter(o => o.orderStatus === 'completed').length;
                      return (
                        <div key={crop._id} className="flex items-center justify-between">
                          <span className="text-gray-700 font-semibold text-sm truncate flex-1">
                            {crop.cropName || crop.name}
                          </span>
                          <span className="text-sm text-gray-600 ml-2">
                            {completedForCrop} completed / {cropOrders.length} orders
                          </span>
                        </div>
                      );
                    })}
                    {crops.length === 0 && (
                      <p className="text-gray-500 text-sm">No crops listed yet</p>
                    )}
                  </div>
                </Card>
              </div>

              <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Performance Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div><p className="text-sm text-gray-600 mb-1">Total Revenue</p><p className="text-3xl font-bold text-green-600">₹{analytics.totalRevenue.toLocaleString()}</p></div>
                  <div><p className="text-sm text-gray-600 mb-1">Completion Rate</p><p className="text-3xl font-bold text-emerald-600">{analytics.totalSales > 0 ? Math.round((analytics.completedOrders / analytics.totalSales) * 100) : 0}%</p></div>
                  <div><p className="text-sm text-gray-600 mb-1">Active Listings</p><p className="text-3xl font-bold text-blue-600">{crops.filter(c => c.availability !== 'not_available' && c.quantity > 0).length}</p></div>
                </div>
              </Card>
            </ScrollAnimation>
          )}
        </div>
      </div>

      {/* Cancel Order Modal */}
      <CancelWithReason
        isOpen={cancelModalOpen}
        onClose={() => { setCancelModalOpen(false); setCancelTargetOrder(null); }}
        onConfirm={handleCancelConfirm}
        loading={cancelLoading}
        title="Cancel Order"
        subtitle={`Cancelling Order #${cancelTargetOrder?.orderNumber || 'N/A'} - ${cancelTargetOrder?.cropName || ''}`}
      />

      {/* Deny Order Modal */}
      <CancelWithReason
        isOpen={denyModalOpen}
        onClose={() => { setDenyModalOpen(false); setDenyTargetOrder(null); }}
        onConfirm={handleDenyConfirm}
        loading={denyLoading}
        title="Deny Order"
        subtitle={`Denying Order #${denyTargetOrder?.orderNumber || 'N/A'} - ${denyTargetOrder?.cropName || ''}`}
      />

    </PageTransition>
  );
}
