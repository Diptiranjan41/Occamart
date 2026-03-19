import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
export const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('❌ Auth user error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('❌ Register user error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        orderCount: user.orderCount,
        createdAt: user.createdAt,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('❌ Get user profile error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      
      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('❌ Update user profile error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({ message: error.message });
  }
};

// 🔥 FIXED: Get recent users for admin dashboard
// @desc    Get recent users
// @route   GET /api/users/recent
// @access  Private/Admin
export const getRecentUsers = async (req, res) => {
  try {
    console.log('📦 Fetching recent users...');
    
    const recentUsers = await User.find({ role: 'user' })
      .sort('-createdAt')
      .limit(10)
      .select('name email createdAt orderCount');

    const formattedUsers = recentUsers.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      orders: user.orderCount || 0,
      joined: user.createdAt
    }));

    console.log(`✅ Found ${formattedUsers.length} recent users`);
    
    res.json({
      success: true,
      data: formattedUsers
    });
  } catch (error) {
    console.error('❌ Get recent users error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// 🔥 NEW: Get user statistics (admin only)
// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private/Admin
export const getUserStats = async (req, res) => {
  try {
    console.log('📊 Fetching user stats...');
    
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalCustomers = await User.countDocuments({ role: 'user' });
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    
    // Users registered in last 7 days
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const newUsersLastWeek = await User.countDocuments({
      createdAt: { $gte: lastWeek }
    });

    // Users registered in last 30 days
    const lastMonth = new Date();
    lastMonth.setDate(lastMonth.getDate() - 30);
    
    const newUsersLastMonth = await User.countDocuments({
      createdAt: { $gte: lastMonth }
    });

    // User growth by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalAdmins,
        totalCustomers,
        activeUsers,
        inactiveUsers,
        newUsersLastWeek,
        newUsersLastMonth,
        userGrowth
      }
    });
  } catch (error) {
    console.error('❌ Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 🔥 NEW: Get user activity
// @desc    Get user activity
// @route   GET /api/users/activity
// @access  Private
export const getUserActivity = async (req, res) => {
  try {
    // This would typically fetch from an activity log
    // For now, return placeholder data
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('❌ Error fetching user activity:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// 🔥 NEW: Get user orders
// @desc    Get user orders
// @route   GET /api/users/orders
// @access  Private
export const getUserOrders = async (req, res) => {
  try {
    // This would typically fetch from orders collection
    // You can redirect to orderAPI or implement here
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('❌ Error fetching user orders:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// 🔥 NEW: Get user wishlist
// @desc    Get user wishlist
// @route   GET /api/users/wishlist
// @access  Private
export const getUserWishlist = async (req, res) => {
  try {
    // This would typically fetch from wishlist collection
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('❌ Error fetching user wishlist:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      // Prevent deleting last admin
      if (user.role === 'admin') {
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount <= 1) {
          return res.status(400).json({ message: 'Cannot delete the last admin' });
        }
      }

      await user.deleteOne();
      res.json({ message: 'User removed successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('❌ Delete user error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('❌ Get user by ID error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.role = req.body.role || user.role;
      user.isActive = req.body.isActive !== undefined ? req.body.isActive : user.isActive;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('❌ Update user error:', error);
    res.status(500).json({ message: error.message });
  }
};

// 🔥 NEW: Toggle user status
// @desc    Toggle user active status
// @route   PATCH /api/users/:id/toggle-status
// @access  Private/Admin
export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow deactivating yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    // Don't allow deactivating the last admin
    if (user.role === 'admin' && user.isActive) {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate the last active admin'
        });
      }
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { 
        _id: user._id,
        isActive: user.isActive 
      }
    });
  } catch (error) {
    console.error('❌ Error toggling user status:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 🔥 NEW: Bulk update users
// @desc    Bulk update users
// @route   POST /api/users/bulk
// @access  Private/Admin
export const bulkUpdateUsers = async (req, res) => {
  try {
    const { userIds, action, value } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs are required'
      });
    }

    let update = {};
    switch (action) {
      case 'status':
        update = { isActive: value };
        break;
      case 'role':
        update = { role: value };
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    // Don't allow bulk updating yourself
    if (userIds.includes(req.user._id.toString())) {
      return res.status(400).json({
        success: false,
        message: 'Cannot bulk update your own account'
      });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: update }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} users successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('❌ Error bulk updating users:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 🔥 NEW: Get user activity logs
// @desc    Get user activity logs
// @route   GET /api/users/:id/activity
// @access  Private/Admin
export const getUserActivityLogs = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name email lastLogin loginHistory');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
        lastLogin: user.lastLogin,
        loginHistory: user.loginHistory || []
      }
    });
  } catch (error) {
    console.error('❌ Error fetching user activity:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};