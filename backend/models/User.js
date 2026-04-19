import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    name: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ]
    },
    password: {
      type: String,
      minlength: 6,
      select: false
    },
    phone: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      enum: ['farmer', 'buyer', 'admin'],
      default: 'buyer'
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'banned'],
      default: 'active'
    },
    profilePicture: {
      type: String,
      default: null
    },
    bio: {
      type: String,
      default: ''
    },
    // Basic Address fields (for user profile)
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    pincode: {
      type: String,
      trim: true
    },
    // Farmer-specific fields
    farmName: {
      type: String,
      trim: true
    },
    farmArea: {
      type: String
    },
    cropsGrown: [{
      type: String
    }],
    farmImages: [String],
    experience: {
      type: Number,
      default: 0
    },
    // KYC and verification
    kycStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    kycSubmittedAt: Date,
    kycVerifiedAt: Date,
    kycRejectionReason: String,
    kycComments: String,
    // KYC Documents - Store document details
    kycDocuments: {
      aadharNumber: String,
      governmentId: {
        fileName: String,
        uploadedAt: Date
      },
      profilePhoto: {
        fileName: String,
        uploadedAt: Date
      },
      addressProof: {
        fileName: String,
        uploadedAt: Date
      },
      landOwnership: {  // For farmers
        fileName: String,
        uploadedAt: Date
      },
      farmRegistration: {  // For farmers
        fileName: String,
        uploadedAt: Date
      }
    },
    // KYC Personal Details
    kycDetails: {
      aadharNumber: String,
      governmentIdType: String, // PAN, Passport, DL, etc.
      governmentIdNumber: String,
      dateOfBirth: Date,
      profilePhotoUrl: String
    },
    // Rating
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
    // Addresses
    addresses: [
      {
        _id: mongoose.Schema.Types.ObjectId,
        streetAddress: String,
        area: String,
        city: String,
        state: String,
        pincode: String,
        latitude: Number,
        longitude: Number,
        isDefault: {
          type: Boolean,
          default: false
        }
      }
    ],
    // Account settings
    verified: {
      type: Boolean,
      default: false
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    // Social and preferences
    socialLinks: {
      linkedin: String,
      twitter: String,
      facebook: String,
      instagram: String
    },
    socialAuth: {
      provider: {
        type: String,
        enum: ['google', 'github', 'facebook'],
        default: null
      },
      providerId: String,
    },
    notificationPreferences: {
      orderUpdates: {
        type: Boolean,
        default: true
      },
      cropUpdates: {
        type: Boolean,
        default: true
      },
      reviews: {
        type: Boolean,
        default: true
      },
      promotions: {
        type: Boolean,
        default: false
      },
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    }
  },
  { timestamps: true }
);

// Index for faster queries
// Note: email index is created automatically by unique: true
userSchema.index({ role: 1 });
userSchema.index({ kycStatus: 1 });

const User = mongoose.model('User', userSchema);
export default User;
