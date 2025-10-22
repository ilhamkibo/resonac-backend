import { Router } from 'express';
import {
  handleGetMeasurementDataDashboard,
  handleGetAggregatedData,
} from '../controllers/measurementController';

const router = Router();

router.get('/dashboard', handleGetMeasurementDataDashboard);
router.get('/', handleGetAggregatedData);

export default router;
