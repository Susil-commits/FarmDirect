import { Trash2, Copy, Check, CheckCheck } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Messages.css';

export default function ChatBubble({ message, onDelete, onCopy }) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  // Guard against malformed messages
  if (!message || !message.senderId) {
    return null;
  }

  const senderId =
    typeof message.senderId === 'object' ? message.senderId._id : message.senderId;
  const senderName = message.senderId?.firstName || 'User';
  const senderPhoto =
    message.senderId?.photo ||
    message.senderId?.profilePhoto ||
    message.senderId?.profilePicture ||
    null;
  const isOwn = String(senderId) === String(user?._id);

  const handleCopy = () => {
    if (message.content) {
      onCopy(message.content);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Generate initials-based avatar for fallback instead of external placeholder
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (parts[0][0] || '?').toUpperCase();
  };

  return (
    <div className={`message-wrapper ${isOwn ? 'sent' : 'received'}`}>
      {/* Sender avatar for received messages */}
      {!isOwn && (
        senderPhoto ? (
          <img
            src={senderPhoto}
            alt={senderName}
            className="message-sender-avatar"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div
            className="message-sender-avatar message-sender-avatar-fallback"
            aria-label={senderName}
          >
            {getInitials(senderName)}
          </div>
        )
      )}

      {/* Bubble */}
      <div className="message-bubble">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <span className="message-text">{message.content || ''}</span>
          <span className="message-meta">
            <span className="message-time">{formatTime(message.createdAt)}</span>
            {isOwn && (
              <span className="message-read-receipt">
                {message.isRead ? <CheckCheck size={14} /> : <Check size={14} />}
              </span>
            )}
          </span>
        </div>

        {/* Hover actions */}
        <div className="message-actions">
          <button
            onClick={handleCopy}
            className="message-action-btn"
            title={copied ? 'Copied!' : 'Copy message'}
          >
            {copied ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
          </button>
          {isOwn && (
            <button
              onClick={() => message._id && onDelete(message._id)}
              className="message-action-btn delete"
              title="Delete message"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
