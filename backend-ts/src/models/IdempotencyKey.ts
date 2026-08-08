import mongoose, { Schema, type Model, type Document } from 'mongoose';

export interface IIdempotencyKey extends Document {
  key: string;
  status: 'pending' | 'completed' | 'failed';
  requestHash: string;
  responseBody: any | null;
  responseStatus: number | null;
  orderId: mongoose.Types.ObjectId | null;
  createdAt: Date;
  expiresAt: Date;
}

const idempotencyKeySchema = new Schema<IIdempotencyKey>({
  key: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], required: true },
  requestHash: { type: String, required: true },
  responseBody: { type: Schema.Types.Mixed, default: null },
  responseStatus: { type: Number, default: null },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
  createdAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true }
});

idempotencyKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const IdempotencyKey: Model<IIdempotencyKey> = mongoose.model<IIdempotencyKey>('IdempotencyKey', idempotencyKeySchema);
export default IdempotencyKey;
