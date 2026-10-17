import { z } from 'zod';

export const updateCartItemSchema = z.object({
  cropId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid cropId'),
  quantity: z.number().positive('Quantity must be greater than 0'),
});

export const updateCartSchema = z.object({
  items: z.array(updateCartItemSchema),
});

export type UpdateCartInput = z.infer<typeof updateCartSchema>;
