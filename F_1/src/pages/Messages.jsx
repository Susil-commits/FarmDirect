import { useEffect, useState, useCallback } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { userService } from '../services/appService';
import ConversationList from '../components/chat/ConversationList';
import ChatPanel from '../components/chat/ChatPanel';
import PageTransition from '../components/common/PageTransition';

export default function Messages() {
  const { user } = useAuth();
  const { navigate, params } = useRouter();
  const { conversations, currentChat, loading, fetchConversations, setCurrentChat, fetchMessages } = useChat();
  const [receiverData, setReceiverData] = useState(null);
  const [cropContext, setCropContext] = useState(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
    }
  }, [user, navigate]);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Handle external navigation from CropDetail "Chat with Farmer" button
  const initExternalChat = useCallback(async (receiverId, cropId, farmerName) => {
    if (!receiverId || !user) return;

    try {
      // Try fetching farmer profile for accurate receiver data
      const farmerRes = await userService.getFarmerProfile(receiverId);
      const farmerData = farmerRes.data?.data || farmerRes.data || farmerRes;
      const receiverInfo = {
        _id: receiverId,
        name: farmerName || farmerData?.name || `${farmerData?.firstName || ''} ${farmerData?.lastName || ''}`.trim() || 'Farmer',
        role: 'farmer',
        profilePicture: farmerData?.profilePicture || null,
      };

      setReceiverData(receiverInfo);
      if (cropId) {
        setCropContext({ cropId, cropName: null });
      }
      setCurrentChat(receiverId);
    } catch {
      // Fallback: use name from URL params
      setReceiverData({ _id: receiverId, name: farmerName || 'Farmer', role: 'farmer' });
      if (cropId) {
        setCropContext({ cropId, cropName: null });
      }
      setCurrentChat(receiverId);
    }
  }, [user, setCurrentChat]);

  // Handle external chat init from URL params
  useEffect(() => {
    const receiverId = params?.receiver;
    const cropId = params?.crop;
    const farmerName = params?.name;

    if (receiverId && user) {
      initExternalChat(receiverId, cropId, farmerName);
    }
  }, [params?.receiver, params?.crop, params?.name, user, initExternalChat]);

  // Load receiver data when chat changes (from conversation list selection)
  useEffect(() => {
    if (currentChat) {
      const conversation = conversations.find(
        (conv) => conv.otherUser._id === currentChat
      );
      if (conversation) {
        setReceiverData(conversation.otherUser);
        setCropContext(conversation.cropContext || null);
        fetchMessages(currentChat);
      }
    }
  }, [currentChat, conversations, fetchMessages]);

  if (!user) {
    return null;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="h-[calc(100vh-4rem)] flex">
          {/* Sidebar - Conversations List */}
          <div className="w-full md:w-80 border-r border-gray-200 overflow-hidden">
            <ConversationList
              conversations={conversations}
              currentChat={currentChat}
              onSelectConversation={setCurrentChat}
              loading={loading}
            />
          </div>

          {/* Main Chat Area - Hidden on mobile when no chat selected */}
          <div className={`flex-1 ${!currentChat ? 'hidden md:flex' : 'flex'}`}>
            <ChatPanel receiverId={currentChat} receiverData={receiverData} cropContext={cropContext} />
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
