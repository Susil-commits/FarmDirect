import mongoose from 'mongoose';
import { z } from 'zod';
import CropListing from '../../models/CropListing.js';
import { ListingApprovalStatus } from '../../types/enums.js';
import type { ToolDefinition } from './types.js';

export const getCropSchema = z.object({
  cropId: z.string().min(1, 'cropId is required'),
});

export type GetCropArgs = z.infer<typeof getCropSchema>;

export const getCropTool: ToolDefinition<GetCropArgs> = {
  name: 'get_crop',
  description: 'Retrieve detailed information for a specific crop listing by its ID.',
  schema: getCropSchema,
  declaration: {
    name: 'get_crop',
    description: 'Retrieve detailed information for a specific crop listing by its ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        cropId: {
          type: 'STRING',
          description: 'The 24-character hexadecimal ID of the crop listing',
        },
      },
      required: ['cropId'],
    },
  },
  allowedRoles: ['guest', 'buyer', 'farmer', 'admin'],
  async run(args) {
    if (!mongoose.Types.ObjectId.isValid(args.cropId)) {
      return { error: `Invalid cropId format: "${args.cropId}"` };
    }

    const crop = await CropListing.findOne({
      _id: args.cropId,
      listingApprovalStatus: ListingApprovalStatus.Approved,
    })
      .populate('farmerId', 'firstName lastName farmName rating')
      .lean();

    if (!crop) {
      return { error: `Crop listing not found or not approved for public viewing.` };
    }

    const farmer = crop.farmerId as any;

    return {
      id: crop._id.toString(),
      cropName: crop.cropName,
      category: crop.category,
      price: `₹${crop.price}/${crop.unit || 'kg'}`,
      availableQuantity: `${crop.quantity} ${crop.unit || 'kg'}`,
      description: crop.description,
      pickupLocation: crop.pickupLocation,
      isOrganic: Boolean(crop.specifications?.organicCertified),
      specifications: crop.specifications,
      farmer: farmer
        ? {
            name: `${farmer.firstName || ''} ${farmer.lastName || ''}`.trim() || 'Verified Farmer',
            farmName: farmer.farmName || 'Local Farm',
            rating: farmer.rating || 0,
          }
        : undefined,
      rating: crop.rating || 0,
      totalReviews: crop.totalReviews || 0,
    };
  },
};
