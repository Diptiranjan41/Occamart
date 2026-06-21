import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  // Order management
  createOrder,
  getOrderById,
  updateOrderToPaid,
  getMyOrders,
  getOrders,
  updateOrderToDelivered,
  getRecentOrders,
  updateOrderStatus,
  // Admin analytics
  getOrderStats,
  getFilteredOrders,
  deleteOrder,
  bulkUpdateOrders,
  getOrderAnalytics,
  // Return functionality
  requestReturn,
  getReturnDetails,
  cancelReturn,
  uploadReturnImages,
  getReturnableItems,
  trackReturn,
  getAllReturns,
  updateReturnStatus,
  processReturnRefund,
  scheduleReturnPickup,
  getReturnReasons,
  getReturnPolicy
} from '../controllers/orderController.js';

const router = express.Router();

// ============================================================
// 1️⃣ PUBLIC ROUTES (No authentication required)
// ============================================================
router.get('/return-reasons', getReturnReasons);
router.get('/return-policy', getReturnPolicy);

// ============================================================
// 2️⃣ PROTECTED USER ROUTES (Authentication required)
// ============================================================
router.use(protect);

// ---------- 2A: CREATE ORDER ----------
router.route('/')
  .post(createOrder);

// ---------- 2B: USER'S OWN ORDERS ----------
router.get('/myorders', getMyOrders);

// ---------- 2C: TRACK RETURN (User) ----------
router.get('/returns/track/:returnId', trackReturn);

// ---------- 2D: RETURN ROUTES (Specific patterns first) ----------
// These MUST come before /:orderId routes
router.get('/:orderId/returnable-items', getReturnableItems);
router.post('/:orderId/return/images', uploadReturnImages);
router.route('/:orderId/return')
  .post(requestReturn)
  .get(getReturnDetails);
router.post('/:orderId/return/cancel', cancelReturn);

// ---------- 2E: SINGLE ORDER BY ID ----------
// ⚠️ IMPORTANT: This must come AFTER all specific routes
// but BEFORE admin-only routes
router.get('/:orderId', getOrderById);

// ---------- 2F: PAYMENT UPDATE ----------
router.put('/:orderId/pay', updateOrderToPaid);

// ============================================================
// 3️⃣ ADMIN ONLY ROUTES
// ============================================================
router.use(admin);

// ---------- 3A: GET ALL ORDERS (Admin) ----------
router.get('/', getOrders);

// ---------- 3B: ORDER ANALYTICS (Admin) ----------
// ⚠️ IMPORTANT: These must come BEFORE any /:orderId routes
router.get('/stats', getOrderStats);
router.get('/filter', getFilteredOrders);
router.get('/analytics', getOrderAnalytics);
router.get('/recent', getRecentOrders);

// ---------- 3C: RETURN MANAGEMENT (Admin) ----------
router.get('/returns', getAllReturns);
router.put('/returns/:returnId/status', updateReturnStatus);
router.post('/returns/:returnId/refund', processReturnRefund);
router.post('/returns/:returnId/pickup', scheduleReturnPickup);

// ---------- 3D: BULK OPERATIONS ----------
// Must come before /:orderId
router.put('/bulk', bulkUpdateOrders);

// ---------- 3E: ORDER MANAGEMENT (Admin) ----------
router.put('/:orderId/status', updateOrderStatus);
router.put('/:orderId/deliver', updateOrderToDelivered);
router.delete('/:orderId', deleteOrder);

export default router;