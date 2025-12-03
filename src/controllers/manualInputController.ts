// src/controllers/manualInputController.ts

import { Request, Response } from 'express';
import {
  createManualInputSchema,
  getManualInputsSchema,
} from '../validators/manualInputValidator';
import * as manualInputService from '../services/manualInputService';
import { asyncHandler } from '../lib/utils/asyncHandler';
import { successResponse } from '../lib/response/response';

/**
 * @desc    Membuat entri manual input baru
 * @route   POST /api/manual-inputs
 * @access  Private
 */
export const handleCreateManualInput = asyncHandler(
  async (req: Request, res: Response) => {
    const validatedBody = createManualInputSchema.parse(req.body);
    const result = await manualInputService.create(validatedBody);

    return successResponse(res, 'Manual input created successfully', result);
  },
);

/**
 * @desc    Mendapatkan daftar manual input
 * @route   GET /api/manual-inputs
 * @access  Private
 */
export const handleGetManualInputs = asyncHandler(
  async (req: Request, res: Response) => {
    const validatedQuery = getManualInputsSchema.parse(req.query);
    const result = await manualInputService.findMany(validatedQuery);

    return successResponse(res, 'Manual inputs fetched successfully', result);
  },
);

export const handleExportManualInputsCsv = asyncHandler(
  async (req: Request, res: Response) => {
    const validatedQuery = getManualInputsSchema.parse(req.query);
    const csv = await manualInputService.exportCsv(validatedQuery);

    const timestamp = new Date()
      .toLocaleString('id-ID', { hour12: false })
      .replace(/[\/:, ]+/g, '-');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=manual-input-history-${timestamp}.csv`,
    );

    return res.status(200).send('\uFEFF' + csv);
  },
);
