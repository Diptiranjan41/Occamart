import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['promotional', 'transactional', 'alert', 'reminder', 'newsletter', 'update'],
    default: 'promotional'
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'pending', 'sent', 'delivered', 'failed', 'cancelled'],
    default: 'draft'
  },
  priority: {
    type: String,
    enum: ['high', 'normal', 'low'],
    default: 'normal'
  },
  targetAudience: {
    type: String,
    enum: ['all', 'active', 'inactive', 'new', 'customers', 'subscribers', 'specific'],
    default: 'all'
  },
  specificUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  userSegments: [{
    type: String
  }],
  scheduledFor: {
    type: Date
  },
  sentAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  failedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  failureReason: {
    type: String
  },
  image: {
    type: String
  },
  actionUrl: {
    type: String
  },
  actionButton: {
    type: String,
    default: 'View Details'
  },
  deepLink: {
    type: String
  },
  expiresAt: {
    type: Date
  },
  // Statistics
  stats: {
    recipients: {
      type: Number,
      default: 0
    },
    delivered: {
      type: Number,
      default: 0
    },
    opened: {
      type: Number,
      default: 0
    },
    clicked: {
      type: Number,
      default: 0
    },
    converted: {
      type: Number,
      default: 0
    },
    failed: {
      type: Number,
      default: 0
    }
  },
  // For tracking individual user interactions
  userInteractions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    delivered: {
      type: Boolean,
      default: false
    },
    deliveredAt: Date,
    opened: {
      type: Boolean,
      default: false
    },
    openedAt: Date,
    clicked: {
      type: Boolean,
      default: false
    },
    clickedAt: Date,
    converted: {
      type: Boolean,
      default: false
    },
    convertedAt: Date,
    convertedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps on save
notificationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;