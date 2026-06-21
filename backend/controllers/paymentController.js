import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '../models/Payment.js';
import Order from '../models/Order.js';

// Validate environment variables before initializing Razorpay
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('\n❌ Razorpay credentials missing!');
    console.error('   RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? '✅ Found' : '❌ Missing');
    console.error('   RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? '✅ Found' : '❌ Missing');
    console.error('   Please check your .env file in the backend directory\n');
    
    if (process.env.NODE_ENV === 'production') {
        throw new Error('Razorpay credentials are required');
    }
}

// Initialize Razorpay with error handling
let razorpay;
try {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    console.log('✅ Razorpay initialized successfully');
} catch (error) {
    console.error('❌ Failed to initialize Razorpay:', error.message);
    if (process.env.NODE_ENV === 'development') {
        console.log('⚠️  Running in development mode without Razorpay');
        razorpay = null;
    } else {
        throw error;
    }
}

// ====================================================================
// 🔑 GET RAZORPAY KEY - FRONTEND NEEDS THIS!
// ====================================================================

// @desc    Get Razorpay key ID for frontend
// @route   GET /api/payments/key
// @access  Public
const getRazorpayKey = async (req, res) => {
    try {
        const keyId = process.env.RAZORPAY_KEY_ID;
        if (!keyId) {
            console.error('❌ Razorpay KEY_ID not found in environment');
            return res.status(503).json({
                success: false,
                message: 'Payment service is currently unavailable'
            });
        }
        console.log('✅ Razorpay key sent to frontend');
        res.json({
            success: true,
            keyId: keyId
        });
    } catch (error) {
        console.error('❌ Error getting Razorpay key:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get Razorpay key'
        });
    }
};

// ====================================================================
// 🔥 FRONTEND INTEGRATION FUNCTIONS
// ====================================================================

// @desc    Create Razorpay order (Frontend expects this exact endpoint)
// @route   POST /api/payments/create-razorpay-order
// @access  Private
const createRazorpayOrder = async (req, res) => {
    try {
        console.log('💰 Creating Razorpay order via /create-razorpay-order');
        console.log('📦 Request body:', req.body);
        
        // Check if Razorpay is initialized
        if (!razorpay) {
            console.error('❌ Razorpay not initialized');
            return res.status(503).json({
                success: false,
                message: 'Payment service is currently unavailable. Please try again later.'
            });
        }

        const { orderId, amount } = req.body;

        if (!orderId) {
            console.error('❌ Missing orderId');
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }

        if (!amount || amount <= 0) {
            console.error('❌ Invalid amount:', amount);
            return res.status(400).json({
                success: false,
                message: 'Invalid amount'
            });
        }

        // Find the order
        const order = await Order.findById(orderId).populate('user', 'name email phone');
        
        if (!order) {
            console.error('❌ Order not found:', orderId);
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        console.log('✅ Order found:', order._id);
        console.log('💰 Amount:', amount);
        console.log('👤 User:', order.user?.email);

        // Create Razorpay order options
        const options = {
            amount: Math.round(amount * 100), // Convert to paise
            currency: 'INR',
            receipt: orderId,
            payment_capture: 1,
            notes: {
                orderId: orderId,
                userId: req.user?._id?.toString() || '',
                customerName: order.user?.name || 'Customer',
                customerEmail: order.user?.email || ''
            }
        };

        console.log('📦 Razorpay options:', options);

        // Create Razorpay order
        const razorpayOrder = await razorpay.orders.create(options);
        
        console.log('✅ Razorpay order created:', razorpayOrder.id);

        // ✅ FIXED: Save payment record with all required fields
        const payment = new Payment({
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount / 100,
            currency: razorpayOrder.currency,
            status: 'created',
            customerName: order.user?.name || 'Customer',
            customerEmail: order.user?.email || '',
            customerPhone: order.user?.phone || req.user?.phone || '9999999999', // ✅ Provide default if missing
            orderId: orderId,
            userId: req.user?._id,
            notes: options.notes
        });

        await payment.save();
        console.log('✅ Payment record saved');

        // Send response
        res.json({
            success: true,
            razorpayOrderId: razorpayOrder.id,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency
        });

    } catch (error) {
        console.error('❌ Razorpay order creation error:', error);
        console.error('📚 Error stack:', error.stack);
        
        // Send detailed error response
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create Razorpay order',
            error: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                stack: error.stack,
                name: error.name
            } : undefined
        });
    }
};

