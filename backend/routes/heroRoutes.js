import express from 'express';
import {
    getHeroBanner,
    getAllBanners,
    getHeroBannerById,
    createHeroBanner,
    updateHeroBanner,
    deleteHeroBanner,
    toggleBannerStatus,
    reorderBanners,
    uploadImage,
    seedBanners
} from '../controllers/heroController.js';

// ⚠️ Apni asli auth middleware yahan import karo.
// productRoutes.js / orderRoutes.js ke upar jo import hai, bilkul wahi path use karo.
import { protect, admin } from '../middleware/authMiddleware.js';

// ⚠️ Cloudinary wali upload middleware (jo multer.memoryStorage use karti hai).
// Apni file ka asli path/naam yahan likho.
import { uploadSingle } from '../middleware/upload.js';

const router = express.Router();

// ============================================================
// PUBLIC (fixed paths pehle, /:id sabse last mein)
// ============================================================
router.get('/', getHeroBanner);
router.get('/active', getHeroBanner); // frontend heroAPI.getActiveBanners ke liye

// ============================================================
// ADMIN - fixed paths (/:id se PEHLE hone zaroori hain)
// ============================================================
router.get('/all', protect, admin, getAllBanners);
router.post('/reorder', protect, admin, reorderBanners);
router.post('/seed', protect, admin, seedBanners);
router.post('/upload', protect, admin, uploadSingle, uploadImage);

// ============================================================
// ADMIN - create / update / delete
// ============================================================
router.post('/', protect, admin, createHeroBanner);
router.patch('/:id/toggle', protect, admin, toggleBannerStatus);
router.put('/:id', protect, admin, updateHeroBanner);
router.delete('/:id', protect, admin, deleteHeroBanner);

// ============================================================
// PUBLIC - dynamic id route (sabse last)
// ============================================================
router.get('/:id', getHeroBannerById);

export default router;
