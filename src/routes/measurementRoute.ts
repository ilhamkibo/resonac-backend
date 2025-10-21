import { Router } from 'express';
import { getMeasurementDataDashboard } from '../controllers/measurementController';

const router = Router();

router.get('/dashboard', getMeasurementDataDashboard);

export default router;
