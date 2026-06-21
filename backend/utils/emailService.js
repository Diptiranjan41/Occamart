import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter with better error handling
const createTransporter = () => {
  // Check if credentials exist
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Email credentials missing in .env file');
    throw new Error('Email configuration missing');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send password reset email (WORKING) - KEEP AS IS
export const sendPasswordResetEmail = async (email, name, resetUrl) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"OccaMart" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request - OccaMart',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #EDE8D0; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #F9F9F9; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1); }
            .header { background: #D4AF37; padding: 30px; text-align: center; }
            .header h1 { color: #1F2937; margin: 0; font-size: 28px; }
            .content { padding: 40px; }
            .content h2 { color: #1F2937; margin-bottom: 20px; }
            .content p { color: #1F2937; line-height: 1.6; margin-bottom: 20px; opacity: 0.8; }
            .btn { display: inline-block; background: #D4AF37; color: #1F2937; text-decoration: none; padding: 15px 40px; border-radius: 12px; font-weight: 600; margin: 20px 0; transition: all 0.3s ease; border: none; }
            .btn:hover { background: #B8962E; transform: translateY(-3px); box-shadow: 0 8px 20px -5px #D4AF37; }
            .footer { background: #EDE8D0; padding: 20px; text-align: center; color: #1F2937; font-size: 14px; opacity: 0.7; }
            .warning { background: #EDE8D0; border-left: 4px solid #D4AF37; padding: 15px; margin: 20px 0; border-radius: 8px; }
            .warning p { color: #1F2937; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🛍️ OccaMart</h1>
            </div>
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>Hello ${name},</p>
              <p>We received a request to reset your password for your OccaMart account. Click the button below to set a new password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="btn">Reset Password</a>
              </div>
              
              <div class="warning">
                <p>⚠️ This link will expire in 1 hour for security reasons.</p>
              </div>
              
              <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
              
              <p style="margin-top: 30px;">Best regards,<br>The OccaMart Team</p>
            </div>
            <div class="footer">
              <p>© 2026 OccaMart. All rights reserved.</p>
              <p style="margin-top: 10px;">This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    throw error;
  }
};

// Send verification email - KEEP AS IS
export const sendVerificationEmail = async (email, name, token) => {
  try {
    const transporter = createTransporter();
    const verificationUrl = `http://localhost:5173/verify-email/${token}`;

    const mailOptions = {
      from: `"OccaMart" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - OccaMart',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #EDE8D0; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #F9F9F9; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1); }
            .header { background: #D4AF37; padding: 30px; text-align: center; }
            .header h1 { color: #1F2937; margin: 0; }
            .content { padding: 40px; }
            .btn { display: inline-block; background: #D4AF37; color: #1F2937; text-decoration: none; padding: 15px 40px; border-radius: 12px; font-weight: 600; margin: 20px 0; }
            .btn:hover { background: #B8962E; }
            .footer { background: #EDE8D0; padding: 20px; text-align: center; color: #1F2937; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🛍️ OccaMart</h1>
            </div>
            <div class="content">
              <h2>Welcome to OccaMart, ${name}!</h2>
              <p>Please verify your email address to start shopping.</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="btn">Verify Email</a>
              </div>
            </div>
            <div class="footer">
              <p>© 2026 OccaMart. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    throw error;
  }
};

// Send welcome email - KEEP AS IS
export const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"OccaMart" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to OccaMart!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #EDE8D0; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #F9F9F9; border-radius: 24px; overflow: hidden; }
            .header { background: #D4AF37; padding: 30px; text-align: center; }
            .header h1 { color: #1F2937; margin: 0; }
            .content { padding: 40px; text-align: center; }
            .content h2 { color: #1F2937; }
            .content p { color: #1F2937; opacity: 0.8; }
            .footer { background: #EDE8D0; padding: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🛍️ OccaMart</h1>
            </div>
            <div class="content">
              <h2>Welcome aboard, ${name}! 🎉</h2>
              <p>Thank you for joining OccaMart. Start exploring our amazing products!</p>
              <a href="http://localhost:5173/" style="display: inline-block; background: #D4AF37; color: #1F2937; text-decoration: none; padding: 12px 30px; border-radius: 8px; margin-top: 20px;">Start Shopping</a>
            </div>
            <div class="footer">
              <p>© 2026 OccaMart. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    throw error;
  }
};

// 🔥 FIXED: Send newsletter subscription confirmation email - CSS properly implemented
export const sendNewsletterConfirmationEmail = async (email) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"OccaMart Bhubaneswar" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🎉 Dhanyabad! Welcome to OccaMart Newsletter - Bhubaneswar, Odisha',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to OccaMart Newsletter - Bhubaneswar, Odisha</title>
          <style>
            /* RESET STYLES */
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #EDE8D0;
              margin: 0;
              padding: 30px 20px;
              line-height: 1.6;
            }
            
            /* MAIN CONTAINER */
            .container {
              max-width: 650px;
              margin: 0 auto;
              background-color: #FFFFFF;
              border-radius: 40px;
              overflow: hidden;
              box-shadow: 0 40px 80px -20px rgba(0,0,0,0.3);
              position: relative;
              border: 1px solid #D4AF37;
            }
            
            /* HEADER SECTION */
            .header {
              background: linear-gradient(135deg, #D4AF37 0%, #B8962E 100%);
              padding: 50px 30px;
              text-align: center;
              position: relative;
            }
            
            .header h1 {
              color: #1F2937;
              margin: 0;
              font-size: 48px;
              font-weight: 800;
              letter-spacing: 2px;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
            }
            
            .header-subtitle {
              color: #1F2937;
              font-size: 18px;
              margin-top: 15px;
              font-weight: 500;
              opacity: 0.9;
            }
            
            .location-badge {
              display: inline-block;
              background-color: rgba(255, 255, 255, 0.25);
              padding: 8px 25px;
              border-radius: 50px;
              margin-top: 15px;
              border: 1px solid rgba(255, 255, 255, 0.5);
            }
            
            .location-badge span {
              color: #1F2937;
              font-weight: 600;
            }
            
            /* CONTENT AREA */
            .content {
              padding: 50px 40px;
            }
            
            /* WELCOME SECTION */
            .welcome-section {
              text-align: center;
              margin-bottom: 30px;
            }
            
            .welcome-section h2 {
              color: #D4AF37;
              font-size: 36px;
              margin-bottom: 20px;
              font-weight: 700;
            }
            
            .welcome-message {
              font-size: 18px;
              color: #1F2937;
              line-height: 1.8;
              margin-bottom: 30px;
            }
            
            /* ODISHA GREETING */
            .odisha-greeting {
              background-color: #EDE8D0;
              padding: 20px;
              border-radius: 20px;
              margin: 30px 0;
              border-left: 6px solid #D4AF37;
            }
            
            .odisha-greeting p {
              font-size: 20px;
              color: #1F2937;
              font-style: italic;
            }
            
            .odisha-greeting small {
              color: #D4AF37;
              font-weight: 600;
            }
            
            /* OFFICIAL CONTACT */
            .official-contact {
              background-color: #1F2937;
              color: #FFFFFF;
              padding: 25px;
              border-radius: 20px;
              margin: 30px 0;
              text-align: center;
              border: 2px solid #D4AF37;
            }
            
            .official-contact h3 {
              color: #D4AF37;
              margin-bottom: 20px;
              font-size: 24px;
            }
            
            .contact-detail {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
              margin: 15px 0;
              font-size: 18px;
            }
            
            .contact-detail span {
              color: #D4AF37;
              font-weight: 700;
            }
            
            .official-email {
              background-color: rgba(212, 175, 55, 0.2);
              padding: 15px;
              border-radius: 50px;
              margin: 15px 0;
              font-size: 20px;
              font-weight: 600;
              letter-spacing: 1px;
            }
            
            .official-email span {
              color: #D4AF37;
            }
            
            /* SERVICE AREAS */
            .service-areas {
              background-color: #EDE8D0;
              border-radius: 20px;
              padding: 25px;
              margin: 30px 0;
            }
            
            .service-areas h3 {
              color: #D4AF37;
              margin-bottom: 20px;
              font-size: 22px;
              text-align: center;
            }
            
            .areas-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
            }
            
            .area-item {
              background-color: #FFFFFF;
              padding: 12px;
              border-radius: 12px;
              text-align: center;
              border: 1px solid #D4AF37;
              font-weight: 600;
              color: #1F2937;
            }
            
            /* STUDENT OFFER */
            .student-offer {
              background: linear-gradient(135deg, #FF9933, #D4AF37);
              border-radius: 20px;
              padding: 30px;
              margin: 30px 0;
              text-align: center;
              position: relative;
            }
            
            .student-offer h3 {
              color: #1F2937;
              font-size: 28px;
              margin-bottom: 15px;
              font-weight: 800;
            }
            
            .student-offer p {
              color: #1F2937;
              font-size: 18px;
              margin: 10px 0;
              font-weight: 600;
            }
            
            .student-badge {
              display: inline-block;
              background-color: #1F2937;
              color: #D4AF37;
              padding: 10px 25px;
              border-radius: 50px;
              margin: 15px 0;
              font-weight: 700;
              font-size: 20px;
            }
            
            /* LOCAL PICKUP */
            .local-pickup {
              background-color: #EDE8D0;
              padding: 25px;
              border-radius: 20px;
              margin: 30px 0;
              display: flex;
              align-items: center;
              gap: 20px;
              border: 2px dashed #D4AF37;
            }
            
            .pickup-icon {
              font-size: 60px;
            }
            
            .pickup-details {
              flex: 1;
            }
            
            .pickup-details h4 {
              color: #D4AF37;
              font-size: 20px;
              margin-bottom: 10px;
            }
            
            .pickup-details p {
              color: #1F2937;
              margin: 5px 0;
            }
            
            /* FESTIVAL CALENDAR */
            .festival-calendar {
              background-color: #FFFFFF;
              border: 2px solid #D4AF37;
              border-radius: 20px;
              padding: 25px;
              margin: 30px 0;
            }
            
            .festival-calendar h3 {
              color: #D4AF37;
              margin-bottom: 20px;
              font-size: 22px;
              text-align: center;
            }
            
            .festival-item {
              display: flex;
              align-items: center;
              gap: 15px;
              padding: 12px;
              border-bottom: 1px dashed #D4AF37;
            }
            
            .festival-item:last-child {
              border-bottom: none;
            }
            
            .festival-icon {
              font-size: 28px;
            }
            
            .festival-name {
              flex: 1;
              font-weight: 600;
              color: #1F2937;
            }
            
            .festival-date {
              color: #D4AF37;
              font-weight: 600;
            }
            
            /* BENEFITS GRID */
            .benefits-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              margin: 40px 0;
            }
            
            .benefit-card {
              background: linear-gradient(135deg, #F9F9F9, #FFFFFF);
              padding: 25px 15px;
              border-radius: 20px;
              text-align: center;
              box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
              border: 1px solid #E0D9CD;
            }
            
            .benefit-icon {
              font-size: 40px;
              margin-bottom: 15px;
            }
            
            .benefit-title {
              font-weight: 700;
              color: #1F2937;
              margin-bottom: 8px;
              font-size: 18px;
            }
            
            .benefit-desc {
              color: #6B7280;
              font-size: 13px;
              line-height: 1.5;
            }
            
            /* COUPON BOX */
            .coupon-box {
              background: linear-gradient(135deg, #1F2937 0%, #2D3748 100%);
              border-radius: 25px;
              padding: 30px;
              text-align: center;
              margin: 40px 0;
              position: relative;
            }
            
            .coupon-label {
              color: #D4AF37;
              font-size: 16px;
              text-transform: uppercase;
              letter-spacing: 2px;
              margin-bottom: 15px;
            }
            
            .coupon-code {
              font-size: 48px;
              font-weight: 800;
              color: #FFFFFF;
              letter-spacing: 8px;
              margin: 15px 0;
              font-family: monospace;
            }
            
            .coupon-validity {
              color: #D4AF37;
              font-size: 14px;
            }
            
            /* CTA BUTTON */
            .cta-section {
              text-align: center;
              margin: 40px 0;
            }
            
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #D4AF37 0%, #B8962E 100%);
              color: #1F2937;
              text-decoration: none;
              padding: 18px 45px;
              border-radius: 50px;
              font-weight: 700;
              font-size: 20px;
              letter-spacing: 1px;
              border: none;
            }
            
            /* FOOTER */
            .footer {
              background-color: #1F2937;
              padding: 40px 30px;
              text-align: center;
              color: #FFFFFF;
            }
            
            .footer h3 {
              color: #D4AF37;
              margin-bottom: 20px;
              font-size: 24px;
            }
            
            .footer-contact {
              margin: 20px 0;
            }
            
            .footer-contact p {
              margin: 10px 0;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
            }
            
            .footer-contact a {
              color: #D4AF37;
              text-decoration: none;
              font-weight: 600;
            }
            
            .social-links {
              display: flex;
              justify-content: center;
              gap: 25px;
              margin: 25px 0;
            }
            
            .social-links a {
              color: #D4AF37;
              font-size: 28px;
              text-decoration: none;
            }
            
            .footer-links {
              display: flex;
              justify-content: center;
              gap: 30px;
              margin: 20px 0;
              flex-wrap: wrap;
            }
            
            .footer-links a {
              color: #D4AF37;
              text-decoration: none;
              font-weight: 500;
            }
            
            .store-badge {
              display: inline-block;
              background-color: #D4AF37;
              color: #1F2937;
              padding: 10px 25px;
              border-radius: 50px;
              font-weight: 700;
              margin: 20px 0;
            }
            
            .odisha-footer {
              margin-top: 25px;
              font-size: 16px;
              color: #D4AF37;
              font-weight: 600;
            }
            
            .unsubscribe {
              margin-top: 20px;
              font-size: 12px;
            }
            
            .unsubscribe a {
              color: #D4AF37;
              text-decoration: none;
            }
            
            /* RESPONSIVE */
            @media (max-width: 600px) {
              .content { padding: 30px 20px; }
              .header h1 { font-size: 32px; }
              .benefits-grid { grid-template-columns: 1fr; }
              .areas-grid { grid-template-columns: 1fr; }
              .coupon-code { font-size: 32px; letter-spacing: 4px; }
              .local-pickup { flex-direction: column; text-align: center; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <h1>📬 Newsletter</h1>
              <div class="header-subtitle">Bhubaneswar • Odisha • India</div>
              <div class="location-badge">
                <span>📍 751001 • Temple City</span>
              </div>
            </div>
            
            <!-- Content -->
            <div class="content">
              <div class="welcome-section">
                <h2>Dhanyawad! 🙏</h2>
                <div class="welcome-message">
                  Thank you for subscribing to the <strong>OccaMart Newsletter</strong>! You're now part of an exclusive community of <strong>50,000+ happy shoppers</strong> across Odisha.
                </div>
              </div>
              
              <div class="odisha-greeting">
                <p>"ଆମର ପରିବାରରେ ସ୍ୱାଗତ | Welcome to our family!"</p>
                <small>- The OccaMart Team, Bhubaneswar</small>
              </div>
              
              <!-- Official Contact Information -->
              <div class="official-contact">
                <h3>📧 Official Communication</h3>
                <div class="official-email">
                  <span>✉️ occamart@gmail.com</span>
                </div>
                <div class="contact-detail">
                  <span>📞</span> +91 78478 74670
                </div>
                <div class="contact-detail">
                  <span>📍</span> Head Office: Unit-3, Bhubaneswar - 751001
                </div>
                <p style="margin-top: 15px; color: #D4AF37;">24/7 Customer Support • 7 Days a Week</p>
              </div>
              
              <!-- Service Areas -->
              <div class="service-areas">
                <h3>🚚 We Deliver To</h3>
                <div class="areas-grid">
                  <div class="area-item">🏛️ Bhubaneswar</div>
                  <div class="area-item">🌊 Kendrapara</div>
                  <div class="area-item">🏯 Jajpur</div>
                  <div class="area-item">🔥 Bhadrak</div>
                  <div class="area-item">🌀 Cuttack</div>
                  <div class="area-item">🌺 Puri</div>
                </div>
                <p style="margin-top: 15px; color: #1F2937;">✓ Free delivery in all these cities • Same-day in BBSR</p>
              </div>
              
              <!-- Student Discount Special - UPDATED with GITA, KIIT, SOA, BJB -->
              <div class="student-offer">
                <h3>🎓 STUDENT SPECIAL</h3>
                <div class="student-badge">15% EXTRA DISCOUNT</div>
                <p>Valid for all college students across India!</p>
                <p><strong>GITA • KIIT • SOA • BJB • + All Colleges</strong></p>
                <p style="margin-top: 15px;">Use code: <strong style="background: #1F2937; color: #D4AF37; padding: 8px 20px; border-radius: 50px; display: inline-block; margin-top: 10px;">STUDENT15</strong></p>
              </div>
              
              <!-- Local Pickup -->
              <div class="local-pickup">
                <div class="pickup-icon">🏪</div>
                <div class="pickup-details">
                  <h4>Local Pickup Available</h4>
                  <p>📦 Collect from our Bhubaneswar store</p>
                  <p>📍 Shop No. 45, Unit-3, Near Jayadev Vatika</p>
                  <p>⏰ Mon-Sat: 10AM - 8PM | Sun: 12PM - 6PM</p>
                </div>
              </div>
              
              <!-- Festival Calendar -->
              <div class="festival-calendar">
                <h3>📅 Odisha Festival Calendar 2026</h3>
                <div class="festival-item">
                  <div class="festival-icon">🌸</div>
                  <div class="festival-name">Raja Festival</div>
                  <div class="festival-date">June 14-16</div>
                </div>
                <div class="festival-item">
                  <div class="festival-icon">🛕</div>
                  <div class="festival-name">Rath Yatra</div>
                  <div class="festival-date">July 12</div>
                </div>
                <div class="festival-item">
                  <div class="festival-icon">🌺</div>
                  <div class="festival-name">Durga Puja</div>
                  <div class="festival-date">October 10-15</div>
                </div>
                <div class="festival-item">
                  <div class="festival-icon">☀️</div>
                  <div class="festival-name">Konark Festival</div>
                  <div class="festival-date">December 1-5</div>
                </div>
                <div class="festival-item">
                  <div class="festival-icon">🪔</div>
                  <div class="festival-name">Diwali</div>
                  <div class="festival-date">November 8</div>
                </div>
              </div>
              
              <!-- Benefits Grid -->
              <div class="benefits-grid">
                <div class="benefit-card">
                  <div class="benefit-icon">✨</div>
                  <div class="benefit-title">Early Access</div>
                  <div class="benefit-desc">Be first to know about new products</div>
                </div>
                <div class="benefit-card">
                  <div class="benefit-icon">💰</div>
                  <div class="benefit-title">Exclusive Discounts</div>
                  <div class="benefit-desc">Member-only deals & offers</div>
                </div>
                <div class="benefit-card">
                  <div class="benefit-icon">🎁</div>
                  <div class="benefit-title">Festival Offers</div>
                  <div class="benefit-desc">Raja, Diwali & Durga Puja discounts</div>
                </div>
              </div>
              
              <!-- Welcome Coupon -->
              <div class="coupon-box">
                <div class="coupon-label">🎁 Your Exclusive Welcome Gift</div>
                <div class="coupon-code">WELCOME15</div>
                <div class="coupon-validity">Valid on first order • Free delivery in Bhubaneswar</div>
              </div>
              
              <!-- CTA Section -->
              <div class="cta-section">
                <a href="http://localhost:5173/shop" class="cta-button">
                  🛍️ Start Shopping in Odisha
                </a>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <h3>OccaMart - Odisha's Favorite Store</h3>
              
              <div class="footer-contact">
                <p><span>📧</span> <a href="mailto:occamart@gmail.com">occamart@gmail.com</a></p>
                <p><span>📞</span> <a href="tel:+917847874670">+91 78478 74670</a></p>
                <p><span>📍</span> Unit-3, Bhubaneswar - 751001</p>
              </div>
              
              <div class="social-links">
                <a href="#">📘</a>
                <a href="#">📷</a>
                <a href="#">🐦</a>
                <a href="#">🎯</a>
                <a href="#">📱</a>
              </div>
              
              <div class="footer-links">
                <a href="#">About Us</a>
                <a href="#">Bhubaneswar Store</a>
                <a href="#">Contact</a>
                <a href="#">Privacy</a>
                <a href="#">Terms</a>
              </div>
              
              <div class="store-badge">
                ⭐ 4.9 ★ (15k+ reviews) • Bhubaneswar's Most Trusted Store
              </div>
              
              <div class="odisha-footer">
                <span>🌺 Bhubaneswar • Kendrapara • Jajpur • Bhadrak • Cuttack 🌺</span>
              </div>
              
              <p style="margin-top: 25px; font-size: 13px; opacity: 0.8;">
                © 2026 OccaMart. All rights reserved. Made with ❤️ in Bhubaneswar, Odisha
              </p>
              
              <div class="unsubscribe">
                <a href="http://localhost:5173/unsubscribe?email=${encodeURIComponent(email)}">Unsubscribe</a> • 
                <a href="#">Preferences</a>
              </div>
              
              <p style="margin-top: 15px; font-size: 11px; opacity: 0.6;">
                For student verification, send college ID to occamart@gmail.com
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Newsletter confirmation email sent to:', email, 'Message ID:', info.messageId);
    
    // Log for admin dashboard
    console.log(`📧 Admin Alert: Newsletter sent to ${email} at ${new Date().toLocaleString()}`);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send newsletter confirmation email:', error);
    throw error;
  }
};

// Send newsletter update (for broadcasting to all subscribers)
export const sendNewsletterUpdate = async (email, subject, content) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"OccaMart Bhubaneswar" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject || 'OccaMart Bhubaneswar - Newsletter Update',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>OccaMart Bhubaneswar Update</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: #EDE8D0;
              margin: 0;
              padding: 30px 20px;
            }
            
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: #FFFFFF;
              border-radius: 32px;
              overflow: hidden;
              box-shadow: 0 30px 60px -15px rgba(0,0,0,0.2);
              border: 1px solid #D4AF37;
            }
            
            .header {
              background: linear-gradient(135deg, #D4AF37 0%, #B8962E 100%);
              padding: 40px 30px;
              text-align: center;
            }
            
            .header h1 {
              color: #1F2937;
              margin: 0;
              font-size: 32px;
            }
            
            .header p {
              color: #1F2937;
              margin-top: 10px;
              font-size: 16px;
            }
            
            .content {
              padding: 40px;
            }
            
            .footer {
              background: #1F2937;
              padding: 30px;
              text-align: center;
              color: #FFFFFF;
            }
            
            .footer a {
              color: #D4AF37;
              text-decoration: none;
            }
            
            .bbsr-badge {
              display: inline-block;
              background: #1F2937;
              color: #D4AF37;
              padding: 5px 15px;
              border-radius: 50px;
              font-size: 12px;
              margin-top: 10px;
            }
            
            .contact-info {
              margin: 20px 0;
              font-size: 14px;
            }
            
            .unsubscribe {
              margin-top: 20px;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📬 OccaMart Bhubaneswar</h1>
              <p>Odisha's Favorite Online Store</p>
              <div class="bbsr-badge">📍 Unit-3, Bhubaneswar - 751001</div>
            </div>
            
            <div class="content">
              ${content}
              
              <div style="margin: 30px 0; padding: 20px; background: #EDE8D0; border-radius: 15px;">
                <p style="margin: 0; color: #1F2937; font-weight: 600;">📞 Need help? Call us: <span style="color: #D4AF37;">+91 78478 74670</span></p>
                <p style="margin: 10px 0 0; color: #1F2937;">📧 Email: occamart@gmail.com</p>
              </div>
              
              <div style="background: #1F2937; color: #FFFFFF; padding: 20px; border-radius: 15px; text-align: center;">
                <p style="margin: 0; font-size: 18px; font-weight: 600;">🎓 Student Discount: 15% off with college ID</p>
                <p style="margin: 10px 0 0; color: #D4AF37;">Valid for GITA • KIIT • SOA • BJB • All Colleges</p>
              </div>
            </div>
            
            <div class="footer">
              <p>© 2026 OccaMart. All rights reserved.</p>
              <div class="contact-info">
                <p>📍 Bhubaneswar | Cuttack | Kendrapara | Jajpur | Bhadrak</p>
              </div>
              <div class="unsubscribe">
                <a href="http://localhost:5173/unsubscribe?email=${encodeURIComponent(email)}">Unsubscribe</a> • 
                <a href="#">Bhubaneswar Store</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Newsletter update sent to:', email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send newsletter update:', error);
    throw error;
  }
};

// Test email function to verify configuration
export const testEmailConfig = async () => {
  try {
    console.log('🔍 Testing email configuration...');
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ Present' : '❌ Missing');
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Present' : '❌ Missing');
    
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email transporter verified successfully');
    
    return { success: true };
  } catch (error) {
    console.error('❌ Email configuration test failed:', error);
    return { success: false, error: error.message };
  }
};