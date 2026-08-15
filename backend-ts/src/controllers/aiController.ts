import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendError } from '../utils/apiResponse.js';
import { aiService } from '../services/aiService.js';

export const handleAiChat = asyncHandler(async (req: Request, res: Response) => {
  const { message, context } = req.body as {
    message?: string;
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

  const result = await aiService.processMessage({
    message: message.trim(),
    context,
  });

  return res.status(200).json(result);
});

export const getPromptSuggestions = asyncHandler(async (req: Request, res: Response) => {
  const role = (req.query.role as string) || 'guest';

  let starterPrompts: Array<{ label: string; query: string; icon: string; category: string }> = [];

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
      { label: 'Escrow & Safety', query: 'How does payment protection work on FaRm?', icon: 'ShieldCheck', category: 'Payment' },
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
