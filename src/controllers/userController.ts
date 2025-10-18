import { Request, Response } from 'express';
import * as userService from '../services/userService';
import { asyncHandler } from '../lib/utils/asyncHandler';
import { successResponse } from '../lib/response/response';
import {
  updateUserSchema,
  userQuerySchema,
} from '../lib/validators/userValidator';

export const handleGetAllUsers = asyncHandler(
  async (req: Request, res: Response) => {
    const validationBody = userQuerySchema.parse(req.query);

    const result = await userService.getAllUsers(validationBody);
    return successResponse(res, 'User list fetched successfully', result, 200);
  },
);

export const handleGetUserById = asyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      // Anda bisa melempar error custom di sini juga
      const error: any = new Error('ID must be a number');
      error.statusCode = 400;
      throw error;
    }

    const result = await userService.getUserById(id);
    return successResponse(res, 'User fetched successfully', result, 200);
  },
);

export const handleUpdateUser = asyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      // Anda bisa melempar error custom di sini juga
      const error: any = new Error('ID must be a number');
      error.statusCode = 400;
      throw error;
    }

    // Validasi body menggunakan Zod
    const validatedBody = updateUserSchema.parse(req.body);

    const result = await userService.updateUser(id, validatedBody);
    return successResponse(res, 'User updated successfully', result, 200);
  },
);
