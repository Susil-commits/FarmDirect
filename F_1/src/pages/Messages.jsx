import { useEffect, useMemo } from 'react';
import { useRouter } from '../hooks/useRouter';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import ConversationList from '../components/chat/ConversationList';
import ChatPanel from '../components/chat/ChatPanel';
import PageTransition from '../components/common/PageTransition';
import DynamicFloatingNavbar from '../components/landing/DynamicFloatingNavbar';
import '../styles/Messages.css';

export default function Messages() {
  const { user } = useAuth();
  const { navigate, params } = useRouter();
  const { conversations, currentChat, loading, fetchConversations, setCurrentChat, fetchMessages } = useChat();

  const showPanel = !!currentChat;

  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    const receiverId = params?.receiver;
    if (receiverId && user) {
      setCurrentChat(receiverId);
    }
  }, [params?.receiver, user, setCurrentChat]);

  const { receiverData, cropContext } = useMemo(() => {
    if (!currentChat) return { receiverData: null, cropContext: null };

    const conversation = conversations.find(
      (conv) => conv.otherUser?._id === currentChat
    );
    if (conversation) {
      return {
        receiverData: conversation.otherUser,
        cropContext: conversation.cropContext || null,
      };
    }

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

  useEffect(() => {
    if (currentChat) {
      fetchMessages(currentChat);
    }
  }, [currentChat, fetchMessages]);

  const handleSelectConversation = (userId) => {
    setCurrentChat(userId);
  };

  const handleBackToList = () => {
    setCurrentChat(null);
  };

  if (!user) {
    return null;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#FBF8F3] text-[#132E20] font-sans-body">
        <DynamicFloatingNavbar activeSection="cream" onNavigate={navigate} />

        <div className="pt-28 pb-8 px-4 max-w-7xl mx-auto">
          <div className="messages-page bg-white/95 backdrop-blur-xl border border-stone-200 rounded-[32px] shadow-2xl overflow-hidden min-h-[75vh]">
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
        </div>
      </div>
    </PageTransition>
  );
}

