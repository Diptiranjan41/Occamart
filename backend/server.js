import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';

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

// Add Vercel frontend URLs dynamically
const vercelUrls = [
    'https://*.vercel.app',  // All Vercel subdomains
    'https://*.now.sh'        // Legacy Vercel domains
];

// CORS middleware with better handling
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, etc)
        if (!origin) return callback(null, true);
        
        // In development, allow all origins
        if (process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }
        
        // Check if origin is in allowed list
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }
        
        // Check for Vercel URLs (wildcard match)
        if (origin.includes('.vercel.app') || origin.includes('.now.sh')) {
            return callback(null, true);
        }
        
        console.log('❌ CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Handle preflight requests
app.options('*', cors());

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== IMPORTANT: FIXED - ROOT API ROUTE =====
// This was missing and causing the "Not Found - /api" error

/**
 * @route   GET /api
 * @desc    API root - returns all available endpoints
 * @access  Public
 */
app.get('/api', (req, res) => {
    // Get database status synchronously
    const dbStatus = getDatabaseStatus();
    
    res.json({
        success: true,
        message: '🛍️ E-Commerce API is running',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        documentation: {
            info: 'For detailed API documentation, visit /api/health',
            baseUrl: `${req.protocol}://${req.get('host')}`
        },
        endpoints: {
            health: '/api/health',
            auth: {
                base: '/api/auth',
                endpoints: ['register', 'login', 'profile', 'forgot-password', 'reset-password/:token']
            },
            users: '/api/users',
            products: '/api/products',
            orders: '/api/orders',
            returns: '/api/returns',
            admin: '/api/admin',
            cart: '/api/cart',
            wishlist: '/api/wishlist',
            newsletter: '/api/newsletter',
            reviews: '/api/reviews',
            feedback: '/api/feedback',
            hero: '/api/hero-banner',
            notifications: '/api/notifications',
            payments: '/api/payments'
        },
        status: {
            database: dbStatus,
            razorpay: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
            email: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
        }
    });
});

// Helper function to get database status synchronously
function getDatabaseStatus() {
    try {
        if (mongoose.connection.readyState === 1) {
            return {
                status: '✅ Connected',
                state: 'connected',
                host: mongoose.connection.host,
                name: mongoose.connection.name
            };
        } else {
            const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
            return {
                status: '❌ Disconnected',
                state: states[mongoose.connection.readyState] || 'unknown'
            };
        }
    } catch (error) {
        return {
            status: '❌ Error',
            error: error.message
        };
    }
}

// Async function for health check
async function getDatabaseStatusAsync() {
    try {
        if (mongoose.connection.readyState === 1) {
            return {
                status: '✅ Connected',
                state: 'connected',
                host: mongoose.connection.host,
                name: mongoose.connection.name
            };
        } else {
            const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
            return {
                status: '❌ Disconnected',
                state: states[mongoose.connection.readyState] || 'unknown'
            };
        }
    } catch (error) {
        return {
            status: '❌ Error',
            error: error.message
        };
    }
}

/**
 * @route   GET /api/health
 * @desc    Health check endpoint with detailed status
 * @access  Public
 */
app.get('/api/health', async (req, res) => {
    try {
        const dbStatus = await getDatabaseStatusAsync();
        
        res.json({
            success: true,
            message: '✅ Server is healthy and running',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            server: {
                port: process.env.PORT || 5000,
                node_version: process.version,
                memory_usage: process.memoryUsage(),
                cpu_usage: process.cpuUsage()
            },
            api: {
                baseUrl: '/api',
                version: '1.0.0',
                status: 'operational'
            },
            database: dbStatus,
            services: {
                razorpay: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) ? '✅ Configured' : '❌ Not Configured',
                email: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS) ? '✅ Configured' : '❌ Not Configured',
                jwt: !!process.env.JWT_SECRET ? '✅ Configured' : '❌ Not Configured'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Health check failed',
            error: error.message
        });
    }
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

// ===== API ROUTES =====

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

// 404 handler - Must be after all routes
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
    
    // Show critical endpoints
    console.log(`\n🔍 === CRITICAL ENDPOINTS ===`);
    console.log(`🏠 API Root: http://localhost:${PORT}/api`);
    console.log(`💓 Health Check: http://localhost:${PORT}/api/health`);
    
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
    
    console.log(`\n🌐 Allowed CORS origins:`);
    allowedOrigins.forEach(origin => console.log(`   - ${origin}`));
    console.log(`   - *.vercel.app (all Vercel deployments)`);
    console.log(`   - *.now.sh (legacy Vercel domains)`);
    
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