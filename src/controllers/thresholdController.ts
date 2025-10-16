// src/controllers/thresholdController.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../lib/utils/asyncHandler';
import { successResponse } from '../lib/response/response';
import * as thresholdService from '../services/thresholdService';

// ✅ GET all
export const getAllThresholds = asyncHandler(
  async (req: Request, res: Response) => {
    const { area } = req.query as { area?: string };

    const data = await thresholdService.getAllThresholds(area);
    return successResponse(res, 'Threshold list fetched successfully', data);
  },
);

// ✅ GET by ID
export const getThresholdById = asyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const data = await thresholdService.getThresholdById(id);
    return successResponse(res, 'Threshold fetched successfully', data);
  },
);

// ✅ CREATE
export const createThreshold = asyncHandler(
  async (req: Request, res: Response) => {
    const newThreshold = await thresholdService.createThreshold(req.body);
    return successResponse(
      res,
      'Threshold created successfully',
      newThreshold,
      201,
    );
  },
);

// ✅ UPDATE
export const updateThreshold = asyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const updated = await thresholdService.updateThreshold(id, req.body);
    return successResponse(res, 'Threshold updated successfully', updated);
  },
);

// ✅ DELETE
export const deleteThreshold = asyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await thresholdService.deleteThreshold(id);
    return successResponse(res, 'Threshold deleted successfully');
  },
);
