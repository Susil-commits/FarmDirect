import mongoose, { Schema, type Model, type Document } from 'mongoose';

export interface IRevokedToken extends Document {
  jti: string;
  expiresAt: Date;
  createdAt: Date;
}

const revokedTokenSchema = new Schema<IRevokedToken>({
  jti: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

revokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RevokedToken: Model<IRevokedToken> =
  mongoose.models.RevokedToken || mongoose.model<IRevokedToken>('RevokedToken', revokedTokenSchema);

export default RevokedToken;
