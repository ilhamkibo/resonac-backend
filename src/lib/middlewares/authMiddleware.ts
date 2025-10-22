import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Tambahkan properti 'user' ke dalam interface Request dari Express
declare global {
  namespace Express {
    interface Request {
      user?: any; // Anda bisa membuat tipe yang lebih spesifik, misal: { id: number; role: string; }
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // 1. Ambil header 'Authorization'
  const authHeader = req.headers['authorization'];

  // 2. Pisahkan "Bearer" dengan tokennya
  const token = authHeader && authHeader.split(' ')[1];

  // 3. Jika tidak ada token, kirim error 401 Unauthorized
  if (token == null) {
    const error: any = new Error('Unauthorized: Token tidak ditemukan.');
    error.statusCode = 401;
    throw error;
  }

  // 4. Verifikasi token
  jwt.verify(
    token,
    process.env.JWT_ACCESS_SECRET as string,
    (err: any, user: any) => {
      // Jika token tidak valid (error), kirim 401 Unauthorized
      if (err) {
        const error: any = new Error('Unauthorized: Token tidak valid.');
        error.statusCode = 401;
        throw error;
      }

      // Jika token valid, simpan data user ke object request
      req.user = user;

      // Lanjutkan ke proses selanjutnya (controller)
      next();
    },
  );
};
