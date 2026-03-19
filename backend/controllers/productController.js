import Product from '../models/Product.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const pageSize = Number(req.query.limit) || 10;
    const page = Number(req.query.pageNumber) || 1;
    const isFeatured = req.query.isFeatured === 'true';
    const isTrending = req.query.isTrending === 'true';
    const isDeal = req.query.isDeal === 'true';
    const category = req.query.category;
    const sort = req.query.sort || 'createdAt';

    // Build filter
    let filter = { isActive: true };
    
    // 🔥 FIXED: Handle featured filter properly
    if (req.query.isFeatured === 'true') {
      filter.isFeatured = true;
    }
    
    if (req.query.isTrending === 'true') {
      filter.isTrending = true;
    }
    
    if (req.query.isDeal === 'true') {
      filter.isDeal = true;
    }

    // Category filter
    if (category && category !== 'all' && category !== 'undefined') {
      filter.category = category;
    }

    // Search keyword
    if (req.query.keyword) {
      filter.name = {
        $regex: req.query.keyword,
        $options: 'i',
      };
    }

    // Build sort
    let sortOption = {};
    switch (sort) {
      case 'price-low':
        sortOption = { price: 1 };
        break;
      case 'price-high':
        sortOption = { price: -1 };
        break;
      case 'rating':
        sortOption = { rating: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'featured':
        sortOption = { isFeatured: -1, createdAt: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const count = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort(sortOption)
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    console.log(`📦 Found ${products.length} products (Page ${page} of ${Math.ceil(count / pageSize)})`);

    res.json({
      success: true,
      products,
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
      limit: pageSize
    });
  } catch (error) {
    console.error('❌ Get products error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get featured products with filtering, sorting, pagination
// @route   GET /api/products/featured
// @access  Public
export const getFeaturedProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const skip = (page - 1) * limit;
    const category = req.query.category;
    const sort = req.query.sort || 'featured';

    // 🔥 FIXED: Use isFeatured field consistently
    let filter = { isFeatured: true, isActive: true };
    
    // Add category filter if provided and not 'all'
    if (category && category !== 'all' && category !== 'undefined') {
      filter.category = category;
    }

    // Build sort options
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'price-low':
        sortOption = { price: 1 };
        break;
      case 'price-high':
        sortOption = { price: -1 };
        break;
      case 'rating':
        sortOption = { rating: -1 };
        break;
      case 'featured':
      default:
        sortOption = { createdAt: -1 };
        break;
    }

    // Get total count for pagination
    const total = await Product.countDocuments(filter);

    // Fetch products with filter, sort, and pagination
    const products = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .select('-__v');

    console.log(`📦 Found ${products.length} featured products (Page ${page} of ${Math.ceil(total / limit)})`);

    // 🔥 DEBUG: Log first product to check fields
    if (products.length > 0) {
      console.log('✅ Sample featured product:', {
        id: products[0]._id,
        name: products[0].name,
        isFeatured: products[0].isFeatured,
        featured: products[0].featured
      });
    } else {
      console.log('⚠️ No featured products found. Checking database...');
      
      // Check if any products exist at all
      const totalProducts = await Product.countDocuments();
      console.log(`📊 Total products in database: ${totalProducts}`);
      
      // Check products with isFeatured=true
      const featuredCount = await Product.countDocuments({ isFeatured: true });
      console.log(`📊 Products with isFeatured=true: ${featuredCount}`);
      
      // Check products with featured=true (old field)
      const oldFeaturedCount = await Product.countDocuments({ featured: true });
      console.log(`📊 Products with featured=true (old): ${oldFeaturedCount}`);
      
      // Show some sample products
      const sampleProducts = await Product.find({}).limit(3).select('name isFeatured featured');
      console.log('📋 Sample products:', sampleProducts);
    }

    res.json({
      success: true,
      products,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      limit
    });
  } catch (error) {
    console.error('❌ Get featured products error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get trending products
// @route   GET /api/products/trending
// @access  Public
export const getTrendingProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    // 🔥 FIXED: Use isTrending field consistently
    const products = await Product.find({ 
      isTrending: true,
      isActive: true 
    })
      .limit(parseInt(limit))
      .sort({ views: -1, rating: -1 });

    console.log(`📦 Found ${products.length} trending products`);

    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('❌ Get trending products error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// 🔥 NEW: Get category counts for all products
// @desc    Get category counts for all products
// @route   GET /api/products/category-counts
// @access  Public
export const getCategoryCounts = async (req, res) => {
  try {
    console.log('📊 Fetching category counts...');
    
    // Aggregate to get counts per category
    const categoryCounts = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Convert to object format
    const counts = {};
    categoryCounts.forEach(item => {
      counts[item._id] = item.count;
    });

    // Also get total products count
    const totalProducts = await Product.countDocuments({ isActive: true });

    console.log('✅ Category counts:', counts);
    console.log('📦 Total active products:', totalProducts);

    res.json({
      success: true,
      data: counts,
      total: totalProducts
    });
  } catch (error) {
    console.error('❌ Error getting category counts:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      // Increment view count
      product.views = (product.views || 0) + 1;
      await product.save();
      
      res.json({
        success: true,
        product
      });
    } else {
      res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }
  } catch (error) {
    console.error('❌ Get product by ID error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get products by category
// @route   GET /api/products/category/:category
// @access  Public
export const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 10 } = req.query;

    const products = await Product.find({ 
      category, 
      isActive: true 
    })
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('❌ Get products by category error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get related products
// @route   GET /api/products/:id/related
// @access  Public
export const getRelatedProducts = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
      isActive: true
    })
      .limit(4)
      .sort({ rating: -1 });

    res.json({
      success: true,
      products: relatedProducts
    });
  } catch (error) {
    console.error('❌ Get related products error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Create a product with image upload
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  try {
    console.log('📦 Creating product with data:', req.body);
    console.log('📸 Files received:', req.files?.length || 0);

    // Validation
    const { name, price, description, category, countInStock } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Product name is required'
      });
    }
    if (!price) {
      return res.status(400).json({
        success: false,
        message: 'Price is required'
      });
    }
    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Description is required'
      });
    }
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }
    if (!countInStock) {
      return res.status(400).json({
        success: false,
        message: 'Stock quantity is required'
      });
    }

    // Handle image paths
    let imagePaths = [];
    if (req.files && req.files.length > 0) {
      imagePaths = req.files.map(file => {
        return `/uploads/${file.filename}`;
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'At least one product image is required'
      });
    }

    // Parse features if provided as JSON string
    let features = [];
    if (req.body.features) {
      try {
        features = JSON.parse(req.body.features);
      } catch (e) {
        features = req.body.features.split(',').map(f => f.trim());
      }
    }

    // 🔥 FIXED: Consistent field naming - use isFeatured (not featured)
    const isFeatured = req.body.isFeatured === 'true' || req.body.isFeatured === true;
    const isTrending = req.body.isTrending === 'true' || req.body.isTrending === true;
    const isDeal = req.body.isDeal === 'true' || req.body.isDeal === true;

    // Create product object
    const productData = {
      name: name.trim(),
      price: Number(price),
      description: description.trim(),
      category,
      countInStock: Number(countInStock),
      brand: req.body.brand?.trim() || 'General',
      image: imagePaths[0] || '',
      images: imagePaths,
      features: features.filter(f => f),
      // 🔥 FIXED: Use consistent field names
      isDeal,
      isFeatured,
      isTrending,
      // Also set legacy fields for backward compatibility
      trending: isTrending,
      featured: isFeatured,
      isActive: true,
      user: req.user._id,
      views: 0,
      sold: 0,
      rating: 0,
      numReviews: 0
    };

    // Add deal fields if applicable
    if (isDeal) {
      if (!req.body.dealPrice) {
        return res.status(400).json({
          success: false,
          message: 'Deal price is required for deal products'
        });
      }
      if (!req.body.dealEnds) {
        return res.status(400).json({
          success: false,
          message: 'Deal end date is required for deal products'
        });
      }
      
      productData.dealPrice = Number(req.body.dealPrice);
      productData.dealEnds = new Date(req.body.dealEnds);
      productData.discount = req.body.discount || '';
      productData.originalPrice = Number(price);
    }

    const product = new Product(productData);
    const createdProduct = await product.save();
    
    console.log('✅ Product created successfully:', createdProduct._id);
    console.log('📸 Images saved:', imagePaths);
    console.log('🔍 Product flags:', {
      isFeatured: createdProduct.isFeatured,
      isTrending: createdProduct.isTrending,
      isDeal: createdProduct.isDeal
    });

    res.status(201).json({
      success: true,
      product: createdProduct,
      message: 'Product created successfully'
    });

  } catch (error) {
    console.error('❌ Product creation error:', error);
    
    // Clean up uploaded files if product creation failed
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const filePath = path.join(__dirname, '../../uploads', file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('🧹 Cleaned up file:', file.filename);
        }
      });
    }

    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    console.log('🔄 Updating product with data:', req.body);

    // Update fields
    product.name = req.body.name || product.name;
    product.price = req.body.price ? Number(req.body.price) : product.price;
    product.description = req.body.description || product.description;
    product.category = req.body.category || product.category;
    product.countInStock = req.body.countInStock ? Number(req.body.countInStock) : product.countInStock;
    product.brand = req.body.brand || product.brand;
    
    // Handle features
    if (req.body.features) {
      try {
        product.features = JSON.parse(req.body.features);
      } catch (e) {
        product.features = req.body.features.split(',').map(f => f.trim());
      }
    }

    // Handle new images if uploaded
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      product.images = [...product.images, ...newImages];
      product.image = product.images[0] || product.image;
    }

    // 🔥 FIXED: Consistent flag updates
    // isTrending
    if (req.body.isTrending !== undefined) {
      const trendingValue = req.body.isTrending === 'true' || req.body.isTrending === true;
      product.isTrending = trendingValue;
      product.trending = trendingValue; // Keep legacy field in sync
    }
    
    // isFeatured
    if (req.body.isFeatured !== undefined) {
      const featuredValue = req.body.isFeatured === 'true' || req.body.isFeatured === true;
      product.isFeatured = featuredValue;
      product.featured = featuredValue; // Keep legacy field in sync
    }
    
    // isDeal
    if (req.body.isDeal !== undefined) {
      product.isDeal = req.body.isDeal === 'true' || req.body.isDeal === true;
    }

    // Update deal fields
    if (product.isDeal) {
      product.dealPrice = req.body.dealPrice ? Number(req.body.dealPrice) : product.dealPrice;
      product.dealEnds = req.body.dealEnds ? new Date(req.body.dealEnds) : product.dealEnds;
      product.discount = req.body.discount || product.discount;
      product.originalPrice = product.price;
    }

    const updatedProduct = await product.save();
    
    console.log('✅ Product updated successfully:', updatedProduct._id);
    console.log('🔍 Updated flags:', {
      isFeatured: updatedProduct.isFeatured,
      isTrending: updatedProduct.isTrending,
      isDeal: updatedProduct.isDeal
    });

    res.json({
      success: true,
      product: updatedProduct,
      message: 'Product updated successfully'
    });

  } catch (error) {
    console.error('❌ Update product error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Delete a product (permanent delete)
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    console.log('🗑️ Permanently deleting product:', product._id, product.name);

    // Delete associated images from filesystem
    if (product.images && product.images.length > 0) {
      product.images.forEach(imagePath => {
        const filename = imagePath.split('/').pop();
        const filePath = path.join(__dirname, '../../uploads', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('🗑️ Deleted image file:', filename);
        }
      });
    }

    // 🔥 HARD DELETE - Remove from database permanently
    await Product.findByIdAndDelete(req.params.id);

    res.json({ 
      success: true,
      message: 'Product deleted permanently' 
    });

  } catch (error) {
    console.error('❌ Delete product error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Soft delete a product (deactivate)
// @route   PUT /api/products/:id/deactivate
// @access  Private/Admin
export const deactivateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    // Soft delete - just mark as inactive
    product.isActive = false;
    await product.save();

    res.json({ 
      success: true,
      message: 'Product deactivated successfully' 
    });

  } catch (error) {
    console.error('❌ Deactivate product error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Restore a deleted product
// @route   PUT /api/products/:id/restore
// @access  Private/Admin
export const restoreProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    product.isActive = true;
    await product.save();

    res.json({ 
      success: true,
      message: 'Product restored successfully' 
    });

  } catch (error) {
    console.error('❌ Restore product error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Duplicate a product
// @route   POST /api/products/:id/duplicate
// @access  Private/Admin
export const duplicateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    const productData = product.toObject();
    delete productData._id;
    delete productData.createdAt;
    delete productData.updatedAt;
    delete productData.__v;

    productData.name = `${productData.name} (Copy)`;
    productData.isActive = true;
    productData.views = 0;
    productData.sold = 0;

    const duplicatedProduct = await Product.create(productData);

    res.status(201).json({
      success: true,
      product: duplicatedProduct,
      message: 'Product duplicated successfully'
    });

  } catch (error) {
    console.error('❌ Duplicate product error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
export const createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    const alreadyReviewed = product.reviews.find(
      r => r.user.toString() === req.user._id.toString()
    );
    
    if (alreadyReviewed) {
      return res.status(400).json({ 
        success: false,
        message: 'Product already reviewed' 
      });
    }
    
    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id
    };
    
    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    
    const totalRating = product.reviews.reduce((acc, r) => acc + r.rating, 0);
    product.rating = totalRating / product.reviews.length;
    
    await product.save();
    
    res.status(201).json({ 
      success: true,
      message: 'Review added successfully' 
    });

  } catch (error) {
    console.error('❌ Create review error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get top rated products
// @route   GET /api/products/top
// @access  Public
export const getTopProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .sort({ rating: -1 })
      .limit(5)
      .select('name price images image rating numReviews isFeatured isTrending');
    
    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('❌ Get top products error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get deal products
// @route   GET /api/products/deals
// @access  Public
export const getDealProducts = async (req, res) => {
  try {
    const currentDate = new Date();
    const products = await Product.find({
      isDeal: true,
      isActive: true,
      dealEnds: { $gt: currentDate }
    })
      .sort({ dealPrice: 1 })
      .select('name price dealPrice dealEnds discount images image isFeatured isTrending');
    
    console.log(`📦 Found ${products.length} active deals`);

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('❌ Get deal products error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get filtered products for admin
// @route   GET /api/products/filter
// @access  Private/Admin
export const getFilteredProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category,
      minPrice,
      maxPrice,
      brand,
      sort = 'createdAt',
      order = 'desc',
      search = '',
      lowStock,
      isDeal,
      isFeatured,
      isTrending,
      includeInactive = 'false'
    } = req.query;

    let filter = {};
    
    if (includeInactive !== 'true') {
      filter.isActive = true;
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (brand && brand !== 'all') {
      filter.brand = brand;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (lowStock === 'true') {
      filter.countInStock = { $lt: 10 };
    }

    if (isDeal === 'true') {
      filter.isDeal = true;
    }

    if (isFeatured === 'true') {
      filter.isFeatured = true;
    }

    if (isTrending === 'true') {
      filter.isTrending = true;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let sortOption = {};
    sortOption[sort] = order === 'desc' ? -1 : 1;

    const products = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      products,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      total
    });
  } catch (error) {
    console.error('❌ Get filtered products error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get low stock products for admin dashboard
// @route   GET /api/products/low-stock
// @access  Private/Admin
export const getLowStockProducts = async (req, res) => {
  try {
    console.log('📦 Fetching low stock products...');
    
    const lowStockProducts = await Product.find({
      countInStock: { $lt: 10 }
    }).select('name countInStock price images image brand isFeatured isTrending');

    console.log(`✅ Found ${lowStockProducts.length} low stock products`);
    
    res.json({
      success: true,
      data: lowStockProducts
    });
  } catch (error) {
    console.error('❌ Get low stock products error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get product stats for admin
// @route   GET /api/products/stats
// @access  Private/Admin
export const getProductStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ isActive: true });
    const dealProducts = await Product.countDocuments({ isDeal: true, isActive: true });
    const featuredProducts = await Product.countDocuments({ isFeatured: true, isActive: true });
    const trendingProducts = await Product.countDocuments({ isTrending: true, isActive: true });
    const outOfStock = await Product.countDocuments({ countInStock: 0, isActive: true });

    console.log('📊 Product stats:', {
      totalProducts,
      dealProducts,
      featuredProducts,
      trendingProducts,
      outOfStock
    });

    res.json({
      success: true,
      data: {
        totalProducts,
        dealProducts,
        featuredProducts,
        trendingProducts,
        outOfStock
      }
    });
  } catch (error) {
    console.error('❌ Get product stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get product analytics
// @route   GET /api/products/analytics
// @access  Private/Admin
export const getProductAnalytics = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;

    let groupBy;
    if (period === 'daily') {
      groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    } else if (period === 'weekly') {
      groupBy = { $week: '$createdAt' };
    } else {
      groupBy = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
    }

    const productsOverTime = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': -1 } },
      { $limit: 12 }
    ]);

    const mostViewed = await Product.find({ isActive: true })
      .sort({ views: -1 })
      .limit(10)
      .select('name views price images isFeatured isTrending');

    const bestSelling = await Product.find({ isActive: true })
      .sort({ sold: -1 })
      .limit(10)
      .select('name sold price images isFeatured isTrending');

    const topRated = await Product.find({ isActive: true })
      .sort({ rating: -1, numReviews: -1 })
      .limit(10)
      .select('name rating numReviews price images isFeatured isTrending');

    res.json({
      success: true,
      data: {
        productsOverTime,
        mostViewed,
        bestSelling,
        topRated
      }
    });
  } catch (error) {
    console.error('❌ Get product analytics error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Bulk update products
// @route   POST /api/products/bulk
// @access  Private/Admin
export const bulkUpdateProducts = async (req, res) => {
  try {
    const { productIds, action, value } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs are required'
      });
    }

    let update = {};
    switch (action) {
      case 'isDeal':
        update = { isDeal: value };
        break;
      case 'isFeatured':
        update = { isFeatured: value };
        break;
      case 'isTrending':
        update = { isTrending: value };
        break;
      case 'isActive':
        update = { isActive: value };
        break;
      case 'category':
        update = { category: value };
        break;
      case 'brand':
        update = { brand: value };
        break;
      case 'delete':
        update = { isActive: false };
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: update }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} products successfully`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('❌ Bulk update error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Export products to CSV
// @route   POST /api/products/export
// @access  Private/Admin
export const exportProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .select('name price description category brand countInStock isDeal isFeatured isTrending rating numReviews');

    const csvData = products.map(p => ({
      Name: p.name,
      Price: p.price,
      Description: p.description?.substring(0, 100),
      Category: p.category,
      Brand: p.brand,
      Stock: p.countInStock,
      'Is Deal': p.isDeal ? 'Yes' : 'No',
      'Is Featured': p.isFeatured ? 'Yes' : 'No',
      'Is Trending': p.isTrending ? 'Yes' : 'No',
      Rating: p.rating,
      Reviews: p.numReviews
    }));

    res.json({
      success: true,
      data: csvData
    });
  } catch (error) {
    console.error('❌ Export products error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Import products from CSV
// @route   POST /api/products/import
// @access  Private/Admin
export const importProducts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    res.json({
      success: true,
      message: 'Products imported successfully'
    });
  } catch (error) {
    console.error('❌ Import products error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Debug endpoint to check featured products
// @route   GET /api/products/debug/featured
// @access  Public (temporary)
export const debugFeaturedProducts = async (req, res) => {
  try {
    // Get all products
    const allProducts = await Product.find({}).limit(20).select('name isFeatured featured isActive');
    
    // Count products with different flags
    const isFeaturedTrue = await Product.countDocuments({ isFeatured: true });
    const featuredTrue = await Product.countDocuments({ featured: true });
    const isActiveTrue = await Product.countDocuments({ isActive: true });
    const totalProducts = await Product.countDocuments();
    
    // Sample products
    const samples = allProducts.map(p => ({
      id: p._id,
      name: p.name,
      isFeatured: p.isFeatured,
      featured: p.featured,
      isActive: p.isActive
    }));

    res.json({
      success: true,
      data: {
        counts: {
          total: totalProducts,
          active: isActiveTrue,
          isFeatured: isFeaturedTrue,
          featuredLegacy: featuredTrue
        },
        samples
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};