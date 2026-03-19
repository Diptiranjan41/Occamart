import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    // Razorpay identifiers
    razorpayOrderId: {
        type: String,
        required: true,
        index: true
    },
    razorpayPaymentId: {
        type: String,
        sparse: true,
        index: true
    },
    razorpaySignature: {
        type: String
    },
    
    // Payment details
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        enum: ['created', 'attempted', 'paid', 'failed', 'refunded', 'partially_refunded'],
        default: 'created'
    },
    
    // Customer details
    customerName: {
        type: String,
        required: true
    },
    customerEmail: {
        type: String,
        required: true
    },
    customerPhone: {
        type: String,
        required: true
    },
    
    // Order reference (if payment is for an order)
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        sparse: true
    },
    
    // User reference (if logged in)
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        sparse: true
    },
    
    // Payment method details
    method: {
        type: String,
        enum: ['card', 'netbanking', 'wallet', 'upi', 'emi', 'unknown'],
        default: 'unknown'
    },
    paymentMethod: {
        type: String
    },
    
    // Description/notes
    description: {
        type: String
    },
    notes: {
        type: Map,
        of: String
    },
    
    // Refund details
    refunds: [{
        refundId: String,
        amount: Number,
        status: {
            type: String,
            enum: ['pending', 'processed', 'failed']
        },
        reason: String,
        processedAt: Date
    }],
    refundedAmount: {
        type: Number,
        default: 0
    },
    
    // Error details (if failed)
    errorCode: String,
    errorDescription: String,
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    paidAt: Date,
    refundedAt: Date
}, {
    timestamps: true
});

// Indexes for better query performance
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ razorpayPaymentId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ customerEmail: 1 });
paymentSchema.index({ orderId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;