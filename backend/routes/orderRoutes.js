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

// ==================== PUBLIC ROUTES ====================
// Public return information routes (no authentication required)
router.get('/return-reasons', getReturnReasons);
router.get('/return-policy', getReturnPolicy);

// ==================== PROTECTED USER ROUTES ====================
// All routes below this require authentication
router.use(protect);

// Order management routes
router.route('/')
  .post(createOrder);  // Create order (authenticated users)

// User's orders
router.get('/myorders', getMyOrders);

// Track return status (user can track their own returns)
router.get('/returns/track/:returnId', trackReturn);

// Order-specific return routes (must come BEFORE /:orderId routes)
router.get('/:orderId/returnable-items', getReturnableItems);
router.post('/:orderId/return/images', uploadReturnImages);
router.route('/:orderId/return')
  .post(requestReturn)
  .get(getReturnDetails);
router.post('/:orderId/return/cancel', cancelReturn);

// 🔥 IMPORTANT: Get single order by ID - This must come AFTER specific routes
// but BEFORE admin-only routes so normal users can access their own orders
router.get('/:orderId', getOrderById);

// Payment update (users can update payment for their orders)
router.put('/:orderId/pay', updateOrderToPaid);

// ==================== ADMIN ONLY ROUTES ====================
// All routes below this require admin privileges
router.use(admin);

// ==================== GET ALL ORDERS (Admin) ====================
router.get('/', getOrders);  // Get all orders (admin only)

// ==================== ORDER ANALYTICS (Admin) ====================
// These must come BEFORE any /:orderId routes with specific patterns
router.get('/stats', getOrderStats);
router.get('/filter', getFilteredOrders);
router.get('/analytics', getOrderAnalytics);
router.get('/recent', getRecentOrders);

// ==================== RETURN MANAGEMENT (Admin) ====================
// Get all returns (admin)
router.get('/returns', getAllReturns);

// Update return status
router.put('/returns/:returnId/status', updateReturnStatus);

// Process return refund
router.post('/returns/:returnId/refund', processReturnRefund);

// Schedule return pickup
router.post('/returns/:returnId/pickup', scheduleReturnPickup);

// ==================== ORDER MANAGEMENT (Admin) ====================
// Bulk update orders
router.put('/bulk', bulkUpdateOrders);

// Status update route
router.put('/:orderId/status', updateOrderStatus);

// Order deletion (admin only)
router.delete('/:orderId', deleteOrder);

// Delivery update
router.put('/:orderId/deliver', updateOrderToDelivered);

export default router;