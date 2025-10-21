import { z } from 'zod';
import {
  aggregateSchema,
  areaSchema,
  periodSchema,
  resolutionSchema,
} from './commonSchemas';

// src/lib/validators/measurementValidator.ts

export const measurementQuerySchema = z.object({
  area: areaSchema.optional(),
  period: periodSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  aggregate: aggregateSchema.optional(),
  resolution: resolutionSchema.optional(),
});

export type MeasurementQuery = z.infer<typeof measurementQuerySchema>;
