// src/validators/manualInputValidator.ts

import { z } from 'zod';
import { areaSchema, periodSchema } from './commonSchemas';

// Skema untuk satu item detail di dalam array 'details'
const manualInputDetailSchema = z
  .object({
    area: areaSchema,

    // Semua field pengukuran dibuat opsional terlebih dahulu
    ampere_r: z.number().optional(),
    ampere_s: z.number().optional(),
    ampere_t: z.number().optional(),
    volt_r: z.number().optional(),
    volt_s: z.number().optional(),
    volt_t: z.number().optional(),
    pf: z.number().optional(),
    kwh: z.number().optional(),
    oil_pressure: z.number().optional(),
    oil_temperature: z.number().optional(),
  })
  // Validasi kondisional: field yang wajib diisi bergantung pada nilai 'area'
  .superRefine((data, ctx) => {
    if (data.area === 'main' || data.area === 'pilot') {
      // Jika area adalah main/pilot, semua field listrik wajib ada
      const requiredFields: (keyof typeof data)[] = [
        'ampere_r',
        'ampere_s',
        'ampere_t',
        'volt_r',
        'volt_s',
        'volt_t',
        'pf',
        'kwh',
      ];
      for (const field of requiredFields) {
        if (data[field] == null) {
          // Cek null atau undefined
          ctx.addIssue({
            code: z.ZodIssueCode.invalid_type,
            expected: 'number',
            received: typeof data[field],
            path: [field],
            message: `${field} wajib diisi untuk area '${data.area}'.`,
          });
        }
      }
    } else if (data.area === 'oil') {
      // Jika area adalah oil, field oil wajib ada
      const requiredFields: (keyof typeof data)[] = ['oil_temperature'];
      for (const field of requiredFields) {
        if (data[field] == null) {
          ctx.addIssue({
            code: z.ZodIssueCode.invalid_type,
            expected: 'number',
            received: typeof data[field],
            path: [field],
            message: `${field} wajib diisi untuk area '${data.area}'.`,
          });
        }
      }
    }
  });

// Skema utama untuk keseluruhan body request
export const createManualInputSchema = z.object({
  // userId harus angka integer positif
  userId: z.number().int().positive('User ID tidak valid.'),

  // timestamp bisa berupa string tanggal yang akan diubah menjadi objek Date
  timestamp: z.coerce.date(),

  // details harus berupa array dari objek detail, dan tidak boleh kosong
  details: z
    .array(manualInputDetailSchema)
    .min(1, 'Minimal harus ada satu detail input.'),
});

// Mengekstrak tipe data dari skema untuk digunakan di service/controller
// Skema untuk memvalidasi query GET manual inputs
export const getManualInputsSchema = z
  .object({
    // Filter waktu standar
    period: periodSchema.optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),

    // Filter spesifik untuk manual inputs
    userId: z.coerce.number().int().positive().optional(),
    area: areaSchema.optional(),

    // Pagination
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
    path: ['startDate'],
  })
  .transform((data) => {
    let modifiedData = { ...data };

    // Atur default 'daily' jika tidak ada filter waktu sama sekali
    if (
      !modifiedData.period &&
      !modifiedData.startDate &&
      !modifiedData.endDate
    ) {
      modifiedData.period = 'daily';
    }

    // Atur endDate ke hari ini jika hanya startDate yang diberikan
    if (modifiedData.startDate && !modifiedData.endDate) {
      modifiedData.endDate = new Date();
    }

    return modifiedData;
  });

export type GetManualInputsQuery = z.infer<typeof getManualInputsSchema>;
export type CreateManualInputPayload = z.infer<typeof createManualInputSchema>;
