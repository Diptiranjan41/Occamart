import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  name: {
    type: String,
    default: 'Anonymous',
    trim: true
  },
  email: {
    type: String,
    default: '',
    trim: true,
    lowercase: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  feedback: {
    type: String,
    required: [true, 'Feedback text is required'],
    trim: true,
    maxlength: [1000, 'Feedback cannot exceed 1000 characters']
  },
  category: {
    type: String,
    enum: {
      values: ['general', 'product', 'service', 'website', 'delivery', 'other', 'quick'],
      message: '{VALUE} is not a valid category'
    },
    default: 'general'
  },
  page: {
    type: String,
    default: '',
    trim: true
  },
  status: {
    type: String,
    enum: {
      values: ['new', 'read', 'replied'],
      message: '{VALUE} is not a valid status'
    },
    default: 'new'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted date
feedbackSchema.virtual('formattedDate').get(function() {
  return this.createdAt ? this.createdAt.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'N/A';
});

// Index for better query performance
feedbackSchema.index({ status: 1, createdAt: -1 });
feedbackSchema.index({ rating: 1 });
feedbackSchema.index({ category: 1 });

// Static method to get feedback statistics
feedbackSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        newCount: {
          $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] }
        },
        readCount: {
          $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] }
        },
        repliedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'replied'] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        _id: 0,
        total: 1,
        averageRating: { $round: ['$averageRating', 1] },
        new: '$newCount',
        read: '$readCount',
        replied: '$repliedCount'
      }
    }
  ]);

  return stats[0] || { total: 0, averageRating: 0, new: 0, read: 0, replied: 0 };
};

// Static method to get rating distribution
feedbackSchema.statics.getRatingDistribution = async function() {
  const distribution = await this.aggregate([
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const result = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  distribution.forEach(item => {
    result[item._id] = item.count;
  });

  return result;
};

// Static method to get category distribution
feedbackSchema.statics.getCategoryDistribution = async function() {
  const distribution = await this.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const result = {};
  distribution.forEach(item => {
    result[item._id] = item.count;
  });

  return result;
};

// Pre-save middleware to ensure data consistency
feedbackSchema.pre('save', function(next) {
  // Trim string fields
  if (this.name) this.name = this.name.trim();
  if (this.feedback) this.feedback = this.feedback.trim();
  if (this.email) this.email = this.email.toLowerCase().trim();
  
  // Set default name if empty
  if (!this.name || this.name === '') {
    this.name = 'Anonymous';
  }

  // Ensure rating is within bounds
  if (this.rating < 1) this.rating = 1;
  if (this.rating > 5) this.rating = 5;

  next();
});

// Create and export the model
const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;