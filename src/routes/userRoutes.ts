import { Router } from 'express';
import {
  handleDeleteUser,
  handleGetAllUsers,
  handleGetUserById,
  handleGetUserStats,
  handleUpdateUser,
} from '../controllers/userController';
import { authenticateToken } from '../lib/middlewares/authMiddleware';
import { authorizeRole } from '../lib/middlewares/authorizeRole';

const router = Router();

// router.get('/', handleGetAllUsers);
// router.get('/stats', handleGetUserStats);
// router.get('/:id', handleGetUserById);
// router.patch('/:id', authorizeRole(['admin']), handleUpdateUser);
// router.delete('/:id', handleDeleteUser);
router.get('/', authenticateToken, handleGetAllUsers);
router.get('/stats', authenticateToken, handleGetUserStats);
router.get('/:id', authenticateToken, handleGetUserById);
router.patch(
  '/:id',
  authenticateToken,
  authorizeRole(['admin']),
  handleUpdateUser,
);
router.delete('/:id', authenticateToken, handleDeleteUser);

export default router;
