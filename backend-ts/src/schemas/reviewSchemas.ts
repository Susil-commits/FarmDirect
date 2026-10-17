import { z } from 'zod';

export const addReviewSchema = z.object({
  rating: z.union([z.number(), z.string().transform((v) => Number(v))]).pipe(
    z.number().min(1, 'Rating must be a number between 1 and 5').max(5, 'Rating must be a number between 1 and 5')
  ),
  comment: z.string().max(2000, 'Comment cannot exceed 2000 characters').optional().default(''),
});

export const reportReviewSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500),
});
