import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import { notificationService } from '../../services/appService';
import PageTransition from '../../components/common/PageTransition.jsx';
import Card from '../../components/common/Card';
import LogoutConfirmationModal from '../../components/common/LogoutConfirmationModal';
import {
  Bell, BellOff, Trash2, CheckCheck, Menu, LogOut, Search,
  BarChart3, Users, Package, Sprout, UserCheck, Send, PlusCircle,
  ChevronLeft, ChevronRight, RefreshCw, X, Mail, AlertCircle,
  Clock, CheckCircle, Filter, Shield, XCircle
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

// ─── Admin Notifications Page ───
export default function AdminNotifications() {
  const { logout } = useAuth();
  const { navigate } = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [searchQuery, setSearchQuery] = useState('');

  // Create notification modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    message: '',
    recipientType: 'all', // 'all', 'farmers', 'buyers', 'specific'
    recipientId: ''
  });
  const [createSuccess, setCreateSuccess] = useState(false);

  // Reset scroll position
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications({ page, limit: ITEMS_PER_PAGE });
      setNotifications(response.data || []);
      setUnreadCount(response.unreadCount || 0);
      if (response.pagination) {
        setTotalPages(response.pagination.pages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Mark single notification as read
  const markAsRead = async (id) => {
    try {
      setActionLoading(true);
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      setActionLoading(true);
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete notification
  const deleteNotification = async (id) => {
    try {
      setActionLoading(true);
      await notificationService.deleteNotification(id);
      setNotifications(prev => {
        const updated = prev.filter(n => n._id !== id);
        return updated;
      });
    } catch (err) {
      console.error('Failed to delete notification:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete all notifications
  const deleteAllNotifications = async () => {
    if (!window.confirm('Are you sure you want to delete ALL notifications?')) return;
    try {
      setActionLoading(true);
      await notificationService.deleteAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to delete all notifications:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Create notification (admin-only)
  const createNotification = async () => {
    if (!createForm.title.trim() || !createForm.message.trim()) return;
    try {
      setActionLoading(true);
      await notificationService.createNotification(createForm);
      setCreateSuccess(true);
      setShowCreateModal(false);
      setCreateForm({ title: '', message: '', recipientType: 'all', recipientId: '' });
      fetchNotifications();
      setTimeout(() => setCreateSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to create notification:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread' && n.isRead) return false;
    if (filter === 'read' && !n.isRead) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (n.title?.toLowerCase().includes(q)) || (n.message?.toLowerCase().includes(q));
    }
    return true;
  });

  // Get icon for notification type
  const getNotificationIcon = (notification) => {
    const title = notification.title || '';
    if (title.includes('Approved') || title.includes('approved')) return <CheckCircle size={18} className="text-green-500" />;
    if (title.includes('Rejected') || title.includes('rejected')) return <XCircle size={18} className="text-red-500" />;
    if (title.includes('Order') || title.includes('order')) return <Package size={18} className="text-blue-500" />;
    if (title.includes('KYC') || title.includes('Verification')) return <Shield size={18} className="text-purple-500" />;
    return <Bell size={18} className="text-gray-500" />;
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 flex">
        {/* ─── Sidebar ─── */}
        <aside className={`fixed lg:static inset-y-0 left-0 transition-all duration-300 z-40 ${sidebarOpen ? 'w-72' : 'w-20'} bg-gradient-to-b from-indigo-700 via-indigo-800 to-purple-900 text-white flex flex-col shadow-2xl`}>
          <div className="p-6 border-b border-indigo-600/50">
            <div className="flex items-center justify-between">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-1 hover:bg-indigo-600 rounded">
                <Menu size={24} />
              </button>
              {sidebarOpen && (
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">FarmDirect</h2>
                  <p className="text-xs text-indigo-200 mt-0.5">Admin Panel</p>
                </div>
              )}
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            {[
              { label: 'Dashboard', path: '/admin/dashboard', icon: BarChart3 },
              { label: 'Approvals', path: '/admin/approvals', icon: UserCheck },
              { label: 'Management', path: '/admin/management', icon: Users },
              { label: 'Crops', path: '/admin/crops', icon: Sprout },
              { label: 'Notifications', path: '/admin/notifications', icon: Bell, active: true },
            ].map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                  item.active
                    ? 'bg-white/20 text-white shadow-lg shadow-indigo-900/20'
                    : 'text-indigo-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon size={18} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-indigo-600/50">
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
        <div className="flex-1 overflow-auto">
          <div className="p-4 lg:p-8">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="hidden lg:block p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                  >
                    {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                  </button>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 flex items-center gap-3">
                      <Bell className="text-indigo-600" size={32} />
                      Notifications
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Manage your notifications {unreadCount > 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 ml-2">
                          {unreadCount} unread
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate('/admin/dashboard')}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm font-medium"
                  >
                    ← Back to Dashboard
                  </button>
                  <button
                    onClick={fetchNotifications}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm font-medium flex items-center gap-2"
                  >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Success Banner */}
              {createSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 animate-fadeIn">
                  <CheckCircle size={20} className="text-green-600 shrink-0" />
                  <p className="text-green-800 text-sm">Notification created and sent successfully!</p>
                  <button onClick={() => setCreateSuccess(false)} className="ml-auto text-green-600 hover:text-green-800">
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Search */}
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search notifications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-56"
                    />
                  </div>
                  {/* Filter */}
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    <Filter size={14} className="text-gray-500 ml-1" />
                    {[
                      { key: 'all', label: 'All' },
                      { key: 'unread', label: 'Unread' },
                      { key: 'read', label: 'Read' },
                    ].map(f => (
                      <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                          filter === f.key
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Create Notification Button */}
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition text-sm font-medium flex items-center gap-2 shadow-sm"
                  >
                    <PlusCircle size={16} />
                    Create
                  </button>
                  {/* Mark All Read */}
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-medium flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      <CheckCheck size={16} />
                      Mark All Read
                    </button>
                  )}
                  {/* Delete All */}
                  {notifications.length > 0 && (
                    <button
                      onClick={deleteAllNotifications}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition text-sm font-medium flex items-center gap-2 border border-red-200 disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              {/* Notifications List */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-indigo-600 animate-spin mb-4"></div>
                  <p className="text-gray-500">Loading notifications...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <Card className="text-center py-16">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <BellOff size={28} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No Notifications</h3>
                    <p className="text-gray-500 text-sm max-w-sm">
                      {searchQuery
                        ? 'No notifications match your search. Try a different query.'
                        : filter === 'unread'
                          ? 'All notifications have been read!'
                          : filter === 'read'
                            ? 'No read notifications yet.'
                            : 'You don\'t have any notifications yet.'}
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map(notification => (
                    <Card
                      key={notification._id}
                      className={`p-4 transition hover:shadow-md border-l-4 ${
                        notification.isRead
                          ? 'border-l-transparent'
                          : 'border-l-indigo-500 bg-indigo-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`p-2 rounded-lg shrink-0 ${
                          notification.isRead ? 'bg-gray-100' : 'bg-white'
                        }`}>
                          {getNotificationIcon(notification)}
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className={`text-sm ${
                                notification.isRead ? 'font-medium text-gray-700' : 'font-bold text-gray-900'
                              }`}>
                                {notification.title || 'Notification'}
                              </h4>
                              <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                                {notification.message || 'No message content'}
                              </p>
                            </div>
                            <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                              <Clock size={12} className="inline mr-1" />
                              {formatDate(notification.createdAt)}
                            </span>
                          </div>
                          {/* Actions */}
                          <div className="flex items-center gap-3 mt-3">
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification._id)}
                                disabled={actionLoading}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 disabled:opacity-50"
                              >
                                <CheckCheck size={14} />
                                Mark Read
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification._id)}
                              disabled={actionLoading}
                              className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 disabled:opacity-50"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-sm text-gray-600 px-3">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Create Notification Modal ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Send size={20} className="text-indigo-600" />
                  Create Notification
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">Send a notification to users</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title *</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Order Status Update"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message *</label>
                <textarea
                  value={createForm.message}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Notification message content..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Send To</label>
                <select
                  value={createForm.recipientType}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, recipientType: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                >
                  <option value="all">All Users</option>
                  <option value="farmers">Farmers Only</option>
                  <option value="buyers">Buyers Only</option>
                  <option value="specific">Specific User</option>
                </select>
              </div>

              {createForm.recipientType === 'specific' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">User ID</label>
                  <input
                    type="text"
                    value={createForm.recipientId}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, recipientId: e.target.value }))}
                    placeholder="Enter user ID"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={createNotification}
                disabled={!createForm.title.trim() || !createForm.message.trim() || actionLoading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition text-sm font-medium flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <><RefreshCw size={16} className="animate-spin" /> Sending...</>
                ) : (
                  <><Send size={16} /> Send Notification</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Logout Confirmation ─── */}
      {showLogoutConfirm && (
        <LogoutConfirmationModal
          onConfirm={() => {
            setShowLogoutConfirm(false);
            logout();
          }}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </PageTransition>
  );
}