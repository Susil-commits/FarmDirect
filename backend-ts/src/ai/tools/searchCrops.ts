import { z } from 'zod';
import CropListing from '../../models/CropListing.js';
import { CropStatus, ListingApprovalStatus, CropAvailability } from '../../types/enums.js';
import { escapeRegex } from '../../utils/escapeRegex.js';
import type { ToolDefinition } from './types.js';

export const searchCropsSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  maxPrice: z.number().positive().optional(),
  organic: z.boolean().optional(),
  location: z.string().optional(),
});

export type SearchCropsArgs = z.infer<typeof searchCropsSchema>;

export const searchCropsTool: ToolDefinition<SearchCropsArgs> = {
  name: 'search_crops',
  description:
    'Search for active and approved fresh crop listings in the marketplace with optional category, price, organic, and location filters.',
  schema: searchCropsSchema,
  declaration: {
    name: 'search_crops',
    description:
      'Search for active and approved fresh crop listings in the marketplace with optional category, price, organic, and location filters.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: 'Keyword search term (crop name or description, e.g. tomato, rice, mango)',
        },
        category: {
          type: 'STRING',
          description: 'Category filter (e.g. vegetables, fruits, grains, pulses, spices)',
        },
        maxPrice: {
          type: 'NUMBER',
          description: 'Maximum price per unit in INR (₹)',
        },
        organic: {
          type: 'BOOLEAN',
          description: 'Filter for organic-certified crops only',
        },
        location: {
          type: 'STRING',
          description: 'City, region, or state to filter listings by pickup location',
        },
      },
    },
  },
  allowedRoles: ['guest', 'buyer', 'farmer', 'admin'],
  async run(args) {
    const filter: Record<string, unknown> = {
      status: CropStatus.Active,
      listingApprovalStatus: ListingApprovalStatus.Approved,
      availability: CropAvailability.Available,
      quantity: { $gt: 0 },
    };

    if (args.query && args.query.trim()) {
      const q = escapeRegex(args.query.trim());
      filter.$or = [
        { cropName: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    if (args.category && args.category.trim()) {
      filter.category = { $regex: `^${escapeRegex(args.category.trim())}$`, $options: 'i' };
    }

    if (args.maxPrice !== undefined && args.maxPrice > 0) {
      filter.price = { $lte: args.maxPrice };
    }

    if (args.organic !== undefined) {
      filter['specifications.organicCertified'] = args.organic;
    }

    if (args.location && args.location.trim()) {
      filter.pickupLocation = { $regex: escapeRegex(args.location.trim()), $options: 'i' };
    }

    const crops = await CropListing.find(filter)
      .select('_id cropName category price unit quantity specifications pickupLocation rating')
      .sort({ rating: -1, createdAt: -1 })
      .limit(8)
      .lean();

    return {
      foundCount: crops.length,
      listings: crops.map((c) => ({
        id: c._id.toString(),
        cropName: c.cropName,
        category: c.category,
        price: `₹${c.price}/${c.unit || 'kg'}`,
        availableQuantity: `${c.quantity} ${c.unit || 'kg'}`,
        isOrganic: Boolean(c.specifications?.organicCertified),
        pickupLocation: c.pickupLocation,
        rating: c.rating || 0,
      })),
    };
  },
};
