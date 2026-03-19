import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendPushNotification } from '../utils/notificationService.js';
import { 
  sendVerificationEmail, 
  sendWelcomeEmail, 
  sendPasswordResetEmail,
  sendNewsletterConfirmationEmail,
  sendNewsletterUpdate 
} from '../utils/emailService.js';

// @desc    Get all notifications
// @route   GET /api/notifications
// @access  Private/Admin
export const getNotifications = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type = 'all',
      status = 'all',
      startDate,
      endDate,
      sort = 'newest'
    } = req.query;

    // Build filter
    let filter = {};
    
    if (type !== 'all') {
      filter.type = type;
    }
    
    if (status !== 'all') {
      filter.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
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
      default:
        sortOption = { createdAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(filter)
      .populate('createdBy', 'name email')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(filter);

    res.json({
      success: true,
      notifications,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      total
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get notification statistics
// @route   GET /api/notifications/stats
// @access  Private/Admin
export const getNotificationStats = async (req, res) => {
  try {
    const [
      total,
      sent,
      pending,
      failed,
      scheduled,
      draft
    ] = await Promise.all([
      Notification.countDocuments(),
      Notification.countDocuments({ status: 'sent' }),
      Notification.countDocuments({ status: 'pending' }),
      Notification.countDocuments({ status: 'failed' }),
      Notification.countDocuments({ status: 'scheduled' }),
      Notification.countDocuments({ status: 'draft' })
    ]);

    // Calculate engagement stats
    const notifications = await Notification.find({ status: 'sent' });
    
    let totalOpened = 0;
    let totalClicked = 0;
    let totalConverted = 0;
    let totalRecipients = 0;

    notifications.forEach(notif => {
      totalOpened += notif.stats?.opened || 0;
      totalClicked += notif.stats?.clicked || 0;
      totalConverted += notif.stats?.converted || 0;
      totalRecipients += notif.stats?.recipients || 0;
    });

    const openRate = totalRecipients > 0 ? (totalOpened / totalRecipients) * 100 : 0;
    const clickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;
    const conversionRate = totalClicked > 0 ? (totalConverted / totalClicked) * 100 : 0;

    res.json({
      success: true,
      data: {
        total,
        sent,
        pending,
        failed,
        scheduled,
        draft,
        opened: totalOpened,
        clicked: totalClicked,
        converted: totalConverted,
        openRate: Math.round(openRate * 10) / 10,
        clickRate: Math.round(clickRate * 10) / 10,
        conversionRate: Math.round(conversionRate * 10) / 10
      }
    });

  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get notification templates
// @route   GET /api/notifications/templates
// @access  Private/Admin
export const getNotificationTemplates = async (req, res) => {
  const templates = [
    {
      id: 'welcome',
      title: 'Welcome to OccaMart',
      message: 'Welcome to OccaMart! Get 10% off on your first order with code WELCOME10',
      type: 'promotional',
      image: '🎉'
    },
    {
      id: 'order_confirmation',
      title: 'Order Confirmed',
      message: 'Your order #{orderNumber} has been confirmed. Track your order here.',
      type: 'transactional',
      image: '✅'
    },
    {
      id: 'order_shipped',
      title: 'Order Shipped',
      message: 'Your order #{orderNumber} has been shipped! Track it here.',
      type: 'transactional',
      image: '🚚'
    },
    {
      id: 'order_delivered',
      title: 'Order Delivered',
      message: 'Your order #{orderNumber} has been delivered. Rate your experience!',
      type: 'transactional',
      image: '📦'
    },
    {
      id: 'abandoned_cart',
      title: 'Complete Your Purchase',
      message: 'You left items in your cart. Complete your purchase now!',
      type: 'reminder',
      image: '🛒'
    },
    {
      id: 'flash_sale',
      title: 'Flash Sale Alert!',
      message: '24-hour flash sale! Up to 50% off on selected items. Shop now!',
      type: 'promotional',
      image: '⚡'
    },
    {
      id: 'price_drop',
      title: 'Price Drop Alert',
      message: 'Items in your wishlist are now at lower prices. Check them out!',
      type: 'alert',
      image: '💰'
    },
    {
      id: 'back_in_stock',
      title: 'Back in Stock',
      message: 'Items you were looking for are back in stock. Order now!',
      type: 'alert',
      image: '🔄'
    },
    {
      id: 'birthday',
      title: 'Happy Birthday!',
      message: 'Happy Birthday! Enjoy a special 20% off on your birthday month.',
      type: 'promotional',
      image: '🎂'
    },
    {
      id: 'review_request',
      title: 'Rate Your Experience',
      message: 'How was your shopping experience? Leave a review and earn points!',
      type: 'reminder',
      image: '⭐'
    }
  ];

  res.json({
    success: true,
    templates
  });
};

// @desc    Create notification
// @route   POST /api/notifications
// @access  Private/Admin
export const createNotification = async (req, res) => {
  try {
    const notificationData = {
      ...req.body,
      createdBy: req.user._id
    };

    const notification = await Notification.create(notificationData);

    res.status(201).json({
      success: true,
      notification
    });

  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Send notification immediately
// @route   POST /api/notifications/send
// @access  Private/Admin
export const sendNotification = async (req, res) => {
  try {
    const {
      title,
      message,
      type,
      targetAudience,
      specificUsers,
      userSegments,
      priority,
      image,
      actionUrl,
      actionButton,
      deepLink
    } = req.body;

    // Get target users
    let targetUsers = [];
    
    switch (targetAudience) {
      case 'all':
        targetUsers = await User.find({ isActive: true }).select('_id fcmToken email');
        break;
      case 'active':
        targetUsers = await User.find({ 
          isActive: true,
          lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }).select('_id fcmToken email');
        break;
      case 'inactive':
        targetUsers = await User.find({ 
          isActive: true,
          lastLogin: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }).select('_id fcmToken email');
        break;
      case 'new':
        targetUsers = await User.find({ 
          isActive: true,
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }).select('_id fcmToken email');
        break;
      case 'customers':
        targetUsers = await User.find({ 
          isActive: true,
          orderCount: { $gt: 0 }
        }).select('_id fcmToken email');
        break;
      case 'subscribers':
        targetUsers = await User.find({ 
          isActive: true,
          newsletterSubscribed: true
        }).select('_id fcmToken email');
        break;
      case 'specific':
        if (specificUsers && specificUsers.length > 0) {
          targetUsers = await User.find({ 
            _id: { $in: specificUsers },
            isActive: true 
          }).select('_id fcmToken email');
        }
        break;
      default:
        targetUsers = [];
    }

    // Create notification record
    const notification = await Notification.create({
      title,
      message,
      type,
      status: 'pending',
      priority,
      targetAudience,
      specificUsers: targetUsers.map(u => u._id),
      userSegments,
      image,
      actionUrl,
      actionButton,
      deepLink,
      stats: {
        recipients: targetUsers.length
      },
      createdBy: req.user._id
    });

    // Send push notifications in background
    if (targetUsers.length > 0) {
      // Send to users with FCM tokens
      const usersWithTokens = targetUsers.filter(u => u.fcmToken);
      
      // Process in batches to avoid overwhelming
      const batchSize = 100;
      for (let i = 0; i < usersWithTokens.length; i += batchSize) {
        const batch = usersWithTokens.slice(i, i + batchSize);
        
        batch.forEach(user => {
          sendPushNotification(user.fcmToken, {
            title,
            body: message,
            data: {
              notificationId: notification._id.toString(),
              type,
              actionUrl,
              deepLink
            },
            image
          }).catch(err => console.error('Push send error:', err));
        });
      }

      // Send emails for users without FCM tokens or as backup
      const usersForEmail = targetUsers.filter(u => u.email);
      
      usersForEmail.forEach(user => {
        // Use appropriate email function based on notification type
        if (type === 'promotional') {
          sendNewsletterUpdate(user.email, title, `<p>${message}</p>`).catch(err => console.error('Email send error:', err));
        } else {
          // For other types, use a generic email
          sendVerificationEmail(user.email, user.name || 'User', 'dummy-token').catch(err => console.error('Email send error:', err));
        }
      });
    }

    // Update notification status
    notification.status = 'sent';
    notification.sentAt = Date.now();
    await notification.save();

    res.json({
      success: true,
      notification,
      recipients: targetUsers.length
    });

  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Schedule notification
// @route   POST /api/notifications/schedule
// @access  Private/Admin
export const scheduleNotification = async (req, res) => {
  try {
    const { scheduledFor, ...notificationData } = req.body;

    if (!scheduledFor) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled time is required'
      });
    }

    const notification = await Notification.create({
      ...notificationData,
      scheduledFor: new Date(scheduledFor),
      status: 'scheduled',
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      notification
    });

  } catch (error) {
    console.error('Schedule notification error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update notification
// @route   PUT /api/notifications/:id
// @access  Private/Admin
export const updateNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Don't allow updating sent notifications
    if (notification.status === 'sent') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update sent notifications'
      });
    }

    const updatedNotification = await Notification.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      notification: updatedNotification
    });

  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cancel scheduled notification
// @route   PUT /api/notifications/:id/cancel
// @access  Private/Admin
export const cancelNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (notification.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Only scheduled notifications can be cancelled'
      });
    }

    notification.status = 'cancelled';
    notification.cancelledAt = Date.now();
    await notification.save();

    res.json({
      success: true,
      notification
    });

  } catch (error) {
    console.error('Cancel notification error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private/Admin
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Soft delete by setting status to deleted
    notification.status = 'deleted';
    await notification.save();

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Track notification open
// @route   POST /api/notifications/:id/track/open
// @access  Private
export const trackOpen = async (req, res) => {
  try {
    const { userId } = req.body;
    
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Update stats
    notification.stats.opened += 1;

    // Track user interaction
    const interaction = notification.userInteractions.find(
      i => i.user.toString() === userId
    );

    if (interaction) {
      interaction.opened = true;
      interaction.openedAt = Date.now();
    } else {
      notification.userInteractions.push({
        user: userId,
        opened: true,
        openedAt: Date.now()
      });
    }

    await notification.save();

    res.json({
      success: true
    });

  } catch (error) {
    console.error('Track open error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Track notification click
// @route   POST /api/notifications/:id/track/click
// @access  Private
export const trackClick = async (req, res) => {
  try {
    const { userId } = req.body;
    
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Update stats
    notification.stats.clicked += 1;

    // Track user interaction
    const interaction = notification.userInteractions.find(
      i => i.user.toString() === userId
    );

    if (interaction) {
      interaction.clicked = true;
      interaction.clickedAt = Date.now();
    } else {
      notification.userInteractions.push({
        user: userId,
        clicked: true,
        clickedAt: Date.now()
      });
    }

    await notification.save();

    res.json({
      success: true
    });

  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single notification
// @route   GET /api/notifications/:id
// @access  Private/Admin
export const getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('userInteractions.user', 'name email');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      notification
    });

  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};