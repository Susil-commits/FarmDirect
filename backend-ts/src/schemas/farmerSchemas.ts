import { z } from 'zod';

export const updateLowStockThresholdSchema = z.object({
  cropId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Valid Crop ID is required'),
  threshold: z.number().min(0, 'Threshold must be 0 or greater'),
});
