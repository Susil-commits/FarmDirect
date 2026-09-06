import api from './api';

export async function sendAiChatMessage(message, context = {}) {
  try {
    const response = await api.post(
      '/ai/chat',
      {
        message,
        context,
      },
      {
        timeout: 45_000,
      }
    );
    // api interceptor in api.js already returns response.data
    return response?.data ?? response;
  } catch (error) {
    console.error('Error contacting AgriBot AI:', error?.message || error);
    
    let messageText = 'I am currently having trouble reaching the AI server. Please try again in a few moments.';
    if (error?.code === 'REQUEST_TIMEOUT' || error?.status === 408) {
      messageText = 'The response took longer than expected. Please ask your question again!';
    } else if (error?.response?.data?.message) {
      messageText = error.response.data.message;
    } else if (error?.message && !error.message.includes('status code')) {
      messageText = error.message;
    }

    return {
      success: false,
      reply: messageText,
      topic: 'platform',
      suggestions: [
        'How to list my crops on FaRm?',
        'How does price negotiation work?',
        'Organic pest control tips',
      ],
      actionLinks: [
        { label: 'Browse Marketplace', url: '/marketplace', icon: 'ShoppingBag' },
      ],
    };
  }
}

export async function getAiStarterSuggestions(role = 'guest') {
  try {
    const response = await api.get(`/ai/suggestions?role=${encodeURIComponent(role)}`);
    const payload = response?.data ?? response;
    return payload?.suggestions || [];
  } catch (error) {
    console.warn('Failed to fetch AI starter prompts:', error);
    return [
      { label: 'How FaRm Works', query: 'How does FaRm eliminate middlemen for farmers and buyers?', icon: 'Sprout', category: 'Platform' },
      { label: 'List New Crops', query: 'How do I list my crops on FaRm?', icon: 'PlusCircle', category: 'Selling' },
      { label: 'Organic Farming', query: 'What are the best organic fertilizers for vegetables?', icon: 'Leaf', category: 'Farming' },
      { label: 'Price Negotiation', query: 'How do direct price negotiations work on FaRm?', icon: 'Handshake', category: 'Deals' },
    ];
  }
}
