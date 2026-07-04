import express from 'express';
import { signup, login, logout, getProfile } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', authenticate, logout);
router.get('/profile', authenticate, getProfile);

export default router;
