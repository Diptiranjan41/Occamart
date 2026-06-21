import express from 'express';
import bcrypt from 'bcryptjs';
import { protect, admin } from '../middleware/authMiddleware.js';
import { getProfile, updateProfile } from '../controllers/authController.js';
import User from '../models/User.js';

const router = express.Router();

// ============= TEST ROUTE (Public) =============
router.get('/test', (req, res) => {
  res.json({ 
    success: true,
    message: '✅ User routes working!',
    endpoints: {
      profile: '/api/users/profile (GET/PUT)',
      allUsers: '/api/users (GET)',
      createUser: '/api/users (POST)',
      recentUsers: '/api/users/recent (GET)',
      userById: '/api/users/:id (GET)',
      updateUser: '/api/users/:id (PUT)',
      deleteUser: '/api/users/:id (DELETE)',
      stats: '/api/users/stats (GET)',
      toggleStatus: '/api/users/:id/toggle-status (PATCH)',
      bulkUpdate: '/api/users/bulk (POST)',
      userActivity: '/api/users/:id/activity (GET)'
    }
  });
});

// ============= USER ROUTES (Protected) =============
router.use(protect);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// ============= ADMIN ROUTES (Protected + Admin) =============
// 🔥 IMPORTANT: Specific routes MUST come before /:id routes

// STATS ROUTE - MUST COME BEFORE /:id
router.get('/stats', admin, async (req, res) => {
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
});

// RECENT USERS ROUTE - MUST COME BEFORE /:id
router.get('/recent', admin, async (req, res) => {
    try {
        const recentUsers = await User.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .select('-password');
        
        res.json({
            success: true,
            data: recentUsers
        });
    } catch (error) {
        console.error('❌ Error fetching recent users:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// BULK UPDATE ROUTE - MUST COME BEFORE /:id
router.post('/bulk', admin, async (req, res) => {
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
});

// GET ALL USERS (with pagination and filters)
router.get('/', admin, async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            role = 'all',
            status = 'all',
            search = ''
        } = req.query;

        // Build filter
        let filter = {};
        
        // Filter by role
        if (role !== 'all') {
            filter.role = role;
        }

        // Filter by status
        if (status !== 'all') {
            filter.isActive = status === 'active';
        }

        // Search functionality
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const users = await User.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select('-password');

        const total = await User.countDocuments(filter);

        res.json({
            success: true,
            data: users,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            total
        });
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// CREATE NEW USER
router.post('/', admin, async (req, res) => {
    try {
        const { name, email, password, role, phone, address, city, state, pincode } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'user',
            isVerified: true,
            isActive: true,
            phone: phone || '',
            address: address || '',
            city: city || '',
            state: state || '',
            pincode: pincode || ''
        });

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                address: user.address,
                city: user.city,
                state: user.state,
                pincode: user.pincode,
                isActive: user.isActive,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('❌ Error creating user:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============= USER BY ID ROUTES (Must come AFTER all specific routes) =============

// GET USER BY ID
router.get('/:id', admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        
        if (user) {
            res.json({
                success: true,
                data: user
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
    } catch (error) {
        console.error('❌ Error fetching user:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// UPDATE USER
router.put('/:id', admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if email is being changed and already exists
        if (req.body.email && req.body.email !== user.email) {
            const emailExists = await User.findOne({ email: req.body.email });
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use'
                });
            }
        }

        // Update fields
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.role = req.body.role || user.role;
        user.phone = req.body.phone || user.phone;
        user.address = req.body.address || user.address;
        user.city = req.body.city || user.city;
        user.state = req.body.state || user.state;
        user.pincode = req.body.pincode || user.pincode;
        
        // If password is being updated
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        const updatedUser = await user.save();
        
        res.json({
            success: true,
            message: 'User updated successfully',
            data: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                phone: updatedUser.phone,
                address: updatedUser.address,
                city: updatedUser.city,
                state: updatedUser.state,
                pincode: updatedUser.pincode,
                isActive: updatedUser.isActive,
                createdAt: updatedUser.createdAt
            }
        });
    } catch (error) {
        console.error('❌ Error updating user:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// DELETE USER
router.delete('/:id', admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Don't allow deleting the last admin
        if (user.role === 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin' });
            if (adminCount <= 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete the last admin user'
                });
            }
        }

        // Don't allow deleting yourself
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        await user.deleteOne();
        
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// TOGGLE USER STATUS
router.patch('/:id/toggle-status', admin, async (req, res) => {
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
});

// GET USER ACTIVITY
router.get('/:id/activity', admin, async (req, res) => {
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
});

export default router;