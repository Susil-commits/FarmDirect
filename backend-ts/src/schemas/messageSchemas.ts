import { z } from 'zod';

export const sendMessageSchema = z.object({
  receiverId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Valid receiver ID is required'),
  content: z.string().min(1, 'Message content cannot be empty').max(5000, 'Message content cannot exceed 5000 characters'),
  cropId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid cropId').optional().nullable(),
  orderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid orderId').optional().nullable(),
  type: z.enum(['text', 'image', 'document', 'system']).optional().default('text'),
  attachments: z.array(z.unknown()).optional().default([]),
});
