import mongoose, { Schema, type Model } from 'mongoose';
import type { IContact } from '../types/index.js';

const contactSchema = new Schema<IContact>({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide valid email'],
  },
  subject: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  status: { type: String, enum: ['new', 'read', 'replied', 'resolved'], default: 'new' },
  reply: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  repliedAt: { type: Date, default: null },
});

contactSchema.index({ status: 1, createdAt: -1 });
contactSchema.index({ email: 1 });

const Contact: Model<IContact> = mongoose.model<IContact>('Contact', contactSchema);
export default Contact;
