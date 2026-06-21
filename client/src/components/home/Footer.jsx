import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  ShoppingBag, 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube,
  Github,
  Shield,
  Truck,
  RefreshCw,
  ChevronRight,
  Award,
  Clock,
  CreditCard,
  Home,
  Package,
  User,
  FileText,
  HelpCircle,
  Info,
  Mail as MailIcon
} from 'lucide-react';

const Footer = () => {
  const navigate = useNavigate();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  // Professional Color Scheme
  const colors = {
    bgPrimary: '#FAF7F2',        // Slide beige background
    bgSecondary: '#F5F0E8',       // Slightly darker beige for cards
    bgDark: '#2C2C2C',           // Dark background for contrast
    primary: '#D4AF37',          // Primary Gold
    primaryDark: '#B8962E',      // Button Hover Gold
    textPrimary: '#1F2937',      // Dark Gray text
    textSecondary: '#4B5563',    // Medium Gray for secondary text
    textLight: '#6B7280',        // Light Gray text
    accent: '#D4AF37',           // Gold accent
    border: '#E5E7EB',           // Light gray border
    white: '#FFFFFF',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Navigation handlers
  const handleNavigation = (path) => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  // Add CSS animations on mount
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes slideInFromLeft {
        from {
          opacity: 0;
          transform: translateX(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes slideInFromRight {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      
      .footer-link {
        position: relative;
        transition: all 0.3s ease;
        color: ${colors.textSecondary};
        text-decoration: none;
        font-size: 0.95rem;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
      }
      
      .footer-link::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        width: 0;
        height: 2px;
        background: ${colors.primary};
        transition: width 0.3s ease;
      }
      
      .footer-link:hover {
        color: ${colors.primary};
        transform: translateX(5px);
      }
      
      .footer-link:hover::after {
        width: 100%;
      }
      
      .social-icon {
        transition: all 0.3s ease;
        cursor: pointer;
      }
      
      .social-icon:hover {
        transform: translateY(-5px);
        color: ${colors.primary};
      }
      
      .feature-card {
        transition: all 0.3s ease;
        animation: fadeInUp 0.6s ease-out;
      }
      
      .feature-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 30px rgba(212, 175, 55, 0.1);
      }
      
      .payment-icon {
        transition: all 0.3s ease;
      }
      
      .payment-icon:hover {
        transform: scale(1.1);
        color: ${colors.primary};
      }
      
      /* Mobile Styles */
      @media (max-width: 768px) {
        .footer-grid {
          grid-template-columns: 1fr !important;
          gap: 1.5rem !important;
        }
        
        .footer-section {
          text-align: center;
        }
        
        .footer-links-container {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        
        .footer-contact-item {
          justify-content: center;
        }
        
        .footer-social-links {
          justify-content: center;
        }
        
        .footer-features {
          grid-template-columns: repeat(2, 1fr) !important;
        }
        
        .footer-bottom {
          flex-direction: column;
          gap: 1rem;
          text-align: center;
        }
        
        .footer-payment-methods {
          justify-content: center;
        }
      }
      
      /* Tablet Styles */
      @media (min-width: 769px) and (max-width: 1024px) {
        .footer-grid {
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 2rem !important;
        }
        
        .footer-links-container {
          grid-template-columns: repeat(2, 1fr);
        }
        
        .footer-features {
          grid-template-columns: repeat(4, 1fr) !important;
        }
      }
      
      /* Desktop Styles */
      @media (min-width: 1025px) and (max-width: 1400px) {
        .footer-grid {
          grid-template-columns: repeat(4, 1fr) !important;
          gap: 2rem !important;
        }
      }
      
      /* Large Screen Styles */
      @media (min-width: 1401px) {
        .footer-container {
          max-width: 1400px !important;
        }
        
        .footer-grid {
          grid-template-columns: repeat(4, 1fr) !important;
          gap: 3rem !important;
        }
        
        .footer-link {
          font-size: 1rem !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const styles = {
    footer: {
      background: colors.bgPrimary,
      color: colors.textPrimary,
      padding: windowWidth <= 768 ? '40px 0 20px' : '60px 0 30px',
      position: 'relative',
      overflow: 'hidden',
      borderTop: `1px solid ${colors.border}`,
      width: '100%',
    },
    gradientOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `radial-gradient(circle at 70% 50%, ${colors.primary}10 0%, transparent 60%)`,
      pointerEvents: 'none',
    },
    container: {
      maxWidth: windowWidth > 1400 ? '1400px' : '1200px',
      margin: '0 auto',
      padding: windowWidth <= 480 ? '0 20px' : '0 30px',
      position: 'relative',
      zIndex: 2,
    },
    // Features Bar
    featuresBar: {
      display: 'grid',
      gridTemplateColumns: windowWidth <= 768 
        ? 'repeat(2, 1fr)' 
        : windowWidth <= 1024 
          ? 'repeat(4, 1fr)' 
          : 'repeat(4, 1fr)',
      gap: windowWidth <= 480 ? '10px' : '20px',
      marginBottom: windowWidth <= 768 ? '30px' : '50px',
      padding: windowWidth <= 768 ? '15px' : '20px',
      background: colors.bgSecondary,
      borderRadius: '16px',
      border: `1px solid ${colors.border}`,
    },
    featureCard: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: windowWidth <= 768 ? 'center' : 'flex-start',
      gap: windowWidth <= 480 ? '8px' : '12px',
      padding: windowWidth <= 480 ? '10px' : '15px',
      borderRadius: '12px',
      background: colors.white,
      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      cursor: 'pointer',
    },
    featureIcon: {
      width: windowWidth <= 480 ? '32px' : '40px',
      height: windowWidth <= 480 ? '32px' : '40px',
      background: `${colors.primary}15`,
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: colors.primary,
    },
    featureText: {
      display: windowWidth <= 768 && windowWidth > 480 ? 'none' : 'block',
    },
    featureTitle: {
      fontSize: windowWidth <= 480 ? '0.8rem' : '0.9rem',
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: '2px',
    },
    featureDesc: {
      fontSize: windowWidth <= 480 ? '0.7rem' : '0.75rem',
      color: colors.textLight,
    },
    // Main Footer Grid
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: windowWidth <= 1024 ? '2rem' : '3rem',
      marginBottom: windowWidth <= 768 ? '30px' : '40px',
    },
    section: {
      animation: 'fadeInUp 0.6s ease-out',
    },
    brandTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '20px',
      justifyContent: windowWidth <= 768 ? 'center' : 'flex-start',
      cursor: 'pointer',
    },
    brandIcon: {
      width: windowWidth <= 480 ? '35px' : '40px',
      height: windowWidth <= 480 ? '35px' : '40px',
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
      borderRadius: '12px',
      padding: windowWidth <= 480 ? '6px' : '8px',
      color: colors.white,
    },
    brandName: {
      fontSize: windowWidth <= 480 ? '1.5rem' : '1.8rem',
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: '-0.5px',
    },
    brandDescription: {
      color: colors.textLight,
      lineHeight: '1.6',
      marginBottom: '20px',
      fontSize: windowWidth <= 480 ? '0.85rem' : '0.95rem',
      textAlign: windowWidth <= 768 ? 'center' : 'left',
    },
    sectionTitle: {
      fontSize: windowWidth <= 480 ? '1rem' : '1.1rem',
      fontWeight: '600',
      marginBottom: '20px',
      color: colors.textPrimary,
      position: 'relative',
      display: 'inline-block',
      textAlign: windowWidth <= 768 ? 'center' : 'left',
      width: windowWidth <= 768 ? '100%' : 'auto',
    },
    titleUnderline: {
      position: 'absolute',
      bottom: '-8px',
      left: windowWidth <= 768 ? '50%' : '0',
      transform: windowWidth <= 768 ? 'translateX(-50%)' : 'none',
      width: '40px',
      height: '3px',
      background: colors.primary,
      borderRadius: '2px',
    },
    linksContainer: {
      display: 'grid',
      gridTemplateColumns: windowWidth <= 480 ? '1fr' : 'repeat(2, 1fr)',
      gap: '12px',
    },
    linkList: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
    },
    linkItem: {
      marginBottom: '12px',
      textAlign: windowWidth <= 768 ? 'center' : 'left',
    },
    contactInfo: {
      marginBottom: '20px',
    },
    contactItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '15px',
      color: colors.textLight,
      fontSize: windowWidth <= 480 ? '0.85rem' : '0.95rem',
      justifyContent: windowWidth <= 768 ? 'center' : 'flex-start',
      cursor: 'pointer',
    },
    contactIcon: {
      width: '36px',
      height: '36px',
      background: colors.bgSecondary,
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: colors.primary,
      flexShrink: 0,
    },
    socialLinks: {
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap',
      justifyContent: windowWidth <= 768 ? 'center' : 'flex-start',
    },
    socialIcon: {
      width: windowWidth <= 480 ? '35px' : '40px',
      height: windowWidth <= 480 ? '35px' : '40px',
      background: colors.bgSecondary,
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: colors.textSecondary,
      transition: 'all 0.3s ease',
      cursor: 'pointer',
    },
    // Bottom Bar
    bottomBar: {
      marginTop: windowWidth <= 768 ? '30px' : '40px',
      paddingTop: '20px',
      borderTop: `1px solid ${colors.border}`,
    },
    bottomContent: {
      display: 'flex',
      flexDirection: windowWidth <= 768 ? 'column' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '20px',
    },
    copyright: {
      color: colors.textLight,
      fontSize: windowWidth <= 480 ? '0.75rem' : '0.85rem',
      textAlign: windowWidth <= 768 ? 'center' : 'left',
    },
    paymentMethods: {
      display: 'flex',
      gap: '15px',
      alignItems: 'center',
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    paymentIcon: {
      fontSize: '0.8rem',
      color: colors.textLight,
      transition: 'color 0.3s ease',
      cursor: 'default',
    },
    bottomLinks: {
      display: 'flex',
      gap: '20px',
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    bottomLink: {
      color: colors.textLight,
      textDecoration: 'none',
      fontSize: windowWidth <= 480 ? '0.75rem' : '0.85rem',
      transition: 'color 0.3s ease',
      cursor: 'pointer',
    },
    trustBadge: {
      marginTop: '20px',
      padding: '12px',
      background: colors.bgSecondary,
      borderRadius: '10px',
      textAlign: 'center',
      fontSize: windowWidth <= 480 ? '0.7rem' : '0.8rem',
      color: colors.textLight,
      border: `1px solid ${colors.border}`,
    },
  };

  // Quick Links data with correct paths
  const quickLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Shop', path: '/shop', icon: ShoppingBag },
    { name: 'Cart', path: '/cart', icon: ShoppingBag },
    { name: 'Wishlist', path: '/wishlist', icon: Heart },
    { name: 'Orders', path: '/orders', icon: Package },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'About Us', path: '/about', icon: Info },
    { name: 'Contact', path: '/contact', icon: MailIcon },
    { name: 'FAQ', path: '/faq', icon: HelpCircle },
    { name: 'Blog', path: '/blog', icon: FileText }
  ];

  // Categories data with correct paths
  const categories = [
    { name: 'Electronics', path: '/shop/electronics' },
    { name: 'Fashion', path: '/shop/fashion' },
    { name: 'Home & Living', path: '/shop/home-living' },
    { name: 'Beauty', path: '/shop/beauty' },
    { name: 'Sports', path: '/shop/sports' },
    { name: 'Books', path: '/shop/books' },
    { name: 'Toys', path: '/shop/toys' },
    { name: 'Gifts', path: '/shop/gifts' }
  ];

  return (
    <footer style={styles.footer}>
      {/* Background overlay */}
      <div style={styles.gradientOverlay}></div>
      
      <div style={styles.container} className="footer-container">
        {/* Features Bar */}
        <div style={styles.featuresBar} className="footer-features">
          {[
            { icon: Truck, title: 'Free Shipping', desc: 'On orders ₹5000+', path: '/shipping' },
            { icon: RefreshCw, title: 'Easy Returns', desc: '30-day return policy', path: '/returns' },
            { icon: Shield, title: 'Secure Payment', desc: '256-bit SSL', path: '/security' },
            { icon: Clock, title: '24/7 Support', desc: 'Dedicated help', path: '/contact' },
          ].map((feature, index) => (
            <div 
              key={index} 
              style={styles.featureCard} 
              className="feature-card"
              onClick={() => handleNavigation(feature.path)}
            >
              <div style={styles.featureIcon}>
                <feature.icon size={windowWidth <= 480 ? 16 : 20} />
              </div>
              <div style={styles.featureText}>
                <div style={styles.featureTitle}>{feature.title}</div>
                <div style={styles.featureDesc}>{feature.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Footer Grid */}
        <div style={styles.grid} className="footer-grid">
          {/* Brand Column */}
          <div style={styles.section} className="footer-section">
            <div style={styles.brandTitle} onClick={() => handleNavigation('/')}>
              <div style={styles.brandIcon}>
                <ShoppingBag size={windowWidth <= 480 ? 20 : 24} />
              </div>
              <span style={styles.brandName}>OccaMart</span>
            </div>
            
            <p style={styles.brandDescription}>
              Odisha's premier destination for quality products and exceptional shopping experience. 
              Serving Bhubaneswar and across India since 2024.
            </p>
            
            <div style={styles.socialLinks} className="footer-social-links">
              {[
                { icon: Facebook, color: '#1877f2', url: 'https://facebook.com/occamart' },
                { icon: Twitter, color: '#1da1f2', url: 'https://twitter.com/occamart' },
                { icon: Instagram, color: '#e4405f', url: 'https://instagram.com/occamart' },
                { icon: Youtube, color: '#ff0000', url: 'https://youtube.com/occamart' },
                { icon: Github, color: '#333', url: 'https://github.com/occamart' },
              ].map((social, index) => (
                <div
                  key={index}
                  style={styles.socialIcon}
                  className="social-icon"
                  onClick={() => window.open(social.url, '_blank')}
                >
                  <social.icon size={windowWidth <= 480 ? 16 : 18} />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links Column */}
          <div style={styles.section} className="footer-section">
            <h5 style={styles.sectionTitle}>
              Quick Links
              <span style={styles.titleUnderline}></span>
            </h5>
            
            <div className="footer-links-container">
              <ul style={styles.linkList}>
                {quickLinks.slice(0, 5).map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <li key={index} style={styles.linkItem}>
                      <div onClick={() => handleNavigation(item.path)} className="footer-link">
                        <ChevronRight size={14} color={colors.primary} />
                        <Icon size={14} style={{ marginRight: '2px' }} />
                        {item.name}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <ul style={styles.linkList}>
                {quickLinks.slice(5, 10).map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <li key={index} style={styles.linkItem}>
                      <div onClick={() => handleNavigation(item.path)} className="footer-link">
                        <ChevronRight size={14} color={colors.primary} />
                        <Icon size={14} style={{ marginRight: '2px' }} />
                        {item.name}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Categories Column */}
          <div style={styles.section} className="footer-section">
            <h5 style={styles.sectionTitle}>
              Categories
              <span style={styles.titleUnderline}></span>
            </h5>
            
            <div className="footer-links-container">
              <ul style={styles.linkList}>
                {categories.slice(0, 4).map((item, index) => (
                  <li key={index} style={styles.linkItem}>
                    <div onClick={() => handleNavigation(item.path)} className="footer-link">
                      <ChevronRight size={14} color={colors.primary} />
                      {item.name}
                    </div>
                  </li>
                ))}
              </ul>
              <ul style={styles.linkList}>
                {categories.slice(4, 8).map((item, index) => (
                  <li key={index} style={styles.linkItem}>
                    <div onClick={() => handleNavigation(item.path)} className="footer-link">
                      <ChevronRight size={14} color={colors.primary} />
                      {item.name}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact Column - UPDATED with Bhubaneswar location */}
          <div style={styles.section} className="footer-section">
            <h5 style={styles.sectionTitle}>
              Contact Us
              <span style={styles.titleUnderline}></span>
            </h5>
            
            <div style={styles.contactInfo}>
              <div 
                style={styles.contactItem} 
                className="footer-contact-item"
                onClick={() => window.open('https://maps.google.com/?q=Bhubaneswar,Odisha', '_blank')}
              >
                <div style={styles.contactIcon}>
                  <MapPin size={18} />
                </div>
                <span>Bhubaneswar, Odisha, India - 751001</span>
              </div>
              
              <div 
                style={styles.contactItem} 
                className="footer-contact-item"
                onClick={() => window.location.href = 'mailto:support@occamart.com'}
              >
                <div style={styles.contactIcon}>
                  <Mail size={18} />
                </div>
                <span>support@occamart.com</span>
              </div>
              
              <div 
                style={styles.contactItem} 
                className="footer-contact-item"
                onClick={() => window.location.href = 'tel:+917847874670'}
              >
                <div style={styles.contactIcon}>
                  <Phone size={18} />
                </div>
                <span>+91 78478 74670</span>
              </div>
            </div>

            <div style={{ marginTop: '15px' }}>
              <div style={{ ...styles.contactItem, marginBottom: '10px' }} className="footer-contact-item">
                <div style={styles.contactIcon}>
                  <Award size={18} />
                </div>
                <span>ISO Certified 9001:2024</span>
              </div>
              <div style={styles.contactItem} className="footer-contact-item">
                <div style={styles.contactIcon}>
                  <Clock size={18} />
                </div>
                <span>Open: Mon-Sat 10AM - 8PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={styles.bottomBar} className="footer-bottom">
          <div style={styles.bottomContent}>
            <div style={styles.copyright}>
              © {currentYear} OccaMart. All rights reserved. Made with ❤️ in Bhubaneswar, Odisha
            </div>

            <div style={styles.paymentMethods} className="footer-payment-methods">
              <CreditCard size={18} color={colors.textLight} />
              <span style={styles.paymentIcon} className="payment-icon">VISA</span>
              <span style={styles.paymentIcon} className="payment-icon">Mastercard</span>
              <span style={styles.paymentIcon} className="payment-icon">PayPal</span>
              <span style={styles.paymentIcon} className="payment-icon">UPI</span>
              <span style={styles.paymentIcon} className="payment-icon">RuPay</span>
            </div>

            <div style={styles.bottomLinks} className="footer-links">
              <div onClick={() => handleNavigation('/privacy')} style={styles.bottomLink} className="footer-link">
                Privacy
              </div>
              <div onClick={() => handleNavigation('/terms')} style={styles.bottomLink} className="footer-link">
                Terms
              </div>
              <div onClick={() => handleNavigation('/shipping')} style={styles.bottomLink} className="footer-link">
                Shipping
              </div>
              <div onClick={() => handleNavigation('/returns')} style={styles.bottomLink} className="footer-link">
                Returns
              </div>
              <div onClick={() => handleNavigation('/faq')} style={styles.bottomLink} className="footer-link">
                FAQ
              </div>
            </div>
          </div>

          {/* Trust Badge */}
          <div style={styles.trustBadge} className="footer-trust-badge">
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <span>🔒 256-bit SSL Encryption</span>
              <span>⭐ 4.8/5 (10k+ Reviews)</span>
              <span>🚚 Free Shipping ₹5000+</span>
              <span>💳 Secure Payments</span>
              <span>📍 Bhubaneswar, Odisha</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;