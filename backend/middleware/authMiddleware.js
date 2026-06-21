// backend/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request object
 */
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if authorization header exists and has correct format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No token or invalid format');
      return res.status(401).json({
        success: false,
        message: 'Access token is missing or invalid'
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    console.log('🔑 Verifying token...');

    // Verify token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || process.env.SECRET_KEY || 'your_jwt_secret'
    );

    // Find user by ID (works with both id or _id)
    const userId = decoded.id || decoded._id || decoded.userId;
    const user = await User.findById(userId).select('-password');

    if (!user) {
      console.log('❌ User not found for ID:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Attach user to request object
    req.user = user;
    req.userId = user._id;

    console.log(`✅ Token verified for user: ${user._id} (${user.role})`);
    next();
    
  } catch (error) {
    // Handle different token errors
    if (error.name === 'TokenExpiredError') {
      console.log('❌ Token expired');
      return res.status(401).json({
        success: false,
        message: 'Access token has expired, please login again'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      console.log('❌ Invalid token signature');
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    console.error('❌ Auth middleware error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Admin authorization middleware
 * Checks if authenticated user has admin role
 */
export const admin = (req, res, next) => {
  // First check if user exists (protect middleware should run before this)
  if (!req.user) {
    console.log('❌ Admin check failed: No user in request');
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  // Check if user has admin role
  if (req.user.role === 'admin') {
    console.log(`✅ Admin access granted for: ${req.user._id}`);
    next();
  } else {
    console.log(`❌ Admin access denied for: ${req.user._id} (role: ${req.user.role})`);
    return res.status(403).json({
      success: false,
      message: 'Not authorized as admin'
    });
  }
};

/**
 * Optional: Role-based authorization middleware
 * Use this for more granular role checking
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      console.log(`❌ Role ${req.user.role} not authorized. Required: ${roles.join(', ')}`);
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to access this resource`
      });
    }

    console.log(`✅ ${req.user.role} access granted for: ${req.user._id}`);
    next();
  };
};

/**
 * Check if user is verified
 */
export const requireVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email first',
      needsVerification: true,
      email: req.user.email
    });
  }

  next();
};

/**
 * Optional: Check if user owns the resource or is admin
 * Useful for routes where users can access their own data
 */
export const isOwnerOrAdmin = (getResourceUserId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
      }

      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }

      // Get the user ID of the resource
      const resourceUserId = await getResourceUserId(req);
      
      // Check if user owns the resource
      if (resourceUserId && resourceUserId.toString() === req.user._id.toString()) {
        return next();
      }

      console.log(`❌ User ${req.user._id} not authorized to access this resource`);
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    } catch (error) {
      console.error('❌ Owner check error:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
};

// Export all middleware functions
export default {
  protect,
  admin,
  authorize,
  requireVerified,
  isOwnerOrAdmin
};