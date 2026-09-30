import mongoose, { Schema, type Model, type Document, type Types } from 'mongoose';

export interface IAiUsage {
  userId?: Types.ObjectId | null;
  feature: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
  success: boolean;
  errorMessage?: string | null;
  at: Date;
  createdAt: Date;
}

const aiUsageSchema = new Schema<IAiUsage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    feature: { type: String, required: true, index: true },
    model: { type: String, required: true },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    latencyMs: { type: Number, default: 0 },
    success: { type: Boolean, default: true },
    errorMessage: { type: String, default: null },
    at: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

aiUsageSchema.index({ userId: 1, at: -1 });
aiUsageSchema.index({ feature: 1, at: -1 });
// TTL index: expire usage records after 180 days
aiUsageSchema.index({ at: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

const AiUsage: Model<IAiUsage> =
  mongoose.models.AiUsage || mongoose.model<IAiUsage>('AiUsage', aiUsageSchema);

export default AiUsage;
