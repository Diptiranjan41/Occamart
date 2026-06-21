import Feedback from '../models/Feedback.js';

// @desc    Submit feedback
// @route   POST /api/feedback
// @access  Public
export const submitFeedback = async (req, res) => {
  try {
    const { name, email, rating, feedback, category } = req.body;

    console.log('📝 New feedback submission:', { name, email, rating, category });

    // Validation
    if (!rating) {
      return res.status(400).json({
        success: false,
        message: 'Rating is required'
      });
    }

    if (!feedback) {
      return res.status(400).json({
        success: false,
        message: 'Feedback text is required'
      });
    }

    // Create feedback object
    const feedbackData = {
      rating: Number(rating),
      feedback: feedback.trim(),
      category: category || 'general',
      status: 'new'
    };

    // Add user info if available
    if (req.user) {
      feedbackData.user = req.user._id;
      feedbackData.name = req.user.name;
      feedbackData.email = req.user.email;
    } else {
      feedbackData.name = name?.trim() || 'Anonymous';
      feedbackData.email = email?.trim() || '';
    }

    const newFeedback = await Feedback.create(feedbackData);

    console.log('✅ Feedback saved with ID:', newFeedback._id);

    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback!',
      data: {
        id: newFeedback._id,
        rating: newFeedback.rating,
        feedback: newFeedback.feedback
      }
    });

  } catch (error) {
    console.error('❌ Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit feedback'
    });
  }
};

// @desc    Quick feedback
// @route   POST /api/feedback/quick
// @access  Public
export const quickFeedback = async (req, res) => {
  try {
    const { rating, feedback, page } = req.body;

    console.log('⚡ Quick feedback received:', { rating, page });

    // Validation
    if (!rating) {
      return res.status(400).json({
        success: false,
        message: 'Rating is required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Create quick feedback
    const quickFeedbackData = {
      rating: Number(rating),
      feedback: feedback?.trim() || 'Quick rating feedback',
      category: 'quick',
      page: page || window?.location?.pathname || 'unknown',
      status: 'new',
      name: 'Quick User'
    };

    // Add user info if logged in
    if (req.user) {
      quickFeedbackData.user = req.user._id;
      quickFeedbackData.name = req.user.name;
      quickFeedbackData.email = req.user.email;
    }

    await Feedback.create(quickFeedbackData);

    console.log('✅ Quick feedback saved');

    res.json({
      success: true,
      message: 'Thank you for your feedback!'
    });

  } catch (error) {
    console.error('❌ Error submitting quick feedback:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit feedback'
    });
  }
};

// @desc    Get all feedback (admin only)
// @route   GET /api/feedback
// @access  Private/Admin
export const getAllFeedback = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    // Build filter
    let filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const total = await Feedback.countDocuments(filter);

    // Get feedback with pagination
    const feedback = await Feedback.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email');

    console.log(`📊 Found ${feedback.length} feedback entries (Page ${page})`);

    // Calculate statistics
    const stats = {
      total: await Feedback.countDocuments(),
      new: await Feedback.countDocuments({ status: 'new' }),
      read: await Feedback.countDocuments({ status: 'read' }),
      replied: await Feedback.countDocuments({ status: 'replied' }),
      averageRating: 0
    };

    // Calculate average rating
    const ratingStats = await Feedback.aggregate([
      { $group: { _id: null, average: { $avg: '$rating' } } }
    ]);

    if (ratingStats.length > 0) {
      stats.averageRating = parseFloat(ratingStats[0].average).toFixed(1);
    }

    res.json({
      success: true,
      count: feedback.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      stats,
      data: feedback
    });

  } catch (error) {
    console.error('❌ Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get feedback stats (admin only)
// @route   GET /api/feedback/stats
// @access  Private/Admin
export const getFeedbackStats = async (req, res) => {
  try {
    // Get counts by status
    const [total, new_count, read_count, replied_count] = await Promise.all([
      Feedback.countDocuments(),
      Feedback.countDocuments({ status: 'new' }),
      Feedback.countDocuments({ status: 'read' }),
      Feedback.countDocuments({ status: 'replied' })
    ]);

    // Get average rating
    const ratingStats = await Feedback.aggregate([
      { $group: { _id: null, average: { $avg: '$rating' } } }
    ]);

    const averageRating = ratingStats.length > 0 
      ? parseFloat(ratingStats[0].average).toFixed(1) 
      : 0;

    // Get rating distribution
    const distribution = await Feedback.aggregate([
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const ratingDistribution = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };
    
    distribution.forEach(item => {
      ratingDistribution[item._id] = item.count;
    });

    // Get category distribution
    const categoryStats = await Feedback.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const categoryDistribution = {};
    categoryStats.forEach(item => {
      categoryDistribution[item._id] = item.count;
    });

    console.log('📊 Feedback stats calculated:', {
      total,
      new: new_count,
      averageRating
    });

    res.json({
      success: true,
      data: {
        total,
        new: new_count,
        read: read_count,
        replied: replied_count,
        averageRating,
        ratingDistribution,
        categoryDistribution
      }
    });

  } catch (error) {
    console.error('❌ Error fetching feedback stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update feedback status (admin only)
// @route   PUT /api/feedback/:id/status
// @access  Private/Admin
export const updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['new', 'read', 'replied'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be new, read, or replied'
      });
    }

    console.log(`🔄 Updating feedback ${id} to status: ${status}`);

    const feedback = await Feedback.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    console.log('✅ Feedback status updated');

    res.json({
      success: true,
      message: 'Feedback status updated',
      data: {
        id: feedback._id,
        status: feedback.status
      }
    });

  } catch (error) {
    console.error('❌ Error updating feedback status:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete feedback (admin only)
// @route   DELETE /api/feedback/:id
// @access  Private/Admin
export const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ Deleting feedback: ${id}`);

    const feedback = await Feedback.findByIdAndDelete(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    console.log('✅ Feedback deleted successfully');

    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting feedback:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get feedback by ID (admin only)
// @route   GET /api/feedback/:id
// @access  Private/Admin
export const getFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findById(id).populate('user', 'name email');

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      data: feedback
    });

  } catch (error) {
    console.error('❌ Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get recent feedback (admin only)
// @route   GET /api/feedback/recent
// @access  Private/Admin
export const getRecentFeedback = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const recent = await Feedback.find()
      .sort('-createdAt')
      .limit(parseInt(limit))
      .populate('user', 'name email')
      .select('rating feedback category status createdAt');

    res.json({
      success: true,
      data: recent
    });

  } catch (error) {
    console.error('❌ Error fetching recent feedback:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get feedback by rating (admin only)
// @route   GET /api/feedback/rating/:rating
// @access  Private/Admin
export const getFeedbackByRating = async (req, res) => {
  try {
    const { rating } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const feedback = await Feedback.find({ rating: parseInt(rating) })
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email');

    const total = await Feedback.countDocuments({ rating: parseInt(rating) });

    res.json({
      success: true,
      count: feedback.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: feedback
    });

  } catch (error) {
    console.error('❌ Error fetching feedback by rating:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};