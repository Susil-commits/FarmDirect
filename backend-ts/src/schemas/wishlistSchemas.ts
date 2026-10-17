import { z } from 'zod';

export const addToWishlistSchema = z.object({
  cropId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'A valid cropId is required'),
});
