import { Router } from 'express';
import {
  handleDeleteUser,
  handleGetAllUsers,
  handleGetUserById,
  handleGetUserStats,
  handleUpdateUser,
} from '../controllers/userController';
import { authenticateToken } from '../lib/middlewares/authMiddleware';

const router = Router();

router.get('/', handleGetAllUsers);
router.get('/stats', handleGetUserStats);
router.get('/:id', handleGetUserById);
router.patch('/:id', handleUpdateUser);
router.delete('/:id', handleDeleteUser);
// router.get('/', authenticateToken, handleGetAllUsers);
// router.get('/:id', authenticateToken, handleGetUserById);
// router.get('/stats', authenticateToken, handleDeleteUser);
// router.patch('/:id', authenticateToken, handleUpdateUser);
// router.delete('/:id', authenticateToken, handleDeleteUser);

export default router;
