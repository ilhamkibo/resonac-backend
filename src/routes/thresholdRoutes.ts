import { Router } from 'express';
import {
  handleCreateThreshold,
  handleDeleteThreshold,
  handleGetAllThresholds,
  handleGetThresholdById,
  handleUpdateThreshold,
} from '../controllers/thresholdController';
import { authenticateToken } from '../lib/middlewares/authMiddleware';

const router = Router();

// Rute PUBLIK (tidak ada middleware authenticateToken)
router.get('/', handleGetAllThresholds);
router.get('/:id', handleGetThresholdById);

// Rute-rute di bawah ini sekarang TERPROTEKSI
// Middleware 'authenticateToken' ditempatkan sebelum handler controller
router.post('/', authenticateToken, handleCreateThreshold);
router.patch('/:id', authenticateToken, handleUpdateThreshold);
router.delete('/:id', authenticateToken, handleDeleteThreshold);

export default router;
