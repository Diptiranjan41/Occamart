// backend/routes/returnRoutes.js
import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  // Return request functions
  requestReturn,
  getReturnDetails,
  cancelReturn,
  uploadReturnImages,
  getReturnableItems,
  trackReturn,
  
  // Admin return management functions
  getAllReturns,
  updateReturnStatus,
  processReturnRefund,
  scheduleReturnPickup,
  
  // Public functions
  getReturnReasons,
  getReturnPolicy
} from '../controllers/orderController.js';

const router = express.Router();

// ==================== PUBLIC ROUTES (No authentication required) ====================
router.get('/reasons', getReturnReasons);
router.get('/policy', getReturnPolicy);

// ==================== PROTECTED USER ROUTES (Authentication required, NO admin) ====================
router.get('/order/:orderId/returnable-items', protect, getReturnableItems);
router.post('/order/:orderId/images', protect, uploadReturnImages);
router.post('/order/:orderId/request', protect, requestReturn);
router.get('/order/:orderId/details', protect, getReturnDetails);
router.post('/order/:orderId/cancel', protect, cancelReturn);
router.get('/track/:returnId', protect, trackReturn);

// ==================== ADMIN ROUTES (Authentication + Admin required) ====================
router.get('/', protect, admin, getAllReturns);
router.put('/:returnId/status', protect, admin, updateReturnStatus);
router.post('/:returnId/refund', protect, admin, processReturnRefund);
router.post('/:returnId/pickup', protect, admin, scheduleReturnPickup);

export default router;