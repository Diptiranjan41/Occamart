import express from 'express';
import { 
  getReviews,
  getReviewById,
  getUserReviews,
  createReview,
  updateReview,
  deleteReview,
  getProductReviews,
  getReviewStats
} from '../controllers/reviewController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ===== PUBLIC ROUTES =====
router.get('/', getReviews);
router.get('/stats', getReviewStats);
router.get('/product/:productId', getProductReviews);

// ===== PROTECTED USER ROUTES (place BEFORE /:id routes) =====
router.get('/user', protect, getUserReviews);  // 🔥 Now this will work!

// ===== PARAMETERIZED ROUTES (place LAST) =====
router.get('/:id', getReviewById);
router.post('/', protect, createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

export default router;