import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// FORCE LOAD .env with absolute path
const envPath = path.join(__dirname, '.env');
console.log('\n🔍 === ENVIRONMENT DEBUG ===');
console.log('Current directory:', __dirname);
console.log('.env path:', envPath);
console.log('.env exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('\n📄 .env content (masked):');
    const lines = content.split('\n');
    lines.forEach(line => {
        if (line.includes('KEY') || line.includes('SECRET') || line.includes('PASS')) {
            const [key, value] = line.split('=');
            const maskedValue = value ? '********' : '';
            console.log(`${key}=${maskedValue}`);
        } else {
            console.log(line);
        }
    });
}

// Load .env
const result = dotenv.config({ path: envPath });
if (result.error) {
    console.error('❌ Error loading .env:', result.error);
} else {
    console.log('✅ .env loaded successfully');
}

console.log('\n📧 Environment Variables After Loading:');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? `✅ ${process.env.EMAIL_USER}` : '❌ MISSING');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? `✅ (${process.env.EMAIL_PASS.length} chars)` : '❌ MISSING');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? `✅ (${process.env.JWT_SECRET.length} chars)` : '❌ MISSING');
console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? `✅ Found (${process.env.RAZORPAY_KEY_ID.length} chars)` : '❌ MISSING');
console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? `✅ Found (${process.env.RAZORPAY_KEY_SECRET.length} chars)` : '❌ MISSING');
console.log('PORT:', process.env.PORT || '5000 (default)');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('🔍 === END DEBUG ===\n');

// Validate required environment variables
const requiredEnvVars = [
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'JWT_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingEnvVars.forEach(envVar => console.error(`   - ${envVar}`));
    console.error('\n⚠️  Please add these variables to your .env file');
    
    // Don't exit in development, but show warning
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
}

// Import database connection
import connectDB from './config/db.js';

// Import routes
import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import newsletterRoutes from './routes/newsletterRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import returnRoutes from './routes/returnRoutes.js';
import heroRoutes from './routes/heroRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

// Import middleware
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Connect to MongoDB
connectDB();

const app = express();

// ===== MIDDLEWARE =====

// Simple request logging middleware (replaces morgan)
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    });
    next();
});

// CORS configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000', // React default port
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://192.168.137.1:5173',
    'http://192.168.56.1:5173',
    'http://20.3.3.22:5173',
    'http://192.168.96.167:5173'
];

// Add any origin from environment variable if set
if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

// In development, allow all origins
if (process.env.NODE_ENV === 'development') {
    allowedOrigins.push('*');
}

// CORS middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, etc)
        if (!origin) return callback(null, true);
        
        // In development, allow all origins
        if (process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('❌ CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== API ROUTES =====

// Health check route (public)
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        razorpayConfigured: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
        routes: {
            products: '/api/products',
            users: '/api/users',
            orders: '/api/orders',
            returns: '/api/returns',
            admin: '/api/admin',
            auth: '/api/auth',
            cart: '/api/cart',
            wishlist: '/api/wishlist',
            newsletter: '/api/newsletter',
            reviews: '/api/reviews',
            feedback: '/api/feedback',
            hero: '/api/hero-banner',
            notifications: '/api/notifications',
            payments: '/api/payments'
        }
    });
});

