import { Trash2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function ChatBubble({ message, onDelete, onCopy }) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const isOwn = message.senderId._id === user?._id;

  const handleCopy = () => {
    onCopy(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group`}>
      {/* Avatar for received messages */}
      {!isOwn && (
        <img
          src={message.senderId.profilePhoto || 'https://via.placeholder.com/40'}
          alt={message.senderId.firstName}
          className="w-8 h-8 rounded-full mr-2 flex-shrink-0 object-cover"
        />
      )}

      {/* Message bubble */}
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative group ${
          isOwn
            ? 'bg-green-500 text-white rounded-br-none'
            : 'bg-gray-200 text-gray-900 rounded-bl-none'
        }`}
      >
        <p className="text-sm break-words">{message.content}</p>

        {/* Message metadata */}
        <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
          isOwn ? 'text-green-100' : 'text-gray-600'
        }`}>
          <span>{formatTime(message.createdAt)}</span>
          {isOwn && message.isRead && (
            <span title="Seen">✓✓</span>
          )}
        </div>

        {/* Hover actions */}
        <div className="absolute -right-24 top-0 hidden group-hover:flex gap-1 bg-white rounded-lg shadow-md p-1 z-10">
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-gray-100 rounded transition"
            title="Copy message"
          >
            {copied ? (
              <Check size={16} className="text-green-600" />
            ) : (
              <Copy size={16} className="text-gray-600" />
            )}
          </button>
          {isOwn && (
            <button
              onClick={() => onDelete(message._id)}
              className="p-1.5 hover:bg-gray-100 rounded transition"
              title="Delete message"
            >
              <Trash2 size={16} className="text-red-600" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
