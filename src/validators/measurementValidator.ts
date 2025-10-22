import { z } from 'zod';

// Skema ini sekarang langsung memvalidasi isi dari req.query
export const getMeasurementsQuerySchema = z
  .object({
    aggregationType: z.enum(['avg', 'min', 'max']),
    period: z.enum(['hour', 'day', 'week', 'month']).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    areas: z
      .string()
      .optional()
      .transform((val) => (val ? val.split(',') : undefined)),
  })
  .refine(
    (data) => {
      // Logika refine tetap sama, tapi sekarang langsung di level query
      return (
        (data.period && !data.startDate && !data.endDate) ||
        (!data.period && data.startDate && data.endDate)
      );
    },
    {
      message:
        "Please provide either 'period' or both 'startDate' and 'endDate'.",
      // Path bisa ditambahkan agar error lebih jelas
      path: ['period'],
    },
  );

// Ubah juga nama Type agar sesuai
export type GetMeasurementsQuery = z.infer<typeof getMeasurementsQuerySchema>;
