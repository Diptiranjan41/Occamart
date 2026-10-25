import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 0, max: 5 },
  comment: { type: String, required: true }
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  brand: { type: String, required: true },
  countInStock: { type: Number, required: true, default: 0 },
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  reviews: [reviewSchema],

  // ===== FLAGS =====
  // Controllers aur queries ab isFeatured / isTrending use karte hain.
  isFeatured: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  // Legacy fields (purane data ke liye). pre-save hook inhe isFeatured/isTrending ke saath sync rakhta hai.
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

  // Product ko kis admin ne banaya (createProduct mein set hota hai)
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

// ===== KEEP NEW + LEGACY FLAGS IN SYNC =====
productSchema.pre('save', function (next) {
  if (this.isModified('isFeatured')) this.featured = this.isFeatured;
  else if (this.isModified('featured')) this.isFeatured = this.featured;

  if (this.isModified('isTrending')) this.trending = this.isTrending;
  else if (this.isModified('trending')) this.isTrending = this.trending;

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

// Purane products ke flags (featured/trending) ko naye fields (isFeatured/isTrending) mein copy karta hai.
// Server start par ek baar chalta hai (config/db.js se), baar baar chalane se koi nuksan nahi.
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

productSchema.methods.updateStock = async function (quantity) {
  if (this.countInStock < quantity) {
    throw new Error('Insufficient stock');
  }
  this.countInStock -= quantity;
  this.sold += quantity;
  return this.save();
};

const Product = mongoose.model('Product', productSchema);

export default Product;
