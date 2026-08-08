import mongoose, { Schema, type Model } from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';
import type { ICropListing } from '../types/index.js';
import {
  CropType,
  CropCategory,
  CropUnit,
  CropStatus,
  CropAvailability,
  ListingApprovalStatus,
  InterestedBuyerStatus,
} from '../types/enums.js';

const cropListingSchema = new Schema<ICropListing>(
  {
    farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    cropName: { type: String, required: [true, 'Crop name is required'], trim: true },
    cropType: {
      type: String,
      enum: Object.values(CropType),
      default: CropType.Vegetables,
    },
    category: {
      type: String,
      enum: Object.values(CropCategory),
      required: [true, 'Category is required'],
    },
    price: { type: Number, required: [true, 'Price per kg is required'], min: 0 },
    originalPrice: { type: Number, default: null },
    quantity: { type: Number, required: [true, 'Quantity is required'], min: 0 },
    unit: { type: String, enum: Object.values(CropUnit), default: CropUnit.Kg },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: 10,
      maxlength: 2000,
    },
    images: [{ type: String }],
    pickupLocation: { type: String, required: [true, 'Pickup location is required'], trim: true },
    contactNumber: { type: String, required: [true, 'Contact number is required'], trim: true },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    specifications: {
      size: String,
      color: String,
      ripeness: String,
      shelfLife: String,
      storageInstructions: String,
      organicCertified: Boolean,
    },
    certifications: [String],
    harvestDate: Date,
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    status: { type: String, enum: Object.values(CropStatus), default: CropStatus.Active },
    availability: {
      type: String,
      enum: Object.values(CropAvailability),
      default: CropAvailability.Available,
    },
    listingApprovalStatus: {
      type: String,
      enum: Object.values(ListingApprovalStatus),
      default: ListingApprovalStatus.Approved,
    },
    rejectionReason: String,
    interestedBuyers: [
      {
        buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: {
          type: String,
          enum: Object.values(InterestedBuyerStatus),
          default: InterestedBuyerStatus.Interested,
        },
        interestedAt: { type: Date, default: Date.now },
        orderId: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
      },
    ],
    views: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 10, min: 0 },
    lastRestockDate: Date,
    restockHistory: [
      { date: { type: Date, default: Date.now }, quantityAdded: Number, previousQuantity: Number },
    ],
    dailySales: [
      { date: { type: Date, default: Date.now }, quantity: { type: Number, default: 0 }, revenue: { type: Number, default: 0 } },
    ],
    monthlyStats: {
      totalRevenue: { type: Number, default: 0 },
      totalUnits: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

cropListingSchema.index({ farmerId: 1 });
cropListingSchema.index({ category: 1 });
cropListingSchema.index({ cropType: 1 });
cropListingSchema.index({ status: 1 });
cropListingSchema.index({ availability: 1 });
cropListingSchema.index({ listingApprovalStatus: 1 });
cropListingSchema.index({ cropName: 'text', description: 'text' });
cropListingSchema.index({ createdAt: -1 });
cropListingSchema.index({ farmerId: 1, createdAt: -1 });
cropListingSchema.index({ farmerId: 1, status: 1 });
cropListingSchema.index({ quantity: 1 });
cropListingSchema.index({ 'interestedBuyers.buyerId': 1 });

cropListingSchema.plugin(updateIfCurrentPlugin);

const CropListing: Model<ICropListing> = mongoose.models.CropListing || mongoose.model<ICropListing>('CropListing', cropListingSchema);
export default CropListing;
