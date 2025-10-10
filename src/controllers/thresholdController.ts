import { Request, Response } from 'express';
import prisma from '../config/db';
import { thresholdSchema } from '../lib/validators/thresholdValidator';
import { successResponse } from '../lib/response/response';
import { asyncHandler } from '../lib/utils/asyncHandler';

// ✅ GET all
export const getAllThresholds = asyncHandler(
  async (_req: Request, res: Response) => {
    const data = await prisma.threshold.findMany({ orderBy: { id: 'asc' } });
    return successResponse(res, 'Threshold list fetched successfully', data);
  },
);

// ✅ GET by ID
export const getThresholdById = asyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const data = await prisma.threshold.findUnique({ where: { id } });
    if (!data) {
      const error: any = new Error('Threshold not found');
      error.statusCode = 404;
      throw error;
    }
    return successResponse(res, 'Threshold fetched successfully', data);
  },
);

// ✅ CREATE
export const createThreshold = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = thresholdSchema.parse(req.body);
    const newThreshold = await prisma.threshold.create({ data: parsed });
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
    const parsed = thresholdSchema.parse(req.body);
    const updated = await prisma.threshold.update({
      where: { id },
      data: parsed,
    });
    return successResponse(res, 'Threshold updated successfully', updated);
  },
);

// ✅ DELETE
export const deleteThreshold = asyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await prisma.threshold.delete({ where: { id } });
    return successResponse(res, 'Threshold deleted successfully');
  },
);
