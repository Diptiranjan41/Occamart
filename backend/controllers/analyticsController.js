import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';

// @desc    Get analytics data for admin dashboard
// @route   GET /api/admin/analytics
// @access  Private/Admin
export const getAnalytics = async (req, res) => {
    try {
        console.log('📊 Fetching analytics data...');

        // Get date range from query params (default to last 30 days)
        const { range = '30days' } = req.query;
        
        const endDate = new Date();
        const startDate = new Date();
        
        switch(range) {
            case '7days':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case '90days':
                startDate.setDate(startDate.getDate() - 90);
                break;
            default: // 30days
                startDate.setDate(startDate.getDate() - 30);
        }

        // Get total counts
        const [totalOrders, totalUsers, totalProducts] = await Promise.all([
            Order.countDocuments(),
            User.countDocuments(),
            Product.countDocuments()
        ]);

        // Get total revenue from delivered orders
        const revenueResult = await Order.aggregate([
            {
                $match: { 
                    status: 'delivered',
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalAmount' }
                }
            }
        ]);
        
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        // Get orders by status
        const ordersByStatus = await Order.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    total: { $sum: '$totalAmount' }
                }
            }
        ]);

        // Get recent orders
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'name email')
            .select('orderNumber totalAmount status createdAt')
            .lean();

        // Get daily sales for chart
        const dailySales = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: 'delivered'
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    sales: { $sum: '$totalAmount' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Get top products by sales
        const topProducts = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    name: { $first: '$items.name' },
                    totalSold: { $sum: '$items.quantity' },
                    revenue: { 
                        $sum: { 
                            $multiply: ['$items.price', '$items.quantity'] 
                        } 
                    }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 }
        ]);

        // Get user growth
        const userGrowth = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        console.log('✅ Analytics fetched successfully');

        res.json({
            success: true,
            data: {
                overview: {
                    totalOrders,
                    totalRevenue,
                    totalUsers,
                    totalProducts,
                    averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
                },
                ordersByStatus: ordersByStatus.map(item => ({
                    status: item._id || 'pending',
                    count: item.count,
                    total: item.total
                })),
                recentOrders,
                dailySales: dailySales.map(item => ({
                    date: item._id,
                    sales: item.sales,
                    orders: item.orders
                })),
                topProducts: topProducts.map(item => ({
                    id: item._id,
                    name: item.name || 'Unknown Product',
                    totalSold: item.totalSold,
                    revenue: item.revenue
                })),
                userGrowth: userGrowth.map(item => ({
                    date: item._id,
                    count: item.count
                }))
            }
        });

    } catch (error) {
        console.error('❌ Analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch analytics data',
            error: error.message
        });
    }
};

// @desc    Get dashboard summary (combined data for dashboard)
// @route   GET /api/admin/dashboard-summary
// @access  Private/Admin
export const getDashboardSummary = async (req, res) => {
    try {
        console.log('📊 Fetching dashboard summary...');

        const [stats, recentOrders, recentUsers, lowStock] = await Promise.all([
            Order.aggregate([
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalRevenue: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$status', 'delivered'] },
                                    '$totalAmount',
                                    0
                                ]
                            }
                        },
                        pendingOrders: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$status', 'pending'] },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                }
            ]),
            Order.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('user', 'name')
                .select('orderNumber totalAmount status createdAt'),
            User.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select('name email createdAt'),
            Product.find({ stock: { $lt: 10 } })
                .limit(5)
                .select('name stock price')
        ]);

        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();

        res.json({
            success: true,
            data: {
                stats: {
                    totalOrders: stats[0]?.totalOrders || 0,
                    totalRevenue: stats[0]?.totalRevenue || 0,
                    pendingOrders: stats[0]?.pendingOrders || 0,
                    totalUsers,
                    totalProducts
                },
                recentOrders,
                recentUsers,
                lowStockProducts: lowStock
            }
        });

    } catch (error) {
        console.error('❌ Dashboard summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard summary',
            error: error.message
        });
    }
};