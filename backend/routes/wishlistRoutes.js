// backend/routes/wishlistRoutes.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';

const router = express.Router();

// @desc    Get user wishlist
// @route   GET /api/wishlist
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate('products', 'name price image brand category countInStock');

    if (!wishlist) {
      wishlist = { products: [] };
    }

    res.json({
      success: true,
      items: wishlist.products || []
    });
  } catch (error) {
    console.error('❌ Get wishlist error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Add product to wishlist
// @route   POST /api/wishlist/add
// @access  Private
router.post('/add', protect, async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product ID is required' 
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      // Create new wishlist
      wishlist = new Wishlist({
        user: req.user._id,
        products: [productId]
      });
    } else {
      // Check if product already in wishlist
      if (wishlist.products.includes(productId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Product already in wishlist' 
        });
      }
      wishlist.products.push(productId);
    }

    await wishlist.save();
    await wishlist.populate('products', 'name price image brand category');

    res.json({
      success: true,
      message: 'Added to wishlist',
      items: wishlist.products
    });
  } catch (error) {
    console.error('❌ Add to wishlist error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
router.delete('/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      return res.status(404).json({ 
        success: false, 
        message: 'Wishlist not found' 
      });
    }

    // Filter out the product
    wishlist.products = wishlist.products.filter(
      id => id.toString() !== productId
    );

    await wishlist.save();

    res.json({
      success: true,
      message: 'Removed from wishlist',
      items: wishlist.products
    });
  } catch (error) {
    console.error('❌ Remove from wishlist error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Clear wishlist
// @route   DELETE /api/wishlist/clear
// @access  Private
router.delete('/clear', protect, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      return res.status(404).json({ 
        success: false, 
        message: 'Wishlist not found' 
      });
    }

    wishlist.products = [];
    await wishlist.save();

    res.json({
      success: true,
      message: 'Wishlist cleared'
    });
  } catch (error) {
    console.error('❌ Clear wishlist error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;