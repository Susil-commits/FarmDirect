import mongoose, { Schema, type Model, type Types } from 'mongoose';

export interface IAiMessage {
  role: 'user' | 'model' | 'assistant' | 'system';
  content: string;
  toolCalls?: Array<{
    name: string;
    args: Record<string, unknown>;
    result?: unknown;
  }>;
  at: Date;
}

export interface IAiConversation {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  messages: IAiMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const aiMessageSchema = new Schema<IAiMessage>(
  {
    role: {
      type: String,
      enum: ['user', 'model', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    toolCalls: {
      type: [Schema.Types.Mixed],
      default: undefined,
    },
    at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const aiConversationSchema = new Schema<IAiConversation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'AgriBot Conversation',
      maxlength: 120,
    },
    messages: {
      type: [aiMessageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for listing user conversations fast
aiConversationSchema.index({ userId: 1, updatedAt: -1 });

// TTL index: expire conversations after 30 days of inactivity
aiConversationSchema.index(
  { updatedAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 }
);

const AiConversation: Model<IAiConversation> =
  mongoose.models.AiConversation ||
  mongoose.model<IAiConversation>('AiConversation', aiConversationSchema);

export default AiConversation;
