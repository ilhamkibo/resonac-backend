import { z } from 'zod';

export const dynamicMeasurementSchema = z.object({
  aggregate: z.enum(['none', 'avg', 'min', 'max']).default('none'),
  bucket: z.string().default('1 minute'),
  duration: z.string().optional(), // <--- hapus default '1 day'
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
  area: z.string().default('main'),
});
