import React, { useState, useEffect } from 'react';
import { Send, Mail, Sparkles, Bell, Gift, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  // API base URL
  const API_URL = 'http://localhost:5000/api';

  // Professional Color Scheme (matching footer)
  const colors = {
    bgPrimary: '#FAF7F2',        // Slide beige background
    bgSecondary: '#F5F0E8',       // Slightly darker beige
    primary: '#D4AF37',          // Primary Gold
    primaryDark: '#B8962E',      // Button Hover Gold
    primaryLight: '#E5C97A',      // Light Gold
    textPrimary: '#1F2937',      // Dark Gray text
    textSecondary: '#4B5563',     // Medium Gray
    textLight: '#6B7280',         // Light Gray
    border: '#E5E7EB',           // Light gray border
    white: '#FFFFFF',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Add CSS animations on mount
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-5px); }
        100% { transform: translateY(0px); }
      }
      
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      
      @keyframes slideInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .newsletter-container {
        animation: slideInUp 0.8s ease-out;
      }
      
      .floating-icon {
        animation: float 3s ease-in-out infinite;
      }
      
      .floating-icon:nth-child(2) {
        animation-delay: 0.2s;
      }
      
      .floating-icon:nth-child(3) {
        animation-delay: 0.4s;
      }
      
      .newsletter-input {
        transition: all 0.3s ease;
      }
      
      .newsletter-input:focus {
        border-color: ${colors.primary} !important;
        box-shadow: 0 0 0 4px ${colors.primary}20 !important;
        outline: none;
      }
      
      .newsletter-button {
        position: relative;
        overflow: hidden;
        transition: all 0.3s ease;
      }
      
      .newsletter-button::after {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(
          135deg,
          transparent,
          rgba(255, 255, 255, 0.3),
          transparent
        );
        transform: rotate(45deg);
        animation: shimmer 3s infinite;
        opacity: 0;
      }
      
      .newsletter-button:hover::after {
        opacity: 1;
      }
      
      .newsletter-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px ${colors.primary}40;
      }
      
      .benefit-item {
        transition: all 0.3s ease;
      }
      
      .benefit-item:hover {
        transform: translateX(5px);
        color: ${colors.primary};
      }
      
      /* Mobile Styles */
      @media (max-width: 768px) {
        .newsletter-title {
          font-size: 1.8rem !important;
        }
        
        .newsletter-description {
          font-size: 1rem !important;
          padding: 0 20px !important;
        }
        
        .newsletter-form {
          flex-direction: column !important;
          padding: 15px !important;
          border-radius: 24px !important;
        }
        
        .newsletter-input {
          width: 100% !important;
          text-align: center !important;
          border-radius: 12px !important;
          padding: 14px !important;
        }
        
        .newsletter-button {
          width: 100% !important;
          justify-content: center !important;
          border-radius: 12px !important;
        }
        
        .benefits-grid {
          grid-template-columns: 1fr !important;
          gap: 12px !important;
          padding: 0 20px !important;
        }
        
        .floating-icons {
          display: none !important;
        }
      }
      
      /* Tablet Styles */
      @media (min-width: 769px) and (max-width: 1024px) {
        .newsletter-title {
          font-size: 2.2rem !important;
        }
        
        .benefits-grid {
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 20px !important;
        }
        
        .newsletter-form {
          max-width: 600px !important;
        }
        
        .floating-icons {
          opacity: 0.5 !important;
        }
      }
      
      /* Desktop Styles */
      @media (min-width: 1025px) and (max-width: 1400px) {
        .benefits-grid {
          grid-template-columns: repeat(3, 1fr) !important;
        }
      }
      
      /* Large Screen Styles */
      @media (min-width: 1401px) {
        .newsletter-container {
          max-width: 1400px !important;
          margin: 0 auto !important;
        }
        
        .newsletter-title {
          font-size: 3rem !important;
        }
        
        .newsletter-description {
          font-size: 1.2rem !important;
        }
        
        .benefits-grid {
          gap: 40px !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // 🔥 FIXED: Actual API call to backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Please enter your email address');
      setStatus('error');
      return;
    }

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      setMessage('Please enter a valid email address');
      setStatus('error');
      return;
    }
    
    setStatus('loading');
    setMessage('');
    
    try {
      console.log('📧 Subscribing email:', email);
      
      const response = await axios.post(`${API_URL}/newsletter/subscribe`, { email });
      
      console.log('✅ Subscription response:', response.data);
      
      setStatus('success');
      setMessage(response.data.message || 'Successfully subscribed to newsletter!');
      setEmail('');
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
      
    } catch (error) {
      console.error('❌ Subscription error:', error);
      
      const errorMessage = error.response?.data?.message || 'Failed to subscribe. Please try again.';
      setMessage(errorMessage);
      setStatus('error');
      
      // Auto-hide error message after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    }
  };

  const styles = {
    section: {
      padding: windowWidth <= 768 ? '60px 20px' : '100px 20px',
      background: `linear-gradient(135deg, ${colors.bgPrimary} 0%, ${colors.bgSecondary} 100%)`,
      position: 'relative',
      overflow: 'hidden',
      borderTop: `1px solid ${colors.border}`,
      borderBottom: `1px solid ${colors.border}`,
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `radial-gradient(circle at 70% 30%, ${colors.primary}10 0%, transparent 60%)`,
      pointerEvents: 'none',
    },
    floatingIcons: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
    },
    floatingIcon: {
      position: 'absolute',
      color: colors.primary,
      opacity: 0.1,
    },
    container: {
      maxWidth: windowWidth > 1400 ? '1200px' : '1000px',
      margin: '0 auto',
      textAlign: 'center',
      position: 'relative',
      zIndex: 2,
    },
    iconWrapper: {
      marginBottom: '30px',
      position: 'relative',
      display: 'inline-block',
    },
    mainIcon: {
      width: windowWidth <= 768 ? '60px' : '80px',
      height: windowWidth <= 768 ? '60px' : '80px',
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
      borderRadius: '30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto',
      color: colors.white,
      boxShadow: `0 10px 30px ${colors.primary}40`,
      animation: 'pulse 2s infinite',
    },
    badge: {
      position: 'absolute',
      top: '-10px',
      right: '-20px',
      background: colors.textPrimary,
      color: colors.white,
      padding: '5px 15px',
      borderRadius: '50px',
      fontSize: '0.8rem',
      fontWeight: '600',
      animation: 'float 3s ease-in-out infinite',
    },
    title: {
      fontSize: windowWidth <= 768 ? '1.8rem' : windowWidth <= 1024 ? '2.2rem' : '2.5rem',
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: '15px',
      lineHeight: '1.2',
    },
    highlight: {
      color: colors.primary,
      position: 'relative',
      display: 'inline-block',
    },
    description: {
      color: colors.textSecondary,
      fontSize: windowWidth <= 768 ? '1rem' : '1.1rem',
      marginBottom: '40px',
      maxWidth: '600px',
      margin: '0 auto 40px',
      lineHeight: '1.6',
    },
    formWrapper: {
      background: colors.white,
      padding: windowWidth <= 768 ? '20px' : '30px',
      borderRadius: windowWidth <= 768 ? '24px' : '50px',
      boxShadow: `0 20px 40px ${colors.primary}15`,
      maxWidth: '700px',
      margin: '0 auto',
      border: `1px solid ${colors.border}`,
    },
    form: {
      display: 'flex',
      gap: '10px',
      flexDirection: windowWidth <= 768 ? 'column' : 'row',
    },
    inputGroup: {
      flex: 1,
      position: 'relative',
    },
    inputIcon: {
      position: 'absolute',
      left: '15px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: colors.textLight,
      pointerEvents: 'none',
    },
    input: {
      width: '100%',
      padding: windowWidth <= 768 ? '14px 20px 14px 45px' : '16px 20px 16px 45px',
      border: `2px solid ${colors.border}`,
      borderRadius: windowWidth <= 768 ? '12px' : '30px',
      fontSize: '1rem',
      outline: 'none',
      background: colors.bgPrimary,
      color: colors.textPrimary,
      transition: 'all 0.3s ease',
    },
    button: {
      padding: windowWidth <= 768 ? '14px 30px' : '16px 35px',
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
      color: colors.white,
      border: 'none',
      borderRadius: windowWidth <= 768 ? '12px' : '30px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      transition: 'all 0.3s ease',
      whiteSpace: 'nowrap',
      boxShadow: `0 5px 15px ${colors.primary}40`,
      opacity: status === 'loading' ? 0.8 : 1,
    },
    messageBox: {
      marginTop: '20px',
      padding: '15px 20px',
      borderRadius: '12px',
      fontSize: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      animation: 'slideInUp 0.5s ease-out',
    },
    successMessage: {
      background: colors.success,
      color: colors.white,
    },
    errorMessage: {
      background: colors.error,
      color: colors.white,
    },
    benefitsGrid: {
      display: 'grid',
      gridTemplateColumns: windowWidth <= 768 
        ? '1fr' 
        : windowWidth <= 1024 
          ? 'repeat(2, 1fr)' 
          : 'repeat(3, 1fr)',
      gap: windowWidth <= 768 ? '15px' : '30px',
      marginTop: '50px',
      maxWidth: '900px',
      margin: '50px auto 0',
    },
    benefitCard: {
      background: colors.white,
      padding: windowWidth <= 768 ? '15px' : '20px',
      borderRadius: '20px',
      border: `1px solid ${colors.border}`,
      boxShadow: `0 5px 15px ${colors.primary}10`,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      transition: 'all 0.3s ease',
    },
    benefitIcon: {
      width: '40px',
      height: '40px',
      background: `${colors.primary}15`,
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: colors.primary,
    },
    benefitContent: {
      flex: 1,
      textAlign: 'left',
    },
    benefitTitle: {
      fontSize: '1rem',
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: '4px',
    },
    benefitDesc: {
      fontSize: '0.85rem',
      color: colors.textLight,
    },
    trustBadge: {
      marginTop: '30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
      flexWrap: 'wrap',
    },
    trustItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: colors.textLight,
      fontSize: '0.9rem',
    },
  };

  // Floating icons positions
  const floatingIcons = [
    { top: '10%', left: '5%', delay: '0s' },
    { top: '20%', right: '5%', delay: '0.2s' },
    { bottom: '10%', left: '10%', delay: '0.4s' },
    { bottom: '20%', right: '10%', delay: '0.6s' },
    { top: '50%', left: '15%', delay: '0.8s' },
    { top: '60%', right: '15%', delay: '1s' },
  ];

  return (
    <section style={styles.section}>
      {/* Background overlay */}
      <div style={styles.overlay}></div>
      
      {/* Floating icons (hidden on mobile) */}
      {windowWidth > 768 && (
        <div style={styles.floatingIcons} className="floating-icons">
          {floatingIcons.map((pos, index) => (
            <div
              key={index}
              style={{
                ...styles.floatingIcon,
                ...pos,
                animation: `float ${3 + index}s ease-in-out infinite`,
                animationDelay: pos.delay,
              }}
            >
              <Mail size={index % 2 === 0 ? 40 : 60} />
            </div>
          ))}
        </div>
      )}

      <div style={styles.container} className="newsletter-container">
        {/* Icon with badge */}
        <div style={styles.iconWrapper}>
          <div style={styles.mainIcon} className="floating-icon">
            <Mail size={windowWidth <= 768 ? 30 : 40} />
          </div>
          <div style={styles.badge} className="floating-icon">
            NEW
          </div>
        </div>

        {/* Title */}
        <h2 style={styles.title} className="newsletter-title">
          Subscribe to Our{' '}
          <span style={styles.highlight}>Newsletter</span>
        </h2>

        {/* Description */}
        <p style={styles.description} className="newsletter-description">
          Join 50,000+ subscribers and get exclusive access to new products, 
          special discounts, and insider-only updates.
        </p>

        {/* Form */}
        <div style={styles.formWrapper}>
          <form onSubmit={handleSubmit} style={styles.form} className="newsletter-form">
            <div style={styles.inputGroup}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                className="newsletter-input"
                required
                disabled={status === 'loading'}
              />
            </div>
            <button
              type="submit"
              style={styles.button}
              className="newsletter-button"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? (
                <div style={{ 
                  width: '20px', 
                  height: '20px', 
                  border: '2px solid white', 
                  borderTop: '2px solid transparent', 
                  borderRadius: '50%', 
                  animation: 'spin 1s linear infinite' 
                }} />
              ) : (
                <>
                  Subscribe <Send size={18} />
                </>
              )}
            </button>
          </form>

          {/* Message Display */}
          {message && (
            <div style={{
              ...styles.messageBox,
              ...(status === 'success' ? styles.successMessage : styles.errorMessage)
            }}>
              {status === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span>{message}</span>
            </div>
          )}
        </div>

        {/* Benefits Grid */}
        <div style={styles.benefitsGrid} className="benefits-grid">
          {[
            { icon: Bell, title: 'Weekly Updates', desc: 'Get the latest news every week' },
            { icon: Gift, title: 'Exclusive Offers', desc: 'Member-only discounts and deals' },
            { icon: Zap, title: 'Early Access', desc: 'Be first to new product launches' },
          ].map((benefit, index) => (
            <div key={index} style={styles.benefitCard} className="benefit-item">
              <div style={styles.benefitIcon}>
                <benefit.icon size={20} />
              </div>
              <div style={styles.benefitContent}>
                <div style={styles.benefitTitle}>{benefit.title}</div>
                <div style={styles.benefitDesc}>{benefit.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div style={styles.trustBadge}>
          <div style={styles.trustItem}>
            <CheckCircle size={16} color={colors.primary} />
            <span>No spam, ever</span>
          </div>
          <div style={styles.trustItem}>
            <CheckCircle size={16} color={colors.primary} />
            <span>Unsubscribe anytime</span>
          </div>
          <div style={styles.trustItem}>
            <CheckCircle size={16} color={colors.primary} />
            <span>50k+ subscribers</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;