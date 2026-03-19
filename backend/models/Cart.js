// backend/models/Cart.js
import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    }
  }],
  total: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// 🔥 FIXED: Calculate total before saving with error handling
cartSchema.pre('save', async function(next) {
  try {
    if (this.items.length > 0) {
      // Populate products to get prices
      await this.populate('items.product');
      
      // Calculate total safely
      this.total = this.items.reduce((sum, item) => {
        // Check if product exists and has price
        if (item.product && item.product.price) {
          return sum + (item.product.price * item.quantity);
        }
        // If product doesn't exist, skip this item (it will be removed later)
        return sum;
      }, 0);
      
      // 🔥 NEW: Remove items where product doesn't exist
      this.items = this.items.filter(item => item.product != null);
    } else {
      this.total = 0;
    }
    next();
  } catch (error) {
    console.error('❌ Error in cart pre-save hook:', error);
    // Set total to 0 and continue
    this.total = 0;
    next();
  }
});

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;