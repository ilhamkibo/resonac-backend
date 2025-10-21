// src/controllers/thresholdController.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../lib/utils/asyncHandler';
import { successResponse } from '../lib/response/response';
import * as thresholdService from '../services/thresholdService';
import {
  createThresholdSchema,
  updateThresholdSchema,
  getThresholdsQuerySchema,
} from '../validators/thresholdValidator';

// ✅ GET all
export const handleGetAllThresholds = asyncHandler(
  async (req: Request, res: Response) => {
    const query = getThresholdsQuerySchema.parse(req.query);
    const data = await thresholdService.getAllThresholds(query.area);
    return successResponse(res, 'Threshold list fetched successfully', data);
  },
);

// ✅ GET by ID
export const handleGetThresholdById = asyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const data = await thresholdService.getThresholdById(id);
    return successResponse(res, 'Threshold fetched successfully', data);
  },
);

// ✅ CREATE
export const handleCreateThreshold = asyncHandler(
  async (req: Request, res: Response) => {
    // Validasi body menggunakan Zod
    const validationBody = createThresholdSchema.parse(req.body);

    const newThreshold = await thresholdService.createThreshold(validationBody);
    return successResponse(
      res,
      'Threshold created successfully',
      newThreshold,
      201,
    );
  },
);

// ✅ UPDATE
export const handleUpdateThreshold = asyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id); // Idealnya ini juga divalidasi Zod

    const validatedBody = updateThresholdSchema.parse(req.body);

    const updated = await thresholdService.updateThreshold(id, validatedBody);
    return successResponse(res, 'Threshold updated successfully', updated);
  },
);
// ✅ DELETE
export const handleDeleteThreshold = asyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      const error: any = new Error('ID must be a number');
      error.statusCode = 400;
      throw error;
    }
    await thresholdService.deleteThreshold(id);
    return successResponse(res, 'Threshold deleted successfully');
  },
);
