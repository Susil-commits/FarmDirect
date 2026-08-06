import {
  Send,
  Loader,
  AlertCircle,
  MoreVertical,
  Trash2,
  Shield,
  ArrowLeft,
  Leaf,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import ChatBubble from './ChatBubble';
import { useChat } from '../../context/ChatContext';
import { useToast } from '../../hooks/useToast';
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

function formatLastSeen(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'online';
  if (diffMin < 60) return `last seen ${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `last seen ${diffHrs}h ago`;
  return `last seen ${date.toLocaleDateString()}`;
}

export default function ChatPanel({
  receiverId,
  receiverData,
  cropContext,
  onBack,
  className = '',
}) {
  const {
    messages,
    loading,
    error,
    sendMessage,
    deleteMessage,
    markConversationAsRead,
    blockUser,
  } = useChat();

  const { addToast } = useToast();

  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark conversation as read when viewing
  useEffect(() => {
    if (receiverId) {
      markConversationAsRead(receiverId);
    }
  }, [receiverId, markConversationAsRead]);

  // Focus input when receiver changes
  useEffect(() => {
    if (receiverId) {
      inputRef.current?.focus();
    }
  }, [receiverId]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    try {
      setSending(true);
      await sendMessage(receiverId, messageInput.trim(), cropContext?.cropId || null);
      setMessageInput('');
      inputRef.current?.focus();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm('Delete this message?')) {
      try {
        await deleteMessage(messageId);
      } catch (err) {
        console.error('Failed to delete message:', err);
      }
    }
  };

  const handleBlockUser = async () => {
    setShowMenu(false);
    if (blocking) return;
    try {
      setBlocking(true);
      const blocked = await blockUser(receiverId);
      setIsBlocked(blocked);
      addToast(
        blocked ? 'User has been blocked' : 'User has been unblocked',
        blocked ? 'warning' : 'success'
      );
    } catch {
      addToast('Failed to update block status', 'error');
    } finally {
      setBlocking(false);
    }
  };

  const handleClearChat = async () => {
    setShowMenu(false);
    if (!window.confirm('Clear all messages in this conversation?')) return;
    try {
      const allMessageIds = messages.map(m => m._id).filter(Boolean);
      await Promise.all(allMessageIds.map(id => deleteMessage(id)));
      addToast('Chat cleared successfully', 'success');
    } catch {
      addToast('Failed to clear chat', 'error');
    }
  };
    const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Get display info from receiverData or fallback
  const displayName =
    receiverData?.name ||
    [receiverData?.firstName, receiverData?.lastName].filter(Boolean).join(' ') ||
    'User';
  const displayRole = receiverData?.role === 'farmer' ? 'Farmer' : 'Buyer';
  const displayRoleIcon = receiverData?.role === 'farmer' ? '🌾' : '👤';
  const photoUrl =
    receiverData?.photo ||
    receiverData?.profilePhoto ||
    receiverData?.profilePicture ||
    receiverData?.avatar ||
    null;

  // Empty state - no chat selected
  if (!receiverId) {
    return (
      <div className={`chat-panel-empty ${className}`}>
        <div className="chat-panel-empty-content">
          <div className="chat-panel-empty-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h3>Your Messages</h3>
          <p>Select a conversation from the left to start chatting with farmers and buyers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`chat-panel ${className}`}>
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-user">
          {/* Mobile back button */}
          {onBack && (
            <button onClick={onBack} className="chat-mobile-back">
              <ArrowLeft size={20} />
            </button>
          )}
          {/* Avatar */}
          {photoUrl ? (
            <img loading="lazy" src={getImageUrl(photoUrl)} alt={displayName} className="chat-header-avatar" />
          ) : (
            <div className={`chat-header-avatar-fallback ${getColorClass(displayName)}`}>
              {getInitial(receiverData?.firstName || receiverData?.name)}
            </div>
          )}
          {/* Info */}
          <div className="chat-header-info">
            <div className="chat-header-name">
              {displayName}
              <span className="chat-header-role">
                {displayRoleIcon} {displayRole}
              </span>
            </div>
            <div className="chat-header-subtitle">
              {receiverData?.lastSeen
                ? formatLastSeen(receiverData.lastSeen)
                : receiverData?.updatedAt
                ? formatLastSeen(receiverData.updatedAt)
                : ''}
            </div>
            {cropContext?.cropId && (
              <span className="chat-crop-context">
                <Leaf size={10} />
                Crop #{typeof cropContext.cropId === 'string' ? cropContext.cropId.slice(-6) : cropContext.cropId}
              </span>
            )}
          </div>
        </div>

        {/* Actions Menu */}
        <div className="chat-header-actions" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="chat-header-action-btn"
            title="More options"
          >
            <MoreVertical size={20} />
          </button>

          {showMenu && (
            <div className="chat-header-dropdown">
              <button
                onClick={handleBlockUser}
                disabled={blocking}
              >
                <Shield size={16} />
                {blocking ? 'Processing...' : isBlocked ? 'Unblock user' : 'Block user'}
              </button>
              <button
                onClick={handleClearChat}
                className="danger"
              >
                <Trash2 size={16} />
                Clear chat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className={`chat-messages ${loading && messages.length === 0 ? 'chat-messages-loading' : ''} ${!loading && messages.length === 0 ? 'chat-messages-empty' : ''}`}>
        {loading && messages.length === 0 ? (
          <Loader size={32} className="chat-spinner" />
        ) : error && messages.length === 0 ? (
          <div className="chat-error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        ) : messages.length > 0 ? (
          <>
            {messages.map((message, index) => (
              <ChatBubble
                key={message._id || `msg-${index}`}
                message={message}
                onDelete={handleDeleteMessage}
                onCopy={handleCopyMessage}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div>
            <p>No messages yet.</p>
            <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#9ca3af' }}>
              Send the first message to start the conversation!
            </p>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <form onSubmit={handleSendMessage} className="chat-input-form">
          <input
            ref={inputRef}
            type="text"
            className="chat-input-field"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={sending}
            autoComplete="off"
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={sending || !messageInput.trim()}
            title="Send message"
          >
            {sending ? (
              <Loader size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
