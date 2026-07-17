import { Router } from 'express';
import AuthController from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/security.middleware.js';

const router = Router();

// Public routes — rate limited to blunt brute-force/credential-stuffing attempts.
router.post('/register', authRateLimiter, AuthController.register);
router.post('/register-admin', authRateLimiter, AuthController.registerAdmin);
router.post('/login', authRateLimiter, AuthController.login);
router.post('/refresh', AuthController.refreshToken);
router.post('/forgot-password', authRateLimiter, AuthController.forgotPassword);
router.post('/reset-password', authRateLimiter, AuthController.resetPassword);

import { requireAdmin } from '../middleware/auth.middleware.js';

// Protected routes — require a valid Bearer access token.
router.post('/logout', requireAuth, AuthController.logout);
router.get('/profile', requireAuth, AuthController.getProfile);
router.get('/me', requireAuth, AuthController.getProfile);

// Admin-only user management
router.get('/users', requireAuth, requireAdmin, AuthController.listUsers);
router.patch('/users/:id/role', requireAuth, requireAdmin, AuthController.updateUserRole);

export default router;
