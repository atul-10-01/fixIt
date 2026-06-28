/**
 * MongoDB database model schema for tracking user authentication sessions with automatic TTL expiry.
 */
import mongoose, { Schema, Document } from 'mongoose';

export interface SessionDocument extends Document {
  sessionId: string;
  uid: string;
  createdAt: Date;
  expiresAt: Date;
}

const SessionSchema = new Schema<SessionDocument>({
  sessionId: { type: String, required: true, unique: true, index: true },
  uid: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

// TTL index — MongoDB automatically deletes expired sessions
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = mongoose.model<SessionDocument>('Session', SessionSchema);
