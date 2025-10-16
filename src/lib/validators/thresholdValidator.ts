// thresholdSchema.ts
import { z } from 'zod';

export const thresholdSchema = z.object({
  area: z.string().min(1, 'Area harus diisi'),
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
