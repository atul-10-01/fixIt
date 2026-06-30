import { z } from 'zod';

export const aiAnalysisResponseSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.string(),
  severityScore: z.coerce.number().min(1).max(10),
  severityReasoning: z.string(),
  estimatedImpactRadius: z.coerce.number(),
  suggestedAuthority: z.string(),
  estimatedResolutionDays: z.coerce.number(),
  urgencyKeywords: z.array(z.string()),
  confidence: z.coerce.number(),
  authenticityScore: z.coerce.number(),
  authenticityReasoning: z.string(),
  isSimulated: z.boolean().optional(),
  simulationReason: z.string().optional(),
});

export const complaintResponseSchema = z.object({
  text: z.string(),
  isSimulated: z.boolean().optional(),
  simulationReason: z.string().optional(),
});

export type AIAnalysisResponse = z.infer<typeof aiAnalysisResponseSchema>;
export type ComplaintResponse = z.infer<typeof complaintResponseSchema>;
