import { z } from 'zod';
import Order from '../../models/Order.js';
import type { ToolDefinition } from './types.js';

export const myOrdersSchema = z.object({
  status: z
    .enum(['confirmed', 'preparing', 'ready_for_pickup', 'picked_up', 'completed', 'cancelled'])
    .optional(),
});

export type MyOrdersArgs = z.infer<typeof myOrdersSchema>;

export const myOrdersTool: ToolDefinition<MyOrdersArgs> = {
  name: 'my_orders',
  description:
    'Retrieve recent marketplace orders for the currently authenticated farmer or buyer, optionally filtered by status.',
  schema: myOrdersSchema,
  declaration: {
    name: 'my_orders',
    description:
      'Retrieve recent marketplace orders for the currently authenticated farmer or buyer, optionally filtered by status.',
    parameters: {
      type: 'OBJECT',
      properties: {
        status: {
          type: 'STRING',
          description:
            'Filter orders by status: confirmed, preparing, ready_for_pickup, picked_up, completed, or cancelled',
        },
      },
    },
  },
  allowedRoles: ['buyer', 'farmer', 'admin'],
  async run(args, ctx) {
    if (!ctx.user || !ctx.user._id) {
      return { error: 'Authentication required. Please sign in to view your orders.' };
    }

    const filter: Record<string, unknown> = {};

    if (ctx.user.role === 'farmer') {
      filter.farmerId = ctx.user._id;
    } else {
      filter.buyerId = ctx.user._id;
    }

    if (args.status) {
      filter.orderStatus = args.status;
    }

    const orders = await Order.find(filter)
      .select('orderNumber cropName quantity totalAmount orderStatus paymentStatus createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return {
      userRole: ctx.user.role,
      orderCount: orders.length,
      orders: orders.map((o) => ({
        orderNumber: o.orderNumber,
        crop: o.cropName || 'Produce Item',
        quantity: o.quantity,
        totalAmount: `₹${o.totalAmount}`,
        status: o.orderStatus,
        payment: o.paymentStatus,
        date: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'N/A',
      })),
    };
  },
};
