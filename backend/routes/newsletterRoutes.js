import express from 'express';
import { 
  subscribeNewsletter, 
  unsubscribeNewsletter,
  getNewsletterStats,
  exportNewsletter,
  broadcastNewsletter,
  deleteSubscriber,
  testEmail,
  testNewsletterDirect  // 🔥 NEW: Import direct test function
} from '../controllers/newsletterController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ===== PUBLIC ROUTES =====
router.post('/subscribe', subscribeNewsletter);
router.post('/unsubscribe', unsubscribeNewsletter);

// 🔥 TEST ROUTES
router.get('/test-email', testEmail);
router.get('/test-direct', testNewsletterDirect);  // Direct test using nodemailer

// ===== ADMIN ROUTES =====
router.get('/stats', protect, admin, getNewsletterStats);
router.get('/export', protect, admin, exportNewsletter);
router.post('/broadcast', protect, admin, broadcastNewsletter);
router.delete('/:id', protect, admin, deleteSubscriber);

export default router;