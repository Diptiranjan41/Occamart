// backend/controllers/returnController.js
import Return from '../models/Return.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

// Generate unique return ID
const generateReturnId = () => {
  return `RET-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
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
    { id: 'other', label: 'Other', description: 'Other reason' }
  ];
  
  res.json({
    success: true,
    data: reasons
  });
};

// @desc    Get return policy
// @route   GET /api/returns/policy
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
      method: 'Original payment method'
    }
  };
  
  res.json({
    success: true,
    data: policy
  });
};

// @desc    Get returnable items for an order
// @route   GET /api/returns/order/:orderId/returnable-items
// @access  Private
export const getReturnableItems = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Check if order belongs to user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }
    
    // Check if order is delivered
    if (order.status !== 'delivered' && !order.isDelivered) {
      return res.status(400).json({
        success: false,
        message: 'Can only return delivered orders',
        data: []
      });
    }
    
    // Check if within return window (7 days)
    const deliveryDate = order.deliveredAt || order.createdAt;
    const daysSinceDelivery = (new Date() - new Date(deliveryDate)) / (1000 * 60 * 60 * 24);
    
    // Check existing returns for this order
    const existingReturns = await Return.find({ 
      order: orderId,
      status: { $in: ['pending', 'approved', 'pickup_scheduled', 'picked_up'] }
    });
    
    // Get IDs of products already in return process
    const returnedProductIds = existingReturns.flatMap(ret => 
      ret.items.map(item => item.product.toString())
    );
    
    // Filter items that are returnable
    const returnableItems = order.orderItems
      .filter(item => !returnedProductIds.includes(item.product.toString()))
      .map(item => ({
        productId: item.product,
        name: item.name,
        price: item.price,
        quantity: item.qty,
        image: item.image,
        isEligible: daysSinceDelivery <= 7,
        reason: daysSinceDelivery > 7 ? 'Return window expired' : null
      }));
    
    res.json({
      success: true,
      data: {
        orderId,
        daysSinceDelivery: Math.round(daysSinceDelivery),
        returnWindowExpired: daysSinceDelivery > 7,
        items: returnableItems
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

// @desc    Upload return images
// @route   POST /api/returns/order/:orderId/images
// @access  Private
export const uploadReturnImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }
    
    const imageUrls = req.files.map(file => `/uploads/returns/${file.filename}`);
    
    res.json({
      success: true,
      data: {
        images: imageUrls,
        count: imageUrls.length
      }
    });
    
  } catch (error) {
    console.error('❌ Upload images error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Submit return request
// @route   POST /api/returns/order/:orderId/request
// @access  Private
export const requestReturn = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { items, returnType, comments } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one item to return'
      });
    }
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Check if order belongs to user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    // Check if order is delivered
    if (order.status !== 'delivered' && !order.isDelivered) {
      return res.status(400).json({
        success: false,
        message: 'Can only return delivered orders'
      });
    }
    
    // Check return window
    const deliveryDate = order.deliveredAt || order.createdAt;
    const daysSinceDelivery = (new Date() - new Date(deliveryDate)) / (1000 * 60 * 60 * 24);
    
    if (daysSinceDelivery > 7) {
      return res.status(400).json({
        success: false,
        message: 'Return window has expired (7 days)'
      });
    }
    
    // Calculate total amount
    let totalAmount = 0;
    const returnItems = items.map(item => {
      const orderItem = order.orderItems.find(
        oi => oi.product.toString() === item.productId
      );
      
      if (orderItem) {
        totalAmount += orderItem.price * item.quantity;
      }
      
      return {
        product: item.productId,
        name: orderItem?.name || 'Product',
        price: orderItem?.price || 0,
        quantity: item.quantity,
        reason: item.reason,
        comments: item.comments || comments,
        images: item.images || [],
        status: 'pending'
      };
    });
    
    // Create return record
    const returnRecord = new Return({
      returnId: generateReturnId(),
      order: orderId,
      user: req.user._id,
      items: returnItems,
      returnType: returnType || 'refund',
      status: 'pending',
      totalAmount,
      requestedAt: new Date(),
      pickupAddress: order.shippingAddress
    });
    
    await returnRecord.save();
    
    // Update order with return reference
    order.returnStatus = 'return-requested';
    order.returnRequestedAt = new Date();
    await order.save();
    
    res.status(201).json({
      success: true,
      data: returnRecord,
      message: 'Return request submitted successfully'
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
// @route   GET /api/returns/order/:orderId/details
// @access  Private
export const getReturnDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const returns = await Return.find({ 
      order: orderId,
      user: req.user._id 
    }).sort('-requestedAt');
    
    if (!returns || returns.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No return requests found for this order',
        data: []
      });
    }
    
    res.json({
      success: true,
      data: returns
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
// @route   POST /api/returns/order/:orderId/cancel
// @access  Private
export const cancelReturn = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { returnId } = req.body;
    
    const returnRecord = await Return.findOne({
      returnId: returnId,
      order: orderId,
      user: req.user._id
    });
    
    if (!returnRecord) {
      return res.status(404).json({
        success: false,
        message: 'Return request not found'
      });
    }
    
    if (returnRecord.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel return with status: ${returnRecord.status}`
      });
    }
    
    returnRecord.status = 'cancelled';
    returnRecord.cancelledAt = new Date();
    await returnRecord.save();
    
    res.json({
      success: true,
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

// @desc    Track return by ID
// @route   GET /api/returns/track/:returnId
// @access  Private
export const trackReturn = async (req, res) => {
  try {
    const { returnId } = req.params;
    
    const returnRecord = await Return.findOne({ returnId })
      .populate('order', 'orderNumber');
    
    if (!returnRecord) {
      return res.status(404).json({
        success: false,
        message: 'Return not found'
      });
    }
    
    // Check authorization
    if (returnRecord.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    // Build timeline
    const timeline = [
      {
        status: 'Requested',
        date: returnRecord.requestedAt,
        description: 'Return request submitted',
        completed: true
      }
    ];
    
    if (returnRecord.approvedAt) {
      timeline.push({
        status: 'Approved',
        date: returnRecord.approvedAt,
        description: 'Return request approved',
        completed: true
      });
    }
    
    if (returnRecord.pickupScheduledAt) {
      timeline.push({
        status: 'Pickup Scheduled',
        date: returnRecord.pickupScheduledAt,
        description: `Pickup scheduled`,
        completed: !!returnRecord.pickupCompletedAt
      });
    }
    
    if (returnRecord.pickupCompletedAt) {
      timeline.push({
        status: 'Picked Up',
        date: returnRecord.pickupCompletedAt,
        description: 'Item picked up',
        completed: true
      });
    }
    
    if (returnRecord.processedAt) {
      timeline.push({
        status: 'Processed',
        date: returnRecord.processedAt,
        description: 'Return processed',
        completed: true
      });
    }
    
    if (returnRecord.completedAt) {
      timeline.push({
        status: 'Completed',
        date: returnRecord.completedAt,
        description: returnRecord.returnType === 'refund' ? 'Refund issued' : 'Replacement sent',
        completed: true
      });
    }
    
    if (returnRecord.rejectedAt) {
      timeline.push({
        status: 'Rejected',
        date: returnRecord.rejectedAt,
        description: returnRecord.rejectionReason || 'Return request rejected',
        completed: false
      });
    }
    
    res.json({
      success: true,
      data: {
        returnId: returnRecord.returnId,
        status: returnRecord.status,
        type: returnRecord.returnType,
        items: returnRecord.items,
        totalAmount: returnRecord.totalAmount,
        refundAmount: returnRecord.refundAmount,
        trackingNumber: returnRecord.trackingNumber,
        timeline
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

// ==================== ADMIN ROUTES ====================

// @desc    Get all returns (admin)
// @route   GET /api/returns
// @access  Private/Admin
export const getAllReturns = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all' } = req.query;
    
    const filter = {};
    if (status !== 'all') filter.status = status;
    
    const returns = await Return.find(filter)
      .populate('user', 'name email')
      .populate('order', 'orderNumber')
      .sort('-requestedAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Return.countDocuments(filter);
    
    res.json({
      success: true,
      data: returns,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
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
// @route   PUT /api/returns/:returnId/status
// @access  Private/Admin
export const updateReturnStatus = async (req, res) => {
  try {
    const { returnId } = req.params;
    const { status, reason, trackingNumber } = req.body;
    
    const returnRecord = await Return.findOne({ returnId });
    
    if (!returnRecord) {
      return res.status(404).json({
        success: false,
        message: 'Return not found'
      });
    }
    
    returnRecord.status = status;
    returnRecord.processedBy = req.user._id;
    
    switch (status) {
      case 'approved':
        returnRecord.approvedAt = new Date();
        break;
      case 'rejected':
        returnRecord.rejectedAt = new Date();
        returnRecord.rejectionReason = reason;
        break;
      case 'completed':
        returnRecord.completedAt = new Date();
        break;
    }
    
    if (trackingNumber) {
      returnRecord.trackingNumber = trackingNumber;
    }
    
    await returnRecord.save();
    
    res.json({
      success: true,
      data: returnRecord,
      message: `Return ${status} successfully`
    });
    
  } catch (error) {
    console.error('❌ Update return status error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Process refund (admin)
// @route   POST /api/returns/:returnId/refund
// @access  Private/Admin
export const processReturnRefund = async (req, res) => {
  try {
    const { returnId } = req.params;
    const { refundAmount, transactionId } = req.body;
    
    const returnRecord = await Return.findOne({ returnId });
    
    if (!returnRecord) {
      return res.status(404).json({
        success: false,
        message: 'Return not found'
      });
    }
    
    returnRecord.refundAmount = refundAmount || returnRecord.totalAmount;
    returnRecord.refundTransactionId = transactionId;
    returnRecord.refundProcessedAt = new Date();
    returnRecord.status = 'completed';
    returnRecord.completedAt = new Date();
    
    await returnRecord.save();
    
    res.json({
      success: true,
      data: returnRecord,
      message: 'Refund processed successfully'
    });
    
  } catch (error) {
    console.error('❌ Process refund error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Schedule pickup (admin)
// @route   POST /api/returns/:returnId/pickup
// @access  Private/Admin
export const scheduleReturnPickup = async (req, res) => {
  try {
    const { returnId } = req.params;
    const { pickupDate, trackingNumber, courier } = req.body;
    
    const returnRecord = await Return.findOne({ returnId });
    
    if (!returnRecord) {
      return res.status(404).json({
        success: false,
        message: 'Return not found'
      });
    }
    
    returnRecord.pickupScheduledAt = pickupDate ? new Date(pickupDate) : new Date();
    returnRecord.trackingNumber = trackingNumber;
    returnRecord.courier = courier;
    returnRecord.status = 'pickup_scheduled';
    
    await returnRecord.save();
    
    res.json({
      success: true,
      data: returnRecord,
      message: 'Pickup scheduled successfully'
    });
    
  } catch (error) {
    console.error('❌ Schedule pickup error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};