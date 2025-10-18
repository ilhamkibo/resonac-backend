import { Router } from 'express';
import {
  handleCreateThreshold,
  handleDeleteThreshold,
  handleGetAllThresholds,
  handleGetThresholdById,
  handleUpdateThreshold,
} from '../controllers/thresholdController';

const router = Router();

router.get('/', handleGetAllThresholds);
router.get('/:id', handleGetThresholdById);
router.post('/', handleCreateThreshold);
router.patch('/:id', handleUpdateThreshold);
router.delete('/:id', handleDeleteThreshold);

export default router;
