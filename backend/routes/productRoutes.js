// backend/routes/productRoutes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { 
  getProducts, 
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createReview,
  getTopProducts,
  getDealProducts,
  getLowStockProducts,
  getFeaturedProducts,
  getProductStats,
  getFilteredProducts,
  bulkUpdateProducts,
  getProductsByCategory,
  getTrendingProducts,
  getRelatedProducts,
  restoreProduct,
  getProductAnalytics,
  duplicateProduct,
  exportProducts,
  importProducts,
  // 🔥 NEW: Import getCategoryCounts
  getCategoryCounts
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== MULTER CONFIGURATION =====
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✅ Created uploads directory:', uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + cleanName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP and GIF are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

// ===== PUBLIC ROUTES =====
// 🔥 NEW: Get category counts
router.get('/category-counts', getCategoryCounts);

router.get('/top', getTopProducts);
router.get('/deals', getDealProducts);
router.get('/featured', getFeaturedProducts);
router.get('/trending', getTrendingProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/:id/related', getRelatedProducts);

// ===== ADMIN ROUTES =====
router.get('/stats', protect, admin, getProductStats);
router.get('/low-stock', protect, admin, getLowStockProducts);
router.get('/filter', protect, admin, getFilteredProducts);

// Bulk operations
router.post('/bulk', protect, admin, bulkUpdateProducts);
router.post('/export', protect, admin, exportProducts);
router.post('/import', protect, admin, upload.single('file'), importProducts);

// Duplicate product
router.post('/:id/duplicate', protect, admin, duplicateProduct);

// Restore deleted product
router.put('/:id/restore', protect, admin, restoreProduct);

// Product analytics
router.get('/analytics', protect, admin, getProductAnalytics);

// Main product routes
router.route('/')
  .get(getProducts)
  .post(protect, admin, upload.array('images', 5), createProduct);

router.route('/:id')
  .get(getProductById)
  .put(protect, admin, upload.array('images', 5), updateProduct)
  .delete(protect, admin, deleteProduct);

// Review route
router.route('/:id/reviews').post(protect, createReview);

// ✅ IMPORTANT: Add default export
export default router;