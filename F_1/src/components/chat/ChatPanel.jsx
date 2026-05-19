import { Send, Loader, AlertCircle, Shield, MoreVertical, Trash2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import ChatBubble from './ChatBubble';
import Avatar from '../common/Avatar';
import { useChat } from '../../context/ChatContext';

export default function ChatPanel({ receiverId, receiverData, cropContext }) {
  const {
    messages,
    loading,
    error,
    sendMessage,
    deleteMessage,
    markConversationAsRead,
  } = useChat();

  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark conversation as read
  useEffect(() => {
    if (receiverId) {
      markConversationAsRead(receiverId);
    }
  }, [receiverId, markConversationAsRead]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageInput.trim()) return;

    try {
      setSending(true);
      await sendMessage(receiverId, messageInput.trim(), cropContext?.cropId || null);
      setMessageInput('');
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

  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content);
  };

  if (!receiverId) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 text-gray-500">
        <div className="text-center">
          <p className="text-lg mb-2">Select a conversation to start chatting</p>
          <p className="text-sm">Or find a farmer/buyer to begin a new conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {receiverData && <Avatar user={receiverData} size="md" />}
          <div>
            <h3 className="font-semibold text-gray-900">
              {receiverData?.name || `${receiverData?.firstName || ''} ${receiverData?.lastName || ''}`.trim() || 'User'}
            </h3>
            <p className="text-xs text-gray-600">
              {receiverData?.role === 'farmer' ? '🌾 Farmer' : '👤 Buyer'}
            </p>
            {cropContext?.cropId && (
              <p className="text-xs text-green-700 font-medium mt-0.5">
                🌱 About Crop #{typeof cropContext.cropId === 'string' ? cropContext.cropId.slice(-6) : cropContext.cropId}
              </p>
            )}
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-green-200 rounded-lg transition"
          >
            <MoreVertical size={20} className="text-gray-600" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <button
                onClick={() => {
                  alert('Block feature coming soon');
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
              >
                <Shield size={16} />
                <span>Block user</span>
              </button>
              <button
                onClick={() => {
                  alert('Clear chat feature coming soon');
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-red-600"
              >
                <Trash2 size={16} />
                <span>Clear chat</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader size={32} className="animate-spin text-green-600" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        ) : messages.length > 0 ? (
          <>
            {messages.map((message) => (
              <ChatBubble
                key={message._id}
                message={message}
                onDelete={handleDeleteMessage}
                onCopy={handleCopyMessage}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-gray-200 bg-gray-50"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={sending || !messageInput.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition flex items-center gap-2"
          >
            {sending ? (
              <Loader size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
