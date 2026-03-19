import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res) => {
  try {
    console.log('📦 Creating order for user:', req.user._id);
    
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,      
      shippingPrice,
      totalPrice
    } = req.body;

    // Validation
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No order items' 
      });
    }

    // Check if products have IDs
    for (const item of orderItems) {
      if (!item.product) {
        return res.status(400).json({
          success: false,
          message: `Product ID missing for ${item.name}. Please add product to cart again.`
        });
      }
    }

    const order = new Order({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      status: 'pending'
    });

    const createdOrder = await order.save();
    
    // Update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { countInStock: -item.qty }
      });
    }
    
    // Increment user order count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { orderCount: 1 }
    });
    
    console.log('✅ Order created:', createdOrder._id);
    
    res.status(201).json({
      success: true,
      order: createdOrder
    });

  } catch (error) {
    console.error('❌ Order creation error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:orderId
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    console.log('🔍 Fetching order with ID:', req.params.orderId);
    
    const order = await Order.findById(req.params.orderId)
      .populate('user', 'name email');

    if (!order) {
      console.log('❌ Order not found:', req.params.orderId);
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }

    // Check if order belongs to user or user is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      console.log('❌ Unauthorized access attempt by user:', req.user._id);
      return res.status(401).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    console.log('✅ Order found:', order._id);
    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('❌ Get order error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
export const updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        updateTime: req.body.update_time,
        emailAddress: req.body.payer?.email_address
      };

      const updatedOrder = await order.save();
      res.json({
        success: true,
        order: updatedOrder
      });
    } else {
      res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }
  } catch (error) {
    console.error('Update to paid error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get all orders with pagination and filters (admin)
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = 'all',
      sort = 'newest',
      search = ''
    } = req.query;

    // Build filter
    let filter = {};
    if (status !== 'all') {
      filter.status = status;
    }

    // Search functionality
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const userIds = users.map(u => u._id);
      
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { user: { $in: userIds } }
      ];
    }

    // Build sort
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'highest':
        sortOption = { totalPrice: -1 };
        break;
      case 'lowest':
        sortOption = { totalPrice: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      orders,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      total
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get filtered orders with pagination
// @route   GET /api/orders/filter
// @access  Private/Admin
export const getFilteredOrders = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = 'all',
      startDate,
      endDate,
      minAmount,
      maxAmount
    } = req.query;

    let filter = {};

    // Status filter
    if (status !== 'all') {
      filter.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      filter.totalPrice = {};
      if (minAmount) filter.totalPrice.$gte = parseFloat(minAmount);
      if (maxAmount) filter.totalPrice.$lte = parseFloat(maxAmount);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      orders,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      total
    });
  } catch (error) {
    console.error('Get filtered orders error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get order statistics for admin dashboard
// @route   GET /api/orders/stats
// @access  Private/Admin
export const getOrderStats = async (req, res) => {
  try {
    const [
      total,
      pending,
      processing,
      shipped,
      outForDelivery,
      delivered,
      cancelled,
      returnRequested,
      returnApproved,
      returnRejected,
      returnCompleted
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'processing' }),
      Order.countDocuments({ status: 'shipped' }),
      Order.countDocuments({ status: 'out-for-delivery' }),
      Order.countDocuments({ status: 'delivered' }),
      Order.countDocuments({ status: 'cancelled' }),
      Order.countDocuments({ returnStatus: 'return-requested' }),
      Order.countDocuments({ returnStatus: 'return-approved' }),
      Order.countDocuments({ returnStatus: 'return-rejected' }),
      Order.countDocuments({ returnStatus: 'return-completed' })
    ]);

    // Calculate total revenue
    const revenueResult = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    // Calculate refunded amount
    const refundedResult = await Order.aggregate([
      { $match: { returnStatus: 'return-completed' } },
      { $group: { _id: null, total: { $sum: '$returnRefundAmount' } } }
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    const totalRefunded = refundedResult.length > 0 ? refundedResult[0].total : 0;

    res.json({
      success: true,
      data: {
        total,
        pending,
        processing,
        shipped,
        outForDelivery,
        delivered,
        cancelled,
        returnRequested,
        returnApproved,
        returnRejected,
        returnCompleted,
        totalRevenue,
        totalRefunded,
        netRevenue: totalRevenue - totalRefunded
      }
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get recent orders for admin dashboard
// @route   GET /api/orders/recent
// @access  Private/Admin
export const getRecentOrders = async (req, res) => {
  try {
    const recentOrders = await Order.find()
      .sort('-createdAt')
      .limit(10)
      .populate('user', 'name email')
      .select('orderNumber totalPrice status returnStatus createdAt');

    const formattedOrders = recentOrders.map(order => ({
      id: order._id,
      orderNumber: order.orderNumber || order._id.toString().slice(-8).toUpperCase(),
      customer: order.user?.name || 'Guest User',
      email: order.user?.email || 'N/A',
      amount: order.totalPrice,
      status: order.returnStatus || order.status || 'pending',
      date: order.createdAt
    }));

    res.json({
      success: true,
      data: formattedOrders
    });
  } catch (error) {
    console.error('❌ Get recent orders error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
export const updateOrderToDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      order.status = 'delivered';

      const updatedOrder = await order.save();
      res.json({
        success: true,
        order: updatedOrder
      });
    } else {
      res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }
  } catch (error) {
    console.error('Update to delivered error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Update order status (admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    console.log('Updating order status:', { orderId: req.params.id, newStatus: status });
    
    // Updated valid statuses to include 'out-for-delivery'
    const validStatuses = ['pending', 'processing', 'shipped', 'out-for-delivery', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Store old status for logging
    const oldStatus = order.status;

    // If cancelling order, restore stock
    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { countInStock: item.qty }
        });
      }
    }

    // If delivering order, set delivery fields
    if (status === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    } 
    // If changing from delivered to another status, reset delivery fields
    else if (order.status === 'delivered' && status !== 'delivered') {
      order.isDelivered = false;
      order.deliveredAt = null;
    }

    // Update the status
    order.status = status;
    
    // Save the updated order
    const updatedOrder = await order.save();

    console.log('✅ Order status updated successfully:', {
      orderId: updatedOrder._id,
      oldStatus,
      newStatus: updatedOrder.status
    });

    res.json({
      success: true,
      order: updatedOrder,
      message: `Order status updated from ${oldStatus} to ${status}`
    });
  } catch (error) {
    console.error('❌ Update order status error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete order (admin only - use with caution)
// @route   DELETE /api/orders/:id
// @access  Private/Admin
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Restore stock if order was not cancelled
    if (order.status !== 'cancelled') {
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { countInStock: item.qty }
        });
      }
    }

    await order.deleteOne();

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Bulk update orders (admin only)
// @route   PUT /api/orders/bulk
// @access  Private/Admin
export const bulkUpdateOrders = async (req, res) => {
  try {
    const { orderIds, status } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order IDs are required'
      });
    }

    // Updated valid statuses for bulk update
    const validStatuses = ['pending', 'processing', 'shipped', 'out-for-delivery', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    const updateData = { status };
    
    // Set delivery fields if status is delivered
    if (status === 'delivered') {
      updateData.isDelivered = true;
      updateData.deliveredAt = new Date();
    }

    const result = await Order.updateMany(
      { _id: { $in: orderIds } },
      { $set: updateData }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} orders`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk update orders error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get order analytics (monthly/weekly/daily)
// @route   GET /api/orders/analytics
// @access  Private/Admin
export const getOrderAnalytics = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;

    console.log('📊 Fetching order analytics for period:', period);

    // Calculate date range based on period
    const endDate = new Date();
    let startDate = new Date();
    let groupFormat;

    switch(period) {
      case 'daily':
        startDate.setDate(startDate.getDate() - 30); // Last 30 days
        groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        break;
      case 'weekly':
        startDate.setDate(startDate.getDate() - 90); // Last 90 days
        groupFormat = { 
          $concat: [
            { $toString: { $isoWeekYear: '$createdAt' } },
            '-W',
            { $toString: { $isoWeek: '$createdAt' } }
          ]
        };
        break;
      case 'yearly':
        startDate.setFullYear(startDate.getFullYear() - 5); // Last 5 years
        groupFormat = { $dateToString: { format: '%Y', date: '$createdAt' } };
        break;
      default: // monthly
        startDate.setMonth(startDate.getMonth() - 12); // Last 12 months
        groupFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
    }

    // Get orders by period (revenue trend)
    const ordersByPeriod = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: groupFormat,
          count: { $sum: 1 },
          revenue: { 
            $sum: { 
              $cond: [
                { $eq: ['$status', 'delivered'] },
                '$totalPrice',
                0
              ]
            } 
          },
          totalAmount: { $sum: '$totalPrice' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get status breakdown
    const statusBreakdown = await Order.aggregate([
      {
        $group: {
          _id: { $ifNull: ['$returnStatus', '$status'] },
          count: { $sum: 1 },
          revenue: { 
            $sum: { 
              $cond: [
                { $eq: ['$status', 'delivered'] },
                '$totalPrice',
                0
              ]
            } 
          }
        }
      }
    ]);

    // Get payment methods breakdown
    const paymentMethods = await Order.aggregate([
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          revenue: { 
            $sum: { 
              $cond: [
                { $eq: ['$status', 'delivered'] },
                '$totalPrice',
                0
              ]
            } 
          }
        }
      }
    ]);

    // Get return analytics
    const returnAnalytics = await Order.aggregate([
      {
        $match: { returnStatus: { $exists: true, $ne: null } }
      },
      {
        $group: {
          _id: '$returnStatus',
          count: { $sum: 1 },
          totalRefundAmount: { $sum: '$returnRefundAmount' }
        }
      }
    ]);

    // Get top products by sales
    const topProducts = await Order.aggregate([
      {
        $match: {
          status: 'delivered',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: '$orderItems.product',
          name: { $first: '$orderItems.name' },
          totalSold: { $sum: '$orderItems.qty' },
          revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.qty'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    // Get daily sales for current month
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const dailySales = await Order.aggregate([
      {
        $match: {
          status: 'delivered',
          createdAt: { $gte: currentMonthStart, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sales: { $sum: '$totalPrice' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Calculate summary statistics
    const summary = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'delivered'] },
                '$totalPrice',
                0
              ]
            }
          },
          averageOrderValue: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'delivered'] },
                '$totalPrice',
                0
              ]
            }
          },
          pendingOrders: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
            }
          },
          deliveredOrders: {
            $sum: {
              $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0]
            }
          },
          cancelledOrders: {
            $sum: {
              $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0]
            }
          }
        }
      }
    ]);

    console.log('✅ Order analytics fetched successfully');

    res.json({
      success: true,
      data: {
        periodData: ordersByPeriod,
        statusBreakdown,
        paymentMethods,
        returnAnalytics,
        topProducts,
        dailySales,
        summary: summary[0] || {
          totalOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          pendingOrders: 0,
          deliveredOrders: 0,
          cancelledOrders: 0
        }
      }
    });

  } catch (error) {
    console.error('❌ Get order analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== RETURN FUNCTIONALITY ====================

// @desc    Request return for an order
// @route   POST /api/orders/:id/return
// @access  Private
export const requestReturn = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Check if order belongs to user
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to return this order'
      });
    }
    
    // Check if order is delivered
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Can only return delivered orders'
      });
    }
    
    // Check if within return window (7 days)
    const deliveredDate = new Date(order.deliveredAt);
    const now = new Date();
    const daysSinceDelivery = Math.floor((now - deliveredDate) / (1000 * 60 * 60 * 24));
    
    if (daysSinceDelivery > 7) {
      return res.status(400).json({
        success: false,
        message: 'Return window has expired (7 days from delivery)'
      });
    }
    
    // Check if return already requested
    if (order.returnStatus) {
      return res.status(400).json({
        success: false,
        message: `Return already requested for this order. Status: ${order.returnStatus}`
      });
    }
    
    // Validate return items
    const { items, reason, comments, returnType, images } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one item to return'
      });
    }
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason for return'
      });
    }
    
    // Calculate refund amount
    let refundAmount = 0;
    for (const returnItem of items) {
      const orderItem = order.orderItems.find(item => 
        item.product.toString() === returnItem.productId || item._id.toString() === returnItem.productId
      );
      
      if (orderItem) {
        refundAmount += orderItem.price * returnItem.quantity;
      }
    }
    
    // Generate return ID
    const returnId = `RET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Update order with return information
    order.returnId = returnId;
    order.returnStatus = 'return-requested';
    order.returnReason = reason;
    order.returnReasonLabel = req.body.reasonLabel || reason;
    order.returnComments = comments || '';
    order.returnType = returnType || 'refund';
    order.returnImages = images || [];
    order.returnRequestedAt = Date.now();
    order.returnItems = items;
    order.returnRefundAmount = refundAmount;
    
    // Update individual item return status
    for (const returnItem of items) {
      const orderItem = order.orderItems.find(item => 
        item.product.toString() === returnItem.productId || item._id.toString() === returnItem.productId
      );
      if (orderItem) {
        orderItem.returnStatus = 'return-requested';
      }
    }
    
    const updatedOrder = await order.save();
    
    console.log('✅ Return request submitted:', {
      orderId: updatedOrder._id,
      returnId,
      items: items.length,
      refundAmount
    });
    
    res.json({
      success: true,
      order: updatedOrder,
      returnId,
      message: 'Return request submitted successfully. We will review it shortly.'
    });
    
  } catch (error) {
    console.error('❌ Return request error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get return details for an order
// @route   GET /api/orders/:id/return
// @access  Private
export const getReturnDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Check if order belongs to user
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    // Check if return exists
    if (!order.returnStatus) {
      return res.status(404).json({
        success: false,
        message: 'No return request found for this order'
      });
    }
    
    res.json({
      success: true,
      returnDetails: {
        returnId: order.returnId,
        returnStatus: order.returnStatus,
        returnReason: order.returnReason,
        returnReasonLabel: order.returnReasonLabel,
        returnComments: order.returnComments,
        returnType: order.returnType,
        returnImages: order.returnImages,
        returnRequestedAt: order.returnRequestedAt,
        returnProcessedAt: order.returnProcessedAt,
        returnApprovedAt: order.returnApprovedAt,
        returnRejectedAt: order.returnRejectedAt,
        returnRejectionReason: order.returnRejectionReason,
        returnCompletedAt: order.returnCompletedAt,
        returnItems: order.returnItems,
        returnRefundAmount: order.returnRefundAmount,
        returnTrackingNumber: order.returnTrackingNumber,
        returnPickupAddress: order.returnPickupAddress,
        returnPickupScheduled: order.returnPickupScheduled,
        returnPickupCompleted: order.returnPickupCompleted
      }
    });
    
  } catch (error) {
    console.error('❌ Get return details error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cancel return request
// @route   POST /api/orders/:id/return/cancel
// @access  Private
export const cancelReturn = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Check if order belongs to user
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    // Check if return can be cancelled
    if (!order.returnStatus) {
      return res.status(400).json({
        success: false,
        message: 'No return request found for this order'
      });
    }
    
    if (order.returnStatus !== 'return-requested') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel return at this stage. Current status: ${order.returnStatus}`
      });
    }
    
    // Remove return information
    order.returnId = undefined;
    order.returnStatus = undefined;
    order.returnReason = undefined;
    order.returnReasonLabel = undefined;
    order.returnComments = undefined;
    order.returnType = undefined;
    order.returnImages = undefined;
    order.returnRequestedAt = undefined;
    order.returnItems = undefined;
    order.returnRefundAmount = undefined;
    
    // Reset item return status
    for (const item of order.orderItems) {
      item.returnStatus = undefined;
    }
    
    const updatedOrder = await order.save();
    
    res.json({
      success: true,
      order: updatedOrder,
      message: 'Return request cancelled successfully'
    });
    
  } catch (error) {
    console.error('❌ Cancel return error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Upload return images
// @route   POST /api/orders/:id/return/images
// @access  Private
export const uploadReturnImages = async (req, res) => {
  try {
    // This is a placeholder for image upload logic
    // In production, you would use multer or similar to handle file uploads
    // and upload to cloud storage like AWS S3, Cloudinary, etc.
    
    const files = req.files || [];
    const imageUrls = [];
    
    // Simulate image upload and return URLs
    for (const file of files) {
      // In production: upload to cloud storage and get URL
      const imageUrl = `/uploads/returns/${Date.now()}-${file.originalname}`;
      imageUrls.push(imageUrl);
    }
    
    res.json({
      success: true,
      imageUrls,
      message: `${imageUrls.length} images uploaded successfully`
    });
    
  } catch (error) {
    console.error('❌ Upload return images error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get returnable items for an order
// @route   GET /api/orders/:id/returnable-items
// @access  Private
export const getReturnableItems = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Check if order belongs to user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    // Check if order is delivered
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Can only return delivered orders'
      });
    }
    
    // Check if within return window
    const deliveredDate = new Date(order.deliveredAt);
    const now = new Date();
    const daysSinceDelivery = Math.floor((now - deliveredDate) / (1000 * 60 * 60 * 24));
    
    if (daysSinceDelivery > 7) {
      return res.status(400).json({
        success: false,
        message: 'Return window has expired'
      });
    }
    
    // Filter items that are returnable (not already returned or in return process)
    const returnableItems = order.orderItems.filter(item => !item.returnStatus);
    
    res.json({
      success: true,
      items: returnableItems,
      returnWindow: {
        daysLeft: Math.max(0, 7 - daysSinceDelivery),
        expiresAt: new Date(deliveredDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      }
    });
    
  } catch (error) {
    console.error('❌ Get returnable items error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Track return status
// @route   GET /api/returns/:returnId/track
// @access  Private
export const trackReturn = async (req, res) => {
  try {
    const { returnId } = req.params;
    
    const order = await Order.findOne({ returnId });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Return not found'
      });
    }
    
    // Check authorization
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    // Build tracking timeline
    const tracking = [];
    
    if (order.returnRequestedAt) {
      tracking.push({
        status: 'return-requested',
        date: order.returnRequestedAt,
        description: 'Return request submitted',
        completed: true
      });
    }
    
    if (order.returnApprovedAt) {
      tracking.push({
        status: 'return-approved',
        date: order.returnApprovedAt,
        description: 'Return request approved',
        completed: true
      });
    }
    
    if (order.returnPickupScheduled) {
      tracking.push({
        status: 'pickup-scheduled',
        date: order.returnPickupScheduled,
        description: `Pickup scheduled for ${new Date(order.returnPickupScheduled).toLocaleDateString()}`,
        completed: !!order.returnPickupCompleted
      });
    }
    
    if (order.returnPickupCompleted) {
      tracking.push({
        status: 'pickup-completed',
        date: order.returnPickupCompleted,
        description: 'Item picked up by courier',
        completed: true
      });
    }
    
    if (order.returnProcessedAt) {
      tracking.push({
        status: 'return-processed',
        date: order.returnProcessedAt,
        description: 'Return processed at warehouse',
        completed: true
      });
    }
    
    if (order.returnCompletedAt) {
      tracking.push({
        status: 'return-completed',
        date: order.returnCompletedAt,
        description: order.returnType === 'refund' ? 'Refund processed' : 'Replacement delivered',
        completed: true
      });
    }
    
    if (order.returnRejectedAt) {
      tracking.push({
        status: 'return-rejected',
        date: order.returnRejectedAt,
        description: order.returnRejectionReason || 'Return request rejected',
        completed: false
      });
    }
    
    res.json({
      success: true,
      tracking,
      currentStatus: order.returnStatus,
      returnDetails: {
        returnId: order.returnId,
        type: order.returnType,
        items: order.returnItems,
        refundAmount: order.returnRefundAmount,
        trackingNumber: order.returnTrackingNumber
      }
    });
    
  } catch (error) {
    console.error('❌ Track return error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== ADMIN RETURN MANAGEMENT ====================

// @desc    Get all returns (admin)
// @route   GET /api/returns
// @access  Private/Admin
export const getAllReturns = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = 'all',
      sort = 'newest'
    } = req.query;

    // Build filter
    let filter = { returnStatus: { $exists: true, $ne: null } };
    if (status !== 'all') {
      filter.returnStatus = status;
    }

    // Build sort
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { returnRequestedAt: -1 };
        break;
      case 'oldest':
        sortOption = { returnRequestedAt: 1 };
        break;
      default:
        sortOption = { returnRequestedAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const returns = await Order.find(filter)
      .populate('user', 'name email')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .select('orderNumber returnId returnStatus returnType returnItems returnRefundAmount returnRequestedAt user');

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      returns,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      total
    });
    
  } catch (error) {
    console.error('❌ Get all returns error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update return status (admin)
// @route   PUT /api/returns/:id/status
// @access  Private/Admin
export const updateReturnStatus = async (req, res) => {
  try {
    const { status, reason, trackingNumber, pickupDate } = req.body;
    
    const validStatuses = [
      'return-approved', 
      'return-rejected', 
      'return-picked-up', 
      'return-processed', 
      'return-completed'
    ];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid return status'
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.returnStatus) {
      return res.status(400).json({
        success: false,
        message: 'No return request found for this order'
      });
    }

    // Update return status and related fields
    order.returnStatus = status;
    
    switch (status) {
      case 'return-approved':
        order.returnApprovedAt = Date.now();
        break;
        
      case 'return-rejected':
        order.returnRejectedAt = Date.now();
        order.returnRejectionReason = reason || 'Return request rejected';
        break;
        
      case 'return-picked-up':
        order.returnPickupCompleted = Date.now();
        order.returnTrackingNumber = trackingNumber;
        break;
        
      case 'return-processed':
        order.returnProcessedAt = Date.now();
        break;
        
      case 'return-completed':
        order.returnCompletedAt = Date.now();
        // If refund type, mark as refunded
        if (order.returnType === 'refund') {
          order.isRefunded = true;
          order.refundedAt = Date.now();
        }
        break;
    }

    // Update item return status
    if (order.returnItems) {
      for (const returnItem of order.returnItems) {
        const orderItem = order.orderItems.find(item => 
          item.product.toString() === returnItem.productId || item._id.toString() === returnItem.productId
        );
        if (orderItem) {
          orderItem.returnStatus = status;
        }
      }
    }

    const updatedOrder = await order.save();

    res.json({
      success: true,
      order: updatedOrder,
      message: `Return status updated to ${status}`
    });
    
  } catch (error) {
    console.error('❌ Update return status error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Process return refund (admin)
// @route   POST /api/returns/:id/refund
// @access  Private/Admin
export const processReturnRefund = async (req, res) => {
  try {
    const { refundAmount, refundMethod, transactionId, notes } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.returnStatus || order.returnStatus !== 'return-approved') {
      return res.status(400).json({
        success: false,
        message: 'Return must be approved before processing refund'
      });
    }

    order.returnRefundAmount = refundAmount || order.returnRefundAmount;
    order.returnRefundMethod = refundMethod || order.paymentMethod;
    order.returnRefundTransactionId = transactionId;
    order.returnRefundNotes = notes;
    order.returnRefundProcessedAt = Date.now();
    order.returnStatus = 'return-processed';
    order.isRefunded = true;
    order.refundedAt = Date.now();

    const updatedOrder = await order.save();

    res.json({
      success: true,
      order: updatedOrder,
      message: 'Refund processed successfully'
    });
    
  } catch (error) {
    console.error('❌ Process return refund error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Schedule return pickup (admin)
// @route   POST /api/returns/:id/pickup
// @access  Private/Admin
export const scheduleReturnPickup = async (req, res) => {
  try {
    const { pickupDate, pickupTime, pickupAddress, courier, trackingNumber, notes } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.returnStatus || order.returnStatus !== 'return-approved') {
      return res.status(400).json({
        success: false,
        message: 'Return must be approved before scheduling pickup'
      });
    }

    order.returnPickupScheduled = pickupDate ? new Date(pickupDate) : Date.now();
    order.returnPickupTime = pickupTime;
    order.returnPickupAddress = pickupAddress || order.shippingAddress;
    order.returnCourier = courier;
    order.returnTrackingNumber = trackingNumber;
    order.returnPickupNotes = notes;
    order.returnStatus = 'return-pickup-scheduled';

    const updatedOrder = await order.save();

    res.json({
      success: true,
      order: updatedOrder,
      message: 'Return pickup scheduled successfully'
    });
    
  } catch (error) {
    console.error('❌ Schedule return pickup error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get return reasons
// @route   GET /api/returns/reasons
// @access  Public
export const getReturnReasons = async (req, res) => {
  const reasons = [
    { id: 'damaged', label: 'Damaged product', description: 'Product arrived damaged or broken' },
    { id: 'wrong_item', label: 'Wrong item delivered', description: 'Received different item than ordered' },
    { id: 'not_as_described', label: 'Item not as described', description: 'Product does not match description' },
    { id: 'size_issue', label: 'Size/fit issue', description: 'Wrong size or doesn\'t fit' },
    { id: 'quality_issue', label: 'Quality issue', description: 'Poor quality or defective' },
    { id: 'missing_parts', label: 'Missing parts', description: 'Accessories or parts missing' },
    { id: 'defective', label: 'Defective product', description: 'Product not working properly' },
    { id: 'changed_mind', label: 'Changed mind', description: 'No longer needed or wanted' },
    { id: 'better_price', label: 'Found better price', description: 'Found cheaper elsewhere' },
    { id: 'other', label: 'Other', description: 'Other reason' }
  ];
  
  res.json({
    success: true,
    reasons
  });
};



// @desc    Get return policy
// @route   GET /api/return-policy
// @access  Public
export const getReturnPolicy = async (req, res) => {
  const policy = {
    returnWindow: 7,
    returnWindowUnit: 'days',
    eligibleStatuses: ['delivered'],
    conditions: [
      'Items must be unused and in original condition',
      'Original packaging must be intact',
      'All tags and labels must be attached',
      'Return request must be initiated within 7 days of delivery'
    ],
    nonReturnableItems: [
      'Personal care products',
      'Intimate apparel',
      'Perishable goods',
      'Customized items',
      'Digital products'
    ],
    refundProcess: {
      timeline: '5-7 business days after return is processed',
      method: 'Original payment method',
      deduction: 'Shipping charges may be deducted for certain returns'
    },
    replacementProcess: {
      timeline: '7-10 business days',
      availability: 'Subject to stock availability'
    }
  };
  
  res.json({
    success: true,
    policy
  });
};