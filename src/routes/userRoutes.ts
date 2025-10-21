import { Router } from 'express';
import {
  handleDeleteUser,
  handleGetAllUsers,
  handleGetUserById,
  handleUpdateUser,
} from '../controllers/userController';

const router = Router();

router.get('/', handleGetAllUsers);
router.get('/:id', handleGetUserById);
router.patch('/:id', handleUpdateUser);
router.delete('/:id', handleDeleteUser);

export default router;
