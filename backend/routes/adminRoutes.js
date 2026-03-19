import express from 'express';
import {
  getAdminStats,
  getRecentOrders,
  getRecentUsers,
  getLowStockProducts,
  getAllOrders,
  updateOrderStatus,
  getAllUsers,
  updateUserRole,
  toggleUserStatus
} from '../controllers/adminController.js';
import { getAnalytics } from '../controllers/analyticsController.js'; // ✅ ADD: analytics controller
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ Analytics route
router.get('/analytics', protect, admin, getAnalytics);

// Admin dashboard stats
router.get('/stats', protect, admin, getAdminStats);
router.get('/recent-orders', protect, admin, getRecentOrders);
router.get('/recent-users', protect, admin, getRecentUsers);
router.get('/low-stock', protect, admin, getLowStockProducts);

// Order management
router.get('/orders', protect, admin, getAllOrders);
router.put('/orders/:id/status', protect, admin, updateOrderStatus);

// User management
router.get('/users', protect, admin, getAllUsers);
router.put('/users/:id/role', protect, admin, updateUserRole);
router.put('/users/:id/status', protect, admin, toggleUserStatus);

export default router;