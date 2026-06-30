import api from './api';
import { Issue, UserProfile, AgentLog } from '../types';

export interface AnalyzeImageResponse {
  title: string;
  description: string;
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

export interface GenerateComplaintResponse {
  text: string;
}

export const issuesService = {
  // AI Endpoints
  analyzeImage: async (imageBase64: string, mimeType: string): Promise<AnalyzeImageResponse> => {
    const response = await api.post<AnalyzeImageResponse>('/api/analyze-image', {
      imageBase64,
      mimeType,
    });
    return response.data;
  },

  generateComplaint: async (params: {
    title: string;
    description: string;
    category: string;
    severity: string;
    verificationCount: number;
    location: any;
    daysUnresolved: number;
    reporterName: string;
    generatedDate: string;
  }): Promise<GenerateComplaintResponse> => {
    const response = await api.post<GenerateComplaintResponse>('/api/generate-complaint', params);
    return response.data;
  },

  // Authentication API Endpoints
  getMe: async (): Promise<UserProfile | null> => {
    const response = await api.get<UserProfile | null>('/api/auth/me');
    return response.data;
  },

  logout: async (): Promise<{ success: boolean }> => {
    const response = await api.post<{ success: boolean }>('/api/auth/logout');
    return response.data;
  },

  // Issues REST API Endpoints
  fetchIssues: async (): Promise<Issue[]> => {
    const response = await api.get<Issue[]>('/api/issues');
    return response.data;
  },

  createIssue: async (issueData: any): Promise<Issue> => {
    const response = await api.post<Issue>('/api/issues', issueData);
    return response.data;
  },

  verifyIssue: async (id: string, userLat: number, userLng: number): Promise<{ success: boolean; issue: Issue }> => {
    const response = await api.put<{ success: boolean; issue: Issue }>(`/api/issues/${id}/verify`, { userLat, userLng });
    return response.data;
  },

  upvoteIssue: async (id: string): Promise<Issue> => {
    const response = await api.put<Issue>(`/api/issues/${id}/upvote`);
    return response.data;
  },

  flagIssue: async (id: string): Promise<Issue> => {
    const response = await api.put<Issue>(`/api/issues/${id}/flag`);
    return response.data;
  },

  addComment: async (id: string, content: string): Promise<Issue> => {
    const response = await api.post<Issue>(`/api/issues/${id}/comments`, { content });
    return response.data;
  },

  adoptIssue: async (id: string, orgName: string): Promise<Issue> => {
    const response = await api.put<Issue>(`/api/issues/${id}/adopt`, { orgName });
    return response.data;
  },

  resolveIssue: async (id: string, resolvedPhotoBase64: string, userLat: number, userLng: number): Promise<{ success: boolean; issue: Issue }> => {
    const response = await api.put<{ success: boolean; issue: Issue }>(`/api/issues/${id}/resolve`, {
      resolvedPhotoBase64,
      userLat,
      userLng
    });
    return response.data;
  },

  fetchLeaderboard: async (): Promise<UserProfile[]> => {
    const response = await api.get<UserProfile[]>('/api/users');
    return response.data;
  },

  toggleRole: async (): Promise<UserProfile> => {
    const response = await api.put<UserProfile>('/api/users/toggle-role');
    return response.data;
  },

  runAgentSweep: async (): Promise<{ success: boolean; logs: AgentLog[]; issues: Issue[] }> => {
    const response = await api.post<{ success: boolean; logs: AgentLog[]; issues: Issue[] }>('/api/agent/sweep');
    return response.data;
  },

  resetDatabase: async (): Promise<{ success: boolean; issues: Issue[]; users: UserProfile[]; currentUser: UserProfile }> => {
    const response = await api.post<{ success: boolean; issues: Issue[]; users: UserProfile[]; currentUser: UserProfile }>('/api/admin/reset');
    return response.data;
  }
};
