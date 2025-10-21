import { Router } from 'express';
import thresholdRoutes from './thresholdRoutes';
import authRoutes from './authRoute';
import measurementRoutes from './measurementRoute';
import userRoutes from './userRoutes';
import errorHistoryRoutes from './errorHistoryRoute';
import manualInputRoutes from './manualInputRoute';

// Buat instance router utama
const router = Router();

// Daftarkan semua sub-router di sini TANPA '/api'
router.use('/thresholds', thresholdRoutes);
router.use('/auth', authRoutes);
router.use('/measurements', measurementRoutes);
router.use('/users', userRoutes);
router.use('/error-histories', errorHistoryRoutes);
router.use('/manual-inputs', manualInputRoutes);

export default router;
