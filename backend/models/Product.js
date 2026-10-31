import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 0, max: 5 },
  comment: { type: String, required: true }
}, { timestamps: true });

// ===== SIZES (T-shirt: S/M/L, shoes: 7/8/9, custom: 500ml etc.) =====
const sizeSchema = new mongoose.Schema({
  size: { type: String, required: true, trim: true, uppercase: true },
  stock: { type: Number, required: true, default: 0, min: 0 }
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  description: { type: String, required: true },
  // Admin form images array bhejta hai; image = images[0] (pre-validate hook set karta hai)
  image: { type: String, default: '' },
  category: { type: String, required: true },
  brand: { type: String, default: '' }, // admin form me Brand optional hai
  countInStock: { type: Number, required: true, default: 0, min: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  numReviews: { type: Number, default: 0, min: 0 },
  reviews: [reviewSchema],

  // ===== SIZES =====
  sizes: {
    type: [sizeSchema],
    default: [],
    validate: {
      validator: (arr) => new Set(arr.map(s => s.size)).size === arr.length,
      message: 'Duplicate sizes allowed nahi hain'
    }
  },

  // ===== FLAGS =====
  isFeatured: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  // Legacy fields (purane data ke liye), pre-save hook sync rakhta hai
  featured: { type: Boolean, default: false },
  trending: { type: Boolean, default: false },

  // ===== DEALS =====
  isDeal: { type: Boolean, default: false },
  dealPrice: { type: Number },
  dealEnds: { type: Date },
  originalPrice: { type: Number },
  discount: { type: String },

  // ===== EXTRA INFO =====
  tags: [{ type: String }],
  images: [{ type: String }],
  features: [{ type: String }],
  specifications: { type: Map, of: String },
  sold: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  subcategory: { type: String },

  // SEO
  metaTitle: { type: String },
  metaDescription: { type: String },
  metaKeywords: [{ type: String }],

  // Inventory
  lowStockThreshold: { type: Number, default: 5 },
  isActive: { type: Boolean, default: true },

  // Warranty and returns
  warranty: { type: String },
  returnPolicy: { type: String },

  // Product kis admin ne banaya
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===== VIRTUALS =====
productSchema.virtual('isLowStock').get(function () {
  return this.countInStock <= this.lowStockThreshold;
});

productSchema.virtual('isOutOfStock').get(function () {
  return this.countInStock <= 0;
});

productSchema.virtual('hasSizes').get(function () {
  return this.sizes && this.sizes.length > 0;
});

productSchema.virtual('availableSizes').get(function () {
  return (this.sizes || []).filter(s => s.stock > 0).map(s => s.size);
});

productSchema.virtual('discountPercentage').get(function () {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100) + '% OFF';
  }
  return null;
});

// ===== INDEXES =====
productSchema.index({ name: 'text', description: 'text', brand: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ isFeatured: -1 });
productSchema.index({ isTrending: -1 });
productSchema.index({ featured: -1 });
productSchema.index({ trending: -1 });
productSchema.index({ isDeal: 1, dealEnds: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ countInStock: 1 });

// ===== image = images[0] (image required hata diya, ye fallback hai) =====
productSchema.pre('validate', function (next) {
  if (!this.image && this.images && this.images.length > 0) {
    this.image = this.images[0];
  }
  if (this.images && this.images.length === 0 && this.image) {
    this.images = [this.image];
  }
  next();
});

// ===== KEEP NEW + LEGACY FLAGS IN SYNC + SIZE STOCK TOTAL =====
productSchema.pre('save', function (next) {
  if (this.isModified('isFeatured')) this.featured = this.isFeatured;
  else if (this.isModified('featured')) this.isFeatured = this.featured;

  if (this.isModified('isTrending')) this.trending = this.isTrending;
  else if (this.isModified('trending')) this.isTrending = this.trending;

  // Sizes hain to total stock = sizes ke stock ka sum
  if (this.sizes && this.sizes.length > 0) {
    this.countInStock = this.sizes.reduce((sum, s) => sum + (s.stock || 0), 0);
  }

  next();
});

// ===== STATIC METHODS =====
productSchema.statics.getFeaturedProducts = async function (limit = 8) {
  return this.find({ $or: [{ isFeatured: true }, { featured: true }], isActive: true })
    .sort({ createdAt: -1 })
    .limit(limit);
};

productSchema.statics.getTrendingProducts = async function (limit = 8) {
  return this.find({ $or: [{ isTrending: true }, { trending: true }], isActive: true })
    .sort({ views: -1, sold: -1 })
    .limit(limit);
};

productSchema.statics.getDealProducts = async function () {
  return this.find({
    isDeal: true,
    dealEnds: { $gt: new Date() },
    isActive: true
  }).sort({ dealPrice: 1 });
};

// Purane featured/trending flags ko isFeatured/isTrending me copy karta hai
productSchema.statics.syncLegacyFlags = async function () {
  const f = await this.updateMany(
    { featured: true, isFeatured: { $ne: true } },
    { $set: { isFeatured: true } }
  );
  const t = await this.updateMany(
    { trending: true, isTrending: { $ne: true } },
    { $set: { isTrending: true } }
  );
  return { featured: f.modifiedCount, trending: t.modifiedCount };
};

// ===== INSTANCE METHODS =====
productSchema.methods.incrementViews = async function () {
  this.views += 1;
  return this.save();
};

/**
 * Stock kam karo (order place hone par).
 * Product me sizes hain to `size` dena zaroori hai.
 */
productSchema.methods.updateStock = async function (quantity, size = null) {
  if (this.sizes && this.sizes.length > 0) {
    if (!size) throw new Error('Size select karna zaroori hai');
    const entry = this.sizes.find(s => s.size === String(size).toUpperCase());
    if (!entry) throw new Error(`Size ${size} available nahi hai`);
    if (entry.stock < quantity) throw new Error(`Size ${size} ka stock kam hai`);
    entry.stock -= quantity; // countInStock pre-save me auto-sum hoga
  } else {
    if (this.countInStock < quantity) throw new Error('Insufficient stock');
    this.countInStock -= quantity;
  }
  this.sold += quantity;
  return this.save();
};

/**
 * Review add karo aur rating/numReviews reviews se recalculate karo.
 */
productSchema.methods.addReview = async function ({ user, name, rating, comment }) {
  if (this.reviews.some(r => r.user.toString() === user.toString())) {
    throw new Error('Aap ye product pehle hi review kar chuke ho');
  }
  this.reviews.push({ user, name, rating: Number(rating), comment });
  this.numReviews = this.reviews.length;
  this.rating = Number(
    (this.reviews.reduce((acc, r) => acc + r.rating, 0) / this.reviews.length).toFixed(1)
  );
  return this.save();
};

const Product = mongoose.model('Product', productSchema);

export default Product;
