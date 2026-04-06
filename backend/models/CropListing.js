import mongoose from 'mongoose';

const cropListingSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    cropName: {
      type: String,
      required: [true, 'Crop name is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Vegetables', 'Fruits', 'Grains', 'Pulses', 'Spices', 'Dairy', 'Meat', 'Seeds', 'Herbs', 'Other']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0
    },
    originalPrice: {
      type: Number,
      default: null
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: 0
    },
    unit: {
      type: String,
      enum: ['kg', 'piece', 'dozen', 'liter', 'box', 'bundle'],
      default: 'kg'
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: 10,
      maxlength: 2000
    },
    images: [
      {
        type: String
      }
    ],
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    // Product specifications
    specifications: {
      size: String,
      color: String,
      ripeness: String,
      shelfLife: String,
      storageInstructions: String,
      organicCertified: Boolean
    },
    certifications: [String],
    harvestDate: Date,
    
    // Rating and reviews
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    
    // Listing status
    status: {
      type: String,
      enum: ['active', 'inactive', 'soldOut'],
      default: 'active'
    },
    listingApprovalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    rejectionReason: String,
    
    // Metrics
    views: {
      type: Number,
      default: 0
    },
    sold: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    
    // Inventory Management
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: 0
    },
    lastRestockDate: Date,
    restockHistory: [
      {
        date: { type: Date, default: Date.now },
        quantityAdded: Number,
        previousQuantity: Number
      }
    ],
    
    // Analytics tracking
    dailySales: [
      {
        date: { type: Date, default: Date.now },
        quantity: { type: Number, default: 0 },
        revenue: { type: Number, default: 0 }
      }
    ],
    monthlyStats: {
      totalRevenue: { type: Number, default: 0 },
      totalUnits: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

// Indexes for optimization
cropListingSchema.index({ farmerId: 1 });
cropListingSchema.index({ category: 1 });
cropListingSchema.index({ status: 1 });
cropListingSchema.index({ listingApprovalStatus: 1 });
cropListingSchema.index({ cropName: 'text', description: 'text' });
cropListingSchema.index({ createdAt: -1 });
cropListingSchema.index({ farmerId: 1, createdAt: -1 });
cropListingSchema.index({ farmerId: 1, status: 1 });
cropListingSchema.index({ quantity: 1 }); // For low-stock queries

const CropListing = mongoose.model('CropListing', cropListingSchema);
export default CropListing;
