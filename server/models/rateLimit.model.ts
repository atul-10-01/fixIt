import mongoose, { Schema, Document } from 'mongoose';

export interface RateLimitDocument extends Document {
  key: string;
  count: number;
  resetAt: Date;
}

const RateLimitSchema = new Schema<RateLimitDocument>({
  key: { type: String, required: true, unique: true, index: true },
  count: { type: Number, default: 1 },
  resetAt: { type: Date, required: true },
});

// Automatically delete records when resetAt has passed
RateLimitSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimit = mongoose.model<RateLimitDocument>('RateLimit', RateLimitSchema);
