import nodemailer from 'nodemailer';
import Newsletter from '../models/Newsletter.js';
import { sendNewsletterConfirmationEmail, testEmailConfig } from '../utils/emailService.js';
import mongoose from 'mongoose'; // 🔥 NEW: Import mongoose for ObjectId validation

// @desc    Subscribe to newsletter
// @route   POST /api/newsletter/subscribe
// @access  Public
export const subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    console.log('📧 Newsletter subscription request for:', email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // Check if email already exists
    const existingSubscriber = await Newsletter.findOne({ email });

    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        return res.status(400).json({
          success: false,
          message: 'This email is already subscribed to our newsletter'
        });
      } else {
        // Reactivate if previously unsubscribed
        existingSubscriber.isActive = true;
        existingSubscriber.subscribedAt = new Date();
        existingSubscriber.unsubscribedAt = null;
        await existingSubscriber.save();

        console.log('🔄 Re-subscribing existing user:', email);

        // Send welcome email for re-subscription
        let emailSent = false;
        try {
          console.log('📧 Attempting to send re-subscription email to:', email);
          const emailResult = await sendNewsletterConfirmationEmail(email);
          console.log('✅ Re-subscription email result:', emailResult);
          emailSent = true;
        } catch (emailError) {
          console.error('❌ Failed to send re-subscription email:', emailError.message);
          console.error('Email error details:', emailError);
        }

        return res.status(200).json({
          success: true,
          message: emailSent 
            ? 'Successfully re-subscribed to newsletter! Please check your email for confirmation.'
            : 'Successfully re-subscribed to newsletter! (Email notification failed, but you are subscribed)',
          emailSent
        });
      }
    }

    // Create new subscriber
    const subscriber = await Newsletter.create({
      email,
      isActive: true,
      subscribedAt: new Date()
    });

    console.log('✅ New newsletter subscriber created:', email);

    // Send welcome email
    let emailSent = false;
    try {
      console.log('📧 Attempting to send newsletter confirmation email to:', email);
      const emailResult = await sendNewsletterConfirmationEmail(email);
      console.log('✅ Email sent successfully:', emailResult);
      emailSent = true;
    } catch (emailError) {
      console.error('❌ Failed to send newsletter confirmation email:', emailError.message);
      console.error('Email error details:', emailError);
      console.error('Email error stack:', emailError.stack);
    }

    res.status(201).json({
      success: true,
      message: emailSent 
        ? 'Successfully subscribed to newsletter! Please check your email for confirmation.'
        : 'Successfully subscribed to newsletter! (Email notification failed, but you are subscribed)',
      data: {
        email: subscriber.email,
        subscribedAt: subscriber.subscribedAt
      },
      emailSent
    });

  } catch (error) {
    console.error('❌ Newsletter subscription error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This email is already subscribed'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to subscribe. Please try again.'
    });
  }
};

// 🔥 NEW: Direct test function using nodemailer (same as password reset)
export const testNewsletterDirect = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email query parameter is required'
      });
    }

    console.log('🧪 TESTING DIRECT NEWSLETTER EMAIL TO:', email);
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASS exists:', !!process.env.EMAIL_PASS);

    // Create transporter directly (same as password reset)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Very simple email (like password reset)
    const mailOptions = {
      from: `"OccaMart Test" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔴 DIRECT TEST: Newsletter Working?',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
            h1 { color: #D4AF37; }
            .success { color: green; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔴 DIRECT TEST EMAIL</h1>
            <p>This is a direct test from newsletter controller.</p>
            <p class="success">✅ If you see this, email is working!</p>
            <p>Time: ${new Date().toString()}</p>
            <hr>
            <p>This proves the email configuration is correct.</p>
          </div>
        </body>
        </html>
      `
    };

    console.log('📧 Sending direct test email...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ DIRECT TEST EMAIL SENT:', info.messageId);
    console.log('📨 Response:', info.response);

    res.json({
      success: true,
      message: 'Direct test email sent successfully',
      messageId: info.messageId,
      response: info.response
    });

  } catch (error) {
    console.error('❌ DIRECT TEST EMAIL FAILED:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      name: error.name
    });
  }
};

// @desc    Test email configuration (using emailService)
// @route   GET /api/newsletter/test-email
// @access  Public
export const testEmail = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email query parameter is required'
      });
    }

    console.log('🧪 Testing email configuration for:', email);
    
    // Test email config first
    const configTest = await testEmailConfig();
    console.log('📧 Email config test result:', configTest);

    if (!configTest.success) {
      return res.status(500).json({
        success: false,
        message: 'Email configuration failed',
        error: configTest.error
      });
    }

    // Try to send test email using the service function
    const result = await sendNewsletterConfirmationEmail(email);
    
    res.json({
      success: true,
      message: 'Test email sent successfully',
      result
    });

  } catch (error) {
    console.error('❌ Test email error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack
    });
  }
};

// @desc    Unsubscribe from newsletter
// @route   POST /api/newsletter/unsubscribe
// @access  Public
export const unsubscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const subscriber = await Newsletter.findOne({ email });

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Email not found in our newsletter list'
      });
    }

    if (!subscriber.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This email is already unsubscribed'
      });
    }

    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    console.log('📧 Newsletter unsubscribed:', email);

    res.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter'
    });

  } catch (error) {
    console.error('❌ Newsletter unsubscribe error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to unsubscribe. Please try again.'
    });
  }
};

