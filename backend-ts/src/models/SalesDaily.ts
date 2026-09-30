import mongoose, { Schema, type Model, type Types } from 'mongoose';

export interface ISalesDaily {
  cropId: Types.ObjectId;
  farmerId: Types.ObjectId;
  date: Date;
  quantitySold: number;
  revenue: number;
  orderCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const salesDailySchema = new Schema<ISalesDaily>(
  {
    cropId: { type: Schema.Types.ObjectId, ref: 'CropListing', required: true, index: true },
    farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true },
    quantitySold: { type: Number, required: true, default: 0, min: 0 },
    revenue: { type: Number, required: true, default: 0, min: 0 },
    orderCount: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true }
);

salesDailySchema.index({ cropId: 1, date: -1 });
salesDailySchema.index({ farmerId: 1, date: -1 });
salesDailySchema.index({ cropId: 1, date: 1 }, { unique: true });

const SalesDaily: Model<ISalesDaily> =
  mongoose.models.SalesDaily || mongoose.model<ISalesDaily>('SalesDaily', salesDailySchema);

export default SalesDaily;
