import mongoose, { Schema, type Model } from 'mongoose';
import type { IContactQuery } from '../types/index.js';
import { InquiryType, ContactQueryStatus, ContactQueryPriority } from '../types/enums.js';

const contactQuerySchema = new Schema<IContactQuery>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      index: true,
    },
    phone: { type: String, trim: true, match: /^[0-9\-+\s()]*$/ },
    inquiryType: {
      type: String,
      enum: Object.values(InquiryType),
      default: InquiryType.General,
      index: true,
    },
    message: { type: String, required: true, trim: true, minlength: 10, maxlength: 5000 },
    status: {
      type: String,
      enum: Object.values(ContactQueryStatus),
      default: ContactQueryStatus.New,
      index: true,
    },
    adminResponse: {
      respondedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      responseMessage: { type: String, trim: true, default: null },
      respondedAt: { type: Date, default: null },
    },
    priority: {
      type: String,
      enum: Object.values(ContactQueryPriority),
      default: ContactQueryPriority.Medium,
    },
    internalNotes: { type: String, trim: true, default: null },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  },
);

contactQuerySchema.index({ email: 1, createdAt: -1 });
contactQuerySchema.index({ status: 1, createdAt: -1 });
contactQuerySchema.index({ inquiryType: 1, createdAt: -1 });

contactQuerySchema.virtual('daysOld').get(function (this: IContactQuery): number {
  const now = new Date();
  const diff = now.getTime() - this.createdAt.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

contactQuerySchema.set('toJSON', { virtuals: true });
contactQuerySchema.set('toObject', { virtuals: true });

contactQuerySchema.index({ name: 'text', email: 'text', message: 'text' });

const ContactQuery: Model<IContactQuery> = mongoose.model<IContactQuery>(
  'ContactQuery',
  contactQuerySchema,
);
export default ContactQuery;
