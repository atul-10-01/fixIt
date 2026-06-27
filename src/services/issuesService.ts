import api from './api';

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
  }): Promise<GenerateComplaintResponse> => {
    const response = await api.post<GenerateComplaintResponse>('/api/generate-complaint', params);
    return response.data;
  },
};
