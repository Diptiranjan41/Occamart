import mongoose from 'mongoose'; // 🔥 IMPORTANT: Add mongoose import
import Review from '../models/Review.js';

// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Public
export const getReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, product } = req.query;
    
    let filter = { isActive: true };
    
    // Filter by product if provided
    if (product) {
      // 🔥 FIX: Validate product ID
      if (!mongoose.Types.ObjectId.isValid(product)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID format'
        });
      }
      filter.product = product;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find(filter)
      .populate('user', 'name email')
      .populate('product', 'name images price')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .lean(); // 🔥 Use lean() for better performance

    const total = await Review.countDocuments(filter);
    
    // Calculate average rating
    const ratings = await Review.aggregate([
      { $match: filter },
      { $group: { _id: null, average: { $avg: '$rating' } } }
    ]);
    
    const averageRating = ratings.length > 0 ? ratings[0].average.toFixed(1) : 0;

    // Get rating distribution
    const distribution = await Review.aggregate([
      { $match: filter },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const ratingDistribution = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };
    
    distribution.forEach(item => {
      ratingDistribution[item._id] = item.count;
    });

    // 🔥 Format reviews to handle potential null product
    const formattedReviews = reviews.map(review => ({
      _id: review._id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      user: review.user,
      product: review.product ? {
        _id: review.product._id,
        name: review.product.name,
        price: review.product.price,
        image: review.product.images?.[0] || review.product.image
      } : null
    }));

    res.json({
      success: true,
      data: formattedReviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats: {
        total,
        averageRating,
        ratingDistribution
      }
    });
  } catch (error) {
    console.error('❌ Error fetching reviews:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// 🔥 FIXED: Get reviews by current user
// @desc    Get reviews by current user
// @route   GET /api/reviews/user
// @access  Private
export const getUserReviews = async (req, res) => {
  try {
    console.log('📦 Fetching reviews for user:', req.user?._id);

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // 🔥 FIX: Use try-catch for database operation
    let reviews = [];
    try {
      reviews = await Review.find({ 
        user: req.user._id,
        isActive: true 
      })
        .populate('product', 'name images price')
        .sort('-createdAt')
        .lean();
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Database error while fetching reviews'
      });
    }

    console.log(`✅ Found ${reviews.length} reviews for user`);

    // 🔥 Format reviews safely
    const formattedReviews = reviews.map(review => {
      // Handle case where product might be null or not populated
      const productData = review.product ? {
        _id: review.product._id || null,
        name: review.product.name || 'Unknown Product',
        price: review.product.price || 0,
        image: (review.product.images && review.product.images[0]) || review.product.image || null
      } : null;

      return {
        _id: review._id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        product: productData
      };
    });

    res.json({
      success: true,
      count: reviews.length,
      data: formattedReviews
    });

  } catch (error) {
    console.error('❌ Error fetching user reviews:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch user reviews'
    });
  }
};

// @desc    Get review by ID
// @route   GET /api/reviews/:id
// @access  Public
export const getReviewById = async (req, res) => {
  try {
    // 🔥 FIX: Validate review ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID format'
      });
    }

    const review = await Review.findById(req.params.id)
      .populate('user', 'name email')
      .populate('product', 'name images price')
      .lean();

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('❌ Error fetching review:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
export const createReview = async (req, res) => {
  try {
    const { rating, comment, product } = req.body;

    console.log('📝 Creating review:', { rating, comment, product, user: req.user._id });

    // Validate required fields
    if (!rating || !comment || !product) {
      return res.status(400).json({
        success: false,
        message: 'Rating, comment and product are required'
      });
    }

    // 🔥 FIX: Validate product ID
    if (!mongoose.Types.ObjectId.isValid(product)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      user: req.user._id,
      product: product,
      isActive: true
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    const review = await Review.create({
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment: comment.trim(),
      product,
      role: 'Verified Buyer',
      verified: true,
      isActive: true
    });

    console.log('✅ Review created successfully:', review._id);

    // Populate the review before sending response
    const populatedReview = await Review.findById(review._id)
      .populate('user', 'name email')
      .populate('product', 'name images price')
      .lean();

    res.status(201).json({
      success: true,
      data: populatedReview,
      message: 'Review added successfully'
    });
  } catch (error) {
    console.error('❌ Error creating review:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
export const updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    // 🔥 FIX: Validate review ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID format'
      });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user owns this review
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }

    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    await review.save();

    const updatedReview = await Review.findById(review._id)
      .populate('user', 'name email')
      .populate('product', 'name images price')
      .lean();

    res.json({
      success: true,
      data: updatedReview,
      message: 'Review updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating review:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Delete a review (soft delete)
// @route   DELETE /api/reviews/:id
// @access  Private
export const deleteReview = async (req, res) => {
  try {
    // 🔥 FIX: Validate review ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID format'
      });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user owns this review or is admin
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    // Soft delete
    review.isActive = false;
    await review.save();

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting review:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get product reviews
// @route   GET /api/reviews/product/:productId
// @access  Public
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // 🔥 FIX: Validate product ID
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({ 
      product: productId,
      isActive: true 
    })
      .populate('user', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Review.countDocuments({ 
      product: productId,
      isActive: true 
    });

    // Calculate average rating for this product
    const ratings = await Review.aggregate([
      { $match: { product: productId, isActive: true } },
      { $group: { _id: null, average: { $avg: '$rating' } } }
    ]);
    
    const averageRating = ratings.length > 0 ? ratings[0].average.toFixed(1) : 0;

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats: {
        total,
        averageRating
      }
    });
  } catch (error) {
    console.error('❌ Error fetching product reviews:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get review statistics
// @route   GET /api/reviews/stats
// @access  Public
export const getReviewStats = async (req, res) => {
  try {
    const total = await Review.countDocuments({ isActive: true });
    
    const averageRating = await Review.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, average: { $avg: '$rating' } } }
    ]);

    const ratingDistribution = await Review.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const distribution = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };

    ratingDistribution.forEach(item => {
      distribution[item._id] = item.count;
    });

    res.json({
      success: true,
      data: {
        total,
        averageRating: averageRating[0]?.average.toFixed(1) || 0,
        ratingDistribution: distribution
      }
    });
  } catch (error) {
    console.error('❌ Error fetching review stats:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};