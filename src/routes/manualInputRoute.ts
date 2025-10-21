import { Router } from 'express';
import {
  handleGetManualInputs,
  handleCreateManualInput,
} from '../controllers/manualInputController';

const router = Router();

router.get('/', handleGetManualInputs);
router.post('/', handleCreateManualInput);

export default router;
