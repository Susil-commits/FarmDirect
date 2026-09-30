import mongoose, { Schema, type Model, type Document, type Types } from 'mongoose';

export type EventType =
  | 'view'
  | 'search'
  | 'click'
  | 'wishlist'
  | 'cart'
  | 'interest'
  | 'offer'
  | 'order';

export interface IEventLog {
  userId?: Types.ObjectId | null;
  sessionId: string;
  type: EventType;
  cropId?: Types.ObjectId | null;
  query?: string;
  meta?: Record<string, unknown>;
  at: Date;
  createdAt: Date;
}

const eventLogSchema = new Schema<IEventLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    sessionId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['view', 'search', 'click', 'wishlist', 'cart', 'interest', 'offer', 'order'],
      required: true,
      index: true,
    },
    cropId: { type: Schema.Types.ObjectId, ref: 'CropListing', default: null, index: true },
    query: { type: String, default: null },
    meta: { type: Schema.Types.Mixed, default: {} },
    at: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// TTL index: 400 days (34,560,000 seconds)
eventLogSchema.index({ at: 1 }, { expireAfterSeconds: 400 * 24 * 60 * 60 });
eventLogSchema.index({ userId: 1, type: 1, at: -1 });
eventLogSchema.index({ cropId: 1, type: 1, at: -1 });

const EventLog: Model<IEventLog> =
  mongoose.models.EventLog || mongoose.model<IEventLog>('EventLog', eventLogSchema);

export default EventLog;
