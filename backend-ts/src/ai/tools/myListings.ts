import { z } from 'zod';
import CropListing from '../../models/CropListing.js';
import type { ToolDefinition } from './types.js';

export const myListingsSchema = z.object({});

export type MyListingsArgs = z.infer<typeof myListingsSchema>;

export const myListingsTool: ToolDefinition<MyListingsArgs> = {
  name: 'my_listings',
  description:
    'Retrieve all crop listings published by the authenticated farmer, including current stock quantities, prices, and approval status.',
  schema: myListingsSchema,
  declaration: {
    name: 'my_listings',
    description:
      'Retrieve all crop listings published by the authenticated farmer, including current stock quantities, prices, and approval status.',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
  allowedRoles: ['farmer', 'admin'],
  async run(_args, ctx) {
    if (!ctx.user || !ctx.user._id) {
      return { error: 'Authentication required. Please sign in as a farmer.' };
    }

    if (ctx.user.role !== 'farmer' && ctx.user.role !== 'admin') {
      return { error: 'This tool is exclusively available for verified farmers.' };
    }

    const listings = await CropListing.find({ farmerId: ctx.user._id })
      .select('_id cropName category price unit quantity status listingApprovalStatus rating totalReviews')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return {
      totalListings: listings.length,
      listings: listings.map((l) => ({
        id: l._id.toString(),
        cropName: l.cropName,
        category: l.category,
        price: `₹${l.price}/${l.unit || 'kg'}`,
        stock: `${l.quantity} ${l.unit || 'kg'}`,
        status: l.status,
        approvalStatus: l.listingApprovalStatus,
        rating: l.rating || 0,
      })),
    };
  },
};
