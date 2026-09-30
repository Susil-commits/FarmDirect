import { z } from 'zod';

export const singleEventSchema = z.object({
  sessionId: z.string().min(1).max(128),
  type: z.enum(['view', 'search', 'click', 'wishlist', 'cart', 'interest', 'offer', 'order']),
  cropId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
  query: z.string().max(200).optional().nullable(),
  meta: z.record(z.unknown()).optional(),
  at: z.string().datetime().or(z.date()).optional(),
});

export const batchEventsSchema = z.object({
  events: z.array(singleEventSchema).min(1).max(100),
});

export type SingleEventInput = z.infer<typeof singleEventSchema>;
export type BatchEventsInput = z.infer<typeof batchEventsSchema>;
