import mongoose, { Schema, type Model, type Types } from 'mongoose';
import type { IUser } from '../types/index.js';
import { UserRole, UserStatus, KycStatus, SocialAuthProvider } from '../types/enums.js';

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: [true, 'First name is required'], trim: true },
    lastName: { type: String, required: [true, 'Last name is required'], trim: true },
    name: { type: String, trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    password: { type: String, minlength: 6, select: false },
    phone: { type: String, trim: true },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.Buyer },
    status: { type: String, enum: Object.values(UserStatus), default: UserStatus.Active },
    suspensionReason: { type: String, default: '' },
    profilePicture: { type: String, default: null },
    bio: { type: String, default: '' },
    address: { type: String, trim: true },
    location: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    farmName: { type: String, trim: true },
    farmArea: { type: String },
    cropsGrown: [{ type: String }],
    farmImages: [String],
    experience: { type: Number, default: 0 },
    kycStatus: { type: String, enum: Object.values(KycStatus), default: KycStatus.NotSubmitted },
    kycSubmittedAt: Date,
    kycVerifiedAt: Date,
    kycRejectionReason: String,
    kycComments: String,
    kycResultSeen: { type: Boolean, default: false },
    kycDocuments: { type: Schema.Types.Mixed, default: {} },
    kycDetails: {
      aadharNumber: String,
      governmentIdType: String,
      governmentIdNumber: String,
      dateOfBirth: Date,
      profilePhotoUrl: String,
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    addresses: [
      {
        _id: Schema.Types.ObjectId,
        streetAddress: String,
        area: String,
        city: String,
        state: String,
        pincode: String,
        latitude: Number,
        longitude: Number,
        isDefault: { type: Boolean, default: false },
      },
    ],
    verified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    socialLinks: { linkedin: String, twitter: String, facebook: String, instagram: String },
    socialAuth: {
      provider: { type: String, enum: Object.values(SocialAuthProvider), default: null },
      providerId: String,
    },
    notificationPreferences: {
      orderUpdates: { type: Boolean, default: true },
      cropUpdates: { type: Boolean, default: true },
      reviews: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
    },
    blockedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
);

userSchema.index({ role: 1 });
userSchema.index({ kycStatus: 1 });

export type UserModel = Model<IUser>;

const User: UserModel = mongoose.model<IUser>('User', userSchema);
export default User;
