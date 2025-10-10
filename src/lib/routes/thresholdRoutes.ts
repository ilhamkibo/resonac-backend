import { Router } from 'express';
import {
  createThreshold,
  deleteThreshold,
  getAllThresholds,
  getThresholdById,
  updateThreshold,
} from '../../controllers/thresholdController';

const router = Router();

router.get('/', getAllThresholds);
router.get('/:id', getThresholdById);
router.post('/', createThreshold);
router.put('/:id', updateThreshold);
router.delete('/:id', deleteThreshold);

export default router;
