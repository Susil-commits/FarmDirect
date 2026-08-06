import { z } from 'zod';
import { CropType, CropAvailability } from '../types/enums.js';

const CROP_TYPES = Object.values(CropType) as [string, ...string[]];
const AVAILABILITIES = Object.values(CropAvailability) as [string, ...string[]];

export const createCropSchema = z.object({
  cropName: z.string().min(2, 'Crop name must be at least 2 characters').max(100, 'Crop name too long'),
  cropType: z.enum(CROP_TYPES, { errorMap: () => ({ message: `Invalid crop type` }) }).optional(),
  category: z.string().max(100).optional(),
  price: z.union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => !isNaN(v) && v > 0, { message: 'Price must be a positive number' }),
  quantity: z.union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => !isNaN(v) && v > 0, { message: 'Quantity must be a positive number' }),
  unit: z.string().max(20).optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
  pickupLocation: z.string().min(5, 'Pickup location is required').max(500),
  contactNumber: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
  specifications: z.string().optional(), // JSON string
  availability: z.enum(AVAILABILITIES).optional(),
});

export const updateCropSchema = z.object({
  cropName: z.string().min(2).max(100).optional(),
  cropType: z.enum(CROP_TYPES).optional(),
  category: z.string().max(100).optional(),
  price: z.union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => !isNaN(v) && v > 0, { message: 'Price must be a positive number' })
    .optional(),
  quantity: z.union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => !isNaN(v) && v > 0, { message: 'Quantity must be a positive number' })
    .optional(),
  unit: z.string().max(20).optional(),
  description: z.string().min(10).max(2000).optional(),
  pickupLocation: z.string().min(5).max(500).optional(),
  contactNumber: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number').optional(),
  specifications: z.string().optional(),
  availability: z.enum(AVAILABILITIES).optional(),
}).strict();

export const cropQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? Math.max(1, parseInt(v, 10)) : 1)),
  limit: z.string().optional().transform((v) => {
    const n = v ? parseInt(v, 10) : 20;
    return Math.min(Math.max(1, n), 100); // clamp 1–100
  }),
  q: z.string().max(200).optional(),
  category: z.string().optional(),
  minPrice: z.string().optional().transform((v) => (v ? Number(v) : undefined)),
  maxPrice: z.string().optional().transform((v) => (v ? Number(v) : undefined)),
  sortBy: z.enum(['price', 'createdAt', 'rating', 'popularity']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  farmerId: z.string().optional(),
});
