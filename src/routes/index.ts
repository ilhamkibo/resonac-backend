import { Router } from 'express';
import thresholdRoutes from './thresholdRoutes';
import authRoutes from './authRoutes';
import measurementRoutes from './measurementRoute';
import userRoutes from './userRoutes';

// Buat instance router utama
const router = Router();

// Daftarkan semua sub-router di sini TANPA '/api'
router.use('/thresholds', thresholdRoutes);
router.use('/auth', authRoutes);
router.use('/measurements', measurementRoutes);
router.use('/users', userRoutes);

export default router;
