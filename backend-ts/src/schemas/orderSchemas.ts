import { z } from 'zod';
import { OrderStatus, PaymentMethod } from '../types/enums.js';

const PAYMENT_METHODS = Object.values(PaymentMethod) as [string, ...string[]];

export const createOrderSchema = z.object({
  cropId: z.string().min(1, 'Crop ID is required'),
  quantity: z.union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => Number.isInteger(v) && v > 0, { message: 'Quantity must be a positive integer' }),
  deliveryAddress: z.object({
    streetAddress: z.string().min(5, 'Street address is required').max(500),
    city: z.string().min(2, 'City is required').max(100),
    state: z.string().min(2, 'State is required').max(100),
    pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  }).optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  couponCode: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});

export const checkoutCartSchema = z.object({
  items: z.array(z.object({
    cropId: z.string().min(1, 'Crop ID is required'),
    quantity: z.union([z.string(), z.number()])
      .transform((v) => Number(v))
      .refine((v) => Number.isInteger(v) && v > 0, { message: 'Quantity must be a positive integer' }),
  })).min(1, 'Cart cannot be empty'),
  deliveryAddress: z.object({
    streetAddress: z.string().min(5, 'Street address is required').max(500),
    city: z.string().min(2, 'City is required').max(100),
    state: z.string().min(2, 'State is required').max(100),
    pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  }),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  couponCode: z.string().max(50).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(Object.values(OrderStatus) as [string, ...string[]], {
    errorMap: () => ({ message: `Status must be one of: ${Object.values(OrderStatus).join(', ')}` }),
  }),
});

export const cancelOrderSchema = z.object({
  cancellationReason: z.string().min(10, 'Please provide a reason for cancellation (at least 10 characters)').max(500),
});

export const orderQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? Math.max(1, parseInt(v, 10)) : 1)),
  limit: z.string().optional().transform((v) => {
    const n = v ? parseInt(v, 10) : 20;
    return Math.min(Math.max(1, n), 100);
  }),
  status: z.enum(Object.values(OrderStatus) as [string, ...string[]]).optional(),
  sortBy: z.enum(['createdAt', 'totalAmount', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
