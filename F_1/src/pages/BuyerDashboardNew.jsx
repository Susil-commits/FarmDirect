import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { orderService, cropService, wishlistService } from '../services/appService';
import PageTransition from '../components/common/PageTransition';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import ScrollAnimation from '../components/common/ScrollAnimation';
import SkeletonLoader from '../components/common/SkeletonLoader';
import ErrorBoundary from '../components/common/ErrorBoundary';
import CancelWithReason from '../components/modals/CancelWithReason';
import {
  ShoppingCart, Heart, Truck, CheckCircle, IndianRupee, Star,
  Clock, ArrowRight, XCircle, Leaf, MapPin, Phone, Package, Loader, ThumbsUp
} from 'lucide-react';
import '../styles/BuyerDashboard.css';
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

export default function BuyerDashboardNew() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [interestedCrops, setInterestedCrops] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [recommendedCrops, setRecommendedCrops] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    interestedCount: 0,
    wishlistCount: 0,
    activeOrdersCount: 0,
    completedOrdersCount: 0,
    totalSpent: 0
  });
  const [loading, setLoading] = useState(true);
  const [interestLoading, setInterestLoading] = useState({});
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTargetOrder, setCancelTargetOrder] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [receiveLoading, setReceiveLoading] = useState({});
  const [pickedUpLoading, setPickedUpLoading] = useState({});

  const fetchBuyerData = useCallback(async () => {
    try {
      setLoading(true);
      const [ordersData, interestedData, wishlistData, recommendedData] = await Promise.all([
        orderService.getOrders(),
        cropService.getMyInterestedCrops(),
        wishlistService.getWishlist(),
        cropService.getRecommendedCrops(8).catch(() => ({ crops: [] })),
      ]);

      const allOrders = ordersData.orders || ordersData.data || [];
      setOrders(allOrders);

      const interestedItems = interestedData.crops || interestedData.data || [];
      setInterestedCrops(interestedItems);

      const recommendedItems = recommendedData.crops || recommendedData.data || [];
      setRecommendedCrops(recommendedItems);

      const activeOrders = allOrders.filter(o =>
        !['completed', 'cancelled'].includes(o.orderStatus)
      );
      const completedOrders = allOrders.filter(o => o.orderStatus === 'completed');
      const totalSpent = allOrders
        .filter(o => o.orderStatus === 'completed')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      const items = wishlistData.wishlist || wishlistData.data || [];
      setWishlist(items);

      setStats({
        totalOrders: allOrders.length,
        interestedCount: interestedItems.length,
        activeOrdersCount: activeOrders.length,
        completedOrdersCount: completedOrders.length,
        totalSpent,
        wishlistCount: items.length
      });
    } catch {
      addToast('Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (user?.role === 'buyer') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchBuyerData();
    }
  }, [user, fetchBuyerData]);

  const handleUnmarkInterest = async (cropId) => {
    try {
      setInterestLoading(prev => ({ ...prev, [cropId]: true }));
      await cropService.toggleInterest(cropId);
      setInterestedCrops(prev => prev.filter(c => (c._id || c.id) !== cropId));
      setStats(prev => ({ ...prev, interestedCount: prev.interestedCount - 1 }));
      addToast('Interest removed', 'success');
    } catch {
      addToast('Failed to update interest', 'error');
    } finally {
      setInterestLoading(prev => ({ ...prev, [cropId]: false }));
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
      addToast('Order cancelled successfully. Farmer has been notified.', 'success');
      await fetchBuyerData();
    } catch (err) {
      addToast(err?.message || 'Failed to cancel order', 'error');
    } finally {
      setCancelLoading(false);
      setCancelModalOpen(false);
      setCancelTargetOrder(null);
    }
  };

  const handleMarkPickedUp = async (orderId) => {
    setPickedUpLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      await orderService.updateOrderStatus(orderId, 'picked_up');
      addToast('Order marked as picked up! Complete the order by marking it as received.', 'success');
      await fetchBuyerData();
    } catch (err) {
      addToast(err?.message || 'Failed to mark order as picked up', 'error');
    } finally {
      setPickedUpLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleMarkReceived = async (orderId) => {
    setReceiveLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      await orderService.markOrderReceived(orderId);
      addToast('Order marked as received! Thank you for your purchase.', 'success');
      await fetchBuyerData();
    } catch (err) {
      addToast(err?.message || 'Failed to mark order as received', 'error');
    } finally {
      setReceiveLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const getStatusStep = (orderStatus) => {
    if (orderStatus === 'cancelled') return -1;
    const idx = ORDER_STATUS_FLOW.indexOf(orderStatus);
    return idx >= 0 ? idx : 0;
  };

  const activeOrders = orders.filter(o =>
    !['completed', 'cancelled'].includes(o.orderStatus)
  );
  const completedOrders = orders.filter(o => o.orderStatus === 'completed');
  const cancelledOrders = orders.filter(o => o.orderStatus === 'cancelled');

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
      <div className="min-h-screen premium-gradient py-12 px-4 relative overflow-hidden">
        {/* Decorative background circles */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <ScrollAnimation className="scroll-slide mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition mb-4"
            >
              ← Back
            </button>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Dashboard</h1>
            <p className="text-gray-600">
              Welcome back, {user?.firstName}! Track your orders and manage your interests.
            </p>
          </ScrollAnimation>

          {/* Stats */}
          <ScrollAnimation className="scroll-slide mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-white">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-600">Total Orders</p>
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-green-50 to-white">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-600">Interested Crops</p>
                  <Leaf className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.interestedCount}</p>
                <p className="text-xs text-gray-500 mt-1">Marked for inquiry</p>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-orange-50 to-white">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-600">Active Orders</p>
                  <Truck className="w-5 h-5 text-orange-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.activeOrdersCount}</p>
                <p className="text-xs text-gray-500 mt-1">In progress</p>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-purple-50 to-white">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-600">Total Spent</p>
                  <IndianRupee className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">₹{stats.totalSpent.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Completed orders</p>
              </Card>
            </div>
          </ScrollAnimation>

          {/* Quick Actions */}
          <ScrollAnimation className="scroll-slide mb-8">
            <Card className="p-6 glass-deep border border-white/50">
              <h3 className="text-lg font-bold mb-4 text-gray-900">Quick Actions</h3>
              <div className="flex gap-4 flex-wrap">
                <Button onClick={() => navigate('/marketplace')} variant="primary">
                  🛍️ Browse Marketplace
                </Button>
                <Button onClick={() => setActiveTab('orders')} variant="outline">
                  📦 My Orders
                </Button>
                <Button onClick={() => setActiveTab('interested')} variant="outline">
                  🌿 Interested Crops
                </Button>
                <Button onClick={() => setActiveTab('wishlist')} variant="outline">
                  ❤️ Wishlist
                </Button>
              </div>
            </Card>
          </ScrollAnimation>

          {/* Tabs */}
          <ScrollAnimation className="scroll-slide mb-8">
            <div className="flex gap-2 border-b border-gray-200/50 overflow-x-auto pb-1 no-scrollbar">
              {['overview', 'orders', 'interested', 'history', 'wishlist'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 font-semibold whitespace-nowrap transition-all border-b-2 ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600'
                  }`}
                >
                  {tab === 'overview' && '📊 Overview'}
                  {tab === 'orders' && '📦 Active Orders'}
                  {tab === 'interested' && '🌿 Interested'}
                  {tab === 'history' && '✓ History'}
                  {tab === 'wishlist' && '❤️ Wishlist'}
                </button>
              ))}
            </div>
          </ScrollAnimation>

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <ScrollAnimation className="scroll-slide space-y-6">
              {/* Recent Orders */}
              <Card className="p-6 glass-deep border border-white/60 shadow-xl">
                <h3 className="text-lg font-bold mb-4 text-gray-900">Recent Orders</h3>
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No orders yet</p>
                    <Button
                      onClick={() => navigate('/marketplace')}
                      variant="primary"
                      className="mt-4"
                    >
                      Browse Marketplace
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.slice(0, 3).map(order => (
                      <div
                        key={order._id}
                        className="flex items-center justify-between p-4 glass-light rounded-xl hover:bg-white/60 premium-hover cursor-pointer mb-3 border border-gray-100"
                        onClick={() => navigate(`/order/${order._id}`)}
                      >
                        <div>
                          <p className="font-semibold text-gray-900">
                            {order.cropName || `Order #${order.orderNumber || order._id?.slice(-6)}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {order.quantity} {order.unit || 'kg'} • ₹{order.totalAmount?.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-3 py-1 rounded text-xs font-semibold ${STATUS_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-800'}`}>
                            {STATUS_LABELS[order.orderStatus] || order.orderStatus}
                          </span>
                          <p className="mt-2 text-sm text-blue-600 font-semibold flex items-center gap-1 justify-end">
                            View <ArrowRight className="w-3 h-3" />
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Interested Crops Preview */}
              {interestedCrops.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4 text-gray-900">Crops You're Interested In</h3>
                  <div className="space-y-3">
                    {interestedCrops.slice(0, 3).map(crop => (
                      <div
                        key={crop._id || crop.id}
                        className="flex items-center justify-between p-4 bg-green-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {crop.images?.[0] ? (
                            <img
                              src={getImageUrl(crop.images[0])}
                              alt={crop.cropName}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-green-200 flex items-center justify-center">
                              <Leaf className="w-6 h-6 text-green-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{crop.cropName}</p>
                            <p className="text-sm text-gray-600">
                              ₹{crop.price}/{crop.unit || 'kg'} • {crop.quantity} {crop.unit || 'kg'} available
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => navigate(`/crop/${crop._id || crop.id}`)}
                          variant="outline"
                          size="sm"
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Recommended for You */}
              {recommendedCrops.length > 0 && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <ThumbsUp className="w-5 h-5 text-green-600" /> Recommended for You
                    </h3>
                    <button
                      onClick={() => navigate('/marketplace')}
                      className="text-sm text-blue-600 font-semibold flex items-center gap-1 hover:text-blue-700"
                    >
                      View all <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {recommendedCrops.slice(0, 8).map(crop => (
                      <div
                        key={crop._id || crop.id}
                        onClick={() => navigate(`/crop/${crop._id || crop.id}`)}
                        className="group cursor-pointer bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition border border-gray-100"
                      >
                        <div className="relative h-28 bg-gradient-to-br from-green-100 to-emerald-100 overflow-hidden">
                          {crop.images?.[0] ? (
                            <img
                              src={getImageUrl(crop.images[0])}
                              alt={crop.cropName}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Leaf className="w-10 h-10 text-green-400" />
                            </div>
                          )}
                          {crop.rating > 0 && (
                            <span className="absolute top-1.5 right-1.5 bg-white/90 backdrop-blur-sm rounded-full px-1.5 py-0.5 text-xs font-bold text-gray-700 flex items-center gap-0.5">
                              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                              {crop.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="font-semibold text-gray-900 text-sm truncate">{crop.cropName}</p>
                          <p className="text-sm text-green-600 font-bold">₹{crop.price}/{crop.unit || 'kg'}</p>
                          {crop.pickupLocation && (
                            <p className="text-xs text-gray-400 flex items-center gap-0.5 mt-1 truncate">
                              <MapPin className="w-3 h-3" /> {crop.pickupLocation}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </ScrollAnimation>
          )}

          {/* ACTIVE ORDERS */}
          {activeTab === 'orders' && (
            <ScrollAnimation className="scroll-slide">
              {activeOrders.length === 0 ? (
                <Card className="p-12 text-center">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No active orders</p>
                  <Button
                    onClick={() => navigate('/marketplace')}
                    variant="primary"
                    className="mt-4"
                  >
                    Browse Marketplace
                  </Button>
                </Card>
              ) : (
                <div className="space-y-4">
                  {activeOrders.map(order => (
                    <Card key={order._id} className="p-6 border-l-4 border-orange-500">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {order.cropName || `Order #${order.orderNumber || order._id?.slice(-6)}`}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Ordered on {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                          {order.pickupLocation && (
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" /> {order.pickupLocation}
                            </p>
                          )}
                        </div>
                        <span className="text-2xl font-bold text-gray-900">
                          ₹{order.totalAmount?.toLocaleString()}
                        </span>
                      </div>

                      {/* Order Details */}
                      <div className="mb-4 pb-4 border-b border-gray-200">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-500">Quantity</p>
                            <p className="font-semibold text-gray-900">
                              {order.quantity} {order.unit || 'kg'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Rate</p>
                            <p className="font-semibold text-gray-900">
                              ₹{order.unitPrice}/{order.unit || 'kg'}
                            </p>
                          </div>
                          {order.farmerContact && (
                            <div>
                              <p className="text-xs text-gray-500">Farmer Contact</p>
                              <p className="font-semibold text-gray-900 flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {order.farmerContact}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-gray-500">Payment</p>
                            <p className="font-semibold text-gray-900 capitalize">
                              {order.paymentMethod === 'razorpay' ? 'Online (Razorpay)' : (order.paymentMethod || 'COD')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Status Progress Bar */}
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-2">Order Progress</p>
                        <div className="flex items-center gap-1">
                          {ORDER_STATUS_FLOW.map((status, idx) => {
                            const currentStep = getStatusStep(order.orderStatus);
                            const isCompleted = idx <= currentStep;
                            const isCurrent = idx === currentStep;
                            return (
                              <React.Fragment key={status}>
                                <div className="flex flex-col items-center flex-1">
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                      isCompleted
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-200 text-gray-500'
                                    } ${isCurrent ? 'ring-2 ring-green-300 ring-offset-2' : ''}`}
                                    title={STATUS_LABELS[status]}
                                  >
                                    {isCompleted ? '✓' : idx + 1}
                                  </div>
                                  <span className="text-[10px] text-gray-500 mt-1 text-center leading-tight">
                                    {STATUS_LABELS[status]}
                                  </span>
                                </div>
                                {idx < ORDER_STATUS_FLOW.length - 1 && (
                                  <div
                                    className={`h-0.5 flex-1 mt-4 ${
                                      idx < currentStep ? 'bg-green-500' : 'bg-gray-200'
                                    }`}
                                  />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>

                      {/* Current Status Badge */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span className={`inline-block px-3 py-1 rounded text-xs font-semibold ${STATUS_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-800'}`}>
                          {STATUS_LABELS[order.orderStatus] || order.orderStatus}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {/* Cancel with Reason - available for all active orders */}
                          <Button
                            onClick={() => handleCancelWithReason(order)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            {cancelLoading && cancelTargetOrder?._id === order._id ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4 mr-1" />
                            )}
                            Cancel
                          </Button>
                          {/* Mark as Picked Up - only for ready_for_pickup orders */}
                          {order.orderStatus === 'ready_for_pickup' && (
                            <Button
                              onClick={() => handleMarkPickedUp(order._id)}
                              variant="outline"
                              size="sm"
                              disabled={pickedUpLoading[order._id]}
                              className="text-purple-600 border-purple-300 hover:bg-purple-50"
                            >
                              {pickedUpLoading[order._id] ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                <ThumbsUp className="w-4 h-4 mr-1" />
                              )}
                              Picked Up
                            </Button>
                          )}
                          {/* Mark as Received - only for picked_up orders */}
                          {order.orderStatus === 'picked_up' && (
                            <Button
                              onClick={() => handleMarkReceived(order._id)}
                              variant="outline"
                              size="sm"
                              disabled={receiveLoading[order._id]}
                              className="text-green-600 border-green-300 hover:bg-green-50"
                            >
                              {receiveLoading[order._id] ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-1" />
                              )}
                              Completed
                            </Button>
                          )}
                          <Button
                            onClick={() => navigate(`/order/${order._id}`)}
                            variant="primary"
                            size="sm"
                          >
                            Track Order
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollAnimation>
          )}

          {/* INTERESTED CROPS */}
          {activeTab === 'interested' && (
            <ScrollAnimation className="scroll-slide">
              {interestedCrops.length === 0 ? (
                <Card className="p-12 text-center">
                  <Leaf className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">You haven't marked interest in any crops yet</p>
                  <Button
                    onClick={() => navigate('/marketplace')}
                    variant="primary"
                    className="mt-4"
                  >
                    Browse Marketplace
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {interestedCrops.map(crop => {
                    const cropId = crop._id || crop.id;
                    return (
                      <Card key={cropId} className="p-4 hover:shadow-lg transition-shadow">
                        {/* Image */}
                        {crop.images?.[0] ? (
                          <div className="relative mb-4 rounded-lg overflow-hidden h-40">
                            <img
                              src={getImageUrl(crop.images[0])}
                              alt={crop.cropName}
                              className="w-full h-full object-cover"
                            />
                            <span className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-semibold ${
                              crop.availability === 'not_available'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {crop.availability === 'not_available' ? 'Sold Out' : 'Available'}
                            </span>
                          </div>
                        ) : (
                          <div className="mb-4 rounded-lg h-40 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                            <Leaf className="w-12 h-12 text-green-500" />
                          </div>
                        )}

                        {/* Details */}
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded capitalize">
                              {crop.cropType || crop.category}
                            </span>
                          </div>
                          <h3 className="font-bold text-gray-900 text-lg">{crop.cropName}</h3>
                          {crop.pickupLocation && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" /> {crop.pickupLocation}
                            </p>
                          )}
                        </div>

                        <div className="mb-3">
                          <p className="text-2xl font-bold text-gray-900">
                            ₹{crop.price}
                            <span className="text-sm text-gray-500 font-normal">/{crop.unit || 'kg'}</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            {crop.quantity} {crop.unit || 'kg'} available
                          </p>
                          {crop.rating > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm text-gray-600">
                                {crop.rating?.toFixed(1)} ({crop.totalReviews || 0} reviews)
                              </span>
                            </div>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{crop.description}</p>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => navigate(`/crop/${cropId}`)}
                            variant="primary"
                            className="flex-1"
                          >
                            View Details
                          </Button>
                          <Button
                            onClick={() => handleUnmarkInterest(cropId)}
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            disabled={interestLoading[cropId]}
                          >
                            {interestLoading[cropId] ? (
                              <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                            ) : (
                              'Remove'
                            )}
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollAnimation>
          )}

          {/* ORDER HISTORY */}
          {activeTab === 'history' && (
            <ScrollAnimation className="scroll-slide space-y-6">
              {/* Completed Orders */}
              <div>
                <h3 className="text-lg font-bold mb-4 text-gray-900">Completed Orders</h3>
                {completedOrders.length === 0 ? (
                  <Card className="p-12 text-center">
                    <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No completed orders yet</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {completedOrders.map(order => (
                      <Card key={order._id} className="p-6 border-l-4 border-green-500">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {order.cropName || `Order #${order.orderNumber || order._id?.slice(-6)}`}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Completed on {new Date(order.completedAt || order.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="text-2xl font-bold text-gray-900">
                            ₹{order.totalAmount?.toLocaleString()}
                          </span>
                        </div>

                        <div className="mb-4 pb-4 border-b border-gray-200">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-gray-500">Quantity</p>
                              <p className="font-semibold text-gray-900">
                                {order.quantity} {order.unit || 'kg'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Rate</p>
                              <p className="font-semibold text-gray-900">
                                ₹{order.unitPrice}/{order.unit || 'kg'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => navigate(`/order/${order._id}`)}
                            variant="outline"
                            className="flex-1"
                          >
                            View Details
                          </Button>
                          <Button
                            onClick={() => navigate('/marketplace')}
                            variant="primary"
                            className="flex-1"
                          >
                            Buy Again
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Cancelled Orders */}
              {cancelledOrders.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-4 text-gray-900">Cancelled Orders</h3>
                  <div className="space-y-4">
                    {cancelledOrders.map(order => (
                      <Card key={order._id} className="p-6 border-l-4 border-red-500 opacity-75">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {order.cropName || `Order #${order.orderNumber || order._id?.slice(-6)}`}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Cancelled on {new Date(order.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="text-2xl font-bold text-gray-900">
                            ₹{order.totalAmount?.toLocaleString()}
                          </span>
                        </div>
                        <Button
                          onClick={() => navigate(`/order/${order._id}`)}
                          variant="outline"
                          className="w-full"
                        >
                          View Details
                        </Button>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </ScrollAnimation>
          )}

          {/* WISHLIST */}
          {activeTab === 'wishlist' && (
            <ScrollAnimation className="scroll-slide">
              {wishlist.length === 0 ? (
                <Card className="p-12 text-center">
                  <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Your wishlist is empty</p>
                  <Button
                    onClick={() => navigate('/marketplace')}
                    variant="primary"
                    className="mt-4"
                  >
                    Browse Marketplace
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlist.map(item => (
                    <Card key={item._id} className="p-4">
                      <div className="mb-4">
                        <h3 className="font-bold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-600">{item.category}</p>
                      </div>
                      <div className="mb-4">
                        <p className="text-2xl font-bold text-gray-900">₹{item.price}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm text-gray-600">
                            {item.rating || 0} ({item.reviews || 0} reviews)
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.description}</p>
                      <Button
                        onClick={() => navigate(`/crop/${item._id}`)}
                        variant="primary"
                        className="w-full mb-2"
                      >
                        View Details
                      </Button>
                      <Button
                        onClick={() => navigate('/marketplace')}
                        variant="outline"
                        className="w-full"
                      >
                        Mark Interested
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
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

    </PageTransition>
    </ErrorBoundary>
  );
}
