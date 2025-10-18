import { Router } from 'express';
import {
  handleGetAllUsers,
  handleGetUserById,
} from '../controllers/userController';

const router = Router();

router.get('/', handleGetAllUsers);
router.get('/:id', handleGetUserById);

export default router;