// Debug routes (only in development)
if (process.env.NODE_ENV === 'development') {
    app.get('/api/debug/routes', (req, res) => {
        const routes = [];
        
        const extractRoutes = (stack, basePath = '') => {
            stack.forEach(layer => {
                if (layer.route) {
                    const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
                    routes.push({
                        path: basePath + layer.route.path,
                        methods
                    });
                } else if (layer.name === 'router' && layer.handle.stack) {
                    extractRoutes(layer.handle.stack, basePath + (layer.regexp.source.replace('\\/?(?=\\/|$)', '').replace(/\\\//g, '/')));
                }
            });
        };
        
        extractRoutes(app._router.stack);
        
        res.json({
            success: true,
            totalRoutes: routes.length,
            routes: routes.sort((a, b) => a.path.localeCompare(b.path))
        });
    });
    
    // Debug endpoint to check environment variables (protected)
    app.get('/api/debug/env', (req, res) => {
        res.json({
            success: true,
            environment: process.env.NODE_ENV,
            razorpayConfigured: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
            emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
            jwtConfigured: !!process.env.JWT_SECRET,
            port: process.env.PORT,
            // Don't send actual values, just status
            variables: {
                RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ? '✅ Set' : '❌ Missing',
                RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET ? '✅ Set' : '❌ Missing',
                JWT_SECRET: process.env.JWT_SECRET ? '✅ Set' : '❌ Missing',
                EMAIL_USER: process.env.EMAIL_USER ? '✅ Set' : '❌ Missing',
                EMAIL_PASS: process.env.EMAIL_PASS ? '✅ Set' : '❌ Missing'
            }
        });
    });
}

// Auth routes
app.use('/api/auth', authRoutes);

// User routes
app.use('/api/users', userRoutes);

// Product routes
app.use('/api/products', productRoutes);

// Order routes
app.use('/api/orders', orderRoutes);

// Return routes (dedicated)
app.use('/api/returns', returnRoutes);

// Cart routes
app.use('/api/cart', cartRoutes);

// Wishlist routes
app.use('/api/wishlist', wishlistRoutes);

// Review routes
app.use('/api/reviews', reviewRoutes);

// Newsletter routes
app.use('/api/newsletter', newsletterRoutes);

// Feedback routes
app.use('/api/feedback', feedbackRoutes);

// Hero banner routes
app.use('/api/hero-banner', heroRoutes);

// Admin routes (should be last as it's most restrictive)
app.use('/api/admin', adminRoutes);

// Notification routes
app.use('/api/notifications', notificationRoutes);

// Payment routes
app.use('/api/payments', paymentRoutes);

// ===== TEST & UTILITY ROUTES =====

// Manual email verification route
app.get('/api/manual-verify/:email', async (req, res) => {
    try {
        const User = (await import('./models/User.js')).default;
        const user = await User.findOne({ email: req.params.email });
        
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        user.isVerified = true;
        user.emailToken = undefined;
        await user.save();
        
        console.log(`✅ Manual verification for: ${user.email}`);
        
        res.json({ 
            success: true, 
            message: `✅ ${user.email} verified manually!`,
            user: { email: user.email, isVerified: user.isVerified }
        });
    } catch (error) {
        console.error('❌ Manual verification error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Test email route
app.get('/api/test-email', async (req, res) => {
    try {
        const { sendVerificationEmail } = await import('./utils/emailService.js');
        const result = await sendVerificationEmail(
            'subratsahoo0978@gmail.com',
            'Test User',
            'test-' + Date.now()
        );
        res.json({ success: true, result });
    } catch (error) {
        console.error('❌ Test email error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Test newsletter email route
app.post('/api/test-newsletter', async (req, res) => {
    try {
        const { email } = req.body;
        const { sendNewsletterConfirmationEmail } = await import('./utils/emailService.js');
        const result = await sendNewsletterConfirmationEmail(email);
        res.json({ success: true, message: 'Test newsletter sent', result });
    } catch (error) {
        console.error('❌ Test newsletter error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ===== ERROR HANDLING =====

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`\n✅ Server running on port ${PORT}`);
    console.log(`📦 API Base: http://localhost:${PORT}/api`);
    console.log(`🖼️  Uploads: http://localhost:${PORT}/uploads`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Show Razorpay status
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        console.log(`💰 Razorpay: ✅ Configured`);
    } else {
        console.log(`💰 Razorpay: ❌ Not configured - Payment routes may not work`);
    }
    
    console.log(`\n📧 === EMAIL ROUTES ===`);
    console.log(`📧 Test email: http://localhost:${PORT}/api/test-email`);
    console.log(`✅ Manual verify: http://localhost:${PORT}/api/manual-verify/your-email@example.com`);
    
    console.log(`\n🔐 === AUTH ROUTES ===`);
    console.log(`📝 Register: http://localhost:${PORT}/api/auth/register`);
    console.log(`🔑 Login: http://localhost:${PORT}/api/auth/login`);
    console.log(`👤 Profile: http://localhost:${PORT}/api/auth/profile`);
    console.log(`🔓 Forgot password: http://localhost:${PORT}/api/auth/forgot-password`);
    console.log(`🔄 Reset password: http://localhost:${PORT}/api/auth/reset-password/:token`);
    
    console.log(`\n👑 === ADMIN ROUTES ===`);
    console.log(`📊 Analytics: http://localhost:${PORT}/api/admin/analytics`);
    console.log(`📈 Stats: http://localhost:${PORT}/api/admin/stats`);
    console.log(`📋 Recent orders: http://localhost:${PORT}/api/admin/recent-orders`);
    console.log(`👥 Recent users: http://localhost:${PORT}/api/admin/recent-users`);
    console.log(`⚠️  Low stock: http://localhost:${PORT}/api/admin/low-stock`);
    console.log(`📦 All orders: http://localhost:${PORT}/api/admin/orders`);
    console.log(`👥 All users: http://localhost:${PORT}/api/admin/users`);
    console.log(`✏️ Update order status: http://localhost:${PORT}/api/admin/orders/:id/status`);
    console.log(`👤 Update user role: http://localhost:${PORT}/api/admin/users/:id/role`);
    console.log(`🚫 Toggle user status: http://localhost:${PORT}/api/admin/users/:id/status`);
    
    console.log(`\n📦 === ORDER ROUTES ===`);
    console.log(`📋 Get orders: http://localhost:${PORT}/api/orders`);
    console.log(`📝 Create order: http://localhost:${PORT}/api/orders (POST)`);
    console.log(`🔍 Get order: http://localhost:${PORT}/api/orders/:id`);
    console.log(`📊 Order stats: http://localhost:${PORT}/api/orders/stats`);
    console.log(`📈 Order analytics: http://localhost:${PORT}/api/orders/analytics`);
    console.log(`🔄 Returnable items: http://localhost:${PORT}/api/orders/:orderId/returnable-items`);
    console.log(`📸 Upload images: http://localhost:${PORT}/api/orders/:orderId/return/images`);
    console.log(`🔄 Request return: http://localhost:${PORT}/api/orders/:orderId/return`);
    console.log(`📋 Return details: http://localhost:${PORT}/api/orders/:orderId/return`);
    console.log(`❌ Cancel return: http://localhost:${PORT}/api/orders/:orderId/return/cancel`);
    
    console.log(`\n🔄 === RETURN ROUTES ===`);
    console.log(`📋 Return reasons: http://localhost:${PORT}/api/returns/reasons`);
    console.log(`📋 Return policy: http://localhost:${PORT}/api/returns/policy`);
    console.log(`🔍 Track return: http://localhost:${PORT}/api/returns/track/:returnId`);
    console.log(`📦 Returnable items: http://localhost:${PORT}/api/returns/order/:orderId/returnable-items`);
    console.log(`📸 Upload images: http://localhost:${PORT}/api/returns/order/:orderId/images`);
    console.log(`🔄 Request return: http://localhost:${PORT}/api/returns/order/:orderId/request`);
    console.log(`📋 Return details: http://localhost:${PORT}/api/returns/order/:orderId/details`);
    console.log(`❌ Cancel return: http://localhost:${PORT}/api/returns/order/:orderId/cancel`);
    
    console.log(`\n👑 === ADMIN RETURN ROUTES ===`);
    console.log(`📋 All returns: http://localhost:${PORT}/api/returns`);
    console.log(`🔄 Update status: http://localhost:${PORT}/api/returns/:returnId/status`);
    console.log(`💰 Process refund: http://localhost:${PORT}/api/returns/:returnId/refund`);
    console.log(`📅 Schedule pickup: http://localhost:${PORT}/api/returns/:returnId/pickup`);
    
    console.log(`\n🛒 === PRODUCT ROUTES ===`);
    console.log(`📋 Get products: http://localhost:${PORT}/api/products`);
    console.log(`🔍 Get product: http://localhost:${PORT}/api/products/:id`);
    console.log(`⭐ Get reviews: http://localhost:${PORT}/api/products/:id/reviews`);
    
    console.log(`\n🛍️  === CART ROUTES ===`);
    console.log(`🛒 Get cart: http://localhost:${PORT}/api/cart`);
    console.log(`➕ Add to cart: http://localhost:${PORT}/api/cart/add`);
    console.log(`➖ Update quantity: http://localhost:${PORT}/api/cart/update`);
    console.log(`❌ Remove item: http://localhost:${PORT}/api/cart/remove/:productId`);
    console.log(`🗑️ Clear cart: http://localhost:${PORT}/api/cart/clear`);
    
    console.log(`\n❤️ === WISHLIST ROUTES ===`);
    console.log(`❤️ Get wishlist: http://localhost:${PORT}/api/wishlist`);
    console.log(`➕ Add to wishlist: http://localhost:${PORT}/api/wishlist/add/:productId`);
    console.log(`❌ Remove from wishlist: http://localhost:${PORT}/api/wishlist/remove/:productId`);
    console.log(`✅ Check in wishlist: http://localhost:${PORT}/api/wishlist/check/:productId`);
    
    console.log(`\n📬 === NEWSLETTER ROUTES ===`);
    console.log(`📝 Subscribe: http://localhost:${PORT}/api/newsletter/subscribe`);
    console.log(`✅ Confirm: http://localhost:${PORT}/api/newsletter/confirm/:token`);
    console.log(`📧 Unsubscribe: http://localhost:${PORT}/api/newsletter/unsubscribe/:token`);
    console.log(`📋 Get subscribers: http://localhost:${PORT}/api/newsletter/subscribers`);
    
    console.log(`\n⭐ === REVIEW ROUTES ===`);
    console.log(`📋 Get reviews: http://localhost:${PORT}/api/reviews`);
    console.log(`📝 Create review: http://localhost:${PORT}/api/reviews (POST)`);
    console.log(`✏️ Update review: http://localhost:${PORT}/api/reviews/:id`);
    console.log(`🗑️ Delete review: http://localhost:${PORT}/api/reviews/:id`);
    console.log(`👍 Like review: http://localhost:${PORT}/api/reviews/:id/like`);
    console.log(`👎 Dislike review: http://localhost:${PORT}/api/reviews/:id/dislike`);
    
    console.log(`\n💬 === FEEDBACK ROUTES ===`);
    console.log(`📝 Submit feedback: http://localhost:${PORT}/api/feedback`);
    console.log(`⚡ Quick feedback: http://localhost:${PORT}/api/feedback/quick`);
    console.log(`📋 Get feedback: http://localhost:${PORT}/api/feedback`);
    console.log(`✅ Update status: http://localhost:${PORT}/api/feedback/:id/status`);
    
    console.log(`\n🖼️ === HERO BANNER ROUTES ===`);
    console.log(`📋 Get all banners: http://localhost:${PORT}/api/hero-banner`);
    console.log(`🔍 Get active banners: http://localhost:${PORT}/api/hero-banner/active`);
    console.log(`🔍 Get banner by ID: http://localhost:${PORT}/api/hero-banner/:id`);
    console.log(`📝 Create banner: http://localhost:${PORT}/api/hero-banner (POST)`);
    console.log(`✏️ Update banner: http://localhost:${PORT}/api/hero-banner/:id (PUT)`);
    console.log(`🗑️ Delete banner: http://localhost:${PORT}/api/hero-banner/:id (DELETE)`);
    
    console.log(`\n🔔 === NOTIFICATION ROUTES ===`);
    console.log(`📋 Get notifications: http://localhost:${PORT}/api/notifications`);
    console.log(`📊 Notification stats: http://localhost:${PORT}/api/notifications/stats`);
    console.log(`📝 Templates: http://localhost:${PORT}/api/notifications/templates`);
    console.log(`📨 Send notification: http://localhost:${PORT}/api/notifications/send (POST)`);
    console.log(`📅 Schedule notification: http://localhost:${PORT}/api/notifications/schedule (POST)`);
    console.log(`🔍 Get notification: http://localhost:${PORT}/api/notifications/:id`);
    console.log(`✏️ Update notification: http://localhost:${PORT}/api/notifications/:id (PUT)`);
    console.log(`❌ Cancel notification: http://localhost:${PORT}/api/notifications/:id/cancel (PUT)`);
    console.log(`🗑️ Delete notification: http://localhost:${PORT}/api/notifications/:id (DELETE)`);
    console.log(`📊 Track open: http://localhost:${PORT}/api/notifications/:id/track/open (POST)`);
    console.log(`🖱️ Track click: http://localhost:${PORT}/api/notifications/:id/track/click (POST)`);
    
    console.log(`\n💰 === PAYMENT ROUTES ===`);
    console.log(`📋 Get payments: http://localhost:${PORT}/api/payments`);
    console.log(`📊 Payment stats: http://localhost:${PORT}/api/payments/stats`);
    console.log(`💳 Create order: http://localhost:${PORT}/api/payments/create-order (POST)`);
    console.log(`✅ Verify payment: http://localhost:${PORT}/api/payments/verify (POST)`);
    console.log(`🔍 Get payment: http://localhost:${PORT}/api/payments/:id`);
    console.log(`↩️ Process refund: http://localhost:${PORT}/api/payments/:id/refund (POST)`);
    console.log(`🔔 Webhook: http://localhost:${PORT}/api/payments/webhook (POST)`);
    
    console.log(`\n🚚 === DELIVERY ROUTES ===`);
    console.log(`📋 Get deliveries: http://localhost:${PORT}/api/orders?status=out-for-delivery`);
    console.log(`📊 Delivery stats: http://localhost:${PORT}/api/orders/stats`);
    console.log(`📦 Update delivery status: http://localhost:${PORT}/api/orders/:orderId/status (PUT)`);
    console.log(`🚚 Out for delivery: http://localhost:${PORT}/api/orders?status=out-for-delivery`);
    console.log(`✅ Mark delivered: http://localhost:${PORT}/api/orders/:orderId/status (PUT with status=delivered)`);
    console.log(`📅 Schedule delivery: http://localhost:${PORT}/api/orders/:orderId/schedule (POST)`);
    console.log(`📍 Track delivery: http://localhost:${PORT}/api/orders/:orderId/track`);
    
    console.log(`\n🌐 Allowed CORS origins:`);
    allowedOrigins.forEach(origin => console.log(`   - ${origin}`));
    
    console.log(`\n🚀 Server is ready to handle requests!\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received. Closing server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received. Closing server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

export default app;