import { z } from 'zod';
import { getPriceStats } from '../../services/priceSnapshotService.js';
import type { ToolDefinition } from './types.js';

export const getPriceStatsSchema = z.object({
  cropName: z.string().min(1, 'cropName is required'),
  region: z.string().optional(),
  days: z.number().positive().max(365).optional(),
});

export type GetPriceStatsArgs = z.infer<typeof getPriceStatsSchema>;

export const getPriceStatsTool: ToolDefinition<GetPriceStatsArgs> = {
  name: 'get_price_stats',
  description:
    'Retrieve statistical market price insights (min, median, max, average, and 30-day price trend percentage) from historical marketplace price snapshots.',
  schema: getPriceStatsSchema,
  declaration: {
    name: 'get_price_stats',
    description:
      'Retrieve statistical market price insights (min, median, max, average, and 30-day price trend percentage) from historical marketplace price snapshots.',
    parameters: {
      type: 'OBJECT',
      properties: {
        cropName: {
          type: 'STRING',
          description: 'Name of the crop (e.g. tomato, rice, potato, onion)',
        },
        region: {
          type: 'STRING',
          description: 'Optional geographical region or district (e.g. Cuttack, Bhubaneswar, Sambalpur)',
        },
        days: {
          type: 'NUMBER',
          description: 'Number of past days of price history to aggregate (default: 30 days)',
        },
      },
      required: ['cropName'],
    },
  },
  allowedRoles: ['guest', 'buyer', 'farmer', 'admin'],
  async run(args) {
    const stats = await getPriceStats({
      cropName: args.cropName,
      region: args.region,
      days: args.days || 30,
      minRequiredSnapshots: 2,
    });

    if (!stats.sufficientData || stats.count === 0) {
      return {
        cropName: args.cropName,
        region: args.region || 'all regions',
        sufficientData: false,
        message: `Insufficient historical price snapshots for "${args.cropName}". More transactions are needed to establish reliable market benchmarks.`,
      };
    }

    return {
      cropName: stats.cropName,
      region: stats.region || 'all regions',
      snapshotsAnalyzed: stats.count,
      minPrice: `₹${stats.minPrice}`,
      medianPrice: `₹${stats.medianPrice}`,
      maxPrice: `₹${stats.maxPrice}`,
      averagePrice: `₹${stats.avgPrice.toFixed(2)}`,
      p25: `₹${stats.p25}`,
      p75: `₹${stats.p75}`,
      trendPercentage: stats.trendPercent !== undefined ? `${stats.trendPercent > 0 ? '+' : ''}${stats.trendPercent.toFixed(1)}%` : 'stable',
      sufficientData: true,
    };
  },
};
