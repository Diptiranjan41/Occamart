// backend/models/Cart.js
import mongoose from 'mongoose';

// Deal chal rahi ho to dealPrice, warna normal price
export const getEffectivePrice = (product) => {
  if (!product) return 0;
  const dealActive =
    product.isDeal && product.dealPrice && product.dealEnds && new Date(product.dealEnds) > new Date();
  return dealActive ? product.dealPrice : product.price;
};

export const normalizeSize = (size) => String(size || '').trim().toUpperCase();

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
    // T-shirt / shoes jaise products ke liye selected size ('' = size nahi hai)
    size: {
      type: String,
      trim: true,
      uppercase: true,
      default: ''
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

// Total calculate karo (populate kiye bina, taaki items.product ObjectId hi rahe)
cartSchema.pre('save', async function (next) {
  try {
    if (this.items.length === 0) {
      this.total = 0;
      return next();
    }

    const Product = mongoose.model('Product');
    const ids = this.items.map((i) => i.product);
    const products = await Product.find({ _id: { $in: ids } }).select(
      'price isDeal dealPrice dealEnds'
    );
    const map = new Map(products.map((p) => [p._id.toString(), p]));

    // Jo products delete ho chuke hain unhe cart se hatao
    this.items = this.items.filter((item) => map.has(item.product.toString()));

    this.total = this.items.reduce((sum, item) => {
      const p = map.get(item.product.toString());
      return sum + getEffectivePrice(p) * item.quantity;
    }, 0);

    next();
  } catch (error) {
    console.error('❌ Error in cart pre-save hook:', error);
    this.total = 0;
    next();
  }
});

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
