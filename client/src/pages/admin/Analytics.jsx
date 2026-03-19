// src/pages/admin/Analytics.jsx
import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  Package,
  Calendar,
  Download,
  Filter,
  Loader,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Star,
  Clock,
  Zap,
  Award,
  Target,
  PieChart,
  Activity,
  MessageSquare,
  ThumbsUp,
  UserCheck,
  RefreshCw,
  Mail,
  Phone,
  Globe,
  MapPin,
  ShoppingCart,
  CreditCard,
  Truck,
  CheckCircle,
  XCircle,
  Clock3
} from 'lucide-react';
import axios from 'axios';

// Import Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const API_URL = 'http://localhost:5000/api';
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('monthly');
  const [analytics, setAnalytics] = useState({
    revenue: [],
    orders: [],
    users: [],
    products: [],
    topProducts: [],
    categoryBreakdown: [],
    statusBreakdown: []
  });
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    avgOrderValue: 0,
    conversionRate: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0
  });
  
  // Feedback stats with proper default values
  const [feedbackStats, setFeedbackStats] = useState({
    total: 0,
    new: 0,
    read: 0,
    replied: 0,
    averageRating: 0,
    ratingDistribution: {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    },
    categoryDistribution: {},
    recentFeedback: []
  });

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
    chartColors: ['#D4AF37', '#B8962E', '#F5E7C8', '#4B5563', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899']
  };

  useEffect(() => {
    fetchAllData();
  }, [period]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchAnalytics(),
        fetchFeedbackStats(),
        fetchOrderStats()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  const fetchAnalytics = async () => {
    try {
      // Try to get analytics from admin endpoint first
      let analyticsData = null;
      try {
        const analyticsRes = await api.get('/admin/analytics');
        if (analyticsRes.data.success) {
          analyticsData = analyticsRes.data.data;
        }
      } catch (analyticsErr) {
        console.log('Analytics endpoint not available, using fallback...');
      }

      // Fetch individual stats
      const [statsRes, ordersRes, usersRes, productsRes] = await Promise.all([
        api.get('/admin/stats').catch(() => ({ data: { success: false, data: {} } })),
        api.get(`/orders/analytics?period=${period}`).catch(() => ({ data: { success: false, data: { periodData: [], statusBreakdown: [] } } })),
        api.get('/users/stats').catch(() => ({ data: { success: false, data: {} } })),
        api.get('/products/stats').catch(() => ({ data: { success: false, data: {} } }))
      ]);

      // If we have analytics data from the combined endpoint, use it
      if (analyticsData) {
        setStats({
          totalRevenue: analyticsData.overview?.totalRevenue || 0,
          totalOrders: analyticsData.overview?.totalOrders || 0,
          totalUsers: analyticsData.overview?.totalUsers || 0,
          totalProducts: analyticsData.overview?.totalProducts || 0,
          avgOrderValue: analyticsData.overview?.averageOrderValue || 0,
          pendingOrders: analyticsData.ordersByStatus?.find(s => s.status === 'pending')?.count || 0,
          processingOrders: analyticsData.ordersByStatus?.find(s => s.status === 'processing')?.count || 0,
          shippedOrders: analyticsData.ordersByStatus?.find(s => s.status === 'shipped')?.count || 0,
          deliveredOrders: analyticsData.ordersByStatus?.find(s => s.status === 'delivered')?.count || 0,
          cancelledOrders: analyticsData.ordersByStatus?.find(s => s.status === 'cancelled')?.count || 0
        });

        setAnalytics(prev => ({
          ...prev,
          revenue: analyticsData.dailySales || [],
          statusBreakdown: analyticsData.ordersByStatus || [],
          topProducts: analyticsData.topProducts || [],
          userGrowth: analyticsData.userGrowth || []
        }));
      } else {
        // Use individual stats as fallback
        if (statsRes.data.success) {
          setStats(prev => ({ ...prev, ...statsRes.data.data }));
        }

        if (ordersRes.data.success) {
          setAnalytics(prev => ({
            ...prev,
            revenue: ordersRes.data.data.periodData || [],
            statusBreakdown: ordersRes.data.data.statusBreakdown || []
          }));
        }
      }
    } catch (error) {
      console.error('Error in fetchAnalytics:', error);
      throw error;
    }
  };

  // Fetch feedback statistics
  const fetchFeedbackStats = async () => {
    try {
      const response = await api.get('/feedback/stats').catch(() => ({ 
        data: { 
          success: false, 
          data: {
            total: 0,
            new: 0,
            read: 0,
            replied: 0,
            averageRating: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            categoryDistribution: {},
            recentFeedback: []
          }
        } 
      }));
      
      if (response.data.success) {
        // Ensure all numeric values are proper numbers
        const data = response.data.data;
        setFeedbackStats({
          total: Number(data.total) || 0,
          new: Number(data.new) || 0,
          read: Number(data.read) || 0,
          replied: Number(data.replied) || 0,
          averageRating: Number(data.averageRating) || 0,
          ratingDistribution: {
            1: Number(data.ratingDistribution?.[1]) || 0,
            2: Number(data.ratingDistribution?.[2]) || 0,
            3: Number(data.ratingDistribution?.[3]) || 0,
            4: Number(data.ratingDistribution?.[4]) || 0,
            5: Number(data.ratingDistribution?.[5]) || 0
          },
          categoryDistribution: data.categoryDistribution || {},
          recentFeedback: Array.isArray(data.recentFeedback) ? data.recentFeedback : []
        });
      }
    } catch (error) {
      console.error('Error fetching feedback stats:', error);
    }
  };

  // Fetch order statistics
  const fetchOrderStats = async () => {
    try {
      const response = await api.get('/orders/stats').catch(() => ({ 
        data: { 
          success: false, 
          data: {
            pending: 0,
            processing: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0
          }
        } 
      }));
      
      if (response.data.success) {
        setStats(prev => ({
          ...prev,
          pendingOrders: Number(response.data.data.pending) || 0,
          processingOrders: Number(response.data.data.processing) || 0,
          shippedOrders: Number(response.data.data.shipped) || 0,
          deliveredOrders: Number(response.data.data.delivered) || 0,
          cancelledOrders: Number(response.data.data.cancelled) || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching order stats:', error);
    }
  };

  // Safe number formatting function
  const formatCurrency = (value) => {
    const num = Number(value) || 0;
    return num.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  // Safe number formatting without currency
  const formatNumber = (value) => {
    const num = Number(value) || 0;
    return num.toLocaleString('en-IN');
  };

  // Safe average rating display
  const displayAverageRating = (rating) => {
    const num = Number(rating) || 0;
    return num.toFixed(1);
  };

  const revenueChartData = {
    labels: analytics.revenue.map(item => item.date || item._id || ''),
    datasets: [
      {
        label: 'Revenue (₹)',
        data: analytics.revenue.map(item => Number(item.sales || item.revenue || 0)),
        borderColor: colors.primary,
        backgroundColor: `${colors.primary}20`,
        tension: 0.4,
        fill: true
      }
    ]
  };

  const ordersChartData = {
    labels: analytics.revenue.map(item => item.date || item._id || ''),
    datasets: [
      {
        label: 'Orders',
        data: analytics.revenue.map(item => Number(item.orders || item.count || 0)),
        backgroundColor: colors.primary,
        borderRadius: 8
      }
    ]
  };

  const statusChartData = {
    labels: analytics.statusBreakdown.map(item => item.status || item._id || ''),
    datasets: [
      {
        data: analytics.statusBreakdown.map(item => Number(item.count || 0)),
        backgroundColor: colors.chartColors,
        borderWidth: 0
      }
    ]
  };

  // Rating distribution chart data with safe number conversion
  const ratingChartData = {
    labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
    datasets: [
      {
        label: 'Number of Reviews',
        data: [
          Number(feedbackStats.ratingDistribution[1]) || 0,
          Number(feedbackStats.ratingDistribution[2]) || 0,
          Number(feedbackStats.ratingDistribution[3]) || 0,
          Number(feedbackStats.ratingDistribution[4]) || 0,
          Number(feedbackStats.ratingDistribution[5]) || 0
        ],
        backgroundColor: [
          colors.error,
          colors.warning,
          colors.info,
          colors.primary,
          colors.success
        ],
        borderRadius: 8
      }
    ]
  };

  // Category distribution chart data
  const categoryChartData = {
    labels: Object.keys(feedbackStats.categoryDistribution || {}).map(key => 
      key.charAt(0).toUpperCase() + key.slice(1)
    ),
    datasets: [
      {
        data: Object.values(feedbackStats.categoryDistribution || {}).map(val => Number(val) || 0),
        backgroundColor: colors.chartColors,
        borderWidth: 0
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: colors.textSecondary
        }
      },
      tooltip: {
        backgroundColor: colors.white,
        titleColor: colors.textPrimary,
        bodyColor: colors.textSecondary,
        borderColor: colors.border,
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== undefined) {
              if (context.dataset.label.includes('Revenue')) {
                label += '₹' + context.parsed.y.toLocaleString('en-IN');
              } else {
                label += context.parsed.y.toLocaleString('en-IN');
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        grid: {
          color: `${colors.border}50`
        },
        ticks: {
          color: colors.textSecondary,
          callback: function(value) {
            if (this.chart.canvas.id === 'revenue-chart') {
              return '₹' + Number(value).toLocaleString('en-IN');
            }
            return value;
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: colors.textSecondary,
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: colors.bgPrimary,
      padding: '30px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
      flexWrap: 'wrap',
      gap: '20px',
    },
    titleSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
    },
    title: {
      fontSize: '2rem',
      fontWeight: '700',
      color: colors.textPrimary,
    },
    refreshButton: {
      padding: '10px',
      background: colors.white,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s ease',
    },
    periodSelector: {
      display: 'flex',
      gap: '10px',
      padding: '5px',
      background: colors.white,
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
    },
    periodButton: {
      padding: '8px 16px',
      border: 'none',
      background: 'transparent',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: '500',
      color: colors.textSecondary,
      transition: 'all 0.3s ease',
    },
    activePeriod: {
      background: colors.primary,
      color: colors.white,
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '30px',
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
    },
    statIcon: {
      width: '50px',
      height: '50px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    statValue: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: colors.textPrimary,
    },
    statLabel: {
      fontSize: '0.9rem',
      color: colors.textLight,
    },
    chartsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '20px',
      marginBottom: '20px',
    },
    chartCard: {
      background: colors.white,
      padding: '20px',
      borderRadius: '16px',
      border: `1px solid ${colors.border}`,
    },
    chartTitle: {
      fontSize: '1.1rem',
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: '15px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    chartContainer: {
      height: '300px',
      position: 'relative',
    },
    fullWidth: {
      gridColumn: 'span 2',
    },
    messageBox: {
      padding: '12px 20px',
      borderRadius: '8px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    errorMessage: {
      background: `${colors.error}10`,
      border: `1px solid ${colors.error}`,
      color: colors.error,
    },
    successMessage: {
      background: `${colors.success}10`,
      border: `1px solid ${colors.success}`,
      color: colors.success,
    },
    // Feedback specific styles
    feedbackStats: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '15px',
      marginTop: '20px',
    },
    feedbackCard: {
      background: colors.white,
      padding: '15px',
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
      textAlign: 'center',
    },
    feedbackValue: {
      fontSize: '2rem',
      fontWeight: '700',
      color: colors.primary,
    },
    feedbackLabel: {
      fontSize: '0.85rem',
      color: colors.textLight,
    },
    ratingStars: {
      display: 'flex',
      gap: '2px',
      justifyContent: 'center',
      marginTop: '5px',
    },
    // Order status grid
    statusGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '10px',
      marginTop: '15px',
    },
    statusItem: {
      padding: '10px',
      borderRadius: '8px',
      textAlign: 'center',
    },
    statusValue: {
      fontSize: '1.2rem',
      fontWeight: '600',
    },
    statusLabel: {
      fontSize: '0.8rem',
      color: colors.textLight,
    },
    // Recent feedback list
    recentFeedbackList: {
      marginTop: '15px',
      maxHeight: '200px',
      overflowY: 'auto',
    },
    recentFeedbackItem: {
      padding: '10px',
      borderBottom: `1px solid ${colors.border}`,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    feedbackAvatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      background: colors.bgSecondary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    feedbackContent: {
      flex: 1,
    },
    feedbackName: {
      fontSize: '0.9rem',
      fontWeight: '600',
      color: colors.textPrimary,
    },
    feedbackText: {
      fontSize: '0.8rem',
      color: colors.textLight,
    },
    feedbackTime: {
      fontSize: '0.7rem',
      color: colors.textLight,
    },
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        background: colors.bgPrimary,
        gap: '20px'
      }}>
        <Loader size={50} color={colors.primary} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: colors.textLight }}>Loading analytics dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <h1 style={styles.title}>Analytics Dashboard</h1>
          <button 
            style={styles.refreshButton}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={20} color={colors.primary} className={refreshing ? 'spin' : ''} />
          </button>
        </div>
        <div style={styles.periodSelector}>
          <button
            style={{ ...styles.periodButton, ...(period === 'daily' ? styles.activePeriod : {}) }}
            onClick={() => setPeriod('daily')}
          >
            Daily
          </button>
          <button
            style={{ ...styles.periodButton, ...(period === 'weekly' ? styles.activePeriod : {}) }}
            onClick={() => setPeriod('weekly')}
          >
            Weekly
          </button>
          <button
            style={{ ...styles.periodButton, ...(period === 'monthly' ? styles.activePeriod : {}) }}
            onClick={() => setPeriod('monthly')}
          >
            Monthly
          </button>
          <button
            style={{ ...styles.periodButton, ...(period === 'yearly' ? styles.activePeriod : {}) }}
            onClick={() => setPeriod('yearly')}
          >
            Yearly
          </button>
        </div>
      </div>

      {error && (
        <div style={{ ...styles.messageBox, ...styles.errorMessage }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: `${colors.primary}15` }}>
            <DollarSign size={24} color={colors.primary} />
          </div>
          <div>
            <div style={styles.statValue}>{formatCurrency(stats.totalRevenue)}</div>
            <div style={styles.statLabel}>Total Revenue</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: `${colors.success}15` }}>
            <ShoppingBag size={24} color={colors.success} />
          </div>
          <div>
            <div style={styles.statValue}>{formatNumber(stats.totalOrders)}</div>
            <div style={styles.statLabel}>Total Orders</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: `${colors.info}15` }}>
            <Users size={24} color={colors.info} />
          </div>
          <div>
            <div style={styles.statValue}>{formatNumber(stats.totalUsers)}</div>
            <div style={styles.statLabel}>Total Users</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: `${colors.warning}15` }}>
            <Package size={24} color={colors.warning} />
          </div>
          <div>
            <div style={styles.statValue}>{formatNumber(stats.totalProducts)}</div>
            <div style={styles.statLabel}>Total Products</div>
          </div>
        </div>
      </div>

      {/* Revenue & Orders Charts */}
      <div style={styles.chartsGrid}>
        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>
            <TrendingUp size={20} color={colors.primary} />
            Revenue Trend
          </div>
          <div style={styles.chartContainer}>
            {analytics.revenue.length > 0 ? (
              <Line 
                id="revenue-chart"
                data={revenueChartData} 
                options={chartOptions} 
              />
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: colors.textLight }}>
                No revenue data available
              </div>
            )}
          </div>
        </div>

        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>
            <ShoppingBag size={20} color={colors.primary} />
            Orders Trend
          </div>
          <div style={styles.chartContainer}>
            {analytics.revenue.length > 0 ? (
              <Bar 
                id="orders-chart"
                data={ordersChartData} 
                options={chartOptions} 
              />
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: colors.textLight }}>
                No orders data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status & Feedback Charts */}
      <div style={styles.chartsGrid}>
        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>
            <PieChart size={20} color={colors.primary} />
            Order Status Distribution
          </div>
          <div style={styles.chartContainer}>
            {analytics.statusBreakdown.length > 0 ? (
              <Pie data={statusChartData} options={chartOptions} />
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: colors.textLight }}>
                No status data available
              </div>
            )}
          </div>
          
          {/* Quick Status Summary */}
          <div style={styles.statusGrid}>
            <div style={{ ...styles.statusItem, background: `${colors.warning}10` }}>
              <div style={{ ...styles.statusValue, color: colors.warning }}>{formatNumber(stats.pendingOrders)}</div>
              <div style={styles.statusLabel}>Pending</div>
            </div>
            <div style={{ ...styles.statusItem, background: `${colors.info}10` }}>
              <div style={{ ...styles.statusValue, color: colors.info }}>{formatNumber(stats.processingOrders)}</div>
              <div style={styles.statusLabel}>Processing</div>
            </div>
            <div style={{ ...styles.statusItem, background: `${colors.purple}10` }}>
              <div style={{ ...styles.statusValue, color: colors.purple }}>{formatNumber(stats.shippedOrders)}</div>
              <div style={styles.statusLabel}>Shipped</div>
            </div>
            <div style={{ ...styles.statusItem, background: `${colors.success}10` }}>
              <div style={{ ...styles.statusValue, color: colors.success }}>{formatNumber(stats.deliveredOrders)}</div>
              <div style={styles.statusLabel}>Delivered</div>
            </div>
            <div style={{ ...styles.statusItem, background: `${colors.error}10` }}>
              <div style={{ ...styles.statusValue, color: colors.error }}>{formatNumber(stats.cancelledOrders)}</div>
              <div style={styles.statusLabel}>Cancelled</div>
            </div>
          </div>
        </div>

        {/* Rating Distribution Chart */}
        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>
            <Star size={20} color={colors.primary} />
            Customer Ratings Distribution
          </div>
          <div style={styles.chartContainer}>
            {feedbackStats.total > 0 ? (
              <Bar data={ratingChartData} options={chartOptions} />
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: colors.textLight }}>
                No rating data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Distribution Chart and Feedback Summary */}
      <div style={styles.chartsGrid}>
        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>
            <MessageSquare size={20} color={colors.primary} />
            Feedback Categories
          </div>
          <div style={styles.chartContainer}>
            {Object.keys(feedbackStats.categoryDistribution || {}).length > 0 ? (
              <Doughnut data={categoryChartData} options={chartOptions} />
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: colors.textLight }}>
                No category data available
              </div>
            )}
          </div>
        </div>

        {/* Feedback Stats Summary */}
        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>
            <ThumbsUp size={20} color={colors.primary} />
            Feedback Summary
          </div>
          <div style={{ padding: '20px' }}>
            <div style={styles.feedbackStats}>
              <div style={styles.feedbackCard}>
                <div style={styles.feedbackValue}>{formatNumber(feedbackStats.total)}</div>
                <div style={styles.feedbackLabel}>Total Feedback</div>
              </div>
              <div style={styles.feedbackCard}>
                <div style={{ ...styles.feedbackValue, color: colors.warning }}>{formatNumber(feedbackStats.new)}</div>
                <div style={styles.feedbackLabel}>New</div>
              </div>
              <div style={styles.feedbackCard}>
                <div style={{ ...styles.feedbackValue, color: colors.info }}>{formatNumber(feedbackStats.read)}</div>
                <div style={styles.feedbackLabel}>Read</div>
              </div>
              <div style={styles.feedbackCard}>
                <div style={{ ...styles.feedbackValue, color: colors.success }}>{formatNumber(feedbackStats.replied)}</div>
                <div style={styles.feedbackLabel}>Replied</div>
              </div>
            </div>
            
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: '700', color: colors.primary }}>
                {displayAverageRating(feedbackStats.averageRating)}
              </div>
              <div style={styles.ratingStars}>
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    color={i < Math.round(Number(feedbackStats.averageRating) || 0) ? colors.primary : colors.border}
                    fill={i < Math.round(Number(feedbackStats.averageRating) || 0) ? colors.primary : 'none'}
                  />
                ))}
              </div>
              <div style={{ color: colors.textLight, marginTop: '5px' }}>
                Average Rating
              </div>
            </div>

            {/* Quick Feedback Highlight */}
            {feedbackStats.categoryDistribution?.quick > 0 && (
              <div style={{
                marginTop: '20px',
                padding: '15px',
                background: `${colors.purple}10`,
                borderRadius: '12px',
                border: `1px solid ${colors.purple}`,
                textAlign: 'center'
              }}>
                <Zap size={24} color={colors.purple} />
                <div style={{ fontWeight: '600', color: colors.purple }}>
                  {formatNumber(feedbackStats.categoryDistribution.quick)} Quick Reviews
                </div>
              </div>
            )}

            {/* Recent Feedback */}
            {feedbackStats.recentFeedback && feedbackStats.recentFeedback.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ fontWeight: '600', marginBottom: '10px' }}>Recent Feedback</div>
                <div style={styles.recentFeedbackList}>
                  {feedbackStats.recentFeedback.slice(0, 3).map((feedback, index) => (
                    <div key={index} style={styles.recentFeedbackItem}>
                      <div style={styles.feedbackAvatar}>
                        <UserCheck size={16} color={colors.primary} />
                      </div>
                      <div style={styles.feedbackContent}>
                        <div style={styles.feedbackName}>{feedback.userName || 'Anonymous'}</div>
                        <div style={styles.feedbackText}>{feedback.message?.substring(0, 50)}...</div>
                      </div>
                      <div style={styles.feedbackTime}>
                        {feedback.createdAt ? new Date(feedback.createdAt).toLocaleDateString() : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Analytics;