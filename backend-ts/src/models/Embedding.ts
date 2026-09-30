import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IEmbedding extends Document {
  sourceId: string;
  title: string;
  category: string;
  entityType?: 'farming_kb' | 'crop_listing';
  cropId?: mongoose.Types.ObjectId;
  content: string;
  embedding: number[];
  tags: string[];
  attribution: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const embeddingSchema = new Schema<IEmbedding>(
  {
    sourceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ['farming_kb', 'crop_listing'],
      default: 'farming_kb',
      index: true,
    },
    cropId: {
      type: Schema.Types.ObjectId,
      ref: 'CropListing',
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    attribution: {
      type: String,
      default: 'FarmDirect Agricultural Knowledge Base & KVK Best Practices',
    },
  },
  {
    timestamps: true,
  }
);

embeddingSchema.index({ tags: 1 });
embeddingSchema.index({ title: 'text', content: 'text' });

const Embedding: Model<IEmbedding> = mongoose.model<IEmbedding>('Embedding', embeddingSchema);

export default Embedding;
