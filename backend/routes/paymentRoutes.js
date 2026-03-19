import express from 'express';
import {
    createOrder,
    verifyPayment,
    getPaymentById,
    getPaymentByRazorpayOrderId,
    getAllPayments,
    getPaymentStats,
    processRefund,
    handleWebhook
} from '../controllers/paymentController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.post('/webhook', handleWebhook); // Razorpay webhook (no auth)

// Protected routes
router.route('/')
    .get(protect, admin, getAllPayments);

router.get('/stats', protect, admin, getPaymentStats);

router.route('/:id')
    .get(protect, getPaymentById);

router.get('/order/:razorpayOrderId', protect, getPaymentByRazorpayOrderId);

router.post('/:id/refund', protect, admin, processRefund);

export default router;