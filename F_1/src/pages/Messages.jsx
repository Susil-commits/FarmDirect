import { useEffect, useMemo } from 'react';
import { useRouter } from '../hooks/useRouter';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import ConversationList from '../components/chat/ConversationList';
import ChatPanel from '../components/chat/ChatPanel';
import PageTransition from '../components/common/PageTransition';
import '../styles/Messages.css';

export default function Messages() {
  const { user } = useAuth();
  const { navigate, params } = useRouter();
  const { conversations, currentChat, loading, fetchConversations, setCurrentChat, fetchMessages } = useChat();

  // derived: show chat panel only when a conversation is active
  const showPanel = !!currentChat;

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

  // Handle external navigation from URL params (e.g., "Chat with Farmer" button)
  useEffect(() => {
    const receiverId = params?.receiver;
    if (receiverId && user) {
      setCurrentChat(receiverId);
    }
  }, [params?.receiver, user, setCurrentChat]);

  // Derive receiverData and cropContext from currentChat + conversations (or URL params as fallback)
  const { receiverData, cropContext } = useMemo(() => {
    if (!currentChat) return { receiverData: null, cropContext: null };

    // Try to find from loaded conversations first
    const conversation = conversations.find(
      (conv) => conv.otherUser?._id === currentChat
    );
    if (conversation) {
      return {
        receiverData: conversation.otherUser,
        cropContext: conversation.cropContext || null,
      };
    }

    // Fallback: build from URL params (for externally-initiated chats before conversations load)
    if (params?.receiver === currentChat) {
      return {
        receiverData: {
          _id: currentChat,
          name: params?.name || 'User',
          role: 'farmer',
        },
        cropContext: params?.crop ? { cropId: params.crop, cropName: null } : null,
      };
    }

    return { receiverData: { _id: currentChat, name: 'User', role: 'farmer' }, cropContext: null };
  }, [currentChat, conversations, params]);

  // Fetch messages when chat changes
  useEffect(() => {
    if (currentChat) {
      fetchMessages(currentChat);
    }
  }, [currentChat, fetchMessages]);

  // Handle conversation selection from sidebar
  const handleSelectConversation = (userId) => {
    setCurrentChat(userId);
  };

  // Handle back button on mobile — clear current chat to go back to list
  const handleBackToList = () => {
    setCurrentChat(null);
  };

  if (!user) {
    return null;
  }

  return (
    <PageTransition>
      <div className="messages-page">
        {/* Sidebar - Conversations List */}
        <div className={`chat-sidebar ${showPanel ? 'hidden-on-mobile' : ''}`}>
          <ConversationList
            conversations={conversations}
            currentChat={currentChat}
            onSelectConversation={handleSelectConversation}
            loading={loading}
          />
        </div>

        {/* Main Chat Panel */}
        <div className={`chat-panel-wrapper ${!showPanel ? 'hidden-on-mobile' : ''}`}>
          <ChatPanel
            receiverId={currentChat}
            receiverData={receiverData}
            cropContext={cropContext}
            onBack={handleBackToList}
          />
        </div>
      </div>
    </PageTransition>
  );
}
