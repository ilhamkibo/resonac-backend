import { z } from 'zod';
import { areaSchema, periodSchema } from './commonSchemas'; // ✨ 1. Impor skema umum

const parameterAliasMap = {
  ampere: ['ampere_rs', 'ampere_st', 'ampere_tr'],
  volt: ['volt_rs', 'volt_st', 'volt_tr'],
};

export const errorHistoryQuerySchema = z
  .object({
    period: periodSchema.optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    area: areaSchema.optional().default('main'),
    parameter: z
      .string()
      .optional()
      .transform((param) => {
        if (param && param in parameterAliasMap) {
          return parameterAliasMap[param as keyof typeof parameterAliasMap];
        }
        return param;
      }),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
  })
  .refine((data) => !(data.period && (data.startDate || data.endDate)), {
    message:
      "Hanya bisa menggunakan filter 'period' atau 'startDate'/'endDate', tidak keduanya.",
    path: ['period'],
  })
  .refine((data) => !(data.endDate && !data.startDate), {
    message: 'startDate harus diisi jika menggunakan endDate.',
    path: ['startDate'], // Menampilkan error pada field startDate yang hilang
  })
  .transform((data) => {
    let modifiedData = { ...data };
    if (
      !modifiedData.period &&
      !modifiedData.startDate &&
      !modifiedData.endDate
    ) {
      modifiedData.period = 'daily';
    }
    if (modifiedData.startDate && !modifiedData.endDate) {
      modifiedData.endDate = new Date(); // Default ke waktu sekarang
    }
    if (!modifiedData.parameter) {
      if (modifiedData.area === 'oil') {
        modifiedData.parameter = 'temp';
      } else {
        modifiedData.parameter = 'pressure';
      }
    }

    return modifiedData;
  });

export type ErrorHistoryQuery = z.infer<typeof errorHistoryQuerySchema>;
