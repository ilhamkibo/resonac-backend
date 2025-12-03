import { Router } from 'express';
import {
  handleExportErrorHistoryCsv,
  handleGetErrorHistoryComparison,
  handleGetHistoryError,
} from '../controllers/errorHistoryController';

const router = Router();

router.get('/', handleGetHistoryError);
router.get('/compare', handleGetErrorHistoryComparison);
router.get('/export', handleExportErrorHistoryCsv);

export default router;
