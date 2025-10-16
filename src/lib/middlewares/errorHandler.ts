import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { errorResponse } from '../response/response';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error('🔥 Global Error:', err);

  // 🧩 Tangani error dari Zod
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

  // 🧩 Tangani error umum lain
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return errorResponse(res, message, statusCode, err);
};
