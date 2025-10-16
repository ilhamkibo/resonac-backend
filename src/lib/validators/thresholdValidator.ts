// thresholdSchema.ts
import { z } from 'zod';

const AreaValues = ['main', 'pilot', 'oil'] as const;

export const thresholdSchema = z.object({
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

export type ThresholdInput = z.infer<typeof thresholdSchema>;
