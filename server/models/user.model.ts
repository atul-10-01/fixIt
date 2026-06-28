import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDocument extends Document {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
  points: number;
  level: 'Newcomer' | 'Observer' | 'Reporter' | 'Investigator' | 'Guardian' | 'CivicHero';
  badges: string[];
  area?: string;
  joinedAt: Date;
  role: 'citizen' | 'admin';
  stats?: {
    reportsSubmitted: number;
    reportsVerified: number;
    issuesResolved: number;
    upvotesGiven: number;
    helpfulnessScore: number;
  };
}

const UserSchema = new Schema<IUserDocument>({
  uid: { type: String, required: true, unique: true, index: true },
  displayName: { type: String, required: true },
  photoURL: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  points: { type: Number, default: 0 },
  level: { 
    type: String, 
    enum: ['Newcomer', 'Observer', 'Reporter', 'Investigator', 'Guardian', 'CivicHero'],
    default: 'Newcomer' 
  },
  badges: { type: [String], default: [] },
  area: { type: String, default: '' },
  joinedAt: { type: Date, default: Date.now },
  role: { type: String, enum: ['citizen', 'admin'], default: 'citizen' },
  stats: {
    reportsSubmitted: { type: Number, default: 0 },
    reportsVerified: { type: Number, default: 0 },
    issuesResolved: { type: Number, default: 0 },
    upvotesGiven: { type: Number, default: 0 },
    helpfulnessScore: { type: Number, default: 0 }
  }
});

export const User = mongoose.model<IUserDocument>('User', UserSchema);
