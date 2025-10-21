import { Request, Response } from 'express';
import { errorHistoryQuerySchema } from '../validators/errorHistoryValidator';
import { getHistoryError } from '../services/errorHistoryService';
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
