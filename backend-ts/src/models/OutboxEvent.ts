import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IOutboxEvent extends Document {
  eventType: string;
  payload: any;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  createdAt: Date;
  updatedAt: Date;
  retryCount: number;
}

const outboxEventSchema = new Schema<IOutboxEvent>(
  {
    eventType: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    status: { type: String, enum: ['PENDING', 'PROCESSED', 'FAILED'], default: 'PENDING', index: true },
    retryCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const OutboxEvent: Model<IOutboxEvent> = mongoose.models.OutboxEvent || mongoose.model<IOutboxEvent>('OutboxEvent', outboxEventSchema);

export default OutboxEvent;
