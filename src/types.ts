export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type IssueStatus = 'reported' | 'verified' | 'in_progress' | 'escalated' | 'resolved' | 'rejected' | 'under_review';

export interface LocationInfo {
  lat: number;
  lng: number;
  address: string;
  area: string;
  city: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
}

export interface AIAnalysis {
  title?: string;
  description?: string;
  category: string;
  severityScore: number;
  severityReasoning: string;
  estimatedImpactRadius: number;
  suggestedAuthority: string;
  estimatedResolutionDays: number;
  urgencyKeywords: string[];
  confidence: number;
  authenticityScore: number;
  authenticityReasoning: string;
}

export interface AgentHistoryEntry {
  action: string;
  timestamp: string;
  details: string;
  automated: boolean;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: Severity;
  severityScore: number;
  status: IssueStatus;
  location: LocationInfo;
  images: string[];
  reportedBy: string;
  reportedByName: string;
  reportedByAvatar: string;
  reportedAt: string;
  verifications: string[]; // User UIDs
  verificationCount: number;
  upvotes: string[]; // User UIDs
  comments: Comment[];
  aiAnalysis: AIAnalysis;
  agentHistory: AgentHistoryEntry[];
  escalatedAt: string | null;
  resolvedAt: string | null;
  resolutionTimeHours: number | null;
  tags: string[];
  anonymous: boolean;
  anonymousToken: string | null;
  isFake: boolean;
  flagCount: number;
  flags: string[]; // User UIDs who flagged as fake
  adoptedBy: string | null; // Org/business name
  adoptedDate: string | null;
  isChronic: boolean;
  resolvedPhoto: string | null;
  exifChecked: boolean;
  exifWarning: boolean;
}

export interface UserStats {
  reportsSubmitted: number;
  reportsVerified: number;
  issuesResolved: number;
  upvotesGiven: number;
  helpfulnessScore: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
  joinedAt: string;
  stats?: UserStats;
  points: number;
  level: 'Newcomer' | 'Observer' | 'Reporter' | 'Investigator' | 'Guardian' | 'CivicHero';
  badges: string[];
  area: string;
}

export interface AgentLog {
  id: string;
  timestamp: string;
  action: 'auto_escalated' | 'authority_notified' | 'duplicate_merged' | 'severity_upgraded' | 'hotspot_detected' | 'resolution_verified' | 'chronic_zone_tagged' | 'war_room_triggered';
  issueId: string;
  issueTitle: string;
  details: string;
  automated: boolean;
}
