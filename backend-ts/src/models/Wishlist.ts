import mongoose, { Schema, type Model } from 'mongoose';
import type { IWishlist } from '../types/index.js';

const wishlistSchema = new Schema<IWishlist>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    cropId: { type: Schema.Types.ObjectId, ref: 'CropListing', required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

wishlistSchema.index({ userId: 1, cropId: 1 }, { unique: true });

const Wishlist: Model<IWishlist> = mongoose.model<IWishlist>('Wishlist', wishlistSchema);
export default Wishlist;
