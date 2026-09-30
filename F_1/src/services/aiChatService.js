import api, { API_BASE_URL } from './api';
import { getAccessToken } from '../utils/tokenStore.js';

export async function sendAiChatMessageStream(
  message,
  context = {},
  conversationId = null,
  callbacks = {}
) {
  const { onToken, onToolCall, onDone, onError } = callbacks;
  const token = getAccessToken();

  // If user is unauthenticated, streaming endpoint requires auth, so fall back to non-stream guest endpoint
  if (!token) {
    try {
      const response = await sendAiChatMessage(message, context, conversationId);
      if (onToken && response?.reply) {
        onToken(response.reply);
      }
      if (onDone) onDone(response);
      return response;
    } catch (err) {
      if (onError) onError(err);
      throw err;
    }
  }

  const payload = {
    message,
    context,
    conversationId: conversationId || undefined,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson.message || `HTTP ${response.status}`);
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported by browser response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let finalPayload = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const jsonStr = trimmed.replace(/^data:\s*/, '');
        try {
          const event = JSON.parse(jsonStr);
          if (event.type === 'token' && event.content) {
            if (onToken) onToken(event.content);
          } else if (event.type === 'tool_call') {
            if (onToolCall) onToolCall(event);
          } else if (event.type === 'done' && event.response) {
            finalPayload = event.response;
            if (onDone) onDone(event.response);
          } else if (event.type === 'error') {
            if (onError) onError(new Error(event.message || 'Stream error'));
          }
        } catch {
          // ignore malformed chunks
        }
      }
    }

    return finalPayload;
  } catch (error) {
    console.warn('Streaming failed, falling back to standard chat:', error);
    const fallbackResponse = await sendAiChatMessage(message, context, conversationId);
    if (onToken && fallbackResponse?.reply) {
      onToken(fallbackResponse.reply);
    }
    if (onDone) onDone(fallbackResponse);
    return fallbackResponse;
  }
}

export async function sendAiChatMessage(message, context = {}, conversationId = null) {
  try {
    const hasAuthToken = Boolean(getAccessToken());
    const endpoint = hasAuthToken ? '/ai/chat' : '/ai/try';
    const payloadMessage = hasAuthToken ? message : message.slice(0, 250);

    const payload = {
      message: payloadMessage,
      context,
    };

    if (hasAuthToken && conversationId) {
      payload.conversationId = conversationId;
    }

    const response = await api.post(
      endpoint,
      payload,
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

export async function getUserConversations() {
  try {
    const response = await api.get('/ai/conversations');
    const payload = response?.data ?? response;
    return payload?.conversations || [];
  } catch (error) {
    console.warn('Failed to fetch conversations:', error);
    return [];
  }
}

export async function getConversationById(id) {
  try {
    const response = await api.get(`/ai/conversations/${encodeURIComponent(id)}`);
    const payload = response?.data ?? response;
    return payload?.conversation || null;
  } catch (error) {
    console.warn('Failed to fetch conversation details:', error);
    return null;
  }
}

export async function deleteConversation(id) {
  try {
    const response = await api.delete(`/ai/conversations/${encodeURIComponent(id)}`);
    const payload = response?.data ?? response;
    return payload?.success ?? true;
  } catch (error) {
    console.warn('Failed to delete conversation:', error);
    return false;
  }
}

export async function getListingDraft(payload) {
  try {
    const response = await api.post('/ai/listing-draft', payload);
    const data = response?.data ?? response;
    return data?.data || data?.draft || data;
  } catch (error) {
    console.warn('Listing draft generation error:', error);
    throw error;
  }
}

export async function getPriceGuidance(cropName, region = '', days = 30, isOrganic = false) {
  try {
    const response = await api.get('/ai/price-guidance', {
      params: { cropName, region: region || undefined, days, isOrganic: isOrganic ? 'true' : undefined },
    });
    const data = response?.data ?? response;
    return data?.data || data;
  } catch (error) {
    console.warn('Price guidance fetch error:', error);
    return { sufficientData: false, status: 'insufficient_data' };
  }
}


