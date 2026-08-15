import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MessageSquare, Search, Filter, ChevronRight, Trash2, Clock, 
  User, Mail, Download, Archive, Flag, Send
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import PageTransition from '../../components/common/PageTransition';
import ScrollAnimation from '../../components/common/ScrollAnimation';
import messageService from '../../services/messageService.js';

export default function AdminMessages() {
  
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalConversations: 0,
    unreadMessages: 0,
    activeUsers: 0,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    userRole: 'all', 
    status: 'all', 
    sortBy: 'recent', 
  });

  const [viewMode, setViewMode] = useState('list'); 
  const [replyText, setReplyText] = useState('');
  
  const [showMoreOptions, setShowMoreOptions] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const calculateStats = useCallback((convs) => {
    const totalConversations = convs.length;
    const unreadMessages = convs.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
    const activeUsers = new Set(convs.map(conv => conv.otherUser?._id)).size;

    setStats({
      totalConversations,
      unreadMessages,
      activeUsers,
    });
  }, []);

  const fetchAllConversations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      
      const response = await messageService.getConversations();
      
      if (response.data) {
        setConversations(response.data || []);
        calculateStats(response.data);
      }
    } catch (err) {
      console.error(err);
      
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [calculateStats]);

  const applyFilters = useCallback(() => {
    let filtered = conversations;

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(conv => {
        const userName = `${conv.otherUser?.firstName || ''} ${conv.otherUser?.lastName || ''}`.toLowerCase();
        const userEmail = conv.otherUser?.email?.toLowerCase() || '';
        const lastMessageContent = conv.lastMessage?.content?.toLowerCase() || '';
        
        return userName.includes(search) || 
               userEmail.includes(search) || 
               lastMessageContent.includes(search);
      });
    }

    if (filters.userRole !== 'all') {
      filtered = filtered.filter(conv => 
        conv.otherUser?.role?.toLowerCase() === filters.userRole.toLowerCase()
      );
    }

    if (filters.status === 'unread') {
      filtered = filtered.filter(conv => (conv.unreadCount || 0) > 0);
    }

    if (filters.sortBy === 'recent') {
      filtered.sort((a, b) => 
        new Date(b.lastMessage?.createdAt) - new Date(a.lastMessage?.createdAt)
      );
    } else if (filters.sortBy === 'oldest') {
      filtered.sort((a, b) => 
        new Date(a.lastMessage?.createdAt) - new Date(b.lastMessage?.createdAt)
      );
    } else if (filters.sortBy === 'unread') {
      filtered.sort((a, b) => (b.unreadCount || 0) - (a.unreadCount || 0));
    }

    setFilteredConversations(filtered);
  }, [conversations, searchTerm, filters]);

  useEffect(() => {
    
    fetchAllConversations();
  }, [fetchAllConversations]);

  useEffect(() => {
    
    applyFilters();
  }, [applyFilters]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const fetchMessages = async (conversation) => {
    setMessagesLoading(true);
    try {
      setSelectedConversation(conversation);
      setViewMode('detail');
      
      const response = await messageService.getConversation(conversation.otherUser._id, 1, 100);
      
      if (response.data) {
        setMessages(response.data);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedConversation) return;

    try {
      const response = await messageService.sendMessage(
        selectedConversation.otherUser._id,
        replyText.trim()
      );

      if (response.data) {
        setMessages([...messages, response.data]);
        setReplyText('');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const msgDate = new Date(date);
    const diffMs = now - msgDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return msgDate.toLocaleDateString('en-IN');
  };

  const getRoleBadgeClasses = (role) => {
    const r = (role || '').toLowerCase();
    if (r === 'farmer') return { badge: 'bg-green-500', text: 'text-green-600', chip: 'bg-green-100' };
    if (r === 'buyer') return { badge: 'bg-blue-500', text: 'text-blue-600', chip: 'bg-blue-100' };
    return { badge: 'bg-gray-500', text: 'text-gray-600', chip: 'bg-gray-100' };
  };

  if (viewMode === 'list') {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pt-28 pb-12">
          {}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white py-8 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                    <MessageSquare size={40} />
                    Messages Hub
                  </h1>
                  <p className="text-emerald-100">Monitor and manage all user conversations</p>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 py-8">
            {}
            <ScrollAnimation className="scroll-slide">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                <Card hover className="bg-gradient-to-br from-blue-50 to-white p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 font-semibold">Total Conversations</p>
                      <p className="text-4xl font-bold text-blue-600 mt-2">{stats.totalConversations}</p>
                    </div>
                    <MessageSquare size={40} className="text-blue-200" />
                  </div>
                </Card>

                <Card hover className="bg-gradient-to-br from-red-50 to-white p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 font-semibold">Unread Messages</p>
                      <p className="text-4xl font-bold text-red-600 mt-2">{stats.unreadMessages}</p>
                    </div>
                    <Flag size={40} className="text-red-200" />
                  </div>
                </Card>

                <Card hover className="bg-gradient-to-br from-purple-50 to-white p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 font-semibold">Active Users</p>
                      <p className="text-4xl font-bold text-purple-600 mt-2">{stats.activeUsers}</p>
                    </div>
                    <User size={40} className="text-purple-200" />
                  </div>
                </Card>
              </div>
            </ScrollAnimation>

            {}
            <Card className="p-6 mb-6 bg-white border-l-4 border-emerald-500">
              <div className="space-y-4">
                {}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search size={20} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or message content..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                </div>

                {}
                <div className="flex flex-wrap gap-3">
                  {}
                  <select
                    value={filters.userRole}
                    onChange={(e) => setFilters({ ...filters, userRole: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="all">All Roles</option>
                    <option value="farmer">Farmers</option>
                    <option value="buyer">Buyers</option>
                  </select>

                  {}
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="unread">Unread Only</option>
                  </select>

                  {}
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="recent">Recent First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="unread">Unread First</option>
                  </select>
                </div>
              </div>
            </Card>

            {}
            {error && (
              <Card className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <p className="text-red-700 flex items-center gap-2">
                  <Flag size={20} />
                  {error}
                </p>
              </Card>
            )}

            {}
            <div className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <Card className="p-12 text-center bg-white">
                  <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">No conversations found</p>
                  <p className="text-gray-400 text-sm mt-2">
                    {searchTerm || filters.userRole !== 'all' ? 'Try adjusting your filters' : 'Messages will appear here'}
                  </p>
                </Card>
              ) : (
                filteredConversations.map((conversation) => (
                  <Card
                    key={conversation.conversationId}
                    hover
                    className="p-4 bg-white border-l-4 border-gray-200 hover:border-emerald-500 cursor-pointer transition-all"
                    onClick={() => fetchMessages(conversation)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 flex gap-4">
                        {}
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {conversation.otherUser?.firstName?.[0]?.toUpperCase()}
                        </div>

                        {}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-gray-900">
                              {conversation.otherUser?.firstName} {conversation.otherUser?.lastName}
                            </h3>
                            {conversation.unreadCount > 0 && (
                              <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                {conversation.unreadCount} New
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <Mail size={16} className="text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-600 truncate">{conversation.otherUser?.email}</span>
                            
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold text-white ${getRoleBadgeClasses(conversation.otherUser?.role).badge} ml-auto flex-shrink-0`}>
                              {conversation.otherUser?.role || 'User'}
                            </span>
                          </div>

                          <p className="text-sm text-gray-600 truncate">
                            {conversation.lastMessage?.content || 'No messages yet'}
                          </p>
                        </div>
                      </div>

                      {}
                      <div className="flex flex-col items-end gap-2 ml-4 flex-shrink-0">
                        <span className="text-xs text-gray-500 flex items-center gap-1 whitespace-nowrap">
                          <Clock size={14} />
                          {formatTime(conversation.lastMessage?.createdAt)}
                        </span>
                        <ChevronRight size={20} className="text-gray-300" />
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (viewMode === 'detail' && selectedConversation) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pt-28 pb-12">
          {}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white py-6 px-4 sticky top-0 z-40 shadow-lg">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setViewMode('list');
                    setSelectedConversation(null);
                    setMessages([]);
                  }}
                  className="p-2 hover:bg-emerald-500 rounded-lg transition-colors"
                >
                  <ChevronRight size={24} style={{ transform: 'rotate(180deg)' }} />
                </button>
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedConversation.otherUser?.firstName} {selectedConversation.otherUser?.lastName}
                  </h2>
                  <p className="text-emerald-100 text-sm flex items-center gap-2">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold bg-white ${getRoleBadgeClasses(selectedConversation.otherUser?.role).text}`}>
                      {selectedConversation.otherUser?.role}
                    </span>
                  </p>
                </div>
              </div>

              {}
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-emerald-500 rounded-lg transition-colors" title="Download Conversation">
                  <Download size={20} />
                </button>
                <button className="p-2 hover:bg-emerald-500 rounded-lg transition-colors" title="Archive">
                  <Archive size={20} />
                </button>
                <button className="p-2 hover:bg-red-500 rounded-lg transition-colors" title="Delete">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 py-6">
            {}
            <Card className="p-6 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Name</p>
                  <p className="text-gray-900 font-bold">
                    {selectedConversation.otherUser?.firstName} {selectedConversation.otherUser?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Email</p>
                  <p className="text-gray-900 font-mono text-sm">{selectedConversation.otherUser?.email}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Role</p>
                  <p className={`text-gray-900 font-bold capitalize ${getRoleBadgeClasses(selectedConversation.otherUser?.role).chip} px-3 py-1 rounded w-fit`}>
                    {selectedConversation.otherUser?.role}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Messages</p>
                  <p className="text-gray-900 font-bold">{messages.length}</p>
                </div>
              </div>
            </Card>

            {}
            <Card className="p-6 bg-white mb-6 h-96 overflow-y-auto">
              {messagesLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex justify-center items-center h-full text-gray-500">
                  <p>No messages in this conversation</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, idx) => {
                    const isOutgoing = message.senderId?._id === selectedConversation.otherUser?._id;
                    return (
                      <div key={idx} className={`flex ${isOutgoing ? 'justify-start' : 'justify-end'}`}>
                        <div
                          className={`max-w-xs px-4 py-3 rounded-lg ${
                            isOutgoing
                              ? 'bg-gray-200 text-gray-900'
                              : 'bg-emerald-500 text-white'
                          }`}
                        >
                          <p className="text-sm font-semibold mb-1">
                            {isOutgoing ? selectedConversation.otherUser?.firstName : 'Admin'}
                          </p>
                          <p className="text-sm break-words">{message.content}</p>
                          <p className={`text-xs mt-2 ${isOutgoing ? 'text-gray-600' : 'text-emerald-100'}`}>
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </Card>

            {}
            <Card className="p-6 bg-white">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim()}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Send size={18} />
                  Send
                </button>
              </div>
            </Card>
          </div>
        </div>
      </PageTransition>
    );
  }

  return null;
}
