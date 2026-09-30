import { z } from 'zod';
import Negotiation from '../../models/Negotiation.js';
import type { ToolDefinition } from './types.js';

export const myNegotiationsSchema = z.object({});

export type MyNegotiationsArgs = z.infer<typeof myNegotiationsSchema>;

export const myNegotiationsTool: ToolDefinition<MyNegotiationsArgs> = {
  name: 'my_negotiations',
  description:
    'Retrieve active price negotiations and counter-offers for the authenticated farmer or buyer.',
  schema: myNegotiationsSchema,
  declaration: {
    name: 'my_negotiations',
    description:
      'Retrieve active price negotiations and counter-offers for the authenticated farmer or buyer.',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
  allowedRoles: ['farmer', 'buyer', 'admin'],
  async run(_args, ctx) {
    if (!ctx.user || !ctx.user._id) {
      return { error: 'Authentication required. Please sign in to view negotiations.' };
    }

    const filter: Record<string, unknown> = {};
    if (ctx.user.role === 'farmer') {
      filter.farmerId = ctx.user._id;
    } else {
      filter.buyerId = ctx.user._id;
    }

    const negotiations = await Negotiation.find(filter)
      .populate('cropId', 'cropName unit')
      .populate('buyerId', 'firstName lastName')
      .populate('farmerId', 'firstName lastName farmName')
      .sort({ updatedAt: -1 })
      .limit(6)
      .lean();

    return {
      count: negotiations.length,
      negotiations: negotiations.map((n: any) => ({
        id: n._id.toString(),
        cropName: n.cropId?.cropName || 'Crop Item',
        originalPrice: `₹${n.originalPrice}`,
        offeredPrice: `₹${n.offeredPrice}`,
        quantity: `${n.quantity} ${n.cropId?.unit || 'kg'}`,
        status: n.status,
        counterparty:
          ctx.user?.role === 'farmer'
            ? `${n.buyerId?.firstName || ''} ${n.buyerId?.lastName || ''}`.trim() || 'Buyer'
            : `${n.farmerId?.firstName || ''} ${n.farmerId?.lastName || ''}`.trim() || 'Farmer',
        lastUpdated: n.updatedAt ? new Date(n.updatedAt).toLocaleDateString() : 'N/A',
      })),
    };
  },
};
