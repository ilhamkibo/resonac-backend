import { z } from 'zod';

export const registerSchema = z
  .object({
    username: z
      .string({ required_error: 'Username harus diisi' })
      .min(3, 'Username minimal 3 karakter')
      .optional(),
    email: z
      .string({ required_error: 'Email harus diisi' })
      .email('Format email tidak valid')
      .optional(),
    password: z
      .string({ required_error: 'Password harus diisi' })
      .min(6, 'Password minimal 6 karakter'),
    name: z
      .string({
        required_error: 'Name harus diisi',
        invalid_type_error: 'Name harus berupa teks',
      })
      .min(3, 'Name minimal 3 karakter'),
  })
  .refine((data) => data.username || data.email, {
    message: 'Username atau email harus diisi',
    path: ['username'],
  });

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Username or email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});
