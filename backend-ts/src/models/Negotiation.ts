import mongoose, { Schema, type Model } from 'mongoose';
import type { INegotiation } from '../types/index.js';
import { NegotiationStatus } from '../types/enums.js';

const negotiationSchema = new Schema<INegotiation>(
  {
    cropId: { type: Schema.Types.ObjectId, ref: 'CropListing', required: true },
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    originalPrice: { type: Number, required: true },
    offeredPrice: { type: Number, required: true, min: 0.01 },
    quantity: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: Object.values(NegotiationStatus),
      default: NegotiationStatus.Pending,
    },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
    lastActionBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    timeline: [
      {
        status: { type: String, enum: Object.values(NegotiationStatus), required: true },
        offeredPrice: { type: Number },
        message: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    isSynthetic: { type: Boolean, default: false },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      index: { expires: 0 },
    },
  },
  { timestamps: true },
);

negotiationSchema.index({ buyerId: 1, status: 1 });
negotiationSchema.index({ farmerId: 1, status: 1 });
negotiationSchema.index({ cropId: 1 });
negotiationSchema.index({ cropId: 1, buyerId: 1, status: 1 });

const Negotiation: Model<INegotiation> = mongoose.model<INegotiation>('Negotiation', negotiationSchema);
export default Negotiation;
