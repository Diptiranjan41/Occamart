// backend/routes/cartRoutes.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

const router = express.Router();

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    console.log('🛒 Fetching cart for user:', req.user._id);
    
    let cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name price image brand category countInStock');

    if (!cart) {
      console.log('📭 No cart found, returning empty cart');
      return res.json({
        success: true,
        items: [],
        total: 0
      });
    }

    console.log(`✅ Cart found with ${cart.items.length} items`);
    res.json({
      success: true,
      items: cart.items,
      total: cart.total
    });
  } catch (error) {
    console.error('❌ Get cart error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
router.post('/add', protect, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    
    console.log('📦 Adding to cart:', { userId: req.user._id, productId, quantity });

    if (!productId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product ID is required' 
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      console.log('❌ Product not found:', productId);
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Check stock
    if (product.countInStock < quantity) {
      return res.status(400).json({ 
        success: false, 
        message: 'Not enough stock' 
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      // Create new cart
      console.log('🆕 Creating new cart for user:', req.user._id);
      cart = new Cart({
        user: req.user._id,
        items: [{ product: productId, quantity }]
      });
    } else {
      // Check if product already in cart
      const existingItem = cart.items.find(
        item => item.product.toString() === productId
      );

      if (existingItem) {
        // Update quantity
        console.log('🔄 Updating existing item quantity');
        existingItem.quantity += quantity;
      } else {
        // Add new item
        console.log('➕ Adding new item to cart');
        cart.items.push({ product: productId, quantity });
      }
    }

    await cart.save();
    await cart.populate('items.product', 'name price image brand category');

    console.log('✅ Item added to cart successfully');
    res.json({
      success: true,
      message: 'Item added to cart',
      items: cart.items,
      total: cart.total
    });
  } catch (error) {
    console.error('❌ Add to cart error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/update
// @access  Private
router.put('/update', protect, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    console.log('🔄 Updating cart item:', { userId: req.user._id, productId, quantity });

    if (!productId || !quantity) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product ID and quantity are required' 
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cart not found' 
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Item not found in cart' 
      });
    }

    // Check stock
    const product = await Product.findById(productId);
    if (product.countInStock < quantity) {
      return res.status(400).json({ 
        success: false, 
        message: 'Not enough stock' 
      });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      console.log('🗑️ Removing item (quantity <= 0)');
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      console.log('📊 Updating quantity to:', quantity);
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();
    await cart.populate('items.product', 'name price image brand category');

    console.log('✅ Cart updated successfully');
    res.json({
      success: true,
      message: 'Cart updated',
      items: cart.items,
      total: cart.total
    });
  } catch (error) {
    console.error('❌ Update cart error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
router.delete('/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;
    
    console.log('🗑️ Removing item from cart:', { 
      userId: req.user._id, 
      productId 
    });

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      console.log('❌ Cart not found for user:', req.user._id);
      return res.status(404).json({ 
        success: false, 
        message: 'Cart not found' 
      });
    }

    // Log before removal
    console.log('Cart before removal - items:', cart.items.length);
    
    // Store original length for logging
    const originalLength = cart.items.length;
    
    // Filter out the item - using toString() to compare ObjectIds correctly
    cart.items = cart.items.filter(
      item => item.product.toString() !== productId
    );

    const removedCount = originalLength - cart.items.length;
    console.log(`🗑️ Removed ${removedCount} item(s)`);

    // Save cart (will trigger pre-save hook)
    await cart.save();

    // Populate for response
    await cart.populate('items.product', 'name price image brand category');

    console.log('✅ Item removed successfully');
    res.json({
      success: true,
      message: 'Item removed from cart',
      items: cart.items,
      total: cart.total
    });
  } catch (error) {
    console.error('❌ Remove from cart error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// @desc    Clear cart
// @route   DELETE /api/cart/clear
// @access  Private
router.delete('/clear', protect, async (req, res) => {
  try {
    console.log('🧹 Clearing cart for user:', req.user._id);

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cart not found' 
      });
    }

    cart.items = [];
    await cart.save();

    console.log('✅ Cart cleared successfully');
    res.json({
      success: true,
      message: 'Cart cleared',
      items: [],
      total: 0
    });
  } catch (error) {
    console.error('❌ Clear cart error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

export default router;