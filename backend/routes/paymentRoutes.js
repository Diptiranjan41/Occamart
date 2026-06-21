import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import {
    createOrder,
    verifyPayment,
    getPaymentById,
    getPaymentByRazorpayOrderId,
    getAllPayments,
    getPaymentStats,
    processRefund,
    handleWebhook,
    // ✅ ADDED: Missing functions
    getRazorpayKey,
    createRazorpayOrder,
    verifyRazorpayPayment
} from '../controllers/paymentController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ============================================================
// 🔑 PUBLIC ROUTES (No auth required)
// ============================================================

// ✅ GET Razorpay key - Frontend needs this!
router.get('/key', getRazorpayKey);

// Razorpay webhook (no auth)
router.post('/webhook', handleWebhook);

// ============================================================
// 🔐 PROTECTED ROUTES (Auth required)
// ============================================================

// ✅ Frontend expects: /payments/create-razorpay-order
router.post('/create-razorpay-order', protect, createRazorpayOrder);

// ✅ Frontend expects: /payments/verify-razorpay-payment
router.post('/verify-razorpay-payment', protect, verifyRazorpayPayment);

// ============================================================
// 📱 BACKWARD COMPATIBILITY ROUTES
// ============================================================

// These are aliases for the same functionality
router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);

// ============================================================
// 👑 ADMIN ROUTES
// ============================================================

router.route('/')
    .get(protect, admin, getAllPayments);

router.get('/stats', protect, admin, getPaymentStats);

router.route('/:id')
    .get(protect, getPaymentById);

router.get('/order/:razorpayOrderId', protect, getPaymentByRazorpayOrderId);

router.post('/:id/refund', protect, admin, processRefund);

export default router;