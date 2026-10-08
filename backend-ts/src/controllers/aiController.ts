import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendError } from '../utils/apiResponse.js';
import { aiService, type StreamEvent } from '../services/aiService.js';
import AiConversation from '../models/AiConversation.js';
import { listingDraftRequestSchema, priceGuidanceQuerySchema, priceForecastQuerySchema } from '../schemas/aiSchemas.js';
import { getPriceGuidance } from '../services/priceSnapshotService.js';
import { getPriceForecast } from '../services/priceForecastService.js';
import logger from '../utils/logger.js';

export const handleAiChat = asyncHandler(async (req: Request, res: Response) => {
  const { message, context, conversationId } = req.body as {
    message?: string;
    conversationId?: string;
    context?: {
      role?: 'farmer' | 'buyer' | 'admin' | 'guest';
      currentPath?: string;
      cropName?: string;
    };
  };

  if (!message || typeof message !== 'string' || !message.trim()) {
    return sendError(res, 'Please provide a valid question or message.', 400);
  }

  if (message.trim().length > 1200) {
    return sendError(res, 'Message is too long. Please limit your question to 1200 characters.', 400);
  }

  const authenticatedRole = (req.user?.role as 'farmer' | 'buyer' | 'admin') || context?.role;

  const result = await aiService.processMessage({
    message: message.trim(),
    conversationId,
    userId: req.user?._id,
    context: {
      ...context,
      role: authenticatedRole,
    },
  });

  return res.status(200).json(result);
});

export const handleAiChatStream = asyncHandler(async (req: Request, res: Response) => {
  const { message, context, conversationId } = req.body as {
    message?: string;
    conversationId?: string;
    context?: {
      role?: 'farmer' | 'buyer' | 'admin' | 'guest';
      currentPath?: string;
      cropName?: string;
    };
  };

  if (!message || typeof message !== 'string' || !message.trim()) {
    return sendError(res, 'Please provide a valid question or message.', 400);
  }

  if (message.trim().length > 1200) {
    return sendError(res, 'Message is too long. Please limit your question to 1200 characters.', 400);
  }

  const authenticatedRole = (req.user?.role as 'farmer' | 'buyer' | 'admin') || context?.role;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  let isClosed = false;
  req.on('close', () => {
    isClosed = true;
  });

  const sendEvent = (event: StreamEvent) => {
    if (isClosed || res.writableEnded) return;
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  try {
    await aiService.processMessageStream(
      {
        message: message.trim(),
        conversationId,
        userId: req.user?._id,
        context: {
          ...context,
          role: authenticatedRole,
        },
      },
      sendEvent
    );
  } catch (err: any) {
    logger.error({ err: err?.message || err }, 'Error in handleAiChatStream');
    sendEvent({
      type: 'error',
      message: 'An error occurred while streaming response.',
    });
  } finally {
    if (!res.writableEnded) {
      res.end();
    }
  }
});

export const handleGuestAiChat = asyncHandler(async (req: Request, res: Response) => {
  const { message, context } = req.body as {
    message?: string;
    context?: {
      currentPath?: string;
      cropName?: string;
    };
  };

  if (!message || typeof message !== 'string' || !message.trim()) {
    return sendError(res, 'Please provide a valid question or message.', 400);
  }

  if (message.trim().length > 250) {
    return sendError(res, 'Guest message preview is limited to 250 characters. Please sign in for full chat.', 400);
  }

  const result = await aiService.processMessage({
    message: message.trim(),
    context: {
      ...context,
      role: 'guest',
    },
  });

  return res.status(200).json({
    ...result,
    isDemo: true,
  });
});

export const getPromptSuggestions = asyncHandler(async (req: Request, res: Response) => {
  const role = (req.query.role as string) || 'guest';

  let starterPrompts: Array<{ label: string; query: string; icon: string; category: string }>;

  if (role === 'farmer') {
    starterPrompts = [
      { label: 'List Crop Guide', query: 'How do I create and publish a crop listing?', icon: 'PlusCircle', category: 'Platform' },
      { label: 'Organic Pest Control', query: 'What are organic pest management tips for vegetables?', icon: 'Sprout', category: 'Farming' },
      { label: 'Price Negotiations', query: 'How do buyer price negotiations work on FaRm?', icon: 'Handshake', category: 'Marketplace' },
      { label: 'KYC Document Steps', query: 'What documents are required for farmer KYC verification?', icon: 'ShieldCheck', category: 'Account' },
    ];
  } else if (role === 'buyer') {
    starterPrompts = [
      { label: 'Negotiate Prices', query: 'How can I negotiate crop prices with farmers directly?', icon: 'Handshake', category: 'Deals' },
      { label: 'Payment & Safety', query: 'How does payment protection work on FaRm?', icon: 'ShieldCheck', category: 'Payment' },
      { label: 'Track Fresh Produce', query: 'How can I track my farm-to-door delivery order?', icon: 'Package', category: 'Orders' },
      { label: 'Organic Quality', query: 'How can I verify if listed crops are genuinely organic?', icon: 'CheckCircle', category: 'Produce' },
    ];
  } else {
    starterPrompts = [
      { label: 'How FaRm Works', query: 'How does the FaRm direct marketplace eliminate middlemen?', icon: 'Sprout', category: 'About' },
      { label: 'Buy from Farmers', query: 'How do I purchase fresh crops directly from farmers?', icon: 'ShoppingBag', category: 'Buying' },
      { label: 'Start Selling Crops', query: 'How do farmers register and sell crops on FaRm?', icon: 'PlusCircle', category: 'Selling' },
      { label: 'Organic Farming Tips', query: 'What are the best organic fertilizers for high yield?', icon: 'Leaf', category: 'Farming' },
    ];
  }

  return res.status(200).json({
    success: true,
    role,
    suggestions: starterPrompts,
  });
});

export const getUserConversations = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) {
    return sendError(res, 'Authentication required', 401);
  }

  const conversations = await AiConversation.find({ userId })
    .select('_id title messages updatedAt createdAt')
    .slice('messages', -1)
    .sort({ updatedAt: -1 })
    .limit(30)
    .lean();

  return res.status(200).json({
    success: true,
    conversations: conversations.map((conv) => ({
      _id: conv._id,
      title: conv.title,
      lastMessage: conv.messages?.[0]?.content || '',
      updatedAt: conv.updatedAt,
      createdAt: conv.createdAt,
    })),
  });
});

