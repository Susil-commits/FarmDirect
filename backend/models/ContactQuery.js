import mongoose from 'mongoose';

const contactQuerySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    // Sender Information
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      match: /^[0-9\-\+\s\(\)]*$/,
    },

    // Query Details
    inquiryType: {
      type: String,
      enum: ['General', 'Support', 'Partnership', 'Farmer Partnership', 'Feedback'],
      default: 'General',
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 5000,
    },

    // Status & Management
    status: {
      type: String,
      enum: ['New', 'Read', 'In Progress', 'Resolved', 'Closed'],
      default: 'New',
      index: true,
    },

    // Admin Response
    adminResponse: {
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      responseMessage: {
        type: String,
        trim: true,
        default: null,
      },
      respondedAt: {
        type: Date,
        default: null,
      },
    },

    // Metadata
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },

    internalNotes: {
      type: String,
      trim: true,
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      { email: 1, createdAt: -1 },
      { status: 1, createdAt: -1 },
      { inquiryType: 1, createdAt: -1 },
    ],
  }
);

// Virtual for calculated fields
contactQuerySchema.virtual('daysOld').get(function () {
  const now = new Date();
  const diff = now - this.createdAt;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

// Indexes for search performance
contactQuerySchema.index({ name: 'text', email: 'text', message: 'text' });

export default mongoose.model('ContactQuery', contactQuerySchema);
