import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    cropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CropListing',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 1000
    },
    images: [String],
    helpful: {
      type: Number,
      default: 0
    },
    unhelpful: {
      type: Number,
      default: 0
    },
    // Abuse reporting
    reports: [
      {
        reportedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        reason: {
          type: String,
          enum: ['spam', 'inappropriate', 'false', 'other']
        },
        description: String,
        reportedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    // Moderation
    isApproved: {
      type: Boolean,
      default: true
    },
    isFlagged: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Index for faster queries
reviewSchema.index({ cropId: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
