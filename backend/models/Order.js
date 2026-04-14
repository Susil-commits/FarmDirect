import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      default: () => 'ORD-' + Date.now()
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // Support multiple items from different farmers
    items: [
      {
        cropId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'CropListing',
          required: true
        },
        farmerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        cropName: String,
        quantity: {
          type: Number,
          required: true,
          min: 1
        },
        unitPrice: {
          type: Number,
          required: true
        },
        totalPrice: {
          type: Number,
          required: true
        }
      }
    ],
    // Delivery details
    deliveryAddress: {
      streetAddress: String,
      area: String,
      city: String,
      state: String,
      pincode: String,
      latitude: Number,
      longitude: Number
    },
    // Pricing
    subtotal: {
      type: Number,
      required: true
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    deliveryCharges: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true
    },
    // Order status workflow
    orderStatus: {
      type: String,
      enum: ['pending', 'verification_pending', 'verification_completed', 'admin_approval_pending', 'admin_approved', 'ready_for_delivery', 'shipped', 'delivered', 'cancelled', 'returned'],
      default: 'pending'
    },
    // Payment details (COD Only)
    paymentMethod: {
      type: String,
      enum: ['cod'],
      default: 'cod'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    paymentId: String,
    // Verification Call Details
    verificationCall: {
      status: {
        type: String,
        enum: ['pending', 'completed', 'rejected'],
        default: 'pending'
      },
      callInitiatedAt: Date,
      verifiedAt: Date,
      verificationNotes: String,
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      attempts: {
        type: Number,
        default: 0
      }
    },
    // Admin Approval Details
    adminApproval: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'hold'],
        default: 'pending'
      },
      approvedAt: Date,
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      rejectionReason: String,
      notes: String
    },
    // Additional Charges & Fines
    additionalCharges: {
      amount: {
        type: Number,
        default: 0
      },
      reason: String,
      appliedAt: Date,
      appliedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    issueFine: {
      amount: {
        type: Number,
        default: 0
      },
      reason: String,
      ratingReduction: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      appliedAt: Date,
      appliedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    // Total with charges
    chargesAmount: {
      type: Number,
      default: 0
    },
    fineAmount: {
      type: Number,
      default: 0
    },
    totalWithCharges: {
      type: Number,
      required: true
    },
    // Final payment tracking
    paymentReceived: {
      amount: {
        type: Number,
        default: 0
      },
      receivedAt: Date,
      notes: String
    },
    // Timeline/tracking
    timeline: [
      {
        event: String,
        description: String,
        timestamp: {
          type: Date,
          default: Date.now
        },
        location: String
      }
    ],
    estimatedDeliveryDate: Date,
    actualDeliveryDate: Date,
    trackingNumber: String,
    // Notes and feedback
    notes: String,
    // Review/rating
    review: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      images: [String],
      reviewedAt: Date
    },
    // Additional metadata
    couponCode: String,
    specialInstructions: String,
    returnRequested: Boolean,
    returnReason: String,
    cancelledAt: Date,
    cancellationReason: String
  },
  { timestamps: true }
);

// Auto-add timeline entry when status changes and calculate final total
orderSchema.pre('save', function (next) {
  if (this.isModified('orderStatus')) {
    this.timeline.push({
      event: this.orderStatus.toUpperCase(),
      description: `Order ${this.orderStatus}`,
      timestamp: new Date()
    });
  }
  
  // Calculate total with charges and fines
  this.chargesAmount = this.additionalCharges?.amount || 0;
  this.fineAmount = this.issueFine?.amount || 0;
  this.totalWithCharges = this.totalAmount + this.chargesAmount + this.fineAmount;
  
  next();
});

// Indexes for faster queries
orderSchema.index({ buyerId: 1 });
// Note: orderNumber index is created automatically by unique: true
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'items.farmerId': 1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
