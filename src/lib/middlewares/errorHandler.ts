// import { NextFunction, Request, Response } from 'express';
// import { ZodError } from 'zod';
// import { errorResponse } from '../response/response';

// export const errorHandler = (
//   err: any,
//   _req: Request,
//   res: Response,
//   _next: NextFunction,
// ) => {
//   console.error('🔥 Global Error:', err);

//   // 🧩 Tangani error dari Zod
//   if (err instanceof ZodError) {
//     return res.status(400).json({
//       status: 'error',
//       message: 'Validation error',
//       errors: err.errors.map((e) => ({
//         field: e.path.join('.'),
//         message: e.message,
//       })),
//     });
//   }

//   // 🧩 Tangani error umum lain
//   const statusCode = err.statusCode || 500;
//   const message = err.message || 'Internal Server Error';

//   return errorResponse(res, message, statusCode, err);
// };

import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { errorResponse } from '../response/response';
import { Prisma } from '../../generated/prisma'; // ✨ 1. Impor tipe error dari Prisma (pastikan path ini benar)

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error('🔥 Global Error:', err);

  // 🧩 Tangani error dari Zod (TETAP SAMA)
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // ✨ 2. BLOK BARU: Tangani error spesifik dari Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      // Kode P2003: Foreign key constraint failed
      case 'P2003':
        // Dapatkan nama field yang menyebabkan error
        const fieldName = err.meta?.field_name as string;
        let message = `Data relasi tidak valid.`;
        // Buat pesan yang lebih spesifik jika memungkinkan
        if (fieldName && fieldName.includes('user_id')) {
          message = 'User dengan ID yang diberikan tidak ditemukan.';
        }
        return errorResponse(res, message, 400); // 400 Bad Request

      // Kode P2002: Unique constraint failed
      case 'P2002':
        const target = (err.meta?.target as string[])?.join(', ');
        return errorResponse(res, `Data duplikat untuk: ${target}.`, 409); // 409 Conflict

      // Tangani kode error Prisma lain di sini jika perlu
      default:
        // Untuk error Prisma lain yang tidak ditangani, berikan pesan umum
        return errorResponse(res, 'Terjadi kesalahan pada database.', 500);
    }
  }

  // 🧩 Tangani error umum lain (TETAP SAMA)
  // Blok ini hanya akan berjalan jika error BUKAN dari Zod atau Prisma
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return errorResponse(res, message, statusCode, err);
};
