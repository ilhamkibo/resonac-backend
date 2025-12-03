import { Request, Response } from 'express';
import { errorHistoryQuerySchema } from '../validators/errorHistoryValidator';
import * as ErrorHistoryService from '../services/errorHistoryService';
import { asyncHandler } from '../lib/utils/asyncHandler';
import { successResponse } from '../lib/response/response';

export const handleGetHistoryError = asyncHandler(
  async (req: Request, res: Response) => {
    const validatedQuery = errorHistoryQuerySchema.parse(req.query);
    const result = await ErrorHistoryService.getHistoryError(validatedQuery);

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
    const data = await ErrorHistoryService.getErrorHistoryComparison();

    return successResponse(
      res,
      'Error history comparison fetched successfully',
      data,
      200,
    );
  },
);

export const handleExportErrorHistoryCsv = asyncHandler(
  async (req: Request, res: Response) => {
    const validatedQuery = errorHistoryQuerySchema.parse(req.query);
    const csv = await ErrorHistoryService.exportCsv(validatedQuery);

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=error_history.csv');

    // Mengganti nama file menjadi "error_history.csv" agar lebih sesuai
    return res.status(200).send(csv);
  },
);
