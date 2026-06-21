import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  getNotifications,
  getNotificationStats,
  getNotificationTemplates,
  createNotification,
  sendNotification,
  scheduleNotification,
  updateNotification,
  cancelNotification,
  deleteNotification,
  trackOpen,
  trackClick,
  getNotificationById
} from '../controllers/notificationController.js';

const router = express.Router();

// Public tracking routes (no auth required for tracking)
router.post('/:id/track/open', trackOpen);
router.post('/:id/track/click', trackClick);

// Protected routes
router.use(protect);

// User routes
router.get('/templates', getNotificationTemplates);

// Admin only routes
router.use(admin);

router.route('/')
  .get(getNotifications)
  .post(createNotification);

router.get('/stats', getNotificationStats);
router.post('/send', sendNotification);
router.post('/schedule', scheduleNotification);

router.route('/:id')
  .get(getNotificationById)
  .put(updateNotification)
  .delete(deleteNotification);

router.put('/:id/cancel', cancelNotification);

export default router;