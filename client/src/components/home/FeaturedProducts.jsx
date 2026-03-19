import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  ShoppingBag, 
  Star, 
  Eye, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Award,
  Zap,
  Clock,
  Shield,
  Truck,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader,
  XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

const FeaturedProducts = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState({});
  const [addingToWishlist, setAddingToWishlist] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [renderKey, setRenderKey] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState({});

  // API base URL
  const API_URL = 'http://localhost:5000/api';

  // Beige and Gold color scheme
  const colors = {
    bgPrimary: '#FAF7F2',
    bgSecondary: '#F5F0E8',
    bgGlass: 'rgba(250, 247, 242, 0.85)',
    primary: '#D4AF37',
    primaryDark: '#B8962E',
    primaryLight: '#E5C97A',
    textPrimary: '#1F2937',
    textSecondary: '#4B5563',
    textLight: '#6B7280',
    border: '#E0D9CD',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    white: '#FFFFFF',
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Responsive breakpoints
  const isMobile = windowWidth <= 768;
  const isTablet = windowWidth > 768 && windowWidth <= 1024;
  const isDesktop = windowWidth > 1024 && windowWidth <= 1400;
  const isLargeScreen = windowWidth > 1400;
  
  const productsPerPage = isMobile ? 2 : isTablet ? 3 : isDesktop ? 4 : 5;

  // Fetch category counts
  useEffect(() => {
    fetchCategoryCounts();
  }, []);

  // Fetch products from backend
  useEffect(() => {
    fetchProducts();
  }, [currentPage, selectedCategory, sortBy]);

  // 🔥 FIXED: Fetch category counts from backend
  const fetchCategoryCounts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products/category-counts`);
      if (response.data.success) {
        setCategoryCounts(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching category counts:', err);
    }
  };

  // 🔥 FIXED: Fetch products with proper featured filter
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: productsPerPage,
        sort: sortBy,
        featured: true  // Only get featured products
      };
      
      // Add category filter if not 'all'
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }

      console.log('📦 Fetching featured products with params:', params);
      
      const response = await axios.get(`${API_URL}/products`, { params });

      console.log('📦 Featured Products API Response:', response.data);

      let productsData = [];
      let pages = 1;
      let total = 0;
      
      // Handle different response formats
      if (response.data.success && response.data.products) {
        productsData = response.data.products;
        pages = response.data.pages || response.data.totalPages || 1;
        total = response.data.total || productsData.length;
      } else if (response.data.products) {
        productsData = response.data.products;
        pages = response.data.pages || response.data.totalPages || 1;
        total = response.data.total || productsData.length;
      } else if (Array.isArray(response.data)) {
        productsData = response.data;
        pages = Math.ceil(productsData.length / productsPerPage);
        total = productsData.length;
      } else if (response.data.data) {
        productsData = response.data.data;
        pages = response.data.totalPages || Math.ceil(productsData.length / productsPerPage);
        total = response.data.total || productsData.length;
      }

      // 🔥 FIXED: Filter to ensure only featured products (multiple field checks)
      const featuredOnly = productsData.filter(product => 
        product.featured === true || 
        product.isFeatured === true ||
        product.featured === 'true' ||
        product.isFeatured === 'true'
      );

      // Remove duplicates
      const uniqueProducts = [];
      const seenIds = new Set();
      
      featuredOnly.forEach(product => {
        if (!seenIds.has(product._id)) {
          seenIds.add(product._id);
          uniqueProducts.push(product);
        }
      });

      console.log(`✅ Found ${uniqueProducts.length} featured products`);
      setProducts(uniqueProducts);
      setTotalPages(pages);
      setTotalProducts(total);
      setError(null);
      setRenderKey(prev => prev + 1);
      
    } catch (err) {
      console.error('❌ Error fetching products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (product) => {
    if (product.image) {
      return product.image.startsWith('http') ? product.image : `http://localhost:5000${product.image}`;
    }
    
    if (product.images && product.images.length > 0) {
      const img = product.images[0];
      if (typeof img === 'string') {
        return img.startsWith('http') ? img : `http://localhost:5000${img}`;
      }
    }
    
    return `https://via.placeholder.com/400x400?text=${product.category || 'Product'}`;
  };

  const handleWishlistToggle = async (product, e) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      showNotification('Please login to add items to wishlist', 'warning');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    const productId = product._id || product.id;
    setAddingToWishlist(prev => ({ ...prev, [productId]: true }));

    try {
      if (isInWishlist(productId)) {
        await removeFromWishlist(productId);
        showNotification('Removed from wishlist', 'success');
      } else {
        await addToWishlist(product);
        showNotification('Added to wishlist', 'success');
      }
    } catch (err) {
      console.error('Error toggling wishlist:', err);
      showNotification('Failed to update wishlist', 'error');
    } finally {
      setAddingToWishlist(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleAddToCart = async (product, e) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      showNotification('Please login to add items to cart', 'warning');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    if (product.countInStock === 0) {
      showNotification('Product is out of stock', 'error');
      return;
    }

    const productId = product._id || product.id;
    setAddingToCart(prev => ({ ...prev, [productId]: true }));

    try {
      await addToCart(productId, 1);
      showNotification(`${product.name} added to cart!`, 'success');
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      console.error('Error adding to cart:', err);
      showNotification('Failed to add to cart', 'error');
    } finally {
      setAddingToCart(prev => ({ ...prev, [productId]: false }));
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  // 🔥 FIXED: Categories with dynamic counts
  const categories = [
    { id: 'all', name: 'All Products', icon: '✨', count: totalProducts },
    { id: 'Electronics', name: 'Electronics', icon: '💻', count: categoryCounts.Electronics || 24 },
    { id: 'Fashion', name: 'Fashion', icon: '👗', count: categoryCounts.Fashion || 18 },
    { id: 'Home & Living', name: 'Home & Living', icon: '🏠', count: categoryCounts['Home & Living'] || 15 },
    { id: 'Beauty', name: 'Beauty', icon: '💄', count: categoryCounts.Beauty || 12 },
    { id: 'Sports', name: 'Sports', icon: '⚽', count: categoryCounts.Sports || 10 },
    { id: 'Books', name: 'Books', icon: '📚', count: categoryCounts.Books || 8 },
  ];

  // 🔥 COMPLETE STYLES OBJECT
  const styles = {
    section: {
      padding: isMobile ? '40px 15px' : '80px 20px',
      background: colors.bgPrimary,
      position: 'relative',
      overflow: 'hidden',
      minHeight: '100vh',
    },
    backgroundGradient1: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `radial-gradient(circle at 20% 30%, ${colors.primary}10 0%, transparent 50%)`,
      pointerEvents: 'none',
    },
    backgroundGradient2: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `radial-gradient(circle at 80% 70%, ${colors.primaryLight}10 0%, transparent 50%)`,
      pointerEvents: 'none',
    },
    container: {
      maxWidth: '1600px',
      margin: '0 auto',
      position: 'relative',
      zIndex: 2,
    },
    header: {
      textAlign: 'center',
      marginBottom: '50px',
    },
    subtitle: {
      color: colors.primary,
      fontSize: '1rem',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '4px',
      marginBottom: '15px',
      display: 'inline-block',
      padding: '6px 20px',
      background: colors.bgSecondary,
      borderRadius: '30px',
      border: `1px solid ${colors.border}`,
    },
    title: {
      fontSize: isMobile ? '2.2rem' : isTablet ? '2.8rem' : '3.5rem',
      fontWeight: '800',
      color: colors.textPrimary,
      margin: '15px 0',
      lineHeight: '1.2',
    },
    highlight: {
      background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    description: {
      color: colors.textSecondary,
      fontSize: isMobile ? '1rem' : '1.1rem',
      maxWidth: '800px',
      margin: '0 auto 40px',
      lineHeight: '1.8',
    },
    filterHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
      flexWrap: 'wrap',
      gap: '20px',
    },
    filterToggle: {
      display: isMobile ? 'flex' : 'none',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 20px',
      background: colors.white,
      border: `1px solid ${colors.border}`,
      borderRadius: '30px',
      color: colors.textPrimary,
      fontSize: '0.95rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    stats: {
      display: 'flex',
      gap: '15px',
      flexWrap: 'wrap',
    },
    statItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 16px',
      background: colors.white,
      borderRadius: '30px',
      border: `1px solid ${colors.border}`,
      fontSize: '0.9rem',
      color: colors.textSecondary,
    },
    categoryFilter: {
      display: isMobile && !showFilter ? 'none' : 'flex',
      justifyContent: 'center',
      gap: isMobile ? '8px' : '12px',
      marginBottom: '30px',
      flexWrap: 'wrap',
    },
    categoryButton: {
      padding: isMobile ? '10px 16px' : '12px 24px',
      borderRadius: '40px',
      border: `1px solid ${colors.border}`,
      background: colors.white,
      color: colors.textSecondary,
      fontSize: isMobile ? '0.85rem' : '0.95rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
    },
    activeCategory: {
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
      color: colors.white,
      borderColor: colors.primary,
      boxShadow: `0 8px 20px -5px ${colors.primary}`,
    },
    categoryCount: {
      background: colors.bgSecondary,
      color: colors.textSecondary,
      padding: '2px 8px',
      borderRadius: '20px',
      fontSize: '0.7rem',
      marginLeft: '4px',
    },
    activeCategoryCount: {
      background: colors.white,
      color: colors.primary,
    },
    sortBar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '40px',
      padding: '15px 25px',
      background: colors.white,
      borderRadius: '16px',
      border: `1px solid ${colors.border}`,
      flexWrap: 'wrap',
      gap: '15px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
    },
    resultCount: {
      color: colors.textSecondary,
      fontSize: '0.95rem',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    sortSelect: {
      padding: '10px 20px',
      border: `1px solid ${colors.border}`,
      borderRadius: '30px',
      color: colors.textPrimary,
      fontSize: '0.95rem',
      cursor: 'pointer',
      outline: 'none',
      background: colors.bgSecondary,
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
      gap: isMobile ? '20px' : '25px',
      marginBottom: '50px',
    },
    card: {
      background: colors.white,
      borderRadius: '24px',
      overflow: 'hidden',
      border: `1px solid ${colors.border}`,
      transition: 'all 0.3s ease',
      position: 'relative',
      cursor: 'pointer',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    },
    cardBadges: {
      position: 'absolute',
      top: '15px',
      left: '15px',
      zIndex: 3,
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
    },
    cardBadge: {
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: '600',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      backdropFilter: 'blur(4px)',
    },
    badgeNew: {
      background: colors.info,
      color: colors.white,
    },
    badgeBestSeller: {
      background: colors.primary,
      color: colors.white,
    },
    badgeTrending: {
      background: colors.warning,
      color: colors.white,
    },
    wishlistButton: {
      position: 'absolute',
      top: '15px',
      right: '15px',
      width: '40px',
      height: '40px',
      background: colors.white,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      border: `1px solid ${colors.border}`,
      transition: 'all 0.3s ease',
      zIndex: 3,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
    imageContainer: {
      position: 'relative',
      height: '250px',
      overflow: 'hidden',
      background: colors.bgSecondary,
    },
    image: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transition: 'transform 0.5s ease',
    },
    quickViewOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
      opacity: 0,
      transition: 'opacity 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      zIndex: 2,
    },
    quickViewButton: {
      width: '45px',
      height: '45px',
      background: colors.white,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      border: 'none',
      transform: 'translateY(20px)',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    },
    cardContent: {
      padding: '20px',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
    },
    brand: {
      color: colors.primary,
      fontSize: '0.8rem',
      fontWeight: '600',
      marginBottom: '6px',
      textTransform: 'uppercase',
      letterSpacing: '1.5px',
    },
    productName: {
      color: colors.textPrimary,
      fontSize: isMobile ? '1rem' : '1.1rem',
      fontWeight: '600',
      marginBottom: '10px',
      lineHeight: '1.4',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
    },
    ratingContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '12px',
    },
    stars: {
      display: 'flex',
      gap: '2px',
    },
    reviews: {
      color: colors.textLight,
      fontSize: '0.8rem',
    },
    priceContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '15px',
      marginTop: 'auto',
    },
    priceWrapper: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexWrap: 'wrap',
    },
    price: {
      fontSize: '1.3rem',
      fontWeight: '700',
      color: colors.primary,
    },
    originalPrice: {
      color: colors.textLight,
      fontSize: '0.95rem',
      textDecoration: 'line-through',
    },
    discountBadge: {
      background: colors.success,
      color: colors.white,
      padding: '3px 8px',
      borderRadius: '12px',
      fontSize: '0.7rem',
      fontWeight: '600',
    },
    stockStatus: {
      fontSize: '0.75rem',
      color: colors.success,
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    outOfStock: {
      color: colors.error,
    },
    addButton: {
      width: '100%',
      padding: '12px',
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
      color: colors.white,
      border: 'none',
      borderRadius: '12px',
      fontSize: '0.95rem',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.3s ease',
      marginTop: '10px',
    },
    featuresBar: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
      gap: '15px',
      marginTop: '60px',
      marginBottom: '40px',
    },
    featureItem: {
      background: colors.white,
      padding: '20px',
      borderRadius: '16px',
      border: `1px solid ${colors.border}`,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    featureIcon: {
      width: '45px',
      height: '45px',
      background: colors.bgSecondary,
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureContent: {
      flex: 1,
    },
    featureTitle: {
      color: colors.textPrimary,
      fontSize: '0.95rem',
      fontWeight: '600',
      marginBottom: '2px',
    },
    featureDesc: {
      color: colors.textLight,
      fontSize: '0.8rem',
    },
    pagination: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '10px',
      marginTop: '50px',
    },
    pageButton: {
      width: '45px',
      height: '45px',
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
      background: colors.white,
      color: colors.textPrimary,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '600',
    },
    activePage: {
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
      color: colors.white,
      borderColor: colors.primary,
      boxShadow: `0 8px 20px -5px ${colors.primary}`,
    },
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '500px',
      gap: '20px',
    },
    loader: {
      width: '60px',
      height: '60px',
      border: '3px solid #F5F0E8',
      borderTop: `3px solid ${colors.primary}`,
      borderRadius: '50%',
      animation: 'rotate 1s linear infinite',
    },
    errorContainer: {
      textAlign: 'center',
      padding: '60px',
      background: colors.white,
      borderRadius: '24px',
      border: `1px solid ${colors.error}`,
      maxWidth: '500px',
      margin: '50px auto',
    },
    retryButton: {
      marginTop: '20px',
      padding: '12px 30px',
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
      color: colors.white,
      border: 'none',
      borderRadius: '30px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
    },
    emptyContainer: {
      textAlign: 'center',
      padding: '60px',
      background: colors.white,
      borderRadius: '24px',
      border: `1px solid ${colors.border}`,
      maxWidth: '500px',
      margin: '50px auto',
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
    },
  };

  if (loading && products.length === 0) {
    return (
      <section style={styles.section}>
        <div style={styles.backgroundGradient1}></div>
        <div style={styles.backgroundGradient2}></div>
        <div style={styles.container}>
          <div style={styles.loadingContainer}>
            <div style={styles.loader}></div>
            <p style={{ color: colors.textSecondary, fontSize: '1.1rem' }}>
              Loading amazing products...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (error && products.length === 0) {
    return (
      <section style={styles.section}>
        <div style={styles.backgroundGradient1}></div>
        <div style={styles.backgroundGradient2}></div>
        <div style={styles.container}>
          <div style={styles.errorContainer}>
            <AlertCircle size={50} color={colors.error} style={{ marginBottom: '20px' }} />
            <h3 style={{ color: colors.textPrimary, fontSize: '1.5rem', marginBottom: '10px' }}>
              Oops! Something went wrong
            </h3>
            <p style={{ color: colors.textSecondary, marginBottom: '20px' }}>{error}</p>
            <button style={styles.retryButton} onClick={fetchProducts}>
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section key={`featured-section-${renderKey}`} style={styles.section}>
      <div style={styles.backgroundGradient1}></div>
      <div style={styles.backgroundGradient2}></div>
      
      {notification.show && (
        <div style={styles.notification}>
          {notification.type === 'success' && <CheckCircle size={20} color={colors.success} />}
          {notification.type === 'error' && <AlertCircle size={20} color={colors.error} />}
          {notification.type === 'warning' && <AlertCircle size={20} color={colors.warning} />}
          <span style={{ color: colors.textPrimary, fontSize: '0.95rem' }}>
            {notification.message}
          </span>
        </div>
      )}

      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.subtitle}>
            <Sparkles size={14} style={{ marginRight: '5px' }} />
            FEATURED COLLECTION
          </div>
          <h2 style={styles.title}>
            Handpicked <span style={styles.highlight}>For You</span>
          </h2>
          <p style={styles.description}>
            Discover our curated selection of premium products, loved by thousands of customers.
            Each item is carefully chosen for quality, style, and value.
          </p>
        </div>

        <div style={styles.filterHeader}>
          <button 
            style={styles.filterToggle}
            onClick={() => setShowFilter(!showFilter)}
          >
            <Filter size={18} />
            {showFilter ? 'Hide Filters' : 'Show Filters'}
          </button>

          <div style={styles.stats}>
            <div style={styles.statItem}>
              <ShoppingBag size={16} color={colors.primary} />
              {products.length} Featured Products
            </div>
            <div style={styles.statItem}>
              <Star size={16} color={colors.primary} />
              Avg Rating: 4.8
            </div>
          </div>
        </div>

        <div style={styles.categoryFilter}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              style={{
                ...styles.categoryButton,
                ...(selectedCategory === cat.id ? styles.activeCategory : {})
              }}
              onClick={() => {
                setSelectedCategory(cat.id);
                setCurrentPage(1);
                if (isMobile) setShowFilter(false);
              }}
            >
              <span>{cat.icon}</span>
              {cat.name}
              {cat.id !== 'all' && (
                <span style={{
                  ...styles.categoryCount,
                  ...(selectedCategory === cat.id ? styles.activeCategoryCount : {})
                }}>
                  {cat.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={styles.sortBar}>
          <div style={styles.resultCount}>
            <Sparkles size={18} color={colors.primary} />
            Showing {products.length} featured products
          </div>
          
          <select 
            style={styles.sortSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="featured">✨ Featured</option>
            <option value="newest">🆕 Newest First</option>
            <option value="price-low">💰 Price: Low to High</option>
            <option value="price-high">💎 Price: High to Low</option>
            <option value="rating">⭐ Highest Rated</option>
          </select>
        </div>

        {products.length === 0 ? (
          <div style={styles.emptyContainer}>
            <ShoppingBag size={60} color={colors.primary} />
            <h3 style={{ color: colors.textPrimary, fontSize: '1.8rem', marginBottom: '10px' }}>
              No Featured Products
            </h3>
            <p style={{ color: colors.textSecondary, marginBottom: '20px' }}>
              {selectedCategory === 'all' 
                ? "No featured products available at the moment. Check back later!"
                : `No featured products found in ${selectedCategory} category.`}
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {products.map((product, index) => {
              const productId = product._id;
              const isInWishlistBool = isInWishlist(productId);
              const isAddingToCart = addingToCart[productId];
              const isAddingToWishlist = addingToWishlist[productId];
              
              const uniqueKey = `featured-${productId}-${index}-${renderKey}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

              return (
                <div
                  key={uniqueKey}
                  data-product-id={productId}
                  data-component="featured"
                  style={styles.card}
                  onMouseEnter={() => setHoveredProduct(productId)}
                  onMouseLeave={() => setHoveredProduct(null)}
                  onClick={() => navigate(`/product/${productId}`)}
                >
                  <div style={styles.cardBadges}>
                    {product.discount && (
                      <div style={{ ...styles.cardBadge, background: colors.success, color: colors.white }}>
                        -{product.discount}%
                      </div>
                    )}
                    {product.isNew && (
                      <div style={{ ...styles.cardBadge, ...styles.badgeNew }}>
                        <Sparkles size={12} /> NEW
                      </div>
                    )}
                    {product.isBestSeller && (
                      <div style={{ ...styles.cardBadge, ...styles.badgeBestSeller }}>
                        <Award size={12} /> BESTSELLER
                      </div>
                    )}
                    {product.trending && (
                      <div style={{ ...styles.cardBadge, ...styles.badgeTrending }}>
                        <Zap size={12} /> TRENDING
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      ...styles.wishlistButton,
                      backgroundColor: isInWishlistBool ? colors.primary : colors.white,
                    }}
                    onClick={(e) => handleWishlistToggle(product, e)}
                  >
                    {isAddingToWishlist ? (
                      <Loader size={16} color={colors.primary} />
                    ) : (
                      <Heart 
                        size={18} 
                        color={isInWishlistBool ? colors.white : colors.textSecondary}
                        fill={isInWishlistBool ? colors.white : 'none'}
                      />
                    )}
                  </div>

                  <div style={styles.imageContainer}>
                    <img 
                      src={getImageUrl(product)} 
                      alt={product.name}
                      style={styles.image}
                      onError={(e) => {
                        e.target.src = `https://via.placeholder.com/400x400?text=${product.category || 'Product'}`;
                      }}
                    />
                    
                    {hoveredProduct === productId && (
                      <div style={styles.quickViewOverlay}>
                        <button 
                          style={styles.quickViewButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/product/${productId}`);
                          }}
                        >
                          <Eye size={18} color={colors.primary} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={styles.cardContent}>
                    <div style={styles.brand}>{product.brand || 'Premium'}</div>
                    <h3 style={styles.productName}>{product.name}</h3>
                    
                    <div style={styles.ratingContainer}>
                      <div style={styles.stars}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={`star-${productId}-${i}-${renderKey}`}
                            size={14}
                            color={i < Math.floor(product.rating || 4) ? colors.primary : colors.border}
                            fill={i < Math.floor(product.rating || 4) ? colors.primary : 'none'}
                          />
                        ))}
                      </div>
                      <span style={styles.reviews}>({product.numReviews || 0})</span>
                    </div>

                    <div style={styles.priceContainer}>
                      <div style={styles.priceWrapper}>
                        <span style={styles.price}>₹{product.price}</span>
                        {product.originalPrice && (
                          <span style={styles.originalPrice}>₹{product.originalPrice}</span>
                        )}
                      </div>
                      {product.countInStock > 0 ? (
                        <div style={styles.stockStatus}>
                          <CheckCircle size={12} /> In Stock
                        </div>
                      ) : (
                        <div style={{ ...styles.stockStatus, ...styles.outOfStock }}>
                          <XCircle size={12} /> Out of Stock
                        </div>
                      )}
                    </div>

                    <button
                      style={styles.addButton}
                      onClick={(e) => handleAddToCart(product, e)}
                      disabled={isAddingToCart || product.countInStock === 0}
                    >
                      {isAddingToCart ? (
                        <>
                          <Loader size={16} /> Adding...
                        </>
                      ) : product.countInStock === 0 ? (
                        'Out of Stock'
                      ) : (
                        <>
                          <ShoppingBag size={16} /> Add to Cart
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {products.length > 0 && (
          <div style={styles.featuresBar}>
            {[
              { icon: Truck, title: 'Free Shipping', desc: 'On orders ₹5000+' },
              { icon: RefreshCw, title: 'Easy Returns', desc: '30-day return policy' },
              { icon: Shield, title: 'Secure Payment', desc: '256-bit SSL' },
              { icon: Clock, title: '24/7 Support', desc: 'Dedicated help' },
            ].map((feature, index) => (
              <div key={`feature-${index}-${renderKey}`} style={styles.featureItem}>
                <div style={styles.featureIcon}>
                  <feature.icon size={22} color={colors.primary} />
                </div>
                <div style={styles.featureContent}>
                  <div style={styles.featureTitle}>{feature.title}</div>
                  <div style={styles.featureDesc}>{feature.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div style={styles.pagination}>
            <button
              style={styles.pageButton}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={18} />
            </button>

            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={`page-${pageNum}-${renderKey}`}
                  style={{
                    ...styles.pageButton,
                    ...(currentPage === pageNum ? styles.activePage : {})
                  }}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              style={styles.pageButton}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
};

export default FeaturedProducts;