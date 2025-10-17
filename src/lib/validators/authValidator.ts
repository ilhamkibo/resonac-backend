import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email harus diisi' })
    .email('Format email tidak valid')
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password harus diisi' })
    .min(6, 'Password minimal 6 karakter'),
  name: z
    .string({
      required_error: 'Name harus diisi',
      invalid_type_error: 'Name harus berupa teks',
    })
    .min(3, 'Name minimal 3 karakter'),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email harus diisi' })
    .email('Format email tidak valid'),
  password: z
    .string({ required_error: 'Password harus diisi' })
    .min(6, 'Password minimal 6 karakter'),
});

// (Opsional) Jika Anda menggunakan TypeScript, ini akan sangat membantu
export type LoginSchema = z.infer<typeof loginSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
