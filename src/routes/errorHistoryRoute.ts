import { Router } from 'express';
import {
  handleGetErrorHistoryComparison,
  handleGetHistoryError,
} from '../controllers/errorHistoryController';

const router = Router();

router.get('/', handleGetHistoryError);
router.get('/compare', handleGetErrorHistoryComparison);

export default router;
