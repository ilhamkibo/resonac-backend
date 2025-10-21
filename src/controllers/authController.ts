import { Request, Response } from 'express';
import { loginSchema, registerSchema } from '../validators/authValidator';
import { successResponse } from '../lib/response/response';
import { asyncHandler } from '../lib/utils/asyncHandler';
import * as authService from '../services/authService';

export const handleLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse({ ...req.body });
  const result = await authService.loginUser({ email, password });

  return successResponse(
    res,
    'User logged in successfully',
    {
      user: result.user, // Body sekarang hanya berisi data user
      token: result.accessToken,
    },
    200,
  );
});

export const handleRegister = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password, name } = registerSchema.parse({ ...req.body });
    const result = await authService.registerUser({ email, password, name });

    return successResponse(
      res,
      'User registered successfully',
      {
        result,
      },
      200,
    );
  },
);
