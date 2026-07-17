import mongoose, { Schema, type Model } from 'mongoose';
import type { IMessage } from '../types/index.js';
import { MessageType } from '../types/enums.js';

const messageSchema = new Schema<IMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true, trim: true, minlength: 1, maxlength: 5000 },
    cropId: { type: Schema.Types.ObjectId, ref: 'CropListing', default: null },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    type: { type: String, enum: Object.values(MessageType), default: MessageType.Text },
    attachments: [
      {
        url: String,
        type: { type: String, enum: ['image', 'document', 'other'] },
        size: Number,
      },
    ],
    conversationId: { type: String, index: true },
    isDeleted: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
    replyTo: { type: Schema.Types.ObjectId, ref: 'Message', default: null },
    metadata: { location: String, deviceType: String },
  },
  {
    timestamps: true,
  },
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ isRead: 1, receiverId: 1 });

messageSchema.pre('find', function (next) {
  const query = this as unknown as { _recursed?: boolean; populate: (opts: unknown[]) => void };
  if (query._recursed) return next();
  query.populate([
    { path: 'senderId', select: 'firstName lastName email profilePhoto role' },
    { path: 'receiverId', select: 'firstName lastName email profilePhoto role' },
  ]);
  next();
});

export interface MessageModel extends Model<IMessage> {
  generateConversationId(userId1: string, userId2: string): string;
}

messageSchema.statics.generateConversationId = function (
  userId1: string,
  userId2: string,
): string {
  const ids = [userId1.toString(), userId2.toString()].sort();
  return `${ids[0]}_${ids[1]}`;
};

const Message: MessageModel = mongoose.model<IMessage, MessageModel>('Message', messageSchema);
export default Message;
