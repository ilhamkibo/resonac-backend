import { z } from 'zod';

export const thresholdSchema = z.object({
  area: z.string().min(1, 'Area is required'),
  parameter: z.string().min(1, 'Parameter is required'),
  lower_limit: z.number().nullable().optional(),
  upper_limit: z.number().nullable().optional(),
});

export type ThresholdInput = z.infer<typeof thresholdSchema>;
