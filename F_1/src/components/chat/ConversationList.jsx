import { MessageCircle, Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import Avatar from '../common/Avatar';

export default function ConversationList({
  conversations,
  currentChat,
  onSelectConversation,
  loading,
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    return conversations.filter((conv) => {
      const name = `${conv.otherUser.firstName} ${conv.otherUser.lastName}`.toLowerCase();
      const lastMessage = conv.lastMessage?.content?.toLowerCase() || '';
      return name.includes(searchQuery.toLowerCase()) ||
        lastMessage.includes(searchQuery.toLowerCase());
    });
  }, [conversations, searchQuery]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Messages</h2>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => (
            <button
              key={conversation.conversationId}
              onClick={() =>
                onSelectConversation(conversation.otherUser._id)
              }
              className={`w-full p-4 flex gap-3 items-start border-b border-gray-100 hover:bg-gray-50 transition text-left ${
                currentChat === conversation.otherUser._id ? 'bg-green-50' : ''
              }`}
            >
              {/* Avatar */}
              <div className="flex-shrink-0 mt-1">
                <Avatar user={conversation.otherUser} size="md" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {conversation.otherUser.firstName}{' '}
                    {conversation.otherUser.lastName}
                  </h3>
                  {conversation.lastMessage && (
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {new Date(
                        conversation.lastMessage.createdAt
                      ).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                </div>

                {/* Last message preview */}
                <p className="text-sm text-gray-600 truncate">
                  {conversation.lastMessage?.content || 'No messages yet'}
                </p>

                {/* Unread count */}
                {conversation.unreadCount > 0 && (
                  <div className="mt-1">
                    <span className="inline-block bg-green-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                      {conversation.unreadCount}
                    </span>
                  </div>
                )}
              </div>
            </button>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8">
            <MessageCircle size={48} className="mb-4 text-gray-300" />
            <p className="text-center">
              {searchQuery
                ? 'No conversations found'
                : 'No conversations yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