// @desc    Verify Razorpay payment (Frontend expects this exact endpoint)
// @route   POST /api/payments/verify-razorpay-payment
// @access  Private
const verifyRazorpayPayment = async (req, res) => {
    try {
        console.log('🔐 Verifying Razorpay payment via /verify-razorpay-payment');
        console.log('📦 Request body:', req.body);
        
        const {
            orderId,
            razorpayPaymentId,
            razorpayOrderId,
            razorpaySignature
        } = req.body;

        if (!orderId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
            console.log('❌ Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Missing required payment verification fields'
            });
        }

        const body = razorpayOrderId + '|' + razorpayPaymentId;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        console.log('🔑 Signature verification:');
        console.log('   Expected:', expectedSignature);
        console.log('   Received:', razorpaySignature);
        console.log('   Match:', expectedSignature === razorpaySignature);

        const isAuthentic = expectedSignature === razorpaySignature;

        if (isAuthentic) {
            const order = await Order.findById(orderId);
            
            if (!order) {
                console.log('❌ Order not found:', orderId);
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            console.log('✅ Order found, updating payment status...');
            console.log('   Current isPaid:', order.isPaid);

            // ✅ Update order payment status
            order.isPaid = true;
            order.paidAt = Date.now();
            order.paymentResult = {
                id: razorpayPaymentId,
                status: 'completed',
                updateTime: new Date().toISOString(),
                emailAddress: req.user?.email || order.user?.email || 'customer@example.com'
            };
            order.status = 'processing';

            await order.save();

            console.log('✅ Order updated successfully:');
            console.log('   isPaid:', order.isPaid);
            console.log('   Status:', order.status);
            console.log('   Payment ID:', razorpayPaymentId);

            // ✅ Update or create payment record
            await Payment.findOneAndUpdate(
                { razorpayOrderId: razorpayOrderId },
                {
                    razorpayPaymentId: razorpayPaymentId,
                    razorpaySignature: razorpaySignature,
                    status: 'paid',
                    paidAt: new Date(),
                    orderId: orderId
                },
                { upsert: true, new: true }
            );

            console.log('✅ Payment record updated');

            res.json({
                success: true,
                message: 'Payment verified successfully',
                orderId: orderId,
                paymentId: razorpayPaymentId,
                isPaid: order.isPaid,
                status: order.status
            });
        } else {
            console.log('❌ Payment verification failed: Invalid signature');
            
            await Payment.findOneAndUpdate(
                { razorpayOrderId: razorpayOrderId },
                {
                    status: 'failed',
                    errorCode: 'SIGNATURE_MISMATCH',
                    errorDescription: 'Payment signature verification failed'
                },
                { upsert: true }
            );

            res.status(400).json({
                success: false,
                message: 'Payment verification failed: Invalid signature'
            });
        }
    } catch (error) {
        console.error('❌ Payment verification error:', error);
        console.error('📚 Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: error.message || 'Payment verification failed'
        });
    }
};

// ====================================================================
// EXISTING FUNCTIONS
// ====================================================================

