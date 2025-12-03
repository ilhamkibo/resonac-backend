import { Router } from 'express';
import {
  handleGetMeasurementDataDashboard,
  handleGetAggregatedData,
  handleExportAggregatedCsv,
} from '../controllers/measurementController';

const router = Router();

router.get('/dashboard', handleGetMeasurementDataDashboard);
router.get('/', handleGetAggregatedData);
router.get('/export', handleExportAggregatedCsv);

export default router;
