import express from 'express';
import {
  submitFeedback,
  quickFeedback,
  getAllFeedback,
  getFeedbackStats,
  updateFeedbackStatus,
  deleteFeedback,
  getFeedbackById
} from '../controllers/feedbackController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ===== PUBLIC ROUTES =====
// @route   POST /api/feedback
// @desc    Submit feedback
// @access  Public
router.post('/', submitFeedback);

// @route   POST /api/feedback/quick
// @desc    Quick feedback
// @access  Public
router.post('/quick', quickFeedback);

// ===== ADMIN ROUTES =====
// @route   GET /api/feedback
// @desc    Get all feedback
// @access  Private/Admin
router.get('/', protect, admin, getAllFeedback);

// @route   GET /api/feedback/stats
// @desc    Get feedback statistics
// @access  Private/Admin
router.get('/stats', protect, admin, getFeedbackStats);

// @route   GET /api/feedback/:id
// @desc    Get feedback by ID
// @access  Private/Admin
router.get('/:id', protect, admin, getFeedbackById);

// @route   PUT /api/feedback/:id/status
// @desc    Update feedback status
// @access  Private/Admin
router.put('/:id/status', protect, admin, updateFeedbackStatus);

// @route   DELETE /api/feedback/:id
// @desc    Delete feedback
// @access  Private/Admin
router.delete('/:id', protect, admin, deleteFeedback);

export default router;