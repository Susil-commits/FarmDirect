import React, { useState, useEffect } from 'react';
import { useRouter } from '../hooks/useRouter';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { cropService, orderService } from '../services/appService';
import PageTransition from '../components/common/PageTransition';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import ScrollAnimation from '../components/common/ScrollAnimation';
import SkeletonLoader from '../components/common/SkeletonLoader';
import ErrorBoundary from '../components/common/ErrorBoundary';
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

  useEffect(() => {
    window.scrollTo(0, 0);
    if (user?.role === 'farmer') {
      fetchFarmerData();
    }
  }, [user]);

  const handleDeleteCrop = async (cropId) => {
    if (window.confirm('Delete this crop? This action cannot be undone.')) {
      try {
        await cropService.deleteCrop(cropId);
        setCrops(crops.filter(c => c._id !== cropId));
        addToast('Crop deleted', 'success');
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
      const createdOrder = result.order;
      addToast(result.message || 'Order started successfully! Buyer has been notified.', 'success');
      if (createdOrder?._id) {
        localStorage.setItem('lastOrderId', createdOrder._id);
        navigate('/order-confirmation');
      } else {
        await fetchFarmerData();
        setExpandedCrop(null);
      }
    } catch (err) {
      addToast(err?.message || 'Failed to start order', 'error');
    } finally {
      setStartOrderLoading(prev => ({ ...prev, [buyerId]: false }));
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      setStatusUpdating(prev => ({ ...prev, [orderId]: true }));
      await orderService.updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, orderStatus: newStatus } : o));
      addToast(`Order status updated to ${STATUS_LABELS[newStatus]}`, 'success');
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
      addToast(err?.message || 'Failed to cancel order', 'error');
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
      addToast(err?.message || 'Failed to deny order', 'error');
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
        <SkeletonLoader variant="dashboard" />
      </PageTransition>
    );
  }

  return (
    <ErrorBoundary>
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
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            {(crop.images?.[0] || crop.image) && (
                              <img
                                src={getImageUrl(crop.images?.[0] || crop.image)}
                                alt={crop.cropName || crop.name}
                                className="w-16 h-16 rounded-lg object-cover"
                                onError={(e) => e.target.style.display = 'none'}
                              />
                            )}
                            <div className="min-w-0">
                              <h3 className="text-lg font-bold text-gray-900 break-words">{crop.cropName || crop.name}</h3>
                              <p className="text-sm text-gray-600">{crop.cropType || crop.category} • {crop.pickupLocation || crop.location}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
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
                                        <div className="flex items-start gap-3 mb-3">
                                          {profilePic ? (
                                            <img src={getImageUrl(profilePic)} alt={fullName} className="w-12 h-12 rounded-full object-cover border-2 border-green-200" />
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
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                              Interested on {new Date(buyer.interestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                          </div>
                                        </div>

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
                          <div className="flex items-start gap-4 flex-1 min-w-0">
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
                            <div className="min-w-0">
                              <h4 className="font-bold text-gray-900 text-lg truncate">
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
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-800'}`}>
                              {STATUS_LABELS[order.orderStatus] || order.orderStatus}
                            </span>
                          </div>
                        </div>

                        {nextStatus && order.orderStatus !== 'completed' && order.orderStatus !== 'cancelled' && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
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
                              <Button
                                onClick={() => handleCancelWithReason(order)}
                                variant="outline"
                                className="text-red-600 border-red-300"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
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
                          <span className="text-sm font-bold text-gray-900 w-8 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            </ScrollAnimation>
          )}

          {cancelModalOpen && (
            <CancelWithReason
              isOpen={cancelModalOpen}
              onClose={() => setCancelModalOpen(false)}
              onConfirm={handleCancelConfirm}
              title="Cancel Order"
              message={`Are you sure you want to cancel order #${cancelTargetOrder?.orderNumber || cancelTargetOrder?._id?.slice(-6)}? Please provide a reason.`}
              loading={cancelLoading}
            />
          )}

          {denyModalOpen && (
            <CancelWithReason
              isOpen={denyModalOpen}
              onClose={() => setDenyModalOpen(false)}
              onConfirm={handleDenyConfirm}
              title="Deny Order"
              message={`Are you sure you want to deny order #${denyTargetOrder?.orderNumber || denyTargetOrder?._id?.slice(-6)}? This will refund the buyer.`}
              loading={denyLoading}
            />
          )}
        </div>
      </div>
    </PageTransition>
    </ErrorBoundary>
  );
}
