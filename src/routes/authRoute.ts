import { Router } from 'express';
import { handleLogin, handleRegister } from '../controllers/authController';
import { redirectIfLoggedIn } from '../lib/middlewares/redirectIfLoggedIn';

const router = Router();

router.post('/register', redirectIfLoggedIn, handleRegister);
router.post('/login', redirectIfLoggedIn, handleLogin);

export default router;
