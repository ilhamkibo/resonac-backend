import { z } from 'zod';

// Skema ini sekarang langsung memvalidasi isi dari req.query
// export const getMeasurementsQuerySchema = z
//   .object({
//     aggregationType: z.enum(['avg', 'min', 'max']),
//     period: z.enum(['hour', 'day', 'week', 'month']).optional(),
//     startDate: z.string().datetime().optional(),
//     endDate: z.string().datetime().optional(),
//     areas: z
//       .string()
//       .optional()
//       .transform((val) => (val ? val.split(',') : undefined)),
//   })
//   .refine(
//     (data) => {
//       // Logika refine tetap sama, tapi sekarang langsung di level query
//       return (
//         (data.period && !data.startDate && !data.endDate) ||
//         (!data.period && data.startDate && data.endDate)
//       );
//     },
//     {
//       message:
//         "Please provide either 'period' or both 'startDate' and 'endDate'.",
//       // Path bisa ditambahkan agar error lebih jelas
//       path: ['period'],
//     },
//   );

export const getMeasurementsQuerySchema = z
  .object({
    aggregationType: z.enum(['avg', 'min', 'max']).optional(),
    period: z.enum(['hour', 'day', 'week', 'month']).optional(),
    startDate: z
      .string()
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        const d = new Date(val);
        if (isNaN(d.getTime())) throw new Error('Invalid datetime');
        d.setHours(0, 0, 0, 0);
        return d.toISOString();
      }),
    endDate: z
      .string()
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        const d = new Date(val);
        if (isNaN(d.getTime())) throw new Error('Invalid datetime');
        d.setHours(23, 59, 59, 999);
        return d.toISOString();
      }),
    areas: z
      .string()
      .optional()
      .transform((val) => (val ? val.split(',') : undefined)),
    page: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 50)),
  })
  .refine(
    (data) => {
      if (data.aggregationType) {
        return (
          (data.period && !data.startDate && !data.endDate) ||
          (!data.period && data.startDate && data.endDate)
        );
      }
      return true;
    },
    {
      message:
        "When 'aggregationType' is provided, please provide either 'period' or both 'startDate' and 'endDate'.",
      path: ['period', 'startDate', 'endDate'],
    },
  );

// Ubah juga nama Type agar sesuai
export type GetMeasurementsQuery = z.infer<typeof getMeasurementsQuerySchema>;