export const getConversationById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { id } = req.params;

  if (!userId) {
    return sendError(res, 'Authentication required', 401);
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(res, 'Invalid conversation ID', 400);
  }

  const conversation = await AiConversation.findOne({ _id: id, userId });
  if (!conversation) {
    return sendError(res, 'Conversation not found', 404);
  }

  return res.status(200).json({
    success: true,
    conversation,
  });
});

export const deleteConversation = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { id } = req.params;

  if (!userId) {
    return sendError(res, 'Authentication required', 401);
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(res, 'Invalid conversation ID', 400);
  }

  const deleted = await AiConversation.findOneAndDelete({ _id: id, userId });
  if (!deleted) {
    return sendError(res, 'Conversation not found', 404);
  }

  return res.status(200).json({
    success: true,
    message: 'Conversation deleted successfully',
  });
});

export const handleListingDraft = asyncHandler(async (req: Request, res: Response) => {
  const parseResult = listingDraftRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return sendError(
      res,
      parseResult.error.issues.map((i) => i.message).join(', '),
      400
    );
  }

  const { imageUrl, imageUrls, imageBase64, mimeType, cropNameHint } = parseResult.data;

  const draft = await aiService.generateListingDraft({
    imageUrl,
    imageUrls,
    imageBase64,
    mimeType,
    cropNameHint,
    userId: req.user?._id,
  });

  return res.status(200).json({
    success: true,
    message: 'Listing draft generated successfully',
    data: draft,
    draft,
  });
});

export const handlePriceGuidance = asyncHandler(async (req: Request, res: Response) => {
  const parseResult = priceGuidanceQuerySchema.safeParse(req.query);
  if (!parseResult.success) {
    return sendError(
      res,
      parseResult.error.issues.map((i) => i.message).join(', '),
      400
    );
  }

  const { cropName, region, days, isOrganic } = parseResult.data;

  const guidance = await getPriceGuidance({
    cropName,
    region,
    days,
    isOrganic,
    minRequiredSnapshots: 2,
  });

  return res.status(200).json({
    success: true,
    ...guidance,
    data: guidance,
  });
});

export const handlePriceForecast = asyncHandler(async (req: Request, res: Response) => {
  const parseResult = priceForecastQuerySchema.safeParse(req.query);
  if (!parseResult.success) {
    return sendError(
      res,
      parseResult.error.issues.map((i) => i.message).join(', '),
      400
    );
  }

  const { cropName, category, region, daysAhead, language } = parseResult.data;

  const forecast = await getPriceForecast({
    cropName,
    category,
    region,
    daysAhead,
    language,
  });

  return res.status(200).json({
    success: true,
    ...forecast,
    data: forecast,
  });
});


