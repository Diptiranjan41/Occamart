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
  
  // 🔥 NEW FIELDS FOR FEATURED PRODUCTS
  featured: { type: Boolean, default: false },           // Mark as featured product
  trending: { type: Boolean, default: false },           // Mark as trending product
  isDeal: { type: Boolean, default: false },             // Mark as deal product
  dealPrice: { type: Number },                            // Discounted price for deals
  dealEnds: { type: Date },                               // Deal expiry date
  originalPrice: { type: Number },                         // Original price before discount
  discount: { type: String },                              // Discount percentage (e.g., "20% OFF")
  tags: [{ type: String }],                                // Product tags for filtering
  images: [{ type: String }],                              // Multiple images support
  features: [{ type: String }],                            // Product features list
  specifications: { type: Map, of: String },               // Product specifications
  sold: { type: Number, default: 0 },                       // Number of units sold
  views: { type: Number, default: 0 },                      // Product views count
  
  // Category and subcategory
  subcategory: { type: String },                            // Subcategory for better filtering
  
  // SEO fields
  metaTitle: { type: String },
  metaDescription: { type: String },
  metaKeywords: [{ type: String }],
  
  // Inventory management
  lowStockThreshold: { type: Number, default: 5 },          // Alert when stock below this
  isActive: { type: Boolean, default: true },                // Product active/inactive
  
  // Warranty and returns
  warranty: { type: String },                                 // Warranty information
  returnPolicy: { type: String }                              // Return policy
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 🔥 VIRTUAL FIELDS
productSchema.virtual('isLowStock').get(function() {
  return this.countInStock <= this.lowStockThreshold;
});

productSchema.virtual('isOutOfStock').get(function() {
  return this.countInStock <= 0;
});

productSchema.virtual('discountPercentage').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100) + '% OFF';
  }
  return null;
});

// 🔥 INDEXES FOR BETTER PERFORMANCE
productSchema.index({ name: 'text', description: 'text', brand: 'text' }); // Text search
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ featured: -1 });
productSchema.index({ trending: -1 });
productSchema.index({ isDeal: 1, dealEnds: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ countInStock: 1 });

// 🔥 STATIC METHODS
productSchema.statics.getFeaturedProducts = async function(limit = 8) {
  return this.find({ featured: true, isActive: true })
    .sort({ createdAt: -1 })
    .limit(limit);
};

productSchema.statics.getTrendingProducts = async function(limit = 8) {
  return this.find({ trending: true, isActive: true })
    .sort({ views: -1, sold: -1 })
    .limit(limit);
};

productSchema.statics.getDealProducts = async function() {
  const now = new Date();
  return this.find({
    isDeal: true,
    dealEnds: { $gt: now },
    isActive: true
  }).sort({ dealPrice: 1 });
};

// 🔥 INSTANCE METHODS
productSchema.methods.incrementViews = async function() {
  this.views += 1;
  return this.save();
};

productSchema.methods.updateStock = async function(quantity) {
  if (this.countInStock < quantity) {
    throw new Error('Insufficient stock');
  }
  this.countInStock -= quantity;
  this.sold += quantity;
  return this.save();
};

const Product = mongoose.model('Product', productSchema);

export default Product;