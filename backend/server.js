import 'dotenv/config'; // MUST be the very first import
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import mongoose from 'mongoose';

import connectDB from './config/db.js';

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
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProd = process.env.NODE_ENV === 'production';
const isDev = process.env.NODE_ENV === 'development';

// ===== Validate env (names only, never values) =====
const required = ['MONGO_URI', 'JWT_SECRET', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error('❌ Missing environment variables:', missing.join(', '));
  if (isProd) process.exit(1);
}

// ===== Connect DB =====
connectDB();

const app = express();

// ===== Request logging =====
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${Date.now() - start}ms`);
  });
  next();
});

// ===== CORS =====
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'https://occamart.vercel.app',
];
if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);

// Only your own Vercel preview deployments, e.g. occamart-git-main-xyz.vercel.app
const vercelPreview = /^https:\/\/occamart[a-z0-9-]*\.vercel\.app$/;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true); // curl, mobile apps, webhooks
      if (isDev) return callback(null, true);
      if (allowedOrigins.includes(origin) || vercelPreview.test(origin)) {
        return callback(null, true);
      }
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Razorpay-Signature'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== Helpers =====
const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
function getDatabaseStatus() {
  const state = mongoose.connection.readyState;
  if (state === 1) {
    return {
      status: '✅ Connected',
      state: 'connected',
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    };
  }
  return { status: '❌ Disconnected', state: dbStates[state] || 'unknown' };
}

// ===== Root + health (Render health check hits "/") =====
app.get('/', (req, res) => res.send('Occamart API running'));

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: '🛍️ E-Commerce API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    status: {
      database: getDatabaseStatus(),
      razorpay: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
      email: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
    },
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '✅ Server is healthy and running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: getDatabaseStatus(),
    services: {
      razorpay: process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET ? '✅ Configured' : '❌ Not Configured',
      email: process.env.EMAIL_USER && process.env.EMAIL_PASS ? '✅ Configured' : '❌ Not Configured',
      jwt: process.env.JWT_SECRET ? '✅ Configured' : '❌ Not Configured',
    },
  });
});

app.get('/api/payments/test', (req, res) => {
  res.json({
    success: true,
    message: '✅ Payment routes are accessible!',
    razorpayConfigured: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    timestamp: new Date().toISOString(),
  });
});

// ===== API routes =====
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/hero-banner', heroRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);

// ===== Dev-only utility routes (were public before: anyone could verify any email) =====
if (!isProd) {
  app.get('/api/manual-verify/:email', async (req, res) => {
    try {
      const User = (await import('./models/User.js')).default;
      const user = await User.findOne({ email: req.params.email });
      if (!user) return res.status(404).json({ success: false, error: 'User not found' });
      user.isVerified = true;
      user.emailToken = undefined;
      await user.save();
      res.json({ success: true, message: `✅ ${user.email} verified manually!` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/test-email', async (req, res) => {
    try {
      const { sendVerificationEmail } = await import('./utils/emailService.js');
      const result = await sendVerificationEmail('your-test-email@example.com', 'Test User', 'test-' + Date.now());
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/test-newsletter', async (req, res) => {
    try {
      const { sendNewsletterConfirmationEmail } = await import('./utils/emailService.js');
      const result = await sendNewsletterConfirmationEmail(req.body.email);
      res.json({ success: true, message: 'Test newsletter sent', result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

// ===== Errors =====
app.use(notFound);
app.use(errorHandler);

// ===== Start =====
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err?.message || err);
});

const shutdown = (signal) => {
  console.log(`🛑 ${signal} received. Closing server...`);
  server.close(() => {
    mongoose.connection.close(false).finally(() => process.exit(0));
  });
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