// @desc    Create Razorpay order (legacy)
// @route   POST /api/payments/create-order
// @access  Public
const createOrder = async (req, res) => {
    try {
        if (!razorpay) {
            return res.status(503).json({
                success: false,
                message: 'Payment service is currently unavailable. Please try again later.',
                devMessage: process.env.NODE_ENV === 'development' ? 'Razorpay not configured' : undefined
            });
        }

        const { 
            amount, 
            currency = 'INR', 
            receipt,
            customerName,
            customerEmail,
            customerPhone,
            description,
            orderId,
            userId
        } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount'
            });
        }

        if (!customerName || !customerEmail || !customerPhone) {
            return res.status(400).json({
                success: false,
                message: 'Customer details are required'
            });
        }

        const options = {
            amount: Math.round(amount * 100),
            currency,
            receipt: receipt || `receipt_${Date.now()}`,
            payment_capture: 1,
            notes: {
                customerName,
                customerEmail,
                customerPhone,
                description: description || '',
                orderId: orderId || '',
                userId: userId || ''
            }
        };

        const razorpayOrder = await razorpay.orders.create(options);

        const payment = new Payment({
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount / 100,
            currency: razorpayOrder.currency,
            status: 'created',
            customerName,
            customerEmail,
            customerPhone,
            description,
            orderId: orderId || null,
            userId: userId || null,
            notes: options.notes
        });

        await payment.save();

        res.status(201).json({
            success: true,
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            receipt: razorpayOrder.receipt,
            paymentId: payment._id
        });

    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create payment order',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Verify payment (legacy)
