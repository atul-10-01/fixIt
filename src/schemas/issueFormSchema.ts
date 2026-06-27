import { z } from 'zod';

export const issueCategories = [
  'pothole',
  'water_leakage',
  'streetlight',
  'garbage',
  'flooding',
  'encroachment',
  'road_damage'
] as const;

export const issueFormSchema = z.object({
  title: z.string()
    .min(3, { message: "Title must be at least 3 characters long" })
    .max(100, { message: "Title must not exceed 100 characters" }),
  description: z.string()
    .min(10, { message: "Description must be at least 10 characters long" })
    .max(1000, { message: "Description must not exceed 1000 characters" }),
  category: z.enum(['pothole', 'water_leakage', 'streetlight', 'garbage', 'flooding', 'encroachment', 'road_damage'], {
    message: "Please select a valid hazard category"
  }),
  severityScore: z.coerce.number() // coerce to ensure numeric type conversion from string elements
    .min(1, { message: "Severity score must be at least 1" })
    .max(10, { message: "Severity score cannot exceed 10" }),
  uploadedImage: z.string()
    .refine((val) => val.startsWith('data:image/'), {
      message: "Please upload a valid image file"
    }),
  manualAddress: z.string().max(200).optional(),
});

export type IssueFormInput = z.infer<typeof issueFormSchema>;
