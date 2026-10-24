// backend/routes/productRoutes.js
import express from 'express';
import multer from 'multer';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  deactivateProduct,
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
  getCategoryCounts
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

// ⚠️ Cloudinary wali upload middleware (multer.memoryStorage + Cloudinary).
// Apni file ka asli path/naam yahan likho (heroRoutes.js mein bhi wahi path).
import { uploadMultiple } from '../middleware/upload.js';

const router = express.Router();

// CSV import ke liye alag uploader (memory mein, disk par nahi).
// Cloudinary wali middleware sirf images allow karti hai, isliye CSV ke liye ye alag hai.
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ===== PUBLIC ROUTES (fixed paths /:id se pehle) =====
router.get('/category-counts', getCategoryCounts);
router.get('/top', getTopProducts);
router.get('/deals', getDealProducts);
router.get('/featured', getFeaturedProducts);
router.get('/trending', getTrendingProducts);
router.get('/category/:category', getProductsByCategory);

// ===== ADMIN ROUTES (fixed paths, /:id se pehle) =====
router.get('/stats', protect, admin, getProductStats);
router.get('/low-stock', protect, admin, getLowStockProducts);
router.get('/filter', protect, admin, getFilteredProducts);
router.get('/analytics', protect, admin, getProductAnalytics);

router.post('/bulk', protect, admin, bulkUpdateProducts);
router.post('/export', protect, admin, exportProducts);
router.post('/import', protect, admin, csvUpload.single('file'), importProducts);

// ===== ROUTES WITH :id =====
router.get('/:id/related', getRelatedProducts);
router.post('/:id/duplicate', protect, admin, duplicateProduct);
router.put('/:id/restore', protect, admin, restoreProduct);
router.put('/:id/deactivate', protect, admin, deactivateProduct);
router.post('/:id/reviews', protect, createReview);

// ===== MAIN PRODUCT ROUTES =====
// uploadMultiple = multer + Cloudinary; controller ko req.files[i].path mein permanent URL milta hai
router
  .route('/')
  .get(getProducts)
  .post(protect, admin, uploadMultiple, createProduct);

router
  .route('/:id')
  .get(getProductById)
  .put(protect, admin, uploadMultiple, updateProduct)
  .delete(protect, admin, deleteProduct);

export default router;
