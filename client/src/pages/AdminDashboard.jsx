import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ShoppingBag,
  Users,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Home,
  Loader,
  Mail,
  MessageSquare,
  Star,
  Truck,
  Gift,
  TrendingUp,
  Shield,
  CreditCard,
  Bell,
  FileText,
  Users2,
  Database,
  RefreshCw,
  DollarSign,
  Image,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [feedbackStats, setFeedbackStats] = useState({
    total: 0,
    new: 0,
    averageRating: 0
  });

  // Stats state
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    totalProducts: 0,
    pendingOrders: 0,
    totalReviews: 0,
    totalFeedback: 0,
    unreadFeedback: 0,
    totalBanners: 0
  });

  // Colors
  const colors = {
    bgPrimary: '#FAF7F2',
    bgSecondary: '#F5F0E8',
    primary: '#D4AF37',
    primaryDark: '#B8962E',
    textPrimary: '#1F2937',
    textSecondary: '#4B5563',
    textLight: '#6B7280',
    border: '#E5E7EB',
    white: '#FFFFFF',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
    purple: '#8B5CF6',
    pink: '#EC4899',
    orange: '#F97316',
    teal: '#14B8A6',
    indigo: '#6366F1'
  };

  // Check authentication and fetch dashboard stats
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    const fetchAllData = async () => {
      await fetchDashboardStats();
      await fetchFeedbackStats();
      await fetchHeroBannerStats();
    };
    
    fetchAllData();
  }, [navigate]);

  // Fetch dashboard stats from backend
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Try to fetch admin stats
      const statsRes = await api.get('/admin/stats').catch(err => {
        console.log('Admin stats endpoint not available, using defaults');
        return { data: { success: false } };
      });
      
      // Try to fetch orders stats
      const ordersRes = await api.get('/orders/stats').catch(err => {
        console.log('Orders stats endpoint not available');
        return { data: { success: false } };
      });
      
      // Try to fetch products stats
      const productsRes = await api.get('/products/stats').catch(err => {
        console.log('Products stats endpoint not available');
        return { data: { success: false } };
      });
      
      // Try to fetch users stats
      const usersRes = await api.get('/users/stats').catch(err => {
        console.log('Users stats endpoint not available');
        return { data: { success: false } };
      });
      
      // Update stats from admin endpoint
      if (statsRes.data?.success) {
        const data = statsRes.data.data;
        setStats(prev => ({
          ...prev,
          totalOrders: data.totalOrders || 0,
          totalUsers: data.totalUsers || 0,
          totalRevenue: data.totalRevenue || 0,
          totalProducts: data.totalProducts || 0,
          pendingOrders: data.pendingOrders || 0
        }));
      }

      // Update stats from orders endpoint
      if (ordersRes.data?.success) {
        setStats(prev => ({
          ...prev,
          totalOrders: ordersRes.data.data.total || prev.totalOrders,
          pendingOrders: ordersRes.data.data.pending || prev.pendingOrders
        }));
      }

      // Update stats from products endpoint
      if (productsRes.data?.success) {
        setStats(prev => ({
          ...prev,
          totalProducts: productsRes.data.data.totalProducts || prev.totalProducts
        }));
      }

      // Update stats from users endpoint
      if (usersRes.data?.success) {
        setStats(prev => ({
          ...prev,
          totalUsers: usersRes.data.data.totalUsers || prev.totalUsers
        }));
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to fetch some dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch feedback stats
  const fetchFeedbackStats = async () => {
    try {
      const response = await api.get('/feedback/stats').catch(err => {
        console.log('Feedback stats endpoint not available');
        return { data: { success: false } };
      });
      
      if (response.data?.success) {
        setFeedbackStats({
          total: response.data.data.total || 0,
          new: response.data.data.new || 0,
          averageRating: response.data.data.averageRating || 0
        });
        setStats(prev => ({
          ...prev,
          totalFeedback: response.data.data.total || 0,
          unreadFeedback: response.data.data.new || 0
        }));
      }
    } catch (err) {
      console.error('Error fetching feedback stats:', err);
    }
  };

  // Fetch hero banner stats
  const fetchHeroBannerStats = async () => {
    try {
      const response = await api.get('/hero-banner').catch(err => {
        console.log('Hero banner endpoint not available');
        return { data: { success: false } };
      });
      
      if (response.data?.success) {
        setStats(prev => ({
          ...prev,
          totalBanners: response.data.data?.length || 0
        }));
      }
    } catch (err) {
      console.error('Error fetching hero banner stats:', err);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Navigation handlers
  const navigateTo = (path) => {
    console.log('Navigating to:', path);
    navigate(path);
  };

  // Refresh all data
  const handleRefresh = async () => {
    setLoading(true);
    await fetchDashboardStats();
    await fetchFeedbackStats();
    await fetchHeroBannerStats();
    setLoading(false);
    setSuccess('Dashboard refreshed successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      background: colors.bgPrimary,
      display: 'flex',
      flexDirection: 'column'
    },
    header: {
      background: colors.white,
      padding: '20px 30px',
      borderBottom: `1px solid ${colors.border}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '15px'
    },
    headerTitle: {
      fontSize: '1.8rem',
      fontWeight: '700',
      color: colors.textPrimary,
      margin: 0
    },
    headerSubtitle: {
      color: colors.textLight,
      fontSize: '0.95rem',
      marginTop: '5px',
      marginBottom: 0
    },
    headerStats: {
      display: 'flex',
      gap: '15px',
      flexWrap: 'wrap'
    },
    headerStat: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      background: colors.bgSecondary,
      borderRadius: '30px',
      fontSize: '0.9rem',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    mainContent: {
      padding: '30px',
      flex: 1
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    },
    statCard: {
      background: colors.white,
      padding: '20px',
      borderRadius: '16px',
      border: `1px solid ${colors.border}`,
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },
    statIcon: {
      width: '50px',
      height: '50px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    statInfo: {
      flex: 1
    },
    statValue: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: colors.textPrimary,
      lineHeight: '1.2'
    },
    statLabel: {
      color: colors.textLight,
      fontSize: '0.9rem',
      marginTop: '4px'
    },
    menuGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '20px',
      marginTop: '20px'
    },
    menuCard: {
      background: colors.white,
      padding: '25px',
      borderRadius: '16px',
      border: `1px solid ${colors.border}`,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: '12px',
      position: 'relative'
    },
    menuIcon: {
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    menuTitle: {
      fontSize: '1.1rem',
      fontWeight: '600',
      color: colors.textPrimary,
      margin: 0
    },
    menuDesc: {
      color: colors.textLight,
      fontSize: '0.85rem',
      lineHeight: '1.4',
      margin: 0
    },
    notificationBadge: {
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: colors.error,
      color: colors.white,
      fontSize: '0.7rem',
      padding: '2px 6px',
      borderRadius: '10px',
      fontWeight: '600'
    },
    logoutCard: {
      background: `${colors.error}08`,
      borderColor: colors.error,
      color: colors.error
    },
    messageBox: {
      padding: '15px 20px',
      borderRadius: '12px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    errorMessage: {
      background: `${colors.error}10`,
      border: `1px solid ${colors.error}`,
      color: colors.error
    },
    successMessage: {
      background: `${colors.success}10`,
      border: `1px solid ${colors.success}`,
      color: colors.success
    },
    refreshButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      background: colors.white,
      border: `1px solid ${colors.border}`,
      borderRadius: '30px',
      fontSize: '0.9rem',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      color: colors.textPrimary
    },
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: colors.bgPrimary,
      gap: '20px'
    }
  };

  // Menu items configuration
  const menuItems = [
    {
      title: 'Dashboard',
      description: 'Overview & statistics',
      icon: Home,
      path: '/admin',
      color: colors.primary
    },
    {
      title: 'Products',
      description: 'Manage inventory & listings',
      icon: Package,
      path: '/admin/products',
      color: colors.primary
    },
    {
      title: 'Orders',
      description: 'View & process orders',
      icon: ShoppingBag,
      path: '/admin/orders',
      color: colors.success,
      badge: stats.pendingOrders > 0 ? stats.pendingOrders : null
    },
    {
      title: 'Users',
      description: 'Manage customer accounts',
      icon: Users,
      path: '/admin/users',
      color: colors.info
    },
    {
      title: 'Hero Banner', // 🔥 Hero banner management
      description: 'Manage homepage banners',
      icon: Image,
      path: '/admin/hero-banner',
      color: colors.indigo,
      badge: stats.totalBanners > 0 ? stats.totalBanners : null,
      onClick: () => navigateTo('/admin/hero-banner')
    },
    {
      title: 'Newsletter',
      description: 'Send emails to subscribers',
      icon: Mail,
      path: '/admin/newsletter',
      color: colors.purple
    },
    {
      title: 'Feedback',
      description: 'View customer feedback',
      icon: MessageSquare,
      path: '/admin/feedback',
      color: colors.pink,
      badge: stats.unreadFeedback > 0 ? stats.unreadFeedback : null
    },
    {
      title: 'Reviews',
      description: 'Manage product reviews',
      icon: Star,
      path: '/admin/reviews',
      color: colors.warning
    },
    {
      title: 'Analytics',
      description: 'Sales & performance metrics',
      icon: BarChart3,
      path: '/admin/analytics',
      color: colors.teal
    },
    {
      title: 'Deliveries',
      description: 'Track & manage shipments',
      icon: Truck,
      path: '/admin/deliveries',
      color: colors.orange
    },
    {
      title: 'Offers',
      description: 'Manage discounts & coupons',
      icon: Gift,
      path: '/admin/offers',
      color: colors.success
    },
    {
      title: 'Payments',
      description: 'Transaction history',
      icon: CreditCard,
      path: '/admin/payments',
      color: colors.info
    },
    {
      title: 'Reports',
      description: 'Generate & export reports',
      icon: FileText,
      path: '/admin/reports',
      color: colors.purple
    },
    {
      title: 'Notifications',
      description: 'Send push notifications',
      icon: Bell,
      path: '/admin/notifications',
      color: colors.warning
    },
    {
      title: 'Settings',
      description: 'Configure store settings',
      icon: Settings,
      path: '/admin/settings',
      color: colors.textSecondary
    }
  ];

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Loader size={50} color={colors.primary} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: colors.textSecondary }}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>Admin Dashboard</h1>
          <p style={styles.headerSubtitle}>Welcome back! Manage your store from here.</p>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button 
            style={styles.refreshButton}
            onClick={handleRefresh}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.bgSecondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.white;
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <div style={styles.headerStats}>
            {stats.unreadFeedback > 0 && (
              <div 
                style={styles.headerStat}
                onClick={() => navigateTo('/admin/feedback')}
              >
                <MessageSquare size={16} color={colors.pink} />
                <span>{stats.unreadFeedback} new</span>
              </div>
            )}
            {stats.pendingOrders > 0 && (
              <div 
                style={styles.headerStat}
                onClick={() => navigateTo('/admin/orders')}
              >
                <ShoppingBag size={16} color={colors.success} />
                <span>{stats.pendingOrders} pending</span>
              </div>
            )}
            {stats.totalBanners > 0 && (
              <div 
                style={styles.headerStat}
                onClick={() => navigateTo('/admin/hero-banner')}
              >
                <Image size={16} color={colors.indigo} />
                <span>{stats.totalBanners} banners</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Messages */}
        {error && (
          <div style={{ ...styles.messageBox, ...styles.errorMessage }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ ...styles.messageBox, ...styles.successMessage }}>
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Stats Overview */}
        <div style={styles.statsGrid}>
          <div 
            style={styles.statCard}
            onClick={() => navigateTo('/admin/orders')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = `0 10px 25px ${colors.primary}20`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ ...styles.statIcon, background: `${colors.primary}15` }}>
              <ShoppingBag size={24} color={colors.primary} />
            </div>
            <div style={styles.statInfo}>
              <div style={styles.statValue}>{stats.totalOrders}</div>
              <div style={styles.statLabel}>Total Orders</div>
            </div>
          </div>

          <div 
            style={styles.statCard}
            onClick={() => navigateTo('/admin/users')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = `0 10px 25px ${colors.info}20`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ ...styles.statIcon, background: `${colors.info}15` }}>
              <Users size={24} color={colors.info} />
            </div>
            <div style={styles.statInfo}>
              <div style={styles.statValue}>{stats.totalUsers}</div>
              <div style={styles.statLabel}>Total Users</div>
            </div>
          </div>

          <div 
            style={styles.statCard}
            onClick={() => navigateTo('/admin/analytics')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = `0 10px 25px ${colors.success}20`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ ...styles.statIcon, background: `${colors.success}15` }}>
              <DollarSign size={24} color={colors.success} />
            </div>
            <div style={styles.statInfo}>
              <div style={styles.statValue}>₹{stats.totalRevenue.toLocaleString()}</div>
              <div style={styles.statLabel}>Total Revenue</div>
            </div>
          </div>

          <div 
            style={styles.statCard}
            onClick={() => navigateTo('/admin/products')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = `0 10px 25px ${colors.warning}20`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ ...styles.statIcon, background: `${colors.warning}15` }}>
              <Package size={24} color={colors.warning} />
            </div>
            <div style={styles.statInfo}>
              <div style={styles.statValue}>{stats.totalProducts}</div>
              <div style={styles.statLabel}>Total Products</div>
            </div>
          </div>

          <div 
            style={styles.statCard}
            onClick={() => navigateTo('/admin/hero-banner')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = `0 10px 25px ${colors.indigo}20`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ ...styles.statIcon, background: `${colors.indigo}15` }}>
              <Image size={24} color={colors.indigo} />
            </div>
            <div style={styles.statInfo}>
              <div style={styles.statValue}>{stats.totalBanners}</div>
              <div style={styles.statLabel}>Active Banners</div>
            </div>
          </div>

          <div 
            style={styles.statCard}
            onClick={() => navigateTo('/admin/feedback')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = `0 10px 25px ${colors.purple}20`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ ...styles.statIcon, background: `${colors.purple}15` }}>
              <MessageSquare size={24} color={colors.purple} />
            </div>
            <div style={styles.statInfo}>
              <div style={styles.statValue}>{stats.totalFeedback}</div>
              <div style={styles.statLabel}>Total Feedback</div>
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        <div style={styles.menuGrid}>
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                style={styles.menuCard}
                onClick={() => navigateTo(item.path)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = `0 15px 30px ${item.color}20`;
                  e.currentTarget.style.borderColor = item.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = colors.border;
                }}
              >
                {item.badge && (
                  <span style={styles.notificationBadge}>
                    {item.badge}
                  </span>
                )}
                <div style={{ 
                  ...styles.menuIcon, 
                  background: `${item.color}15`,
                  color: item.color
                }}>
                  <Icon size={28} />
                </div>
                <h3 style={styles.menuTitle}>{item.title}</h3>
                <p style={styles.menuDesc}>{item.description}</p>
              </div>
            );
          })}

          {/* Logout Card */}
          <div
            style={{ ...styles.menuCard, ...styles.logoutCard }}
            onClick={handleLogout}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 15px 30px rgba(239,68,68,0.15)';
              e.currentTarget.style.borderColor = colors.error;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = colors.border;
            }}
          >
            <div style={{ ...styles.menuIcon, background: `${colors.error}15`, color: colors.error }}>
              <LogOut size={28} />
            </div>
            <h3 style={{ ...styles.menuTitle, color: colors.error }}>Logout</h3>
            <p style={styles.menuDesc}>Sign out of your account</p>
          </div>
        </div>
      </div>

      {/* Animation keyframes */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default AdminDashboard;