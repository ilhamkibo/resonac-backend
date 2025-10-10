import { Request, Response } from 'express';
import prisma from '../config/db';
import bcrypt from 'bcrypt';
import { ZodError } from 'zod';
import { loginSchema, registerSchema } from '../lib/validators/authValidator';
import { successResponse, errorResponse } from '../lib/response/response';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../lib/utils/jwt';

const cookieOptions = (rememberMe: boolean) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: rememberMe
    ? 7 * 24 * 60 * 60 * 1000 // 7 hari
    : 24 * 60 * 60 * 1000, // 1 hari
});

export const register = async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.parse(req.body);
    const { username, email, password, name } = parsed;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (existingUser)
      return errorResponse(res, 'Username or Email already exists', 400);

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, email, password_hash: hashed, name },
    });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id, false);

    res.cookie('refresh_token', refreshToken, cookieOptions(false));

    return successResponse(
      res,
      'User registered successfully',
      {
        user: { id: user.id, username: user.username, email: user.email },
        tokens: { accessToken },
      },
      201,
    );
  } catch (err: any) {
    console.error(err);

    // ✅ Tambahkan handling khusus untuk ZodError
    if (err instanceof ZodError) {
      const formatted = err.issues.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      return errorResponse(res, 'Validation failed', 400, formatted);
    }

    // Fallback untuk error lain
    return errorResponse(res, err.message, 400, err);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const {
      identifier,
      password,
      rememberMe = false,
    } = loginSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: { OR: [{ username: identifier }, { email: identifier }] },
    });
    if (!user) return errorResponse(res, 'User not found', 404);

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return errorResponse(res, 'Invalid credentials', 401);

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id, rememberMe);

    // ⬇️ Set refresh token ke cookie
    res.cookie('refresh_token', refreshToken, cookieOptions(rememberMe));

    return successResponse(res, 'Login successful', {
      user: { id: user.id, username: user.username, email: user.email },
      tokens: { accessToken },
    });
  } catch (err: any) {
    console.error(err);
    return errorResponse(res, err.message, 400, err);
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.refresh_token;
    if (!token) return errorResponse(res, 'No refresh token provided', 401);

    const decoded = verifyRefreshToken(token) as { userId: number };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    if (!user) return errorResponse(res, 'User not found', 404);

    const newAccessToken = generateAccessToken(user.id);
    return successResponse(res, 'Access token refreshed', {
      accessToken: newAccessToken,
    });
  } catch (err: any) {
    console.error(err);
    return errorResponse(res, 'Invalid or expired refresh token', 401, err);
  }
};
