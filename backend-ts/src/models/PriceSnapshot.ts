import mongoose, { Schema, type Model, type Document, type Types } from 'mongoose';

export interface IPriceSnapshot {
  cropId: Types.ObjectId;
  cropName: string;
  category: string;
  region: string;
  price: number;
  unit: string;
  isOrganic?: boolean;
  source?: 'listing_created' | 'price_updated' | 'order_completed' | 'seed';
  at: Date;
  createdAt: Date;
  updatedAt: Date;
}

const priceSnapshotSchema = new Schema<IPriceSnapshot>(
  {
    cropId: { type: Schema.Types.ObjectId, ref: 'CropListing', required: true, index: true },
    cropName: { type: String, required: true, trim: true, lowercase: true },
    category: { type: String, required: true, trim: true, lowercase: true },
    region: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, default: 'kg' },
    isOrganic: { type: Boolean, default: false },
    source: {
      type: String,
      enum: ['listing_created', 'price_updated', 'order_completed', 'seed'],
      default: 'listing_created',
    },
    at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

priceSnapshotSchema.index({ cropName: 1, region: 1, at: -1 });
priceSnapshotSchema.index({ category: 1, region: 1, at: -1 });

const PriceSnapshot: Model<IPriceSnapshot> =
  mongoose.models.PriceSnapshot || mongoose.model<IPriceSnapshot>('PriceSnapshot', priceSnapshotSchema);

export default PriceSnapshot;
