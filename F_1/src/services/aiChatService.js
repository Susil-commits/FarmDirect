import api from './api';

export async function sendAiChatMessage(message, context = {}) {
  try {
    const response = await api.post('/ai/chat', {
      message,
      context,
    });
    return response.data;
  } catch (error) {
    console.error('Error contacting AgriBot AI:', error);
    
    const messageText =
      error?.response?.data?.message ||
      'I am currently having trouble reaching the AI server. Please try again in a few moments.';
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
    return response.data?.suggestions || [];
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
