import Product from '../models/Product.js';
import cloudinary from '../config/cloudinary.js';

// ============================================================
// HELPERS
// ============================================================

const escapeRegex = (str = '') => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toBool = (v) => v === true || v === 'true';

const parseJSON = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (e) {
    return fallback;
  }
};

// FormData se aaye sizes ko clean karta hai -> [{ size: 'M', stock: 10 }]
// Duplicate / khali sizes hata deta hai, size uppercase hota hai
const cleanSizes = (raw) => {
  const arr = parseJSON(raw, []);
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  return arr
    .map((s) => ({
      size: String(s?.size ?? '').trim().toUpperCase(),
      stock: Math.max(0, Number(s?.stock) || 0)
    }))
    .filter((s) => s.size && !seen.has(s.size) && seen.add(s.size));
};

const sumStock = (sizes) => sizes.reduce((sum, s) => sum + s.stock, 0);

const clampRating = (v) => Math.min(5, Math.max(0, Number(v) || 0));

// Cloudinary URL se public_id nikalta hai
// https://res.cloudinary.com/xxx/image/upload/v123/occamart/products/abc.jpg -> occamart/products/abc
const getPublicId = (url) => {
  if (typeof url !== 'string' || !url.includes('res.cloudinary.com')) return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i);
  return match ? match[1] : null;
};

// Cloudinary se images delete karta hai (purani /uploads wali images ignore hoti hain)
const deleteCloudImages = async (urls = []) => {
  for (const url of urls) {
    const publicId = getPublicId(url);
    if (!publicId) continue;
    try {
      await cloudinary.uploader.destroy(publicId);
      console.log('🗑️ Deleted cloud image:', publicId);
    } catch (err) {
      console.error('⚠️ Cloudinary delete failed:', publicId, err.message);
    }
  }
};

// Sirf wahi images delete karta hai jo kisi aur product me use nahi ho rahi
// (duplicateProduct same URLs share karta hai, isliye ye check zaroori hai)
const deleteUnusedCloudImages = async (urls = [], excludeProductId) => {
  const unused = [];
  for (const url of urls) {
    const stillUsed = await Product.exists({
      _id: { $ne: excludeProductId },
      $or: [{ images: url }, { image: url }]
    });
    if (!stillUsed) unused.push(url);
  }
  await deleteCloudImages(unused);
};

// Upload middleware ke baad file.path mein permanent https URL hota hai
const getUploadedUrls = (files = []) => files.map((f) => f.path).filter(Boolean);

const parseFeatures = (raw) => {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw.filter(Boolean);
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch (e) {
    return String(raw).split(',').map((f) => f.trim()).filter(Boolean);
  }
};

const MAX_IMAGES = 5;

