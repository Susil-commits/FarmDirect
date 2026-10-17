import { z } from 'zod';

export const createRazorpayOrderSchema = z.object({
  orderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid orderId').optional(),
  orderIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid orderId')).optional(),
}).refine((data) => Boolean(data.orderId || (data.orderIds && data.orderIds.length > 0)), {
  message: 'orderId or orderIds is required',
});

export const verifyRazorpayPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1, 'razorpayOrderId is required'),
  razorpayPaymentId: z.string().min(1, 'razorpayPaymentId is required'),
  razorpaySignature: z.string().min(1, 'razorpaySignature is required'),
  orderId: z.string().optional(),
});

export const markRazorpayPaymentFailedSchema = z.object({
  orderId: z.string().optional(),
  razorpayOrderId: z.string().optional(),
  errorDescription: z.string().optional(),
  reason: z.string().optional(),
});
