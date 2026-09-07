import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IOutboxEvent extends Document {
  eventType: string;
  payload: any;
  status: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
  createdAt: Date;
  updatedAt: Date;
  retryCount: number;
}

const outboxEventSchema = new Schema<IOutboxEvent>(
  {
    eventType: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'PROCESSED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    retryCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

outboxEventSchema.index({ status: 1, createdAt: 1 });

const OutboxEvent: Model<IOutboxEvent> = mongoose.models.OutboxEvent || mongoose.model<IOutboxEvent>('OutboxEvent', outboxEventSchema);

export default OutboxEvent;
