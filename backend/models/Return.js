// backend/models/Return.js
import mongoose from 'mongoose';

const returnItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: String,
  price: Number,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  reason: {
    type: String,
    required: true,
    enum: ['damaged', 'wrong_item', 'not_as_described', 'size_issue', 'quality_issue', 'missing_parts', 'defective', 'changed_mind', 'other']
  },
  reasonLabel: String,
  comments: String,
  images: [String],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'picked_up', 'processed', 'completed'],
    default: 'pending'
  }
});

const returnSchema = new mongoose.Schema({
  returnId: {
    type: String,
    required: true,
    unique: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [returnItemSchema],
  returnType: {
    type: String,
    enum: ['refund', 'replacement'],
    default: 'refund'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'pickup_scheduled', 'picked_up', 'processed', 'completed', 'cancelled'],
    default: 'pending'
  },
  totalAmount: Number,
  refundAmount: Number,
  refundMethod: String,
  refundTransactionId: String,
  refundProcessedAt: Date,
  trackingNumber: String,
  courier: String,
  pickupAddress: {
    address: String,
    city: String,
    postalCode: String,
    country: String
  },
  pickupScheduledAt: Date,
  pickupTime: String,
  pickupCompletedAt: Date,
  pickupNotes: String,
  rejectionReason: String,
  rejectedAt: Date,
  requestedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: Date,
  processedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  adminNotes: String,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for faster queries
returnSchema.index({ returnId: 1 });
returnSchema.index({ order: 1 });
returnSchema.index({ user: 1 });
returnSchema.index({ status: 1 });
returnSchema.index({ requestedAt: -1 });

const Return = mongoose.model('Return', returnSchema);
export default Return;