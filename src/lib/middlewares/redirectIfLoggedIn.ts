import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const redirectIfLoggedIn = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  console.log('🚀 ~ redirectIfLoggedIn ~ token:', token);

  // Jika tidak ada token, berarti pengguna adalah tamu, biarkan lanjut
  if (token == null) {
    return next();
  }

  // Jika ada token, coba verifikasi
  jwt.verify(
    token,
    process.env.JWT_ACCESS_SECRET as string,
    (err: any, user: any) => {
      // Jika token tidak valid, anggap sebagai tamu, biarkan lanjut
      if (err) {
        return next();
      }

      // Jika token VALID, berarti pengguna sudah login. Tolak permintaan ini.
      const error: any = new Error('Forbidden: Anda sudah login.');
      error.statusCode = 403;
      throw error;
    },
  );
};