// ============================================================
// PUBLIC ROUTES
// ============================================================

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const pageSize = Number(req.query.limit) || 10;
    // Admin frontend `page` bhejta hai, purana code `pageNumber` — dono chalenge
    const page = Number(req.query.page) || Number(req.query.pageNumber) || 1;
    const category = req.query.category;
    const sort = req.query.sort || 'createdAt';

    const filter = { isActive: true };

    if (req.query.isFeatured === 'true') filter.isFeatured = true;
    if (req.query.isTrending === 'true') filter.isTrending = true;
    if (req.query.isDeal === 'true') filter.isDeal = true;

    if (category && category !== 'all' && category !== 'undefined') {
      filter.category = category;
    }

    // Size filter: /api/products?size=M  (sirf wo products jinme M size ka stock hai)
    if (req.query.size) {
      filter.sizes = {
        $elemMatch: { size: String(req.query.size).toUpperCase(), stock: { $gt: 0 } }
      };
    }

    // Minimum rating filter: /api/products?minRating=4
    if (req.query.minRating) {
      filter.rating = { $gte: Number(req.query.minRating) };
    }

    if (req.query.keyword) {
      filter.name = { $regex: escapeRegex(req.query.keyword), $options: 'i' };
    }

    let sortOption = {};
    switch (sort) {
      case 'price-low':
        sortOption = { price: 1 };
        break;
      case 'price-high':
        sortOption = { price: -1 };
        break;
      case 'rating':
        sortOption = { rating: -1, numReviews: -1 };
        break;
      case 'featured':
        sortOption = { isFeatured: -1, createdAt: -1 };
        break;
      case 'newest':
      default:
        sortOption = { createdAt: -1 };
    }

    const count = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort(sortOption)
      .limit(pageSize)
      .skip(pageSize * (page - 1));

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
    res.status(500).json({ success: false, message: error.message });
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

    const filter = { isFeatured: true, isActive: true };

    if (category && category !== 'all' && category !== 'undefined') {
      filter.category = category;
    }

    let sortOption = {};
    switch (sort) {
      case 'price-low':
        sortOption = { price: 1 };
        break;
      case 'price-high':
        sortOption = { price: -1 };
        break;
      case 'rating':
        sortOption = { rating: -1, numReviews: -1 };
        break;
      case 'newest':
      case 'featured':
      default:
        sortOption = { createdAt: -1 };
        break;
    }

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .select('-__v');

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
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get trending products
// @route   GET /api/products/trending
// @access  Public
export const getTrendingProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const products = await Product.find({ isTrending: true, isActive: true })
      .limit(parseInt(limit))
      .sort({ views: -1, rating: -1 });

    res.json({ success: true, products });
  } catch (error) {
    console.error('❌ Get trending products error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get category counts for all products
// @route   GET /api/products/category-counts
// @access  Public
export const getCategoryCounts = async (req, res) => {
  try {
    const categoryCounts = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const counts = {};
    categoryCounts.forEach((item) => {
      counts[item._id] = item.count;
    });

    const totalProducts = await Product.countDocuments({ isActive: true });

    res.json({ success: true, data: counts, total: totalProducts });
  } catch (error) {
    console.error('❌ Error getting category counts:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    // $inc se view count atomically badhta hai (save() se race condition hoti hai)
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (error) {
    console.error('❌ Get product by ID error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get products by category
// @route   GET /api/products/category/:category
// @access  Public
export const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 10 } = req.query;

    const products = await Product.find({ category, isActive: true })
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({ success: true, products });
  } catch (error) {
    console.error('❌ Get products by category error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get related products
// @route   GET /api/products/:id/related
// @access  Public
export const getRelatedProducts = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
      isActive: true
    })
      .limit(4)
      .sort({ rating: -1 });

    res.json({ success: true, products: relatedProducts });
  } catch (error) {
    console.error('❌ Get related products error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get top rated products
// @route   GET /api/products/top
// @access  Public
export const getTopProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .sort({ rating: -1, numReviews: -1 })
      .limit(5)
      .select(
        'name price images image rating numReviews sizes countInStock isFeatured isTrending isDeal dealPrice'
      );

    res.json({ success: true, products });
  } catch (error) {
    console.error('❌ Get top products error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get deal products
// @route   GET /api/products/deals
// @access  Public
export const getDealProducts = async (req, res) => {
  try {
    const products = await Product.find({
      isDeal: true,
      isActive: true,
      dealEnds: { $gt: new Date() }
    })
      .sort({ dealPrice: 1 })
      .select(
        'name price dealPrice dealEnds discount images image rating numReviews sizes countInStock isFeatured isTrending'
      );

    res.json({ success: true, count: products.length, products });
  } catch (error) {
    console.error('❌ Get deal products error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ADMIN ROUTES
// ============================================================

// @desc    Create a product with image upload (Cloudinary)
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  const uploadedUrls = getUploadedUrls(req.files);

  const fail = async (status, message) => {
    await deleteCloudImages(uploadedUrls);
    return res.status(status).json({ success: false, message });
  };

  try {
    const { name, price, description, category, countInStock } = req.body;

    const sizes = cleanSizes(req.body.sizes);
    const hasSizes = sizes.length > 0;

    if (!name) return fail(400, 'Product name is required');
    if (!price) return fail(400, 'Price is required');
    if (!description) return fail(400, 'Description is required');
    if (!category) return fail(400, 'Category is required');

    // Sizes hain to stock unse nikalta hai; warna 0 bhi valid hai, isliye undefined check
    if (!hasSizes && (countInStock === undefined || countInStock === '')) {
      return fail(400, 'Stock quantity is required');
    }

    if (uploadedUrls.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one product image is required'
      });
    }
    if (uploadedUrls.length > MAX_IMAGES) {
      return fail(400, `Maximum ${MAX_IMAGES} images allowed`);
    }

    if (req.body.rating !== undefined && req.body.rating !== '') {
      const r = Number(req.body.rating);
      if (isNaN(r) || r < 0 || r > 5) {
        return fail(400, 'Rating 0 se 5 ke beech honi chahiye');
      }
    }

    const features = parseFeatures(req.body.features) || [];

    const isFeatured = toBool(req.body.isFeatured);
    const isTrending = toBool(req.body.isTrending);
    const isDeal = toBool(req.body.isDeal);

    const productData = {
      name: name.trim(),
      price: Number(price),
      description: description.trim(),
      category,
      sizes,
      countInStock: hasSizes ? sumStock(sizes) : Number(countInStock),
      brand: req.body.brand?.trim() || 'General',
      image: uploadedUrls[0],
      images: uploadedUrls,
      features,
      isDeal,
      isFeatured,
      isTrending,
      // legacy fields in sync
      trending: isTrending,
      featured: isFeatured,
      isActive: true,
      user: req.user._id,
      views: 0,
      sold: 0,
      // Admin ki di hui initial rating (customer reviews aane par recalculate hogi)
      rating: clampRating(req.body.rating),
      numReviews: Math.max(0, Number(req.body.numReviews) || 0)
    };

    if (isDeal) {
      if (!req.body.dealPrice) return fail(400, 'Deal price is required for deal products');
      if (!req.body.dealEnds) return fail(400, 'Deal end date is required for deal products');

      productData.dealPrice = Number(req.body.dealPrice);
      productData.dealEnds = new Date(req.body.dealEnds);
      productData.discount = req.body.discount || '';
      productData.originalPrice = Number(price);
    }

    const createdProduct = await new Product(productData).save();

    console.log('✅ Product created:', createdProduct._id);

    res.status(201).json({
      success: true,
      product: createdProduct,
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('❌ Product creation error:', error);

    // Product save fail hua to Cloudinary se uploaded images hata do
    await deleteCloudImages(uploadedUrls);

    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  const uploadedUrls = getUploadedUrls(req.files);

  const fail = async (status, message) => {
    await deleteCloudImages(uploadedUrls);
    return res.status(status).json({ success: false, message });
  };

  try {
    const product = await Product.findById(req.params.id);

    if (!product) return fail(404, 'Product not found');

    const b = req.body;

    // ---------- Basic fields ----------
    if (b.name) product.name = b.name.trim();
    if (b.price !== undefined && b.price !== '') product.price = Number(b.price);
    if (b.description) product.description = b.description.trim();
    if (b.category) product.category = b.category;
    if (b.brand !== undefined && b.brand.trim()) product.brand = b.brand.trim();

    // ---------- Sizes + stock ----------
    // Frontend hamesha sizes bhejta hai ('[]' = saare sizes hata do)
    if (b.sizes !== undefined) {
      product.sizes = cleanSizes(b.sizes);
    }
    if (product.sizes && product.sizes.length > 0) {
      product.countInStock = sumStock(product.sizes);
    } else if (b.countInStock !== undefined && b.countInStock !== '') {
      product.countInStock = Math.max(0, Number(b.countInStock) || 0);
    }

    // ---------- Rating ----------
    // Agar real customer reviews hain to rating unhi se chalti hai, admin override nahi karega
    if (product.reviews.length === 0) {
      if (b.rating !== undefined && b.rating !== '') {
        const r = Number(b.rating);
        if (isNaN(r) || r < 0 || r > 5) {
          return fail(400, 'Rating 0 se 5 ke beech honi chahiye');
        }
        product.rating = clampRating(r);
      }
      if (b.numReviews !== undefined && b.numReviews !== '') {
        product.numReviews = Math.max(0, Number(b.numReviews) || 0);
      }
    }

    const features = parseFeatures(b.features);
    if (features) product.features = features;

    // ---------- Images ----------
    // existingImages = jo purani images admin ne rakhi hain. Nahi bheji to sab purani rahengi.
    const parsedKeep = parseJSON(b.existingImages, null);
    const keepImages = Array.isArray(parsedKeep) ? parsedKeep : product.images || [];
    // Sirf wahi URLs rakho jo pehle se is product me hain (security)
    const validKeep = keepImages.filter((url) => (product.images || []).includes(url));
    const removedImages = (product.images || []).filter((url) => !validKeep.includes(url));
    const mergedImages = [...validKeep, ...uploadedUrls];

    if (mergedImages.length === 0) {
      return fail(400, 'At least one product image is required');
    }
    if (mergedImages.length > MAX_IMAGES) {
      return fail(400, `Maximum ${MAX_IMAGES} images allowed`);
    }

    product.images = mergedImages;
    product.image = mergedImages[0];

    // ---------- Flags ----------
    if (b.isTrending !== undefined) {
      const v = toBool(b.isTrending);
      product.isTrending = v;
      product.trending = v;
    }

    if (b.isFeatured !== undefined) {
      const v = toBool(b.isFeatured);
      product.isFeatured = v;
      product.featured = v;
    }

    if (b.isDeal !== undefined) {
      product.isDeal = toBool(b.isDeal);
    }

    if (product.isDeal) {
      const dealPrice = b.dealPrice ? Number(b.dealPrice) : product.dealPrice;
      const dealEnds = b.dealEnds ? new Date(b.dealEnds) : product.dealEnds;
      if (!dealPrice) return fail(400, 'Deal price is required for deal products');
      if (!dealEnds) return fail(400, 'Deal end date is required for deal products');

      product.dealPrice = dealPrice;
      product.dealEnds = dealEnds;
      product.discount = b.discount || product.discount;
      product.originalPrice = product.price;
    } else {
      // Deal band hai to purana deal data saaf karo
      product.dealPrice = undefined;
      product.dealEnds = undefined;
      product.discount = undefined;
      product.originalPrice = undefined;
    }

    const updatedProduct = await product.save(); // hooks (flag sync, stock sum) yahin chalte hain

    // Save successful hone ke baad hi hataayi gayi purani images Cloudinary se delete karo
    if (removedImages.length > 0) {
      await deleteUnusedCloudImages(removedImages, product._id);
    }

    res.json({
      success: true,
      product: updatedProduct,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('❌ Update product error:', error);
    await deleteCloudImages(uploadedUrls);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a product (permanent delete)
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);

    // Cloudinary se images hatao (jo duplicate products me use ho rahi hain wo bachi rahengi)
    await deleteUnusedCloudImages(product.images || [], product._id);

    res.json({ success: true, message: 'Product deleted permanently' });
  } catch (error) {
    console.error('❌ Delete product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Soft delete a product (deactivate)
// @route   PUT /api/products/:id/deactivate
// @access  Private/Admin
export const deactivateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.isActive = false;
    await product.save();

    res.json({ success: true, message: 'Product deactivated successfully' });
  } catch (error) {
    console.error('❌ Deactivate product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Restore a deleted product
// @route   PUT /api/products/:id/restore
// @access  Private/Admin
export const restoreProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.isActive = true;
    await product.save();

    res.json({ success: true, message: 'Product restored successfully' });
  } catch (error) {
    console.error('❌ Restore product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Duplicate a product
// @route   POST /api/products/:id/duplicate
// @access  Private/Admin
export const duplicateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const productData = product.toObject();
    delete productData._id;
    delete productData.id;
    delete productData.createdAt;
    delete productData.updatedAt;
    delete productData.__v;

    productData.name = `${productData.name} (Copy)`;
    productData.isActive = true;
    productData.views = 0;
    productData.sold = 0;
    // Copy me purane customer reviews nahi jaane chahiye
    productData.reviews = [];
    productData.rating = 0;
    productData.numReviews = 0;

    const duplicatedProduct = await Product.create(productData);

    res.status(201).json({
      success: true,
      product: duplicatedProduct,
      message: 'Product duplicated successfully'
    });
  } catch (error) {
    console.error('❌ Duplicate product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
export const createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || Number(rating) < 1 || Number(rating) > 5 || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Rating (1-5) aur comment dono zaroori hain'
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({ success: false, message: 'Product already reviewed' });
    }

    product.reviews.push({
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id
    });
    product.numReviews = product.reviews.length;
    product.rating = Number(
      (product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length).toFixed(1)
    );

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      rating: product.rating,
      numReviews: product.numReviews
    });
  } catch (error) {
    console.error('❌ Create review error:', error);
    res.status(500).json({ success: false, message: error.message });
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
      size,
      minRating,
      sort = 'createdAt',
      order = 'desc',
      search = '',
      lowStock,
      isDeal,
      isFeatured,
      isTrending,
      includeInactive = 'false'
    } = req.query;

    const filter = {};

    if (includeInactive !== 'true') filter.isActive = true;
    if (category && category !== 'all') filter.category = category;
    if (brand && brand !== 'all') filter.brand = brand;

    if (size) {
      filter.sizes = { $elemMatch: { size: String(size).toUpperCase(), stock: { $gt: 0 } } };
    }
    if (minRating) filter.rating = { $gte: parseFloat(minRating) };

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (lowStock === 'true') filter.countInStock = { $lt: 10 };
    if (isDeal === 'true') filter.isDeal = true;
    if (isFeatured === 'true') filter.isFeatured = true;
    if (isTrending === 'true') filter.isTrending = true;

    if (search) {
      const safe = escapeRegex(search);
      filter.$or = [
        { name: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } },
        { brand: { $regex: safe, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOption = { [sort]: order === 'desc' ? -1 : 1 };

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
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get low stock products for admin dashboard
// @route   GET /api/products/low-stock
// @access  Private/Admin
export const getLowStockProducts = async (req, res) => {
  try {
    // Ya to total stock kam hai, ya kisi size ka stock khatam / kam hai
    const lowStockProducts = await Product.find({
      isActive: true,
      $or: [
        { countInStock: { $lt: 10 } },
        { sizes: { $elemMatch: { stock: { $lt: 3 } } } }
      ]
    }).select('name countInStock sizes price images image brand isFeatured isTrending');

    res.json({ success: true, data: lowStockProducts });
  } catch (error) {
    console.error('❌ Get low stock products error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get product stats for admin
// @route   GET /api/products/stats
// @access  Private/Admin
export const getProductStats = async (req, res) => {
  try {
    const [totalProducts, dealProducts, featuredProducts, trendingProducts, outOfStock] =
      await Promise.all([
        Product.countDocuments({ isActive: true }),
        Product.countDocuments({ isDeal: true, isActive: true }),
        Product.countDocuments({ isFeatured: true, isActive: true }),
        Product.countDocuments({ isTrending: true, isActive: true }),
        Product.countDocuments({ countInStock: 0, isActive: true })
      ]);

    res.json({
      success: true,
      data: { totalProducts, dealProducts, featuredProducts, trendingProducts, outOfStock }
    });
  } catch (error) {
    console.error('❌ Get product stats error:', error);
    res.status(500).json({ success: false, message: error.message });
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
      { $group: { _id: groupBy, count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
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
      data: { productsOverTime, mostViewed, bestSelling, topRated }
    });
  } catch (error) {
    console.error('❌ Get product analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Bulk update products
// @route   POST /api/products/bulk
// @access  Private/Admin
export const bulkUpdateProducts = async (req, res) => {
  try {
    const { productIds, action, value } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Product IDs are required' });
    }

    let update = {};
    switch (action) {
      case 'isDeal':
        update = { isDeal: value };
        break;
      case 'isFeatured':
        // legacy field bhi sync (updateMany me pre-save hook nahi chalta)
        update = { isFeatured: value, featured: value };
        break;
      case 'isTrending':
        update = { isTrending: value, trending: value };
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
        return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    const result = await Product.updateMany({ _id: { $in: productIds } }, { $set: update });

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} products successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('❌ Bulk update error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export products to CSV
// @route   POST /api/products/export
// @access  Private/Admin
export const exportProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).select(
      'name price description category brand countInStock sizes isDeal isFeatured isTrending rating numReviews'
    );

    const csvData = products.map((p) => ({
      Name: p.name,
      Price: p.price,
      Description: p.description?.substring(0, 100),
      Category: p.category,
      Brand: p.brand,
      Stock: p.countInStock,
      Sizes: (p.sizes || []).map((s) => `${s.size}:${s.stock}`).join(' | '),
      'Is Deal': p.isDeal ? 'Yes' : 'No',
      'Is Featured': p.isFeatured ? 'Yes' : 'No',
      'Is Trending': p.isTrending ? 'Yes' : 'No',
      Rating: p.rating,
      Reviews: p.numReviews
    }));

    res.json({ success: true, data: csvData });
  } catch (error) {
    console.error('❌ Export products error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Import products from CSV
// @route   POST /api/products/import
// @access  Private/Admin
export const importProducts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    res.json({ success: true, message: 'Products imported successfully' });
  } catch (error) {
    console.error('❌ Import products error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Debug endpoint to check featured products (development only)
// @route   GET /api/products/debug/featured
// @access  Public (disabled in production)
export const debugFeaturedProducts = async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ success: false, message: 'Not found' });
  }

  try {
    const allProducts = await Product.find({}).limit(20).select('name isFeatured featured isActive');

    const [isFeaturedTrue, featuredTrue, isActiveTrue, totalProducts] = await Promise.all([
      Product.countDocuments({ isFeatured: true }),
      Product.countDocuments({ featured: true }),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        counts: {
          total: totalProducts,
          active: isActiveTrue,
          isFeatured: isFeaturedTrue,
          featuredLegacy: featuredTrue
        },
        samples: allProducts.map((p) => ({
          id: p._id,
          name: p.name,
          isFeatured: p.isFeatured,
          featured: p.featured,
          isActive: p.isActive
        }))
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
