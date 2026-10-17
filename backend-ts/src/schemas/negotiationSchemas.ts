import { z } from 'zod';

export const makeOfferSchema = z.object({
  cropId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Valid Crop ID is required'),
  offeredPrice: z.number().min(0.01, 'Offered price must be at least ₹0.01'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  message: z.string().max(500).optional(),
});

export const respondOfferSchema = z.object({
  action: z.enum(['accept', 'reject', 'counter'], { errorMap: () => ({ message: 'Invalid action. Must be accept, reject, or counter.' }) }),
  offeredPrice: z.number().min(0.01).optional(),
  message: z.string().max(500).optional(),
});
