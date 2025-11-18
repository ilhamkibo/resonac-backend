import { Request, Response } from 'express';
import { errorHistoryQuerySchema } from '../validators/errorHistoryValidator';
import {
  getErrorHistoryComparison,
  getHistoryError,
} from '../services/errorHistoryService';
import { asyncHandler } from '../lib/utils/asyncHandler';
import { successResponse } from '../lib/response/response';

export const handleGetHistoryError = asyncHandler(
  async (req: Request, res: Response) => {
    const validatedQuery = errorHistoryQuerySchema.parse(req.query);
    const result = await getHistoryError(validatedQuery);

    return successResponse(
      res,
      'Error history fetched successfully',
      result,
      200,
    );
  },
);

export const handleGetErrorHistoryComparison = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await getErrorHistoryComparison();

    return successResponse(
      res,
      'Error history comparison fetched successfully',
      data,
      200,
    );
  },
);
