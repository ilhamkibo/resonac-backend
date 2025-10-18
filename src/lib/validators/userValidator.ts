import { z } from 'zod';

// Skema untuk memvalidasi query parameter di getAllUsers
export const userQuerySchema = z.object({
  status: z.enum(['approved', 'unapproved']).optional(),
  role: z.enum(['operator', 'admin']).optional(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
});

// Skema untuk memvalidasi body saat update user (semua field opsional)
export const updateUserSchema = z.object({
  email: z.string().email('Email tidak valid.').optional(),
  name: z.string().min(3, 'Nama minimal 3 karakter.').optional(),
  role: z.enum(['operator', 'admin']).optional(),
  isApproved: z.boolean().optional(),
});

// Otomatis membuat Tipe TypeScript dari Skema Zod
export type UserQuery = z.infer<typeof userQuerySchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
