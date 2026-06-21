import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Middleware for authentication (implement your own auth logic)
const protect = (req, res, next) => {
    // TODO: Implement your authentication logic
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }
    next();
};

// Admin middleware
const admin = (req, res, next) => {
    // TODO: Implement admin check logic
    next();
};

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'banner-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

// Public routes (no authentication required)
router.get('/', getHeroBanner);
router.get('/:id', getHeroBannerById);

// Protected routes (require authentication)
router.get('/all', protect, admin, getAllBanners);
router.post('/', protect, admin, createHeroBanner);
router.put('/:id', protect, admin, updateHeroBanner);
router.patch('/:id/toggle', protect, admin, toggleBannerStatus);
router.delete('/:id', protect, admin, deleteHeroBanner);
router.post('/reorder', protect, admin, reorderBanners);
router.post('/upload', protect, admin, upload.single('image'), uploadImage);
router.post('/seed', protect, admin, seedBanners);

export default router;