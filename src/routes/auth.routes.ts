import { Router } from 'express';
import { register, login, getMe, getMockUsersList } from '../controllers/auth.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const router = Router();

// POST /auth/register & /auth/signup
router.post('/register', register);
router.post('/signup', register);

// POST /auth/login
router.post('/login', login);

// GET /auth/me
router.get('/me', authenticateUser, getMe);
router.get('/mock-users', getMockUsersList);

export default router;
