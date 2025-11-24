import { Router } from 'express';
import {
  handleGetManualInputs,
  handleCreateManualInput,
  handleExportManualInputsCsv,
} from '../controllers/manualInputController';
import { authenticateToken } from '../lib/middlewares/authMiddleware';

const router = Router();

router.get('/', handleGetManualInputs);
router.post('/', authenticateToken, handleCreateManualInput);
router.get('/export', handleExportManualInputsCsv); // ⬅ CSV download

export default router;
