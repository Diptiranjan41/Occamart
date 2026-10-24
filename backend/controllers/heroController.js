import HeroBanner from '../models/HeroBanner.js';
import cloudinary from '../config/cloudinary.js';

// ============================================================
// HELPERS
// ============================================================

const isValidId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

const toBool = (v) => v === true || v === 'true';

// https://res.cloudinary.com/xxx/image/upload/v123/occamart/banners/abc.jpg -> occamart/banners/abc
const getPublicId = (url) => {
    if (typeof url !== 'string' || !url.includes('res.cloudinary.com')) return null;
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i);
    return match ? match[1] : null;
};

// Cloudinary se image delete (purani /uploads ya Unsplash URLs ignore hoti hain)
const deleteCloudImage = async (url) => {
    const publicId = getPublicId(url);
    if (!publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId);
        console.log('🗑️ Deleted cloud image:', publicId);
    } catch (err) {
        console.error('⚠️ Cloudinary delete failed:', publicId, err.message);
    }
};

const ALLOWED_FIELDS = [
    'title',
    'subtitle',
    'badge',
    'highlight',
    'category',
    'buttonText',
    'buttonLink',
    'image',
    'active',
    'order'
];

// ============================================================
// PUBLIC
// ============================================================

// @desc    Get hero banner data (active banners only for frontend)
// @route   GET /api/hero-banner
// @access  Public
export const getHeroBanner = async (req, res) => {
    try {
        const activeSlides = await HeroBanner.find({ active: true }).sort('order');

        res.json({
            success: true,
            data: activeSlides,
            themeColor: '#D4AF37'
        });
    } catch (error) {
        console.error('❌ Error fetching hero banner:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single hero banner by ID
// @route   GET /api/hero-banner/:id
// @access  Public
export const getHeroBannerById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid banner ID format' });
        }

        const banner = await HeroBanner.findById(id);

        if (!banner) {
            return res.status(404).json({ success: false, message: 'Banner not found' });
        }

        res.json({ success: true, data: banner });
    } catch (error) {
        console.error('❌ Error fetching hero banner by ID:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// ADMIN
// ============================================================

// @desc    Get all banners (for admin panel)
// @route   GET /api/hero-banner/all
// @access  Private/Admin
export const getAllBanners = async (req, res) => {
    try {
        const banners = await HeroBanner.find().sort('order');
        res.json({ success: true, data: banners });
    } catch (error) {
        console.error('❌ Error fetching all banners:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create new hero banner
// @route   POST /api/hero-banner
// @access  Private/Admin
// Image do tarah se aa sakti hai:
//   1. req.file.path  (agar route par uploadSingle middleware laga hai, Cloudinary URL)
//   2. req.body.image (pehle /api/upload se mila URL ya koi bhi https URL)
export const createHeroBanner = async (req, res) => {
    const uploadedUrl = req.file?.path;

    try {
        const {
            title,
            subtitle,
            badge,
            highlight,
            category,
            buttonText,
            buttonLink,
            active
        } = req.body;

        const image = uploadedUrl || req.body.image;

        if (!title || !image) {
            if (uploadedUrl) await deleteCloudImage(uploadedUrl);
            return res.status(400).json({
                success: false,
                message: 'Title and image are required'
            });
        }

        const count = await HeroBanner.countDocuments();

        const newBanner = await HeroBanner.create({
            title,
            subtitle: subtitle || '',
            badge: badge || '',
            highlight: highlight || '',
            category: category || '',
            buttonText: buttonText || 'Shop Now',
            buttonLink: buttonLink || '/shop',
            image,
            active: active !== undefined ? toBool(active) : true,
            order: count + 1
        });

        res.status(201).json({
            success: true,
            message: 'Hero banner created successfully',
            data: newBanner
        });
    } catch (error) {
        console.error('❌ Error creating hero banner:', error);
        if (uploadedUrl) await deleteCloudImage(uploadedUrl);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update hero banner
// @route   PUT /api/hero-banner/:id
// @access  Private/Admin
export const updateHeroBanner = async (req, res) => {
    const uploadedUrl = req.file?.path;

    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            if (uploadedUrl) await deleteCloudImage(uploadedUrl);
            return res.status(400).json({ success: false, message: 'Invalid banner ID format' });
        }

        const existing = await HeroBanner.findById(id);

        if (!existing) {
            if (uploadedUrl) await deleteCloudImage(uploadedUrl);
            return res.status(404).json({ success: false, message: 'Banner not found' });
        }

        // Sirf allowed fields update hongi (req.body spread nahi)
        const updateData = {};
        ALLOWED_FIELDS.forEach((field) => {
            if (req.body[field] !== undefined) updateData[field] = req.body[field];
        });

        if (updateData.active !== undefined) updateData.active = toBool(updateData.active);
        if (updateData.order !== undefined) updateData.order = Number(updateData.order);
        if (uploadedUrl) updateData.image = uploadedUrl;
        updateData.updatedAt = Date.now();

        const updatedBanner = await HeroBanner.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        });

        // Image badli hai to purani Cloudinary image hata do
        if (updateData.image && updateData.image !== existing.image) {
            await deleteCloudImage(existing.image);
        }

        res.json({
            success: true,
            message: 'Hero banner updated successfully',
            data: updatedBanner
        });
    } catch (error) {
        console.error('❌ Error updating hero banner:', error);
        if (uploadedUrl) await deleteCloudImage(uploadedUrl);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete hero banner
// @route   DELETE /api/hero-banner/:id
// @access  Private/Admin
export const deleteHeroBanner = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid banner ID format' });
        }

        const deletedBanner = await HeroBanner.findByIdAndDelete(id);

        if (!deletedBanner) {
            return res.status(404).json({ success: false, message: 'Banner not found' });
        }

        await deleteCloudImage(deletedBanner.image);

        // Order dobara 1..n set karo (ek hi bulk query mein)
        const remaining = await HeroBanner.find().sort('order').select('_id');
        if (remaining.length > 0) {
            await HeroBanner.bulkWrite(
                remaining.map((b, i) => ({
                    updateOne: { filter: { _id: b._id }, update: { $set: { order: i + 1 } } }
                }))
            );
        }

        res.json({ success: true, message: 'Hero banner deleted successfully' });
    } catch (error) {
        console.error('❌ Error deleting hero banner:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Toggle banner active status
// @route   PATCH /api/hero-banner/:id/toggle
// @access  Private/Admin
export const toggleBannerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { active } = req.body;

        if (!isValidId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid banner ID format' });
        }

        const banner = await HeroBanner.findById(id);

        if (!banner) {
            return res.status(404).json({ success: false, message: 'Banner not found' });
        }

        banner.active = active !== undefined ? toBool(active) : !banner.active;
        await banner.save();

        res.json({
            success: true,
            message: `Banner ${banner.active ? 'activated' : 'deactivated'} successfully`,
            data: banner
        });
    } catch (error) {
        console.error('❌ Error toggling banner status:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Reorder banners
// @route   POST /api/hero-banner/reorder
// @access  Private/Admin
export const reorderBanners = async (req, res) => {
    try {
        const { order } = req.body;

        if (!order || !Array.isArray(order) || order.some((id) => !isValidId(id))) {
            return res.status(400).json({
                success: false,
                message: 'Order must be an array of valid banner IDs'
            });
        }

        await HeroBanner.bulkWrite(
            order.map((id, i) => ({
                updateOne: { filter: { _id: id }, update: { $set: { order: i + 1 } } }
            }))
        );

        res.json({ success: true, message: 'Banners reordered successfully' });
    } catch (error) {
        console.error('❌ Error reordering banners:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Upload image to Cloudinary
// @route   POST /api/upload  (ya jo bhi route is controller se juda hai)
// @access  Private/Admin
// Route par uploadSingle middleware zaroori hai: router.post('/', protect, admin, uploadSingle, uploadImage)
export const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image file provided' });
        }

        // Upload middleware ke baad req.file.path = permanent Cloudinary https URL
        const imageUrl = req.file.path;

        if (!imageUrl || !imageUrl.startsWith('http')) {
            return res.status(500).json({
                success: false,
                message: 'Image upload failed. Cloudinary is not configured on the server.'
            });
        }

        console.log('📸 Image uploaded:', imageUrl);

        res.json({
            success: true,
            message: 'Image uploaded successfully',
            url: imageUrl
        });
    } catch (error) {
        console.error('❌ Error uploading image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload image',
            error: error.message
        });
    }
};

// @desc    Seed initial banner data
// @route   POST /api/hero-banner/seed
// @access  Private/Admin
export const seedBanners = async (req, res) => {
    try {
        const count = await HeroBanner.countDocuments();

        if (count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Banners already exist in database'
            });
        }

        const initialBanners = [
            {
                title: 'Summer Collection',
                subtitle: 'Discover Your Perfect Style',
                badge: '🔥 HOT DEALS',
                highlight: 'Up to 50% Off',
                category: 'fashion',
                buttonText: 'Shop Now',
                buttonLink: '/shop?category=fashion',
                image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
                active: true,
                order: 1
            },
            {
                title: 'Premium Electronics',
                subtitle: 'Latest Tech Arrivals',
                badge: '⚡ FLASH SALE',
                highlight: 'Save ₹5000+',
                category: 'electronics',
                buttonText: 'Shop Now',
                buttonLink: '/shop?category=electronics',
                image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
                active: true,
                order: 2
            },
            {
                title: 'Luxury Watches',
                subtitle: 'Timeless Elegance',
                badge: '✨ PREMIUM',
                highlight: '30-70% Off',
                category: 'watches',
                buttonText: 'Shop Now',
                buttonLink: '/shop?category=watches',
                image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
                active: true,
                order: 3
            },
            {
                title: 'Sportswear Edition',
                subtitle: 'Active Lifestyle Gear',
                badge: '🏃 SPORTS',
                highlight: 'Extra 20% Off',
                category: 'sports',
                buttonText: 'Shop Now',
                buttonLink: '/shop?category=sports',
                image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
                active: true,
                order: 4
            }
        ];

        await HeroBanner.insertMany(initialBanners);

        res.json({ success: true, message: 'Initial banners seeded successfully' });
    } catch (error) {
        console.error('❌ Error seeding banners:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to seed banners',
            error: error.message
        });
    }
};
