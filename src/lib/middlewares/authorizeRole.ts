import { Request, Response, NextFunction } from 'express';

export const authorizeRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Pastikan user sudah terverifikasi lewat authenticateToken
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Cek apakah role user ada dalam daftar yang diizinkan
    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({
          message:
            'Forbidden: Anda tidak memiliki izin untuk melakukan aksi ini.',
        });
    }

    next();
  };
};
