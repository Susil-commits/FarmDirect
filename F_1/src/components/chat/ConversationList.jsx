import { MessageCircle, Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { getImageUrl } from '../../utils/formatters';
import '../../styles/Messages.css';

const AVATAR_COLORS = [
  'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
  'bg-blue-500', 'bg-indigo-500', 'bg-purple-500',
  'bg-pink-500', 'bg-orange-500', 'bg-amber-500',
];

function getInitial(name) {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

function getColorClass(name) {
  if (!name) return 'bg-gray-400';
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ConversationList({
  conversations = [],
  currentChat,
  onSelectConversation,
  loading,
  className = '',
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    const query = searchQuery.toLowerCase();
    return conversations.filter((conv) => {
      const otherUser = conv?.otherUser || {};
      const name = `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.toLowerCase();
      const preview = conv?.lastMessage?.content?.toLowerCase() || '';
      return name.includes(query) || preview.includes(query);
    });
  }, [conversations, searchQuery]);

  return (
    <div className={`chat-sidebar ${className}`}>
      {/* Header */}
      <div className="chat-sidebar-header">
        <h2>Messages</h2>
        <div className="chat-search-wrapper">
          <Search size={18} />
          <input
            type="text"
            className="chat-search-input"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="conversation-list">
        {loading ? (
          <div className="conversation-empty">
            <div
              className="chat-spinner"
              style={{
                width: 32,
                height: 32,
                border: '3px solid #e5e7eb',
                borderTopColor: '#22c55e',
                borderRadius: '50%',
              }}
            />
            <p style={{ marginTop: '0.75rem' }}>Loading conversations...</p>
          </div>
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map((conversation, index) => {
            const otherUser = conversation?.otherUser || {};
            const displayName =
              [otherUser.firstName, otherUser.lastName].filter(Boolean).join(' ') ||
              'Unknown User';
            const hasPhoto = !!(
              otherUser.photo ||
              otherUser.profilePhoto ||
              otherUser.profilePicture
            );
            const key = conversation.conversationId || otherUser._id || index;

            return (
              <button
                key={key}
                onClick={() => otherUser._id && onSelectConversation(otherUser._id)}
                className={`conversation-item ${currentChat === otherUser._id ? 'active' : ''}`}
              >
                {/* Avatar */}
                <div className="conversation-avatar-wrapper">
                  {hasPhoto ? (
                    <img
                      src={getImageUrl(
                        otherUser.photo ||
                        otherUser.profilePhoto ||
                        otherUser.profilePicture
                      )}
                      alt={displayName}
                      className="conversation-avatar"
                    />
                  ) : (
                    <div
                      className={`conversation-avatar-fallback ${getColorClass(displayName)}`}
                    >
                      {getInitial(otherUser.firstName || otherUser.name)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="conversation-content">
                  <div className="conversation-top-row">
                    <span className="conversation-name">{displayName}</span>
                    {conversation.lastMessage?.createdAt && (
                      <span className="conversation-time">
                        {formatTime(conversation.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="conversation-preview-row">
                    <span className="conversation-preview">
                      {conversation.lastMessage?.content || 'No messages yet'}
                    </span>
                    {conversation.unreadCount > 0 && (
                      <span className="conversation-unread-badge">
                        {conversation.unreadCount > 99
                          ? '99+'
                          : conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="conversation-empty">
            <MessageCircle size={48} />
            <p>
              {searchQuery
                ? 'No conversations found'
                : 'No conversations yet.\nStart chatting with a farmer or buyer!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
