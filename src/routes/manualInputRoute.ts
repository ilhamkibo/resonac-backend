import { Router } from 'express';
import {
  handleGetManualInputs,
  handleCreateManualInput,
} from '../controllers/manualInputController';
import { authenticateToken } from '../lib/middlewares/authMiddleware';

const router = Router();

router.get('/', handleGetManualInputs);
router.post('/', authenticateToken, handleCreateManualInput);

export default router;
