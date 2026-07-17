import mongoose, { Schema, type Model } from 'mongoose';
import type { IReview } from '../types/index.js';
import { ReportReason } from '../types/enums.js';

const reviewSchema = new Schema<IReview>(
  {
    cropId: { type: Schema.Types.ObjectId, ref: 'CropListing', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, minlength: 10, maxlength: 1000 },
    images: [String],
    helpful: { type: Number, default: 0 },
    unhelpful: { type: Number, default: 0 },
    reports: [
      {
        reportedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String, enum: Object.values(ReportReason) },
        description: String,
        reportedAt: { type: Date, default: Date.now },
      },
    ],
    isApproved: { type: Boolean, default: true },
    isFlagged: { type: Boolean, default: false },
  },
  { timestamps: true },
);

reviewSchema.index({ cropId: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });

const Review: Model<IReview> = mongoose.model<IReview>('Review', reviewSchema);
export default Review;
