import { z } from 'zod';

export const CreateIssueSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(120),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000),
  category: z.enum(['pothole', 'water_leakage', 'streetlight', 'garbage', 'graffiti', 'road_damage', 'flooding', 'encroachment', 'other']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  severityScore: z.number().int().min(1).max(10),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().min(5),
    area: z.string().min(2),
    city: z.string().min(2),
  }),
  images: z.array(z.string()).min(1, "At least one image is required"),
  aiAnalysis: z.object({
    category: z.string(),
    severityScore: z.number().min(1).max(10),
    severityReasoning: z.string(),
    estimatedImpactRadius: z.number().min(0),
    suggestedAuthority: z.string(),
    confidence: z.number().min(0).max(1),
    authenticityScore: z.number().min(0).max(1),
    authenticityReasoning: z.string(),
    estimatedResolutionDays: z.number().min(0),
    urgencyKeywords: z.array(z.string()),
  }),
  anonymous: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional(),
  exifChecked: z.boolean().optional(),
  exifWarning: z.boolean().optional(),
});

export const VerifyIssueSchema = z.object({
  userLat: z.number().min(-90).max(90),
  userLng: z.number().min(-180).max(180),
});

export const CommentSchema = z.object({
  content: z.string()
    .min(3, "Comment must be at least 3 characters")
    .max(500, "Comment must be under 500 characters"),
});

export const ResolveIssueSchema = z.object({
  resolvedPhotoBase64: z.string().min(100, "A resolution photo is required"),
  userLat: z.number().min(-90).max(90),
  userLng: z.number().min(-180).max(180),
});

export const AdoptIssueSchema = z.object({
  orgName: z.string().min(2, "Organisation name required").max(100),
});

export type CreateIssueInput = z.infer<typeof CreateIssueSchema>;
export type VerifyIssueInput = z.infer<typeof VerifyIssueSchema>;
export type CommentInput = z.infer<typeof CommentSchema>;
export type ResolveIssueInput = z.infer<typeof ResolveIssueSchema>;
export type AdoptIssueInput = z.infer<typeof AdoptIssueSchema>;
