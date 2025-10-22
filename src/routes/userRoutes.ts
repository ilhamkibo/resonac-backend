import { Router } from 'express';
import {
  handleDeleteUser,
  handleGetAllUsers,
  handleGetUserById,
  handleUpdateUser,
} from '../controllers/userController';
import { authenticateToken } from '../lib/middlewares/authMiddleware';

const router = Router();

router.get('/', authenticateToken, handleGetAllUsers);
router.get('/:id', authenticateToken, handleGetUserById);
router.patch('/:id', authenticateToken, handleUpdateUser);
router.delete('/:id', authenticateToken, handleDeleteUser);

export default router;
