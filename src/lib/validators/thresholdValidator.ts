// thresholdSchema.ts
import { z } from 'zod';

const AreaValues = ['main', 'pilot', 'oil'] as const;

// Skema dasar yang bisa kita gunakan kembali
const baseThresholdSchema = z.object({
  area: z.enum(AreaValues),
  parameter: z.string().min(1, 'Parameter harus diisi'),
  lowerLimit: z.number({
    required_error: 'lowerLimit harus diisi',
    invalid_type_error: 'lowerLimit harus berupa angka',
  }),
  upperLimit: z.number({
    required_error: 'upperLimit harus diisi',
    invalid_type_error: 'upperLimit harus berupa angka',
  }),
});

// Skema untuk CREATE (semua field wajib)
export const createThresholdSchema = baseThresholdSchema;

// Skema untuk UPDATE (semua field opsional)
export const updateThresholdSchema = baseThresholdSchema.partial();

// Skema untuk memvalidasi query parameter
export const getThresholdsQuerySchema = z.object({
  area: z.enum(AreaValues).optional(),
});

// Tipe yang di-generate
export type CreateThresholdInput = z.infer<typeof createThresholdSchema>;
export type UpdateThresholdInput = z.infer<typeof updateThresholdSchema>;
