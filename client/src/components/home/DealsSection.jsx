import React, { useState, useEffect } from 'react';
import { Clock, ShoppingBag, Zap, Percent, TrendingUp, Gift, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

// API setup
const API_URL = 'http://localhost:5000';
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const DealsSection = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [timeLeft, setTimeLeft] = useState({});
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // Color scheme
  const colors = {
    primary: '#D4AF37',      // Gold
    primaryDark: '#B8962E',   // Button Hover Gold
    primaryLight: '#E5C97A',  // Light Gold
    bgPrimary: '#EDE8D0',     // Background White/Beige
    bgSecondary: '#F5F0E8',   // Slightly darker beige
    cardBg: '#F9F9F9',        // Card Background
    textPrimary: '#1F2937',   // Text Dark Gray
    textSecondary: '#4B5563', // Medium Gray
    textLight: '#6B7280',     // Light Gray
    border: '#E5E7EB',        // Border Light Gray
    success: '#10B981',        // Green
    warning: '#F59E0B',        // Orange
    error: '#EF4444',          // Red
    white: '#FFFFFF',
    black: '#000000',
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Timer functionality
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const distance = midnight - now;

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({
        hours: hours.toString().padStart(2, '0'),
        minutes: minutes.toString().padStart(2, '0'),
        seconds: seconds.toString().padStart(2, '0')
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch deals from backend
  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true);
        const response = await api.get('/products?deal=true&limit=8');
        
        console.log('📦 Deals API Response:', response.data);

        let dealsData = [];
        if (response.data.products) {
          dealsData = response.data.products;
        } else if (Array.isArray(response.data)) {
          dealsData = response.data;
        } else if (response.data.data) {
          dealsData = response.data.data;
        }

        // 🔥 FIXED: Better deal filtering
        const dealProducts = dealsData.filter(product => 
          product.isDeal === true || 
          product.deal === true ||
          (product.discount && product.discount > 0) ||
          (product.dealPrice && product.dealPrice < product.price)
        );

        console.log(`✅ Found ${dealProducts.length} deal products`);
        setDeals(dealProducts);
      } catch (error) {
        console.error('Error fetching deals:', error);
        // Fallback to static data if API fails
        setDeals(generateFallbackDeals());
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  // Generate fallback deals for development
  const generateFallbackDeals = () => {
    return [
      { 
        _id: '1', 
        name: 'Smart TV 55" 4K UHD', 
        price: 45999, 
        originalPrice: 89999, 
        discount: 49, 
        sold: 156,
        total: 200,
        image: 'https://images.unsplash.com/photo-1593784991095-a205205470b6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        category: 'electronics',
        isDeal: true,
        countInStock: 44
      },
      { 
        _id: '2', 
        name: 'Gaming Laptop RTX 4060', 
        price: 75999, 
        originalPrice: 125999, 
        discount: 40, 
        sold: 89,
        total: 150,
        image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        category: 'electronics',
        isDeal: true,
        countInStock: 61
      },
      { 
        _id: '3', 
        name: 'Wireless Earbuds Pro', 
        price: 2499, 
        originalPrice: 5999, 
        discount: 58, 
        sold: 234,
        total: 300,
        image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        category: 'accessories',
        isDeal: true,
        countInStock: 66
      },
      { 
        _id: '4', 
        name: 'Smart Watch Ultra', 
        price: 3999, 
        originalPrice: 8999, 
        discount: 56, 
        sold: 178,
        total: 250,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        category: 'watches',
        isDeal: true,
        countInStock: 72
      },
    ];
  };

  // Responsive breakpoints
  const isMobile = windowWidth <= 768;
  const isTablet = windowWidth > 768 && windowWidth <= 1024;
  const isDesktop = windowWidth > 1024 && windowWidth <= 1400;
  const isLargeScreen = windowWidth > 1400;

  // 🔥 FIXED: Navigate to product details page
  const handleProductClick = (dealId) => {
    console.log('🔍 Navigating to product:', dealId);
    navigate(`/product/${dealId}`);
  };

  const handleGrabDeal = (deal) => {
    navigate(`/product/${deal._id}`);
  };

  const handleAddToCart = async (deal, e) => {
    e.stopPropagation(); // Prevent card click when clicking Add to Cart button
    
    if (!isAuthenticated) {
      showNotification('Please login to add items to cart', 'warning');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    if (deal.countInStock === 0) {
      showNotification('Product is out of stock', 'error');
      return;
    }

    setAddingToCart(prev => ({ ...prev, [deal._id]: true }));

    try {
      await addToCart(deal._id, 1);
      showNotification(`${deal.name} added to cart!`, 'success');
    } catch (err) {
      console.error('Error adding to cart:', err);
      showNotification('Failed to add to cart', 'error');
    } finally {
      setAddingToCart(prev => ({ ...prev, [deal._id]: false }));
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const handleViewAll = () => {
    navigate('/deals');
  };

  const calculateProgress = (sold, total) => {
    if (!sold || !total) return 0;
    return (sold / total) * 100;
  };

  // 🔥 FIXED: Calculate discount percentage (ENSURES DISCOUNT SHOWS)
  const calculateDiscount = (deal) => {
    // If discount field exists
    if (deal.discount) {
      return deal.discount;
    }
    
    // Calculate from originalPrice and price
    if (deal.originalPrice && deal.price && deal.originalPrice > deal.price) {
      return Math.round(((deal.originalPrice - deal.price) / deal.originalPrice) * 100);
    }
    
    // Deal price calculation
    if (deal.dealPrice && deal.price && deal.price > deal.dealPrice) {
      return Math.round(((deal.price - deal.dealPrice) / deal.price) * 100);
    }
    
    // For fallback data
    if (deal.originalPrice && deal.price) {
      return Math.round(((deal.originalPrice - deal.price) / deal.originalPrice) * 100);
    }
    
    return 0;
  };

  // 🔥 FIXED: Get current price (consider deal price)
  const getCurrentPrice = (deal) => {
    if (deal.dealPrice) {
      return deal.dealPrice;
    }
    return deal.price;
  };

  // 🔥 FIXED: Get original price
  const getOriginalPrice = (deal) => {
    if (deal.originalPrice) {
      return deal.originalPrice;
    }
    if (deal.dealPrice && deal.price && deal.price > deal.dealPrice) {
      return deal.price;
    }
    return null;
  };

  // 🔥 FIXED: Better image handling with multiple fallbacks and proper sizing
  const getImageUrl = (deal) => {
    // If deal has image property
    if (deal.image) {
      return deal.image.startsWith('http') ? deal.image : `${API_URL}${deal.image}`;
    }
    
    // If deal has images array
    if (deal.images && deal.images.length > 0) {
      const img = deal.images[0];
      return img.startsWith('http') ? img : `${API_URL}${img}`;
    }
    
    // Fallback to placeholder with category-based image
    const categoryImages = {
      'electronics': 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      'Electronics': 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      'fashion': 'https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      'Fashion': 'https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      'home': 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      'Home & Living': 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      'beauty': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      'Beauty': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      'sports': 'https://images.unsplash.com/photo-1517649763962-0c623066013b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      'Sports': 'https://images.unsplash.com/photo-1517649763962-0c623066013b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      'books': 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      'Books': 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      'toys': 'https://images.unsplash.com/photo-1566576912324-d58f69a4313f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      'Toys': 'https://images.unsplash.com/photo-1566576912324-d58f69a4313f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    };
    
    return categoryImages[deal.category] || `https://picsum.photos/400/400?random=${deal._id}`;
  };

  const styles = {
    section: {
      padding: isMobile ? '40px 15px' : isTablet ? '50px 20px' : '60px 20px',
      background: colors.bgPrimary,
      position: 'relative',
      overflow: 'hidden',
    },
    backgroundPattern: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `radial-gradient(circle at 30% 50%, ${colors.primary}15 0%, transparent 50%)`,
      pointerEvents: 'none',
    },
    container: {
      maxWidth: isLargeScreen ? '1400px' : '1200px',
      margin: '0 auto',
      position: 'relative',
      zIndex: 2,
    },
    header: {
      textAlign: 'center',
      marginBottom: isMobile ? '30px' : '40px',
    },
    flashIcon: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      marginBottom: '15px',
    },
    title: {
      fontSize: isMobile ? '1.8rem' : isTablet ? '2.2rem' : isDesktop ? '2.5rem' : '3rem',
      fontWeight: '800',
      margin: '0 0 10px',
      color: colors.textPrimary,
    },
    highlight: {
      color: colors.primary,
    },
    description: {
      color: colors.textSecondary,
      fontSize: isMobile ? '0.95rem' : '1.1rem',
      maxWidth: '600px',
      margin: '0 auto',
      padding: isMobile ? '0 10px' : 0,
    },
    timerBanner: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isMobile ? '15px' : '20px',
      marginTop: '20px',
      padding: isMobile ? '12px' : '15px',
      background: colors.white,
      borderRadius: '50px',
      border: `1px solid ${colors.border}`,
      maxWidth: '400px',
      margin: '20px auto 0',
      boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
    },
    timerItem: {
      textAlign: 'center',
    },
    timerValue: {
      fontSize: isMobile ? '1.2rem' : '1.5rem',
      fontWeight: '700',
      color: colors.primary,
    },
    timerLabel: {
      fontSize: isMobile ? '0.7rem' : '0.8rem',
      color: colors.textSecondary,
      textTransform: 'uppercase',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: isMobile 
        ? '1fr' 
        : isTablet 
          ? 'repeat(2, 1fr)' 
          : isDesktop 
            ? 'repeat(3, 1fr)' 
            : 'repeat(4, 1fr)',
      gap: isMobile ? '15px' : '20px',
      marginTop: '30px',
    },
    card: {
      background: colors.cardBg,
      borderRadius: isMobile ? '16px' : '20px',
      padding: isMobile ? '15px' : '20px',
      border: `1px solid ${colors.border}`,
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
      cursor: 'pointer',
    },
    discountBadge: {
      position: 'absolute',
      top: isMobile ? '10px' : '15px',
      right: isMobile ? '10px' : '15px',
      background: colors.primary,
      color: colors.textPrimary,
      padding: isMobile ? '6px 10px' : '8px 12px',
      borderRadius: '30px',
      fontSize: isMobile ? '0.9rem' : '1rem',
      fontWeight: '700',
      zIndex: 2,
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      boxShadow: `0 4px 12px ${colors.primary}60`,
    },
    categoryTag: {
      position: 'absolute',
      top: isMobile ? '10px' : '15px',
      left: isMobile ? '10px' : '15px',
      background: colors.bgSecondary,
      color: colors.textPrimary,
      padding: '4px 8px',
      borderRadius: '6px',
      fontSize: '0.7rem',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      border: `1px solid ${colors.border}`,
      zIndex: 2,
    },
    imageContainer: {
      width: '100%',
      height: isMobile ? '200px' : isTablet ? '220px' : '240px', // 🔥 FIXED: Increased height for better image display
      marginBottom: '15px',
      borderRadius: '12px',
      overflow: 'hidden',
      position: 'relative',
      cursor: 'pointer',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    },
    image: {
      width: '100%',
      height: '100%',
      objectFit: 'cover', // 🔥 FIXED: Proper image sizing
      objectPosition: 'center',
      transition: 'transform 0.5s ease',
    },
    productName: {
      fontSize: isMobile ? '1rem' : '1.1rem',
      fontWeight: '600',
      marginBottom: '8px',
      color: colors.textPrimary,
      lineHeight: '1.4',
      minHeight: '50px',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
    },
    priceContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '12px',
      flexWrap: 'wrap',
    },
    price: {
      fontSize: isMobile ? '1.3rem' : '1.5rem',
      fontWeight: '700',
      color: colors.primary,
    },
    originalPrice: {
      color: colors.textLight,
      fontSize: isMobile ? '0.9rem' : '1rem',
      textDecoration: 'line-through',
    },
    discountText: {
      background: colors.bgSecondary,
      color: colors.primary,
      padding: '3px 8px',
      borderRadius: '6px',
      fontSize: '0.8rem',
      fontWeight: '600',
    },
    timer: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      color: colors.textSecondary,
      fontSize: isMobile ? '0.85rem' : '0.9rem',
      marginBottom: '12px',
      padding: isMobile ? '6px 10px' : '8px 12px',
      background: colors.bgSecondary,
      borderRadius: '8px',
      border: `1px solid ${colors.border}`,
    },
    progressSection: {
      marginBottom: '15px',
    },
    progressInfo: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '5px',
      fontSize: isMobile ? '0.75rem' : '0.8rem',
      color: colors.textSecondary,
    },
    progressBar: {
      width: '100%',
      height: '6px',
      background: colors.border,
      borderRadius: '3px',
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      background: colors.primary,
      borderRadius: '3px',
      transition: 'width 0.3s ease',
    },
    addToCart: {
      width: '100%',
      padding: isMobile ? '10px' : '12px',
      background: 'transparent',
      color: colors.primary,
      border: `2px solid ${colors.primary}`,
      borderRadius: '10px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.3s ease',
      fontSize: isMobile ? '0.9rem' : '1rem',
      position: 'relative',
      zIndex: 3,
    },
    viewAllButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: '40px',
    },
    viewAll: {
      background: 'transparent',
      color: colors.textPrimary,
      border: `2px solid ${colors.primary}`,
      padding: isMobile ? '12px 30px' : '14px 40px',
      borderRadius: '12px',
      fontSize: isMobile ? '0.95rem' : '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      transition: 'all 0.3s ease',
    },
    notification: {
      position: 'fixed',
      top: '100px',
      right: '20px',
      background: colors.white,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      padding: '16px 24px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      animation: 'slideIn 0.3s ease-out',
    },
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px',
      gap: '20px',
    },
    loader: {
      width: '50px',
      height: '50px',
      border: '3px solid #F5F0E8',
      borderTop: `3px solid ${colors.primary}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
  };

  if (loading) {
    return (
      <section style={styles.section}>
        <div style={styles.container}>
          <div style={styles.loadingContainer}>
            <div style={styles.loader}></div>
            <p style={{ color: colors.textSecondary }}>Loading amazing deals...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={styles.section}>
      <div style={styles.backgroundPattern}></div>
      
      {/* Notification */}
      {notification.show && (
        <div style={styles.notification}>
          {notification.type === 'success' && <ShoppingBag size={20} color={colors.success} />}
          {notification.type === 'error' && <Percent size={20} color={colors.error} />}
          {notification.type === 'warning' && <Clock size={20} color={colors.warning} />}
          <span style={{ color: colors.textPrimary }}>{notification.message}</span>
        </div>
      )}

      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.flashIcon}>
            <Zap size={isMobile ? 28 : 32} color={colors.primary} />
            <span style={{ color: colors.primary, fontWeight: '600', fontSize: isMobile ? '1.1rem' : '1.2rem' }}>
              FLASH DEALS
            </span>
          </div>
          <h2 style={styles.title}>
            Limited Time <span style={styles.highlight}>Offers</span>
          </h2>
          <p style={styles.description}>
            Grab these amazing deals before they're gone! Up to 60% OFF
          </p>

          {/* Live Timer */}
          <div style={styles.timerBanner}>
            <div style={styles.timerItem}>
              <div style={styles.timerValue}>{timeLeft.hours || '00'}</div>
              <div style={styles.timerLabel}>Hours</div>
            </div>
            <div style={{ color: colors.primary, fontSize: '1.5rem', fontWeight: '300' }}>:</div>
            <div style={styles.timerItem}>
              <div style={styles.timerValue}>{timeLeft.minutes || '00'}</div>
              <div style={styles.timerLabel}>Mins</div>
            </div>
            <div style={{ color: colors.primary, fontSize: '1.5rem', fontWeight: '300' }}>:</div>
            <div style={styles.timerItem}>
              <div style={styles.timerValue}>{timeLeft.seconds || '00'}</div>
              <div style={styles.timerLabel}>Secs</div>
            </div>
          </div>
        </div>

        <div style={styles.grid}>
          {deals.slice(0, isMobile ? 4 : 8).map((deal) => {
            const progress = calculateProgress(deal.sold || 0, deal.total || 100);
            const discount = calculateDiscount(deal);
            const currentPrice = getCurrentPrice(deal);
            const originalPrice = getOriginalPrice(deal);
            
            return (
              <div
                key={deal._id}
                style={styles.card}
                onClick={() => handleProductClick(deal._id)} // 🔥 FIXED: Click on card goes to product page
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = `0 20px 30px ${colors.primary}30`;
                  e.currentTarget.style.borderColor = colors.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = colors.border;
                }}
              >
                <span style={styles.categoryTag}>{deal.category}</span>
                {discount > 0 && ( // 🔥 FIXED: Only show discount badge if discount > 0
                  <span style={styles.discountBadge}>
                    <Percent size={14} /> {discount}% OFF
                  </span>
                )}
                
                <div 
                  style={styles.imageContainer}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent double navigation
                    handleProductClick(deal._id);
                  }}
                >
                  <img 
                    src={getImageUrl(deal)}
                    alt={deal.name}
                    style={styles.image}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://picsum.photos/400/400?random=${deal._id}`;
                    }}
                  />
                </div>

                <h3 style={styles.productName}>{deal.name}</h3>
                
                <div style={styles.priceContainer}>
                  <span style={styles.price}>₹{currentPrice?.toLocaleString()}</span>
                  {originalPrice && originalPrice > currentPrice && (
                    <span style={styles.originalPrice}>₹{originalPrice.toLocaleString()}</span>
                  )}
                  {discount > 0 && (
                    <span style={styles.discountText}>
                      -{discount}%
                    </span>
                  )}
                </div>

                <div style={styles.timer}>
                  <Clock size={isMobile ? 14 : 16} color={colors.primary} />
                  <span>Ends in: {timeLeft.hours || '00'}:{timeLeft.minutes || '00'}:{timeLeft.seconds || '00'}</span>
                </div>

                <div style={styles.progressSection}>
                  <div style={styles.progressInfo}>
                    <span>🔥 {deal.sold || Math.floor(Math.random() * 200)} sold</span>
                    <span>Only {deal.countInStock || Math.floor(Math.random() * 50)} left</span>
                  </div>
                  <div style={styles.progressBar}>
                    <div style={{...styles.progressFill, width: `${progress}%`}}></div>
                  </div>
                </div>

                <button 
                  style={styles.addToCart}
                  onClick={(e) => handleAddToCart(deal, e)}
                  onMouseEnter={(e) => {
                    e.target.style.background = colors.primary;
                    e.target.style.color = colors.textPrimary;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = colors.primary;
                  }}
                  disabled={addingToCart[deal._id]}
                >
                  {addingToCart[deal._id] ? (
                    <>
                      <Loader size={14} className="spinner" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={isMobile ? 14 : 16} /> Grab Deal
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* View All Button */}
        <div style={styles.viewAllButton}>
          <button 
            style={styles.viewAll}
            onClick={handleViewAll}
            onMouseEnter={(e) => {
              e.target.style.background = colors.primary;
              e.target.style.color = colors.textPrimary;
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = colors.textPrimary;
            }}
          >
            View All Deals <Gift size={isMobile ? 16 : 18} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </section>
  );
};

export default DealsSection;