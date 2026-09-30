import { z } from 'zod';
import CropListing from '../../models/CropListing.js';
import { CropStatus } from '../../types/enums.js';
import type { ToolDefinition } from './types.js';

export const lowStockSchema = z.object({
  threshold: z.number().positive().optional(),
});

export type LowStockArgs = z.infer<typeof lowStockSchema>;

export const lowStockTool: ToolDefinition<LowStockArgs> = {
  name: 'low_stock',
  description:
    'Identify crop listings with critically low inventory levels for the authenticated farmer so they can restock or update availability.',
  schema: lowStockSchema,
  declaration: {
    name: 'low_stock',
    description:
      'Identify crop listings with critically low inventory levels for the authenticated farmer so they can restock or update availability.',
    parameters: {
      type: 'OBJECT',
      properties: {
        threshold: {
          type: 'NUMBER',
          description:
            'Quantity threshold to flag low stock (default: 15 units)',
        },
      },
    },
  },
  allowedRoles: ['farmer', 'admin'],
  async run(args, ctx) {
    if (!ctx.user || !ctx.user._id) {
      return { error: 'Authentication required. Please sign in as a farmer.' };
    }

    if (ctx.user.role !== 'farmer' && ctx.user.role !== 'admin') {
      return { error: 'This tool is exclusively available for farmers.' };
    }

    const maxStock = args.threshold || 15;

    const lowStockCrops = await CropListing.find({
      farmerId: ctx.user._id,
      quantity: { $lte: maxStock },
      status: CropStatus.Active,
    })
      .select('_id cropName category price unit quantity')
      .sort({ quantity: 1 })
      .limit(10)
      .lean();

    return {
      thresholdUsed: maxStock,
      lowStockCount: lowStockCrops.length,
      items: lowStockCrops.map((c) => ({
        id: c._id.toString(),
        cropName: c.cropName,
        category: c.category,
        remainingStock: `${c.quantity} ${c.unit || 'kg'}`,
        price: `₹${c.price}/${c.unit || 'kg'}`,
      })),
    };
  },
};