// @desc    Get newsletter stats (admin only)
// @route   GET /api/newsletter/stats
// @access  Private/Admin
export const getNewsletterStats = async (req, res) => {
  try {
    const totalSubscribers = await Newsletter.countDocuments();
    const activeSubscribers = await Newsletter.countDocuments({ isActive: true });
    const unsubscribed = await Newsletter.countDocuments({ isActive: false });

    // Get recent subscribers
    const recentSubscribers = await Newsletter.find()
      .sort({ subscribedAt: -1 })
      .limit(10)
      .select('email subscribedAt isActive');

    console.log('📊 Newsletter stats:', {
      total: totalSubscribers,
      active: activeSubscribers,
      unsubscribed: unsubscribed
    });

    res.json({
      success: true,
      data: {
        total: totalSubscribers,
        active: activeSubscribers,
        unsubscribed: unsubscribed,
        recent: recentSubscribers
      }
    });

  } catch (error) {
    console.error('❌ Get newsletter stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Export newsletter emails (admin only)
// @route   GET /api/newsletter/export
// @access  Private/Admin
export const exportNewsletter = async (req, res) => {
  try {
    const subscribers = await Newsletter.find({ isActive: true })
      .select('email subscribedAt -_id')
      .sort({ subscribedAt: -1 });

    // Format for CSV export
    const formattedData = subscribers.map(sub => ({
      email: sub.email,
      subscribedDate: sub.subscribedAt.toISOString().split('T')[0],
      subscribedTime: sub.subscribedAt.toTimeString().split(' ')[0]
    }));

    console.log(`📧 Exporting ${formattedData.length} active subscribers`);

    res.json({
      success: true,
      count: formattedData.length,
      data: formattedData
    });

  } catch (error) {
    console.error('❌ Export newsletter error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Send newsletter broadcast (admin only)
// @route   POST /api/newsletter/broadcast
// @access  Private/Admin
export const broadcastNewsletter = async (req, res) => {
  try {
    const { subject, content } = req.body;
    
    if (!subject || !content) {
      return res.status(400).json({
        success: false,
        message: 'Subject and content are required'
      });
    }

    // Get all active subscribers
    const subscribers = await Newsletter.find({ isActive: true }).select('email');
    
    console.log(`📬 Broadcasting newsletter to ${subscribers.length} subscribers`);

    if (subscribers.length === 0) {
      return res.json({
        success: true,
        message: 'No active subscribers to send to',
        stats: { total: 0, sent: 0, failed: 0 }
      });
    }

    // Send emails in batches
    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < subscribers.length; i += batchSize) {
      batches.push(subscribers.slice(i, i + batchSize));
    }

    let sentCount = 0;
    let failedCount = 0;

    // Process each batch
    for (const batch of batches) {
      const promises = batch.map(async (subscriber) => {
        try {
          const { sendNewsletterUpdate } = await import('../utils/emailService.js');
          await sendNewsletterUpdate(subscriber.email, subject, content);
          sentCount++;
        } catch (error) {
          console.error(`❌ Failed to send to ${subscriber.email}:`, error.message);
          failedCount++;
        }
      });

      await Promise.all(promises);
      
      if (batches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`✅ Broadcast complete: ${sentCount} sent, ${failedCount} failed`);

    res.json({
      success: true,
      message: `Newsletter broadcast sent to ${sentCount} subscribers`,
      stats: {
        total: subscribers.length,
        sent: sentCount,
        failed: failedCount
      }
    });

  } catch (error) {
    console.error('❌ Broadcast newsletter error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 🔥 FIXED: Delete subscriber with better error handling
// @desc    Delete subscriber (admin only)
// @route   DELETE /api/newsletter/:id
// @access  Private/Admin
export const deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ Attempting to delete subscriber with ID:', id);

    // 🔥 FIX 1: Validate if ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('❌ Invalid subscriber ID format:', id);
      return res.status(400).json({
        success: false,
        message: 'Invalid subscriber ID format'
      });
    }

    // 🔥 FIX 2: Find subscriber by ID
    const subscriber = await Newsletter.findById(id);
    
    if (!subscriber) {
      console.error('❌ Subscriber not found with ID:', id);
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found'
      });
    }

    console.log('📧 Found subscriber:', subscriber.email);

    // 🔥 FIX 3: Delete the subscriber
    await subscriber.deleteOne();
    
    console.log('✅ Subscriber deleted successfully:', subscriber.email);

    res.json({
      success: true,
      message: 'Subscriber deleted successfully',
      data: {
        email: subscriber.email,
        id: subscriber._id
      }
    });

  } catch (error) {
    console.error('❌ Delete subscriber error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete subscriber. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// 🔥 NEW: Get single subscriber by ID (optional)
// @desc    Get subscriber by ID
// @route   GET /api/newsletter/:id
// @access  Private/Admin
export const getSubscriberById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscriber ID format'
      });
    }

    const subscriber = await Newsletter.findById(id).select('-__v');
    
    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found'
      });
    }

    res.json({
      success: true,
      data: subscriber
    });

  } catch (error) {
    console.error('❌ Get subscriber error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 🔥 NEW: Bulk delete subscribers (optional)
// @desc    Bulk delete subscribers
// @route   POST /api/newsletter/bulk-delete
// @access  Private/Admin
export const bulkDeleteSubscribers = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of subscriber IDs'
      });
    }

    // Validate all IDs
    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
    
    if (validIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid subscriber IDs provided'
      });
    }

    const result = await Newsletter.deleteMany({ _id: { $in: validIds } });
    
    console.log(`🗑️ Bulk deleted ${result.deletedCount} subscribers`);

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} subscribers`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('❌ Bulk delete error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};