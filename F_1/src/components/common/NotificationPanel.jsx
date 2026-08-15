import { useState, _useEffect } from 'react';
import { X, Trash2, Check } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../context/AuthContext';

export default function NotificationPanel({ isOpen, onClose }) {
  const { notifications, markAsRead, deleteNotification, markAllAsRead } = useNotifications();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');

  if (!isOpen) return null;

  const getTabsForRole = () => {
    if (!user) return [];

    const baseTabsAll = [
      { id: 'all', label: 'All', icon: '📋' },
      { id: 'unread', label: 'Unread', icon: '🔔' },
    ];

    if (user.role === 'farmer') {
      return [
        ...baseTabsAll,
        { id: 'approvals', label: 'Approvals', icon: '✅' },
        { id: 'orders', label: 'Orders', icon: '📦' },
        { id: 'system', label: 'System', icon: '⚙️' },
      ];
    }

    if (user.role === 'buyer') {
      return [
        ...baseTabsAll,
        { id: 'orders', label: 'Orders', icon: '📦' },
        { id: 'system', label: 'System', icon: '⚙️' },
      ];
    }

    if (user.role === 'admin') {
      return [
        ...baseTabsAll,
        { id: 'approvals', label: 'Approvals', icon: '✅' },
        { id: 'orders', label: 'Orders', icon: '📦' },
        { id: 'system', label: 'System', icon: '⚙️' },
      ];
    }

    return baseTabsAll;
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;

    if (activeTab === 'unread') {
      filtered = filtered.filter(n => !n.isRead);
    } else if (activeTab === 'approvals') {
      filtered = filtered.filter(n => n.type === 'approval' || n.title.includes('Approved') || n.title.includes('Rejected') || n.title.includes('Resubmitted'));
    } else if (activeTab === 'orders') {
      filtered = filtered.filter(n => n.type === 'order' || n.title.includes('Order'));
    } else if (activeTab === 'system') {
      filtered = filtered.filter(n => n.type === 'system' || n.type === 'general' || n.title.includes('System'));
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const tabs = getTabsForRole();
  const filteredNotifications = getFilteredNotifications();

  const getNotificationColor = (notification) => {
    if (notification.title.includes('Approved')) return 'border-l-4 border-l-green-500 bg-green-50';
    if (notification.title.includes('Rejected')) return 'border-l-4 border-l-red-500 bg-red-50';
    if (notification.title.includes('Order')) return 'border-l-4 border-l-blue-500 bg-blue-50';
    if (notification.title.includes('Resubmitted')) return 'border-l-4 border-l-yellow-500 bg-yellow-50';
    return 'border-l-4 border-l-gray-300 bg-gray-50';
  };

  const getIcon = (notification) => {
    if (notification.title.includes('Approved')) return '✅';
    if (notification.title.includes('Rejected')) return '❌';
    if (notification.title.includes('Order')) return '📦';
    if (notification.title.includes('Resubmitted')) return '🔄';
    return '📧';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {}
      <div className="fixed top-16 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-in">
        {}
        <div className="bg-linear-to-r from-green-50 to-green-100 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white rounded-lg transition"
            aria-label="Close notifications"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {}
        <div className="flex gap-1 px-4 pt-4 border-b border-gray-200 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-3 py-2 text-sm font-medium rounded-t-lg transition ${
                activeTab === tab.id
                  ? 'bg-white border-b-2 border-green-600 text-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title={tab.label}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {}
        {filteredNotifications.some(n => !n.isRead) && (
          <div className="px-4 py-2 border-b border-gray-200 flex justify-end">
            <button
              onClick={() => markAllAsRead()}
              className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
            >
              <Check size={14} />
              Mark all as read
            </button>
          </div>
        )}

        {}
        <div className="max-h-96 overflow-y-auto">
          {filteredNotifications.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map(notification => (
                <div
                  key={notification._id}
                  className={`p-4 hover:bg-gray-50 transition ${getNotificationColor(notification)} ${!notification.isRead ? 'font-semibold' : ''}`}
                >
                  <div className="flex gap-3">
                    {}
                    <div className="text-xl shrink-0 mt-0.5">
                      {getIcon(notification)}
                    </div>

                    {}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1.5">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>

                    {}
                    <div className="flex items-center gap-2 shrink-0">
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification._id)}
                          className="p-1 hover:bg-white/50 rounded transition"
                          title="Mark as read"
                        >
                          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification._id)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-white/50 rounded transition"
                        title="Delete notification"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-sm">No notifications yet</p>
              <p className="text-gray-400 text-xs mt-1">Check back soon!</p>
            </div>
          )}
        </div>

        {}
        {filteredNotifications.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-center">
            <button
              onClick={() => {
                onClose();
                
              }}
              className="text-xs text-green-600 hover:text-green-700 font-medium"
            >
              View All Notifications →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
