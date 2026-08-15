import mongoose, { Schema, type Model, type Document } from 'mongoose';

export interface IUserOrderStats extends Document<string> {
  _id: string; 
  n: number;
  mean: number;
  m2: number;
  updatedAt: Date;
}

const userOrderStatsSchema = new Schema<IUserOrderStats>({
  _id: { type: String, required: true },
  n: { type: Number, required: true, default: 0 },
  mean: { type: Number, required: true, default: 0 },
  m2: { type: Number, required: true, default: 0 },
  updatedAt: { type: Date, required: true, default: Date.now }
});

const UserOrderStats: Model<IUserOrderStats> = mongoose.model<IUserOrderStats>('UserOrderStats', userOrderStatsSchema);
export default UserOrderStats;
