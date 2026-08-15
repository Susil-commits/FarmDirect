import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../hooks/useRouter';
import { orderService } from '../../services/appService';
import PageTransition from '../../components/common/PageTransition';
import Card from '../../components/common/Card';
import {
  ShoppingCart, Package, Truck, CheckCircle, XCircle,
  Clock, MapPin, Phone, User, ChevronDown, ChevronUp,
  ArrowLeft, RefreshCw, Search, Filter, IndianRupee
} from 'lucide-react';
import { getImageUrl } from '../../utils/formatters';

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
  confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
  preparing: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  ready_for_pickup: 'bg-orange-100 text-orange-800 border-orange-300',
  picked_up: 'bg-purple-100 text-purple-800 border-purple-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300'
};

const STATUS_ICONS = {
  confirmed: Clock,
  preparing: Package,
  ready_for_pickup: Truck,
  picked_up: CheckCircle,
  completed: CheckCircle,
  cancelled: XCircle
};

export default function AdminOrders() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    preparing: 0,
    ready_for_pickup: 0,
    picked_up: 0,
    completed: 0,
    cancelled: 0
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    if (user?.role === 'admin') {
       
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderService.getOrders({ limit: 100 });
      const ordersData = response.orders || response.data?.orders || [];
      setOrders(ordersData);

      const newStats = {
        total: ordersData.length,
        confirmed: ordersData.filter(o => o.orderStatus === 'confirmed').length,
        preparing: ordersData.filter(o => o.orderStatus === 'preparing').length,
        ready_for_pickup: ordersData.filter(o => o.orderStatus === 'ready_for_pickup').length,
        picked_up: ordersData.filter(o => o.orderStatus === 'picked_up').length,
        completed: ordersData.filter(o => o.orderStatus === 'completed').length,
        cancelled: ordersData.filter(o => o.orderStatus === 'cancelled').length,
      };
      setStats(newStats);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.orderStatus === filterStatus;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      (order.orderNumber || '').toLowerCase().includes(searchLower) ||
      (order.cropName || '').toLowerCase().includes(searchLower) ||
      (order.buyerId?.firstName || order.buyerId?.name || '').toLowerCase().includes(searchLower) ||
      (order.farmerId?.firstName || order.farmerId?.name || order.farmerId?.farmName || '').toLowerCase().includes(searchLower);
    return matchesStatus && matchesSearch;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (!user || user.role !== 'admin') {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center px-4 pt-28 pb-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Access Denied</h2>
            <p className="text-slate-300 mb-8">Only administrators can access this page</p>
            <button onClick={() => navigate('/')} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition">
              Return Home
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-28 pb-12">
        {}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-3 sm:px-6 py-4 flex items-center justify-between shadow-sm z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition flex-shrink-0">
              <ArrowLeft size={18} /> <span className="hidden sm:inline">Back</span>
            </button>
            <ShoppingCart size={28} className="text-green-600 flex-shrink-0" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">Order Management</h1>
          </div>
          <button onClick={fetchOrders} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-semibold flex-shrink-0">
            <RefreshCw size={18} /> <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        <div className="p-6 max-w-7xl mx-auto">
          {}
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
            <Card className="p-4 bg-gradient-to-br from-slate-50 to-white text-center">
              <p className="text-xs font-semibold text-gray-600 mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </Card>
            {ORDER_STATUS_FLOW.map(status => (
              <Card key={status} className={`p-4 text-center border-2 ${STATUS_COLORS[status]?.split(' ')[2] || 'border-gray-200'}`}>
                <p className="text-xs font-semibold text-gray-600 mb-1">{STATUS_LABELS[status]}</p>
                <p className="text-2xl font-bold text-gray-900">{stats[status] || 0}</p>
              </Card>
            ))}
            <Card className="p-4 bg-gradient-to-br from-red-50 to-white text-center border-2 border-red-200">
              <p className="text-xs font-semibold text-gray-600 mb-1">Cancelled</p>
              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
            </Card>
          </div>

          {}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2 flex-1 max-w-md">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search by order #, crop, farmer or buyer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 bg-white outline-none"
              >
                <option value="all">All Statuses</option>
                {ORDER_STATUS_FLOW.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {}
          {loading ? (
            <Card className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <p className="text-gray-600 mt-4">Loading orders...</p>
            </Card>
          ) : error ? (
            <Card className="p-12 text-center">
              <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-600">{error}</p>
              <button onClick={fetchOrders} className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold">Retry</button>
            </Card>
          ) : filteredOrders.length === 0 ? (
            <Card className="p-12 text-center">
              <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No orders found</p>
              <p className="text-gray-400 text-sm mt-1">
                {filterStatus !== 'all' ? 'Try changing the status filter' : 'Orders will appear here when created'}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map(order => {
                const isExpanded = expandedOrder === order._id;
                const StatusIcon = STATUS_ICONS[order.orderStatus] || Clock;
                const buyerName = order.buyerId?.firstName || order.buyerId?.name || 'Unknown Buyer';
                const farmerName = order.farmerId?.firstName || order.farmerId?.name || order.farmerId?.farmName || 'Unknown Farmer';

                return (
                  <Card key={order._id} className="overflow-hidden">
                    {}
                    <div 
                      className="p-6 cursor-pointer hover:bg-gray-50 transition"
                      onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${STATUS_COLORS[order.orderStatus]?.split(' ')[0] || 'bg-gray-100'}`}>
                            <StatusIcon className={`w-5 h-5 ${STATUS_COLORS[order.orderStatus]?.split(' ')[1] || 'text-gray-600'}`} />
                          </div>
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-green-100 flex items-center justify-center shrink-0">
                            {order.cropId?.images?.[0] ? (
                              <img
                                src={getImageUrl(order.cropId.images[0])}
                                alt={order.cropName || 'Crop'}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                              />
                            ) : null}
                            <span
                              className="text-lg"
                              style={{ display: order.cropId?.images?.[0] ? 'none' : 'flex' }}
                            >
                              🌾
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-gray-900 text-lg">
                                #{order.orderNumber || order._id?.slice(-8)}
                              </h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                                {STATUS_LABELS[order.orderStatus] || order.orderStatus}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {order.cropName || 'Crop'} • {order.quantity} {order.unit || 'kg'} •
                              <span className="font-semibold ml-1">₹{order.totalAmount?.toLocaleString()}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right hidden md:block">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <User className="w-3 h-3" /> {farmerName}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <User className="w-3 h-3" /> {buyerName}
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                        </div>
                      </div>
                    </div>

                    {}
                    {isExpanded && (
                      <div className="px-6 pb-6 border-t border-gray-200 pt-4">
                        {}
                        <div className="mb-6">
                          <p className="text-sm font-semibold text-gray-700 mb-3">Order Progress</p>
                          <div className="flex items-center">
                            {ORDER_STATUS_FLOW.map((status, idx) => {
                              const statusIdx = ORDER_STATUS_FLOW.indexOf(order.orderStatus);
                              const isCompleted = idx <= statusIdx && order.orderStatus !== 'cancelled';
                              const isCurrent = status === order.orderStatus;
                              const isCancelled = order.orderStatus === 'cancelled';
                              return (
                                <React.Fragment key={status}>
                                  <div className="flex flex-col items-center flex-1">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                      isCancelled ? 'bg-red-100 text-red-600' :
                                      isCompleted ? 'bg-green-500 text-white' :
                                      isCurrent ? 'bg-blue-500 text-white ring-4 ring-blue-200' :
                                      'bg-gray-200 text-gray-500'
                                    }`}>
                                      {isCompleted && !isCurrent ? '✓' : idx + 1}
                                    </div>
                                    <span className={`text-xs mt-1 text-center font-semibold ${
                                      isCancelled ? 'text-red-500' :
                                      isCompleted ? 'text-green-600' :
                                      isCurrent ? 'text-blue-600' : 'text-gray-400'
                                    }`}>
                                      {STATUS_LABELS[status]}
                                    </span>
                                  </div>
                                  {idx < ORDER_STATUS_FLOW.length - 1 && (
                                    <div className={`flex-1 h-1 mx-1 rounded transition-all ${
                                      isCancelled ? 'bg-red-200' :
                                      idx < statusIdx ? 'bg-green-500' : 'bg-gray-200'
                                    }`} />
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>

                        {}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 font-semibold mb-1">Crop</p>
                            <p className="font-bold text-gray-900">{order.cropName || 'N/A'}</p>
                            <p className="text-sm text-gray-600">{order.quantity} {order.unit || 'kg'} × ₹{order.unitPrice}/{order.unit || 'kg'}</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 font-semibold mb-1">Total Amount</p>
                            <p className="font-bold text-gray-900 flex items-center gap-1">
                              <IndianRupee className="w-4 h-4" /> {order.totalAmount?.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600">Payment: {order.paymentMethod?.toUpperCase() || 'COD'}</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 font-semibold mb-1">Pickup Location</p>
                            <p className="font-bold text-gray-900 flex items-center gap-1">
                              <MapPin className="w-4 h-4" /> {order.pickupLocation || 'N/A'}
                            </p>
                          </div>
                        </div>

                        {}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-xs text-green-600 font-semibold mb-2">👨‍🌾 Farmer</p>
                            <p className="font-bold text-gray-900">{farmerName}</p>
                            {order.farmerId?.phone && (
                              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" /> {order.farmerId.phone}
                              </p>
                            )}
                            {order.farmerContact && (
                              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" /> {order.farmerContact}
                              </p>
                            )}
                            {order.farmerId?.city && (
                              <p className="text-sm text-gray-600 mt-1">
                                {[order.farmerId.city, order.farmerId.state].filter(Boolean).join(', ')}
                              </p>
                            )}
                          </div>
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-xs text-blue-600 font-semibold mb-2">🛒 Buyer</p>
                            <p className="font-bold text-gray-900">{buyerName}</p>
                            {order.buyerId?.phone && (
                              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" /> {order.buyerId.phone}
                              </p>
                            )}
                            {order.buyerContact && (
                              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" /> {order.buyerContact}
                              </p>
                            )}
                            {order.buyerId?.city && (
                              <p className="text-sm text-gray-600 mt-1">
                                {[order.buyerId.city, order.buyerId.state].filter(Boolean).join(', ')}
                              </p>
                            )}
                          </div>
                        </div>

                        {}
                        {order.orderStatus === 'cancelled' && (
                          <div className={`mb-4 p-4 rounded-lg border-2 ${
                            order.cancelledBy === 'farmer' ? 'bg-orange-50 border-orange-400' :
                            order.cancelledBy === 'admin' ? 'bg-purple-50 border-purple-400' :
                            'bg-red-50 border-red-400'
                          }`}>
                            <p className="text-sm font-bold text-gray-900 mb-2">
                              🚫 Order {order.cancelledBy === 'farmer' ? 'Denied / Cancelled by Farmer' :
                              order.cancelledBy === 'admin' ? 'Cancelled by Admin' :
                              'Cancelled by Buyer'}
                            </p>
                            {order.cancellationReason && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500 font-semibold mb-1">Reason:</p>
                                <p className="text-sm text-gray-800 bg-white/60 rounded p-2 border border-current/10">
                                  {order.cancellationReason}
                                </p>
                              </div>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>Cancelled by: <span className="font-semibold capitalize">{order.cancelledBy || 'Unknown'}</span></span>
                              {order.updatedAt && (
                                <span>Cancelled at: {new Date(order.updatedAt).toLocaleString('en-IN', {
                                  day: 'numeric', month: 'short', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit'
                                })}</span>
                              )}
                            </div>
                          </div>
                        )}

                        {}
                        {order.orderStatus === 'cancelled' && order.timeline?.some(t => t.event === 'denied') && !order.cancellationReason && (
                          <div className="mb-4 p-4 rounded-lg border-2 bg-orange-50 border-orange-400">
                            <p className="text-sm font-bold text-gray-900 mb-1">🛑 Order Denied by Farmer</p>
                            <p className="text-xs text-gray-500">This order was denied at the cart stage before being started.</p>
                          </div>
                        )}

                        {}
                        {order.timeline && order.timeline.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-700 mb-3">Order Timeline</p>
                            <div className="space-y-2">
                              {order.timeline.map((entry, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-sm font-semibold text-gray-800">
                                      {entry.event?.replace(/_/g, ' ') || entry.status?.replace(/_/g, ' ')}
                                    </p>
                                    <p className="text-xs text-gray-500">{entry.description}</p>
                                    <p className="text-xs text-gray-400">
                                      {entry.timestamp ? new Date(entry.timestamp).toLocaleString('en-IN', {
                                        day: 'numeric', month: 'short', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                      }) : ''}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {}
                        <div className="flex gap-2 pt-2 border-t border-gray-200">
                          <button
                            onClick={() => navigate(`/order/${order._id}`)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition"
                          >
                            View Full Details
                          </button>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}