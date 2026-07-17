import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface ICartItem {
  cropId: Types.ObjectId;
  quantity: number;
}

export interface ICart extends Document {
  userId: Types.ObjectId;
  items: ICartItem[];
}

const cartItemSchema = new Schema<ICartItem>({
  cropId: { type: Schema.Types.ObjectId, ref: 'CropListing', required: true },
  quantity: { type: Number, required: true, min: 1 },
}, { _id: false });

const cartSchema = new Schema<ICart>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema],
}, { timestamps: true });

export default mongoose.model<ICart>('Cart', cartSchema);
