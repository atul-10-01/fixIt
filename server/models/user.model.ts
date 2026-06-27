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
  joinedAt: { type: Date, default: Date.now }
});

export const User = mongoose.model<IUserDocument>('User', UserSchema);