// @route   POST /api/payments/verify
// @access  Public
const verifyPayment = async (req, res) => {
    try {
        if (!razorpay) {
            return res.status(503).json({
                success: false,
                message: 'Payment service is currently unavailable. Please try again later.'
            });
        }

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderId,
            userId
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Missing required payment verification fields'
            });
        }

        const body = razorpay_order_id + '|' + razorpay_payment_id;
        
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment record not found'
            });
        }

        const isSignatureValid = expectedSignature === razorpay_signature;

        if (isSignatureValid) {
            const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);

            payment.razorpayPaymentId = razorpay_payment_id;
            payment.razorpaySignature = razorpay_signature;
            payment.status = 'paid';
            payment.method = razorpayPayment.method || 'unknown';
            payment.paymentMethod = razorpayPayment.method;
            payment.paidAt = new Date();
            
            if (razorpayPayment.method === 'card') {
                payment.paymentMethod = `card_${razorpayPayment.card?.type || 'unknown'}`;
            } else if (razorpayPayment.method === 'upi') {
                payment.paymentMethod = `upi_${razorpayPayment.upi?.vpa || 'unknown'}`;
            } else if (razorpayPayment.method === 'netbanking') {
                payment.paymentMethod = `netbanking_${razorpayPayment.bank || 'unknown'}`;
            }

            await payment.save();

            if (orderId || payment.orderId) {
                const targetOrderId = orderId || payment.orderId;
                await Order.findByIdAndUpdate(targetOrderId, {
                    paymentId: razorpay_payment_id,
                    paymentStatus: 'completed',
                    status: 'processing',
                    paidAt: new Date()
                });
            }

            res.json({
                success: true,
                message: 'Payment verified successfully',
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                amount: payment.amount,
                method: payment.method
            });
        } else {
            payment.status = 'failed';
            payment.errorCode = 'SIGNATURE_MISMATCH';
            payment.errorDescription = 'Payment signature verification failed';
            await payment.save();

            res.status(400).json({
                success: false,
                message: 'Payment verification failed: Invalid signature'
            });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        
        if (req.body.razorpay_order_id) {
            try {
                await Payment.findOneAndUpdate(
                    { razorpayOrderId: req.body.razorpay_order_id },
                    { 
                        status: 'failed',
                        errorCode: error.code,
                        errorDescription: error.message
                    }
                );
            } catch (updateError) {
                console.error('Error updating payment status:', updateError);
            }
        }

        res.status(500).json({
            success: false,
            message: 'Payment verification failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ====================================================================
// ADMIN FUNCTIONS
// ====================================================================

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
const getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('orderId', 'orderNumber items total')
            .populate('userId', 'name email');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        if (req.user && payment.userId && payment.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this payment'
            });
        }

        res.json({
            success: true,
            payment
        });
    } catch (error) {
        console.error('Error fetching payment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get payment by Razorpay order ID
// @route   GET /api/payments/order/:razorpayOrderId
// @access  Private
const getPaymentByRazorpayOrderId = async (req, res) => {
    try {
        const payment = await Payment.findOne({ 
            razorpayOrderId: req.params.razorpayOrderId 
        }).populate('orderId', 'orderNumber items total');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        res.json({
            success: true,
            payment
        });
    } catch (error) {
        console.error('Error fetching payment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get all payments (admin only)
// @route   GET /api/payments
// @access  Private/Admin
const getAllPayments = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            status,
            startDate,
            endDate,
            search 
        } = req.query;

        const query = {};

        if (status) {
            query.status = status;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        if (search) {
            query.$or = [
                { customerEmail: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } },
                { razorpayPaymentId: { $regex: search, $options: 'i' } }
            ];
        }

        const payments = await Payment.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .populate('orderId', 'orderNumber')
            .populate('userId', 'name email');

        const total = await Payment.countDocuments(query);

        const stats = await Payment.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        res.json({
            success: true,
            payments,
            stats,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payments',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get payment statistics (admin only)
// @route   GET /api/payments/stats
// @access  Private/Admin
const getPaymentStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfYear = new Date(today.getFullYear(), 0, 1);

        const [todayStats, monthStats, yearStats, methodStats] = await Promise.all([
            Payment.aggregate([
                { $match: { createdAt: { $gte: today }, status: 'paid' } },
                { $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
            ]),
            
            Payment.aggregate([
                { $match: { createdAt: { $gte: startOfMonth }, status: 'paid' } },
                { $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
            ]),
            
            Payment.aggregate([
                { $match: { createdAt: { $gte: startOfYear }, status: 'paid' } },
                { $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
            ]),

            Payment.aggregate([
                { $match: { status: 'paid' } },
                { $group: { _id: '$method', count: { $sum: 1 } } }
            ])
        ]);

        const statusStats = await Payment.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            stats: {
                today: todayStats[0] || { count: 0, totalAmount: 0 },
                thisMonth: monthStats[0] || { count: 0, totalAmount: 0 },
                thisYear: yearStats[0] || { count: 0, totalAmount: 0 },
                byStatus: statusStats,
                byMethod: methodStats
            }
        });
    } catch (error) {
        console.error('Error fetching payment stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Process refund
// @route   POST /api/payments/:id/refund
// @access  Private/Admin
const processRefund = async (req, res) => {
    try {
        if (!razorpay) {
            return res.status(503).json({
                success: false,
                message: 'Payment service is currently unavailable. Please try again later.'
            });
        }

        const { id } = req.params;
        const { amount, reason } = req.body;

        const payment = await Payment.findById(id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        if (payment.status !== 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Only paid payments can be refunded'
            });
        }

        if (!payment.razorpayPaymentId) {
            return res.status(400).json({
                success: false,
                message: 'No Razorpay payment ID found'
            });
        }

        const refundAmount = amount || payment.amount;
        
        if (refundAmount > payment.amount - payment.refundedAmount) {
            return res.status(400).json({
                success: false,
                message: 'Refund amount exceeds available balance'
            });
        }

        const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
            amount: Math.round(refundAmount * 100),
            notes: {
                reason: reason || 'Customer requested refund',
                refundedBy: req.user?.email || 'admin',
                originalPaymentId: payment.razorpayPaymentId
            }
        });

        payment.refunds.push({
            refundId: refund.id,
            amount: refundAmount,
            status: 'processed',
            reason: reason || 'Customer requested refund',
            processedAt: new Date()
        });

        payment.refundedAmount += refundAmount;
        
        if (payment.refundedAmount >= payment.amount) {
            payment.status = 'refunded';
            payment.refundedAt = new Date();
        } else if (payment.refundedAmount > 0) {
            payment.status = 'partially_refunded';
        }

        await payment.save();

        if (payment.orderId) {
            await Order.findByIdAndUpdate(payment.orderId, {
                paymentStatus: payment.status,
                refundedAmount: payment.refundedAmount
            });
        }

        res.json({
            success: true,
            message: 'Refund processed successfully',
            refund: {
                id: refund.id,
                amount: refundAmount,
                status: 'processed',
                createdAt: new Date()
            }
        });
    } catch (error) {
        console.error('Error processing refund:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process refund',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Razorpay webhook handler
// @route   POST /api/payments/webhook
// @access  Public
const handleWebhook = async (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        
        if (webhookSecret && process.env.NODE_ENV !== 'development') {
            const signature = req.headers['x-razorpay-signature'];

            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(JSON.stringify(req.body))
                .digest('hex');

            if (signature !== expectedSignature) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid webhook signature' 
                });
            }
        }

        const { event, payload } = req.body;

        console.log(`Received webhook event: ${event}`);

        switch (event) {
            case 'payment.captured':
                await handlePaymentCaptured(payload);
                break;
            case 'payment.failed':
                await handlePaymentFailed(payload);
                break;
            case 'refund.processed':
                await handleRefundProcessed(payload);
                break;
            case 'refund.failed':
                await handleRefundFailed(payload);
                break;
            default:
                console.log('Unhandled webhook event:', event);
        }

        res.json({ success: true, received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// ====================================================================
// HELPER FUNCTIONS FOR WEBHOOK
// ====================================================================

async function handlePaymentCaptured(payload) {
    try {
        const payment = payload.payment.entity;
        
        const updatedPayment = await Payment.findOneAndUpdate(
            { razorpayOrderId: payment.order_id },
            {
                razorpayPaymentId: payment.id,
                status: 'paid',
                method: payment.method,
                paidAt: new Date()
            },
            { new: true }
        );

        if (updatedPayment?.orderId) {
            const order = await Order.findById(updatedPayment.orderId);
            if (order) {
                order.isPaid = true;
                order.paidAt = new Date();
                order.paymentResult = {
                    id: payment.id,
                    status: 'completed',
                    updateTime: new Date().toISOString()
                };
                order.status = 'processing';
                await order.save();
                console.log('✅ Order updated via webhook:', order._id);
            }
        }
    } catch (error) {
        console.error('Error in handlePaymentCaptured:', error);
    }
}

async function handlePaymentFailed(payload) {
    try {
        const payment = payload.payment.entity;
        
        await Payment.findOneAndUpdate(
            { razorpayOrderId: payment.order_id },
            {
                status: 'failed',
                errorCode: payment.error_code,
                errorDescription: payment.error_description
            }
        );
    } catch (error) {
        console.error('Error in handlePaymentFailed:', error);
    }
}

async function handleRefundProcessed(payload) {
    try {
        const refund = payload.refund.entity;
        
        const payment = await Payment.findOne({ razorpayPaymentId: refund.payment_id });
        
        if (payment) {
            const refundAmount = refund.amount / 100;
            
            payment.refunds.push({
                refundId: refund.id,
                amount: refundAmount,
                status: 'processed',
                processedAt: new Date()
            });

            payment.refundedAmount += refundAmount;

            if (payment.refundedAmount >= payment.amount) {
                payment.status = 'refunded';
                payment.refundedAt = new Date();
            } else {
                payment.status = 'partially_refunded';
            }

            await payment.save();
        }
    } catch (error) {
        console.error('Error in handleRefundProcessed:', error);
    }
}

async function handleRefundFailed(payload) {
    try {
        const refund = payload.refund.entity;
        
        const payment = await Payment.findOne({ razorpayPaymentId: refund.payment_id });
        
        if (payment) {
            const refundRecord = payment.refunds.find(r => r.refundId === refund.id);
            if (refundRecord) {
                refundRecord.status = 'failed';
                await payment.save();
            }
        }
    } catch (error) {
        console.error('Error in handleRefundFailed:', error);
    }
}

// ====================================================================
// 📤 EXPORT ALL FUNCTIONS - SINGLE EXPORT
// ====================================================================

export {
    getRazorpayKey,
    createRazorpayOrder,
    verifyRazorpayPayment,
    createOrder,
    verifyPayment,
    getPaymentById,
    getPaymentByRazorpayOrderId,
    getAllPayments,
    getPaymentStats,
    processRefund,
    handleWebhook
};