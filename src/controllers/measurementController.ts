import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../lib/response/response';
import { asyncHandler } from '../lib/utils/asyncHandler';
import * as measurementService from '../services/measurementService';
import { getMeasurementsQuerySchema } from '../validators/measurementValidator';

//Ambil data untuk dashboard
export const handleGetMeasurementDataDashboard = asyncHandler(
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

export const handleGetAggregatedData = asyncHandler(
  async (req: Request, res: Response) => {
    const validation = getMeasurementsQuerySchema.parse(req.query);
    const data = await measurementService.getAggregatedData(validation);
    return successResponse(
      res,
      'Aggregated data list fetched successfully',
      data,
    );
  },
);
