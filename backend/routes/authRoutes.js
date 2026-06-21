import express from 'express';
import {
  registerUser,
  loginUser,
  getCurrentUser,
  getProfile,
  updateProfile,
  verifyEmail,
  resendVerification,
  forgotPassword,    // Add this
  resetPassword      // Add this
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerification);

// Password reset routes - ADD THESE
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Protected routes
router.get('/me', protect, getCurrentUser);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

export default router;