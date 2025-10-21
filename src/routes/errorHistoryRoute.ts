import { Router } from 'express';
import { handleGetHistoryError } from '../controllers/errorHistoryController';

const router = Router();

router.get('/', handleGetHistoryError);

export default router;
