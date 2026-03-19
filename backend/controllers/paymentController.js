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
    
    // In development, we can continue with a warning
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
    // Create a mock razorpay for development if needed
    if (process.env.NODE_ENV === 'development') {
        console.log('⚠️  Running in development mode without Razorpay');
        razorpay = null;
    } else {
        throw error;
    }
}

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Public
export const createOrder = async (req, res) => {
    try {
        // Check if Razorpay is initialized
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

        // Validate required fields
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

        // Create Razorpay order
        const options = {
            amount: Math.round(amount * 100), // Convert to paise and ensure integer
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

        // Save payment record in database
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

// @desc    Verify payment
// @route   POST /api/payments/verify
// @access  Public
export const verifyPayment = async (req, res) => {
    try {
        // Check if Razorpay is initialized
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
            orderId, // Internal order ID (if applicable)
            userId
        } = req.body;

        // Validate required fields
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Missing required payment verification fields'
            });
        }

        // Generate signature for verification
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        // Find payment record
        const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment record not found'
            });
        }

        // Verify signature
        const isSignatureValid = expectedSignature === razorpay_signature;

        if (isSignatureValid) {
            // Fetch payment details from Razorpay
            const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);

            // Update payment record
            payment.razorpayPaymentId = razorpay_payment_id;
            payment.razorpaySignature = razorpay_signature;
            payment.status = 'paid';
            payment.method = razorpayPayment.method || 'unknown';
            payment.paymentMethod = razorpayPayment.method;
            payment.paidAt = new Date();
            
            // Update method specific details
            if (razorpayPayment.method === 'card') {
                payment.paymentMethod = `card_${razorpayPayment.card?.type || 'unknown'}`;
            } else if (razorpayPayment.method === 'upi') {
                payment.paymentMethod = `upi_${razorpayPayment.upi?.vpa || 'unknown'}`;
            } else if (razorpayPayment.method === 'netbanking') {
                payment.paymentMethod = `netbanking_${razorpayPayment.bank || 'unknown'}`;
            }

            await payment.save();

            // If this payment is for an internal order, update order status
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
            // Update payment status to failed
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
        
        // Try to update payment status if we have the order ID
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

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
export const getPaymentById = async (req, res) => {
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

        // Check authorization (if user is logged in)
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
export const getPaymentByRazorpayOrderId = async (req, res) => {
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
export const getAllPayments = async (req, res) => {
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

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Filter by date range
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        // Search by customer email or name
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

        // Get payment statistics
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
export const getPaymentStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfYear = new Date(today.getFullYear(), 0, 1);

        // Get statistics for different periods
        const [todayStats, monthStats, yearStats, methodStats] = await Promise.all([
            // Today's stats
            Payment.aggregate([
                { $match: { createdAt: { $gte: today }, status: 'paid' } },
                { $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
            ]),
            
            // This month's stats
            Payment.aggregate([
                { $match: { createdAt: { $gte: startOfMonth }, status: 'paid' } },
                { $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
            ]),
            
            // This year's stats
            Payment.aggregate([
                { $match: { createdAt: { $gte: startOfYear }, status: 'paid' } },
                { $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
            ]),

            // Payment method distribution
            Payment.aggregate([
                { $match: { status: 'paid' } },
                { $group: { _id: '$method', count: { $sum: 1 } } }
            ])
        ]);

        // Get status distribution
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
export const processRefund = async (req, res) => {
    try {
        // Check if Razorpay is initialized
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

        // Calculate refund amount
        const refundAmount = amount || payment.amount;
        
        if (refundAmount > payment.amount - payment.refundedAmount) {
            return res.status(400).json({
                success: false,
                message: 'Refund amount exceeds available balance'
            });
        }

        // Process refund through Razorpay
        const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
            amount: Math.round(refundAmount * 100),
            notes: {
                reason: reason || 'Customer requested refund',
                refundedBy: req.user?.email || 'admin',
                originalPaymentId: payment.razorpayPaymentId
            }
        });

        // Update payment record
        payment.refunds.push({
            refundId: refund.id,
            amount: refundAmount,
            status: 'processed',
            reason: reason || 'Customer requested refund',
            processedAt: new Date()
        });

        payment.refundedAmount += refundAmount;
        
        // Update payment status
        if (payment.refundedAmount >= payment.amount) {
            payment.status = 'refunded';
            payment.refundedAt = new Date();
        } else if (payment.refundedAmount > 0) {
            payment.status = 'partially_refunded';
        }

        await payment.save();

        // Update associated order if exists
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
export const handleWebhook = async (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        
        // Skip verification if no webhook secret is set (development only)
        if (webhookSecret && process.env.NODE_ENV !== 'development') {
            const signature = req.headers['x-razorpay-signature'];

            // Verify webhook signature
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
                // Payment successful
                await handlePaymentCaptured(payload);
                break;

            case 'payment.failed':
                // Payment failed
                await handlePaymentFailed(payload);
                break;

            case 'refund.processed':
                // Refund processed
                await handleRefundProcessed(payload);
                break;

            case 'refund.failed':
                // Refund failed
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

// Helper functions for webhook handling
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

        // Update order if needed
        if (updatedPayment?.orderId) {
            await Order.findByIdAndUpdate(updatedPayment.orderId, {
                paymentStatus: 'completed',
                status: 'processing',
                paidAt: new Date()
            });
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
            // Mark the specific refund as failed
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