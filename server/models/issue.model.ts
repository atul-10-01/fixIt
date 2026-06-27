import mongoose, { Schema, Document } from 'mongoose';

export interface IssueDocument extends Document {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  severityScore: number;
  status: 'reported' | 'verified' | 'in_progress' | 'resolved' | 'escalated' | 'under_review' | 'rejected';
  anonymous: boolean;
  anonymousToken?: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    area: string;
    city: string;
  };
  images: string[];
  reportedBy: string;
  reportedByName: string;
  reportedByAvatar: string;
  reportedAt: Date;
  verifications: string[];
  verificationCount: number;
  upvotes: string[];
  comments: Array<{
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    content: string;
    timestamp: Date;
  }>;
  aiAnalysis: {
    category: string;
    severityScore: number;
    severityReasoning: string;
    estimatedImpactRadius: number;
    suggestedAuthority: string;
    confidence: number;
    authenticityScore: number;
    authenticityReasoning: string;
    estimatedResolutionDays: number;
    urgencyKeywords: string[];
  };
  agentHistory: Array<{
    action: string;
    timestamp: Date;
    details: string;
    automated: boolean;
  }>;
  escalatedAt?: Date;
  resolvedAt?: Date;
  resolutionTimeHours?: number;
  adoptedBy?: string;
  adoptedDate?: Date;
  isFake: boolean;
  flagCount: number;
  flags: string[];
  resolvedPhoto?: string;
  isChronic: boolean;
  tags: string[];
  exifChecked?: boolean;
  exifWarning?: boolean;
}

const IssueSchema = new Schema<IssueDocument>({
  id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  severityScore: { type: Number, required: true },
  status: { type: String, enum: ['reported', 'verified', 'in_progress', 'resolved', 'escalated', 'under_review', 'rejected'], default: 'reported', required: true },
  anonymous: { type: Boolean, default: false },
  anonymousToken: { type: String },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, required: true },
    area: { type: String, required: true },
    city: { type: String, required: true }
  },
  images: { type: [String], required: true },
  reportedBy: { type: String, required: true, index: true },
  reportedByName: { type: String, required: true },
  reportedByAvatar: { type: String, required: true },
  reportedAt: { type: Date, default: Date.now },
  verifications: { type: [String], default: [] },
  verificationCount: { type: Number, default: 0 },
  upvotes: { type: [String], default: [] },
  comments: [{
    id: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userAvatar: { type: String, required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  aiAnalysis: {
    category: { type: String, required: true },
    severityScore: { type: Number, required: true },
    severityReasoning: { type: String, required: true },
    estimatedImpactRadius: { type: Number, required: true },
    suggestedAuthority: { type: String, required: true },
    confidence: { type: Number, required: true },
    authenticityScore: { type: Number, required: true },
    authenticityReasoning: { type: String, required: true },
    estimatedResolutionDays: { type: Number, required: true },
    urgencyKeywords: { type: [String], default: [] }
  },
  agentHistory: [{
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    details: { type: String, required: true },
    automated: { type: Boolean, default: true }
  }],
  escalatedAt: { type: Date },
  resolvedAt: { type: Date },
  resolutionTimeHours: { type: Number },
  adoptedBy: { type: String },
  adoptedDate: { type: Date },
  isFake: { type: Boolean, default: false },
  flagCount: { type: Number, default: 0 },
  flags: { type: [String], default: [] },
  resolvedPhoto: { type: String },
  isChronic: { type: Boolean, default: false },
  tags: { type: [String], default: [] },
  exifChecked: { type: Boolean, default: false },
  exifWarning: { type: Boolean, default: false }
});

export const Issue = mongoose.model<IssueDocument>('Issue', IssueSchema);
