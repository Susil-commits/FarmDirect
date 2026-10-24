import { z } from 'zod';
import { InquiryType, ContactQueryStatus, ContactQueryPriority } from '../types/enums.js';

export const submitContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian phone number').optional().or(z.literal('')),
  inquiryType: z.nativeEnum(InquiryType, { message: 'Invalid inquiry type' }),
  message: z.string().min(10, 'Message must be at least 10 characters long').max(5000),
});

export const updateContactQuerySchema = z.object({
  status: z.nativeEnum(ContactQueryStatus).optional(),
  adminResponse: z.string().max(5000).optional(),
  internalNotes: z.string().max(5000).optional(),
  priority: z.nativeEnum(ContactQueryPriority).optional(),
});
