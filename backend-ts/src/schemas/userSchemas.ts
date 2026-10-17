import { z } from 'zod';

export const updateUserProfileSchema = z.object({
  firstName: z.string().min(1, 'First name cannot be empty').max(50).optional(),
  lastName: z.string().max(50).optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian phone number').optional(),
  bio: z.string().max(500).optional(),
  profilePicture: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export const addAddressSchema = z.object({
  streetAddress: z.string().min(1, 'Street address is required').max(200),
  area: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Must be a valid 6-digit Indian PIN code').optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isDefault: z.boolean().optional(),
});
