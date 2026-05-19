import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    // Participants
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Message Content
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 5000,
    },

    // Context (which crop the message is about - optional)
    cropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CropListing',
      default: null,
    },

    // Context (which order the message is about - optional)
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },

    // Message Status
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },

    // Message Type
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'notification'],
      default: 'text',
    },

    // Attachments (for images/files)
    attachments: [
      {
        url: String,
        type: { type: String, enum: ['image', 'document', 'other'] },
        size: Number,
      },
    ],

    // Conversation Reference (for faster lookups)
    conversationId: {
      type: String,
      index: true,
      // Format: "farmerId_buyerId" (always smaller ID first for consistency)
    },

    // Message flags
    isDeleted: {
      type: Boolean,
      default: false,
    },

    isEdited: {
      type: Boolean,
      default: false,
    },

    editedAt: {
      type: Date,
      default: null,
    },

    // For future features
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },

    metadata: {
      location: String,
      deviceType: String,
    },
  },
  {
    timestamps: true,
    indexes: [
      { conversationId: 1, createdAt: -1 },
      { senderId: 1, receiverId: 1 },
      { isRead: 1, receiverId: 1 },
    ],
  }
);

// Compound index for conversation lookup
messageSchema.index({ conversationId: 1, createdAt: -1 });

// Auto-populate before querying
messageSchema.pre(/^find/, function (next) {
  if (this.options._recursed) return next();

  this.populate({
    path: 'senderId',
    select: 'firstName lastName email profilePhoto role',
  }).populate({
    path: 'receiverId',
    select: 'firstName lastName email profilePhoto role',
  });

  next();
});

// Helper method to generate conversation ID (consistent format)
messageSchema.statics.generateConversationId = function (userId1, userId2) {
  const ids = [userId1.toString(), userId2.toString()].sort();
  return `${ids[0]}_${ids[1]}`;
};

export default mongoose.model('Message', messageSchema);
