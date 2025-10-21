import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../lib/response/response';
import { asyncHandler } from '../lib/utils/asyncHandler';
import * as measurementService from '../services/measurementService';

//Ambil data untuk dashboard
export const getMeasurementDataDashboard = asyncHandler(
  async (req: Request, res: Response) => {
    const { area } = req.query as { area?: string };

    const data = await measurementService.getMeasurementDataDashboard(area);
    return successResponse(
      res,
      'Measurement data dashboard list fetched successfully',
      data,
    );
  },
);
