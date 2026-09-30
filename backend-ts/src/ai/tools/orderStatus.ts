import { z } from 'zod';
import Order from '../../models/Order.js';
import type { ToolDefinition } from './types.js';

export const orderStatusSchema = z.object({
  orderNumber: z.string().min(1, 'orderNumber is required'),
});

export type OrderStatusArgs = z.infer<typeof orderStatusSchema>;

export const orderStatusTool: ToolDefinition<OrderStatusArgs> = {
  name: 'order_status',
  description:
    'Track and inspect the detailed status, payment state, and timeline of a specific order by order number with strict ownership authorization.',
  schema: orderStatusSchema,
  declaration: {
    name: 'order_status',
    description:
      'Track and inspect the detailed status, payment state, and timeline of a specific order by order number with strict ownership authorization.',
    parameters: {
      type: 'OBJECT',
      properties: {
        orderNumber: {
          type: 'STRING',
          description: 'The unique order identifier (e.g. ORD-1718000000000)',
        },
      },
      required: ['orderNumber'],
    },
  },
  allowedRoles: ['buyer', 'farmer', 'admin'],
  async run(args, ctx) {
    if (!ctx.user || !ctx.user._id) {
      return { error: 'Authentication required. Please sign in to view order details.' };
    }

    const order = await Order.findOne({ orderNumber: args.orderNumber.trim() }).lean();

    if (!order) {
      return { error: `Order "${args.orderNumber}" was not found.` };
    }

    const userIdStr = String(ctx.user._id);
    const isOwner =
      String(order.buyerId) === userIdStr ||
      String(order.farmerId) === userIdStr ||
      ctx.user.role === 'admin';

    if (!isOwner) {
      return {
        error: `Order "${args.orderNumber}" not found or you are not authorized to view this order.`,
      };
    }

    return {
      orderNumber: order.orderNumber,
      crop: order.cropName || 'Farm Item',
      quantity: order.quantity,
      unitPrice: `₹${order.unitPrice}`,
      totalAmount: `₹${order.totalAmount}`,
      orderStatus: order.orderStatus,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      pickupLocation: order.pickupLocation,
      timeline: order.timeline?.map((t) => ({
        event: t.event,
        description: t.description,
        timestamp: t.timestamp,
      })),
      createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : null,
    };
  },
};
