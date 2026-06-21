import HeroBanner from '../models/HeroBanner.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Get hero banner data (active banners only for frontend)
// @route   GET /api/hero-banner
// @access  Public
export const getHeroBanner = async (req, res) => {
    try {
        console.log('📦 Fetching hero banner data...');
        
        const activeSlides = await HeroBanner.find({ active: true }).sort('order');
        
        console.log(`✅ Found ${activeSlides.length} active slides`);
        
        res.json({
            success: true,
            data: activeSlides,
            themeColor: '#D4AF37'
        });
    } catch (error) {
        console.error('❌ Error fetching hero banner:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// @desc    Get all banners (for admin panel)
// @route   GET /api/hero-banner/all
// @access  Private/Admin
export const getAllBanners = async (req, res) => {
    try {
        const banners = await HeroBanner.find().sort('order');
        res.json({
            success: true,
            data: banners
        });
    } catch (error) {
        console.error('❌ Error fetching all banners:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// @desc    Get single hero banner by ID
// @route   GET /api/hero-banner/:id
// @access  Public
export const getHeroBannerById = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid banner ID format'
            });
        }
        
        const banner = await HeroBanner.findById(id);
        
        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found'
            });
        }
        
        res.json({
            success: true,
            data: banner
        });
    } catch (error) {
        console.error('❌ Error fetching hero banner by ID:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// @desc    Create new hero banner (admin only)
// @route   POST /api/hero-banner
// @access  Private/Admin
export const createHeroBanner = async (req, res) => {
    try {
        const { title, subtitle, badge, highlight, category, buttonText, buttonLink, image, active } = req.body;
        
        if (!title || !image) {
            return res.status(400).json({
                success: false,
                message: 'Title and image are required'
            });
        }
        
        console.log('📝 Creating new banner:', { title, category });
        
        const newBanner = await HeroBanner.create({
            title,
            subtitle: subtitle || '',
            badge: badge || '',
            highlight: highlight || '',
            category: category || '',
            buttonText: buttonText || 'Shop Now',
            buttonLink: buttonLink || '/shop',
            image,
            active: active !== undefined ? active : true
        });
        
        res.status(201).json({
            success: true,
            message: 'Hero banner created successfully',
            data: newBanner
        });
    } catch (error) {
        console.error('❌ Error creating hero banner:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// @desc    Update hero banner (admin only)
// @route   PUT /api/hero-banner/:id
// @access  Private/Admin
export const updateHeroBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid banner ID format'
            });
        }
        
        console.log(`🔄 Updating banner ${id}:`, updateData);
        
        const updatedBanner = await HeroBanner.findByIdAndUpdate(
            id,
            {
                ...updateData,
                updatedAt: Date.now()
            },
            { new: true, runValidators: true }
        );
        
        if (!updatedBanner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Hero banner updated successfully',
            data: updatedBanner
        });
    } catch (error) {
        console.error('❌ Error updating hero banner:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// @desc    Delete hero banner (admin only)
// @route   DELETE /api/hero-banner/:id
// @access  Private/Admin
export const deleteHeroBanner = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid banner ID format'
            });
        }
        
        console.log(`🗑️ Deleting banner ${id}`);
        
        const deletedBanner = await HeroBanner.findByIdAndDelete(id);
        
        if (!deletedBanner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found'
            });
        }
        
        const remainingBanners = await HeroBanner.find().sort('order');
        for (let i = 0; i < remainingBanners.length; i++) {
            remainingBanners[i].order = i + 1;
            await remainingBanners[i].save();
        }
        
        res.json({
            success: true,
            message: 'Hero banner deleted successfully'
        });
    } catch (error) {
        console.error('❌ Error deleting hero banner:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// @desc    Toggle banner active status (admin only)
// @route   PATCH /api/hero-banner/:id/toggle
// @access  Private/Admin
export const toggleBannerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { active } = req.body;
        
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid banner ID format'
            });
        }
        
        console.log(`🔄 Toggling banner ${id} status`);
        
        const banner = await HeroBanner.findById(id);
        
        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found'
            });
        }
        
        banner.active = active !== undefined ? active : !banner.active;
        await banner.save();
        
        res.json({
            success: true,
            message: `Banner ${banner.active ? 'activated' : 'deactivated'} successfully`,
            data: banner
        });
    } catch (error) {
        console.error('❌ Error toggling banner status:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// @desc    Reorder banners (admin only)
// @route   POST /api/hero-banner/reorder
// @access  Private/Admin
export const reorderBanners = async (req, res) => {
    try {
        const { order } = req.body;
        
        if (!order || !Array.isArray(order)) {
            return res.status(400).json({
                success: false,
                message: 'Order array is required'
            });
        }
        
        console.log('🔄 Reordering banners:', order);
        
        for (let i = 0; i < order.length; i++) {
            const banner = await HeroBanner.findById(order[i]);
            if (banner) {
                banner.order = i + 1;
                await banner.save();
            }
        }
        
        res.json({
            success: true,
            message: 'Banners reordered successfully'
        });
    } catch (error) {
        console.error('❌ Error reordering banners:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// @desc    Upload image
// @route   POST /api/upload
// @access  Private/Admin
export const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        const imageUrl = `/uploads/${req.file.filename}`;

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
                title: 'Summer Collection 2024',
                subtitle: 'Discover Your Perfect Style',
                badge: '🔥 HOT DEALS',
                highlight: 'Up to 50% Off',
                category: 'fashion',
                buttonText: 'Shop Now',
                buttonLink: '/shop?category=fashion',
                image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
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
                image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
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
                image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
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
                image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
                active: true,
                order: 4
            }
        ];

        await HeroBanner.insertMany(initialBanners);

        console.log('✅ Initial banners seeded successfully');

        res.json({
            success: true,
            message: 'Initial banners seeded successfully'
        });
    } catch (error) {
        console.error('❌ Error seeding banners:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to seed banners',
            error: error.message
        });
    }
};