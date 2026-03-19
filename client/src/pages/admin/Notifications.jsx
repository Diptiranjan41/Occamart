// src/components/Notifications.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Bell,
  Send,
  Users,
  UserCheck,
  ShoppingBag,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Filter,
  Search,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Copy,
  Loader,
  Mail,
  Star,
  Heart,
  Gift,
  Percent,
  Tag,
  Megaphone,
  BarChart3,
  PieChart,
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  Upload,
  Flag,
  Target,
  DollarSign,
  CreditCard,
  Truck,
  Package,
  Layers,
  ThumbsUp,
  MessageCircle,
  Headphones,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  MapPin,
  Home,
  Briefcase,
  Coffee,
  Cake,
  ShoppingCart,
  Shield,
  Lock,
  Book,
  Lightbulb,
  Zap,
  Wrench,
  PenTool,
  FileText,
  HelpCircle,
  Trophy,
  ThumbsDown,
  RefreshCw as RefreshIcon
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

// Custom date formatting function
const formatDate = (dateString, format = 'full') => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = monthNames[date.getMonth()];
    
    if (format === 'short') {
      return `${day}/${month}/${year}`;
    } else if (format === 'time') {
      return `${hours}:${minutes}`;
    } else if (format === 'datetime') {
      return `${day} ${monthName} ${year}, ${hours}:${minutes}`;
    } else {
      return `${day} ${monthName} ${year}, ${hours}:${minutes}`;
    }
  } catch (error) {
    return 'Invalid Date';
  }
};

// Format relative time
const formatRelativeTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
    if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
  } catch (error) {
    return 'N/A';
  }
};

// Helper function to check if user is admin
const isAdmin = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user?.role === 'admin';
};

const Notifications = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('month');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);
  
  // New notification form state
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'promotional',
    targetAudience: 'all',
    specificUsers: [],
    userSegments: [],
    scheduledFor: '',
    isScheduled: false,
    priority: 'normal',
    image: '',
    actionUrl: '',
    actionButton: 'View Details',
    deepLink: '',
    expiresAt: ''
  });

  // Templates state
  const [templates, setTemplates] = useState([]);
  const [showOnlyUserNotifications, setShowOnlyUserNotifications] = useState(true);

  // Notification stats
  const [notificationStats, setNotificationStats] = useState({
    total: 0,
    sent: 0,
    pending: 0,
    failed: 0,
    scheduled: 0,
    opened: 0,
    clicked: 0,
    conversionRate: 0,
    openRate: 0,
    clickRate: 0
  });

  // Toast message for better UX
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Check if we're on payment page - don't fetch if true
  const isPaymentPage = location.pathname.includes('/payment') || 
                        location.pathname.includes('/checkout');

  const colors = {
    bgPrimary: '#FAF7F2',
    bgSecondary: '#F5F0E8',
    primary: '#D4AF37',
    primaryDark: '#B8962E',
    primaryLight: '#E5C97A',
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
    cyan: '#06B6D4',
    indigo: '#6366F1',
    violet: '#8B5CF6',
    fuchsia: '#D946EF',
    rose: '#F43F5E',
    amber: '#F59E0B',
    lime: '#84CC16',
    emerald: '#10B981',
    sky: '#0EA5E9',
    blue: '#3B82F6'
  };

  const notificationTypeColors = {
    'promotional': colors.primary,
    'transactional': colors.info,
    'alert': colors.warning,
    'reminder': colors.purple,
    'newsletter': colors.success,
    'update': colors.pink,
    'event': colors.orange,
    'offer': colors.teal,
    'discount': colors.cyan,
    'announcement': colors.indigo,
    'feedback': colors.violet,
    'survey': colors.fuchsia,
    'review': colors.rose,
    'recommendation': colors.amber,
    'personalized': colors.lime,
    'seasonal': colors.emerald,
    'holiday': colors.sky,
    'birthday': colors.blue,
    'anniversary': colors.purple,
    'achievement': colors.success,
    'milestone': colors.primary,
    'reward': colors.warning,
    'points': colors.info,
    'payment': colors.info,
    'invoice': colors.purple,
    'receipt': colors.pink,
    'refund': colors.success,
    'cancellation': colors.error,
    'shipped': colors.info,
    'delivered': colors.success,
    'return': colors.warning,
    'support': colors.pink,
    'help': colors.primary,
    'guide': colors.teal,
    'tip': colors.amber
  };

  const notificationTypeLabels = {
    'promotional': 'Promotional',
    'transactional': 'Transactional',
    'alert': 'Alert',
    'reminder': 'Reminder',
    'newsletter': 'Newsletter',
    'update': 'Update',
    'event': 'Event',
    'offer': 'Offer',
    'discount': 'Discount',
    'announcement': 'Announcement',
    'feedback': 'Feedback',
    'survey': 'Survey',
    'review': 'Review',
    'recommendation': 'Recommendation',
    'personalized': 'Personalized',
    'seasonal': 'Seasonal',
    'holiday': 'Holiday',
    'birthday': 'Birthday',
    'anniversary': 'Anniversary',
    'achievement': 'Achievement',
    'milestone': 'Milestone',
    'reward': 'Reward',
    'points': 'Points',
    'payment': 'Payment',
    'invoice': 'Invoice',
    'receipt': 'Receipt',
    'refund': 'Refund',
    'cancellation': 'Cancellation',
    'shipped': 'Shipped',
    'delivered': 'Delivered',
    'return': 'Return',
    'support': 'Support',
    'help': 'Help',
    'guide': 'Guide',
    'tip': 'Tip'
  };

  const notificationStatusColors = {
    'sent': colors.success,
    'delivered': colors.success,
    'pending': colors.warning,
    'scheduled': colors.info,
    'failed': colors.error,
    'cancelled': colors.error,
    'draft': colors.textLight,
    'processing': colors.primary,
    'queued': colors.purple,
    'expired': colors.textLight
  };

  const notificationStatusLabels = {
    'sent': 'Sent',
    'delivered': 'Delivered',
    'pending': 'Pending',
    'scheduled': 'Scheduled',
    'failed': 'Failed',
    'cancelled': 'Cancelled',
    'draft': 'Draft',
    'processing': 'Processing',
    'queued': 'Queued',
    'expired': 'Expired'
  };

  const targetAudienceOptions = [
    { value: 'all', label: 'All Users', icon: <Users size={16} />, count: 2547 },
    { value: 'active', label: 'Active Users', icon: <UserCheck size={16} />, count: 1234 },
    { value: 'new', label: 'New Users', icon: <Award size={16} />, count: 156 },
    { value: 'customers', label: 'Customers', icon: <ShoppingBag size={16} />, count: 987 },
    { value: 'subscribers', label: 'Subscribers', icon: <Mail size={16} />, count: 1876 },
    { value: 'premium', label: 'Premium Users', icon: <Star size={16} />, count: 345 },
    { value: 'vip', label: 'VIP Users', icon: <Award size={16} />, count: 89 },
    { value: 'inactive', label: 'Inactive Users', icon: <Clock size={16} />, count: 890 }
  ];

  // Simplified templates for demo
  const notificationTemplates = [
    { id: 'welcome_1', title: 'Welcome to OccaMart', message: 'Welcome to OccaMart! Get 10% off on your first order with code WELCOME10', type: 'promotional', category: 'welcome' },
    { id: 'order_confirmation', title: 'Order Confirmed', message: 'Your order #{orderNumber} has been confirmed. Track your order here.', type: 'transactional', category: 'order' },
    { id: 'order_shipped', title: 'Order Shipped', message: 'Your order #{orderNumber} has been shipped! Track it here.', type: 'transactional', category: 'order' },
    { id: 'order_delivered', title: 'Order Delivered', message: 'Your order #{orderNumber} has been delivered. Rate your experience!', type: 'transactional', category: 'order' },
    { id: 'cart_abandoned', title: 'Complete Your Purchase', message: 'You left items in your cart. Complete your purchase now!', type: 'reminder', category: 'cart' },
    { id: 'flash_sale', title: 'Flash Sale Alert!', message: '24-hour flash sale! Up to 50% off on selected items. Shop now!', type: 'promotional', category: 'promo' },
    { id: 'price_drop', title: 'Price Drop Alert', message: 'Items in your wishlist are now at lower prices. Check them out!', type: 'alert', category: 'product' },
    { id: 'back_in_stock', title: 'Back in Stock', message: 'Items you were looking for are back in stock. Order now!', type: 'alert', category: 'product' },
    { id: 'birthday_reward', title: 'Happy Birthday!', message: 'Happy Birthday! Enjoy a special 20% off on your birthday month.', type: 'birthday', category: 'loyalty' },
    { id: 'payment_success', title: 'Payment Successful', message: 'Your payment of ${amount} was successful', type: 'transactional', category: 'payment' },
    { id: 'payment_failed', title: 'Payment Failed', message: 'Your payment failed. Please update your payment method', type: 'alert', category: 'payment' },
    { id: 'review_request', title: 'Review Your Purchase', message: 'How was your experience with #{productName}? Leave a review!', type: 'feedback', category: 'feedback' }
  ];

  // User notifications (for regular users)
  const userNotifications = [
    {
      id: 'user_notif_1',
      _id: 'user_notif_1',
      title: 'Order Confirmed',
      message: 'Your order #ORD12345 has been confirmed',
      type: 'transactional',
      status: 'sent',
      targetAudience: 'user',
      sentAt: new Date('2024-03-15T10:30:00')
    },
    {
      id: 'user_notif_2',
      _id: 'user_notif_2',
      title: 'Flash Sale!',
      message: '24-hour flash sale on electronics',
      type: 'promotional',
      status: 'sent',
      targetAudience: 'all',
      sentAt: new Date('2024-03-14T09:15:00')
    },
    {
      id: 'user_notif_3',
      _id: 'user_notif_3',
      title: 'Order Shipped',
      message: 'Your order #ORD12345 has been shipped',
      type: 'transactional',
      status: 'sent',
      targetAudience: 'user',
      sentAt: new Date('2024-03-13T14:20:00')
    },
    {
      id: 'user_notif_4',
      _id: 'user_notif_4',
      title: 'Price Drop Alert',
      message: 'An item in your wishlist is now 20% off',
      type: 'alert',
      status: 'sent',
      targetAudience: 'user',
      sentAt: new Date('2024-03-12T11:45:00')
    },
    {
      id: 'user_notif_5',
      _id: 'user_notif_5',
      title: 'Birthday Special',
      message: 'Happy Birthday! Enjoy 20% off on your next purchase',
      type: 'birthday',
      status: 'scheduled',
      targetAudience: 'user',
      scheduledFor: new Date('2024-03-20T00:00:00')
    }
  ];

  useEffect(() => {
    // Don't fetch notifications on payment page
    if (isPaymentPage) {
      setLoading(false);
      return;
    }
    
    // Check if user is admin before fetching admin data
    if (isAdmin()) {
      fetchNotifications();
      fetchNotificationStats();
      fetchTemplates();
    } else {
      // For regular users, show only their notifications
      setNotifications(userNotifications);
      setFilteredNotifications(userNotifications);
      setLoading(false);
    }
  }, [currentPage, typeFilter, statusFilter, dateRange, isPaymentPage]);

  useEffect(() => {
    filterNotifications();
  }, [searchTerm, notifications]);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    if (type === 'success') {
      setSuccess(message);
    } else if (type === 'error') {
      setError(message);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const fetchNotifications = async () => {
    // Only admin can fetch all notifications
    if (!isAdmin()) {
      setNotifications(userNotifications);
      setFilteredNotifications(userNotifications);
      return;
    }

    setLoading(true);
    clearMessages();
    try {
      const params = {
        page: currentPage,
        limit: 10,
        sort: 'newest'
      };

      if (typeFilter !== 'all') {
        params.type = typeFilter;
      }

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      // Add date range filter
      if (dateRange !== 'all') {
        const dates = getDateRange(dateRange);
        if (dates) {
          params.startDate = dates.startDate.toISOString();
          params.endDate = dates.endDate.toISOString();
        }
      }

      const response = await api.get('/notifications', { params });

      if (response.data.success) {
        // Ensure each notification has an id (use _id from MongoDB)
        const notificationsWithId = response.data.notifications.map(notif => ({
          ...notif,
          id: notif._id || notif.id
        }));
        setNotifications(notificationsWithId);
        setFilteredNotifications(notificationsWithId);
        setTotalPages(response.data.totalPages);
        setTotalNotifications(response.data.total);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      
      // If 403 error (forbidden), show only user notifications
      if (error.response?.status === 403) {
        console.log('Admin access denied - showing user notifications');
        setNotifications(userNotifications);
        setFilteredNotifications(userNotifications);
      } else {
        setError('Failed to load notifications');
        // Use mock data for demo
        setNotifications(userNotifications);
        setFilteredNotifications(userNotifications);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchNotificationStats = async () => {
    // Only admin can fetch stats
    if (!isAdmin()) return;

    try {
      const response = await api.get('/notifications/stats');
      if (response.data.success) {
        setNotificationStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      // Set default stats for demo
      setNotificationStats({
        total: 156,
        sent: 142,
        pending: 8,
        failed: 6,
        scheduled: 12,
        opened: 89,
        clicked: 45,
        openRate: 62.7,
        clickRate: 31.7,
        conversionRate: 12.3
      });
    }
  };

  const fetchTemplates = async () => {
    // Only admin can fetch templates
    if (!isAdmin()) return;

    try {
      const response = await api.get('/notifications/templates');
      if (response.data.success) {
        setTemplates(response.data.templates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      setTemplates(notificationTemplates);
    }
  };

  const filterNotifications = () => {
    if (!searchTerm.trim()) {
      setFilteredNotifications(notifications);
      return;
    }

    const filtered = notifications.filter(notification => {
      const searchLower = searchTerm.toLowerCase();
      return (
        notification.title?.toLowerCase().includes(searchLower) ||
        notification.message?.toLowerCase().includes(searchLower) ||
        notification.type?.toLowerCase().includes(searchLower) ||
        notification.status?.toLowerCase().includes(searchLower)
      );
    });

    setFilteredNotifications(filtered);
  };

  const getDateRange = (range) => {
    const today = new Date();
    const startDate = new Date();
    const endDate = new Date();

    switch (range) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        return { startDate, endDate };
      case 'week':
        startDate.setDate(today.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        return { startDate, endDate };
      case 'month':
        startDate.setMonth(today.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        return { startDate, endDate };
      case 'quarter':
        startDate.setMonth(today.getMonth() - 3);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        return { startDate, endDate };
      case 'year':
        startDate.setFullYear(today.getFullYear() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        return { startDate, endDate };
      case 'all':
      default:
        return null;
    }
  };

  const handleRefresh = () => {
    if (isPaymentPage) return;
    setRefreshing(true);
    clearMessages();
    
    if (isAdmin()) {
      fetchNotifications();
      fetchNotificationStats();
    } else {
      setNotifications(userNotifications);
      setFilteredNotifications(userNotifications);
      setRefreshing(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleTypeFilterChange = (type) => {
    setTypeFilter(type);
    setCurrentPage(1);
    clearMessages();
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
    clearMessages();
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    setCurrentPage(1);
    clearMessages();
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      clearMessages();
    }
  };

  const handleViewDetails = (notification) => {
    if (!notification) {
      showToast('Cannot view: Notification data is missing', 'error');
      return;
    }
    setSelectedNotification(notification);
    setShowDetailsModal(true);
  };

  const handleCreateNotification = () => {
    // Only admin can create notifications
    if (!isAdmin()) {
      showToast('Only admins can create notifications', 'error');
      return;
    }

    setNotificationForm({
      title: '',
      message: '',
      type: 'promotional',
      targetAudience: 'all',
      specificUsers: [],
      userSegments: [],
      scheduledFor: '',
      isScheduled: false,
      priority: 'normal',
      image: '',
      actionUrl: '',
      actionButton: 'View Details',
      deepLink: '',
      expiresAt: ''
    });
    setSelectedNotification(null);
    setShowCreateModal(true);
    clearMessages();
  };

  const handleEditNotification = (notification) => {
    // Only admin can edit notifications
    if (!isAdmin()) {
      showToast('Only admins can edit notifications', 'error');
      return;
    }

    if (!notification) {
      showToast('Cannot edit: Notification data is missing', 'error');
      return;
    }
    
    setNotificationForm({
      title: notification.title || '',
      message: notification.message || '',
      type: notification.type || 'promotional',
      targetAudience: notification.targetAudience || 'all',
      specificUsers: notification.specificUsers || [],
      userSegments: notification.userSegments || [],
      scheduledFor: notification.scheduledFor || '',
      isScheduled: !!notification.scheduledFor,
      priority: notification.priority || 'normal',
      image: notification.image || '',
      actionUrl: notification.actionUrl || '',
      actionButton: notification.actionButton || 'View Details',
      deepLink: notification.deepLink || '',
      expiresAt: notification.expiresAt || ''
    });
    setSelectedNotification(notification);
    setShowCreateModal(true);
    clearMessages();
  };

  const handleUseTemplate = (template) => {
    // Only admin can use templates
    if (!isAdmin()) {
      showToast('Only admins can use templates', 'error');
      return;
    }

    setNotificationForm({
      title: template.title,
      message: template.message,
      type: template.type,
      targetAudience: 'all',
      specificUsers: [],
      userSegments: [],
      scheduledFor: '',
      isScheduled: false,
      priority: 'normal',
      image: '',
      actionUrl: '',
      actionButton: 'View Details',
      deepLink: '',
      expiresAt: ''
    });
    setShowTemplateModal(false);
    setShowCreateModal(true);
    showToast('Template applied successfully!', 'success');
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNotificationForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleArrayInputChange = (name, value) => {
    setNotificationForm(prev => ({
      ...prev,
      [name]: value.split(',').map(item => item.trim())
    }));
  };

  const sendNotification = async () => {
    // Only admin can send notifications
    if (!isAdmin()) {
      showToast('Only admins can send notifications', 'error');
      return;
    }

    setSendingNotification(true);
    clearMessages();

    try {
      // Validate form
      if (!notificationForm.title.trim()) {
        throw new Error('Title is required');
      }
      if (!notificationForm.message.trim()) {
        throw new Error('Message is required');
      }

      const response = await api.post('/notifications/send', notificationForm);

      if (response.data.success) {
        showToast('Notification sent successfully!', 'success');
        setShowCreateModal(false);
        fetchNotifications();
        fetchNotificationStats();
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send notification';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setSendingNotification(false);
    }
  };

  const scheduleNotification = async () => {
    // Only admin can schedule notifications
    if (!isAdmin()) {
      showToast('Only admins can schedule notifications', 'error');
      return;
    }

    setSendingNotification(true);
    clearMessages();

    try {
      // Validate form
      if (!notificationForm.title.trim()) {
        throw new Error('Title is required');
      }
      if (!notificationForm.message.trim()) {
        throw new Error('Message is required');
      }
      if (!notificationForm.scheduledFor) {
        throw new Error('Schedule date and time is required');
      }

      const response = await api.post('/notifications/schedule', {
        ...notificationForm,
        scheduledFor: new Date(notificationForm.scheduledFor)
      });

      if (response.data.success) {
        showToast('Notification scheduled successfully!', 'success');
        setShowCreateModal(false);
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to schedule notification';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setSendingNotification(false);
    }
  };

  const cancelNotification = async (id) => {
    // Only admin can cancel notifications
    if (!isAdmin()) {
      showToast('Only admins can cancel notifications', 'error');
      return;
    }

    const notificationId = id?._id || id?.id || id;
    
    if (!notificationId) {
      showToast('Cannot cancel: Notification ID is missing', 'error');
      return;
    }

    if (!window.confirm('Are you sure you want to cancel this notification?')) {
      return;
    }

    clearMessages();
    try {
      const response = await api.put(`/notifications/${notificationId}/cancel`);

      if (response.data.success) {
        showToast('Notification cancelled successfully', 'success');
        fetchNotifications();
        fetchNotificationStats();
      }
    } catch (error) {
      console.error('Error cancelling notification:', error);
      const errorMessage = error.response?.data?.message || 'Failed to cancel notification';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  const deleteNotification = async (id) => {
    // Only admin can delete notifications
    if (!isAdmin()) {
      showToast('Only admins can delete notifications', 'error');
      return;
    }

    const notificationId = id?._id || id?.id || id;
    
    if (!notificationId) {
      showToast('Cannot delete: Notification ID is missing', 'error');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this notification? This action cannot be undone.')) {
      return;
    }

    clearMessages();
    try {
      const response = await api.delete(`/notifications/${notificationId}`);

      if (response.data.success) {
        showToast('Notification deleted successfully', 'success');
        fetchNotifications();
        fetchNotificationStats();
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete notification';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  const duplicateNotification = (notification) => {
    // Only admin can duplicate notifications
    if (!isAdmin()) {
      showToast('Only admins can duplicate notifications', 'error');
      return;
    }

    setNotificationForm({
      title: `${notification.title} (Copy)`,
      message: notification.message,
      type: notification.type,
      targetAudience: notification.targetAudience || 'all',
      specificUsers: notification.specificUsers || [],
      userSegments: notification.userSegments || [],
      scheduledFor: '',
      isScheduled: false,
      priority: notification.priority || 'normal',
      image: notification.image || '',
      actionUrl: notification.actionUrl || '',
      actionButton: notification.actionButton || 'View Details',
      deepLink: notification.deepLink || '',
      expiresAt: notification.expiresAt || ''
    });
    setShowCreateModal(true);
    showToast('Notification duplicated! Edit and send.', 'success');
  };

  const getRecipientCount = (audience) => {
    const option = targetAudienceOptions.find(o => o.value === audience);
    return option ? `${option.count} users` : '0 users';
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'promotional':
        return <Tag size={14} />;
      case 'transactional':
        return <ShoppingBag size={14} />;
      case 'alert':
        return <AlertCircle size={14} />;
      case 'reminder':
        return <Clock size={14} />;
      case 'newsletter':
        return <Mail size={14} />;
      case 'update':
        return <RefreshCw size={14} />;
      case 'event':
        return <Calendar size={14} />;
      case 'offer':
        return <Gift size={14} />;
      case 'discount':
        return <Percent size={14} />;
      case 'announcement':
        return <Megaphone size={14} />;
      case 'feedback':
        return <MessageCircle size={14} />;
      case 'survey':
        return <BarChart3 size={14} />;
      case 'review':
        return <Star size={14} />;
      case 'recommendation':
        return <ThumbsUp size={14} />;
      case 'personalized':
        return <UserCheck size={14} />;
      case 'seasonal':
        return <Calendar size={14} />;
      case 'holiday':
        return <Gift size={14} />;
      case 'birthday':
        return <Cake size={14} />;
      case 'anniversary':
        return <Award size={14} />;
      case 'achievement':
        return <Trophy size={14} />;
      case 'milestone':
        return <Flag size={14} />;
      case 'reward':
        return <Award size={14} />;
      case 'points':
        return <Star size={14} />;
      case 'payment':
        return <CreditCard size={14} />;
      case 'invoice':
        return <FileText size={14} />;
      case 'receipt':
        return <FileText size={14} />;
      case 'refund':
        return <RefreshCw size={14} />;
      case 'cancellation':
        return <XCircle size={14} />;
      case 'shipped':
        return <Truck size={14} />;
      case 'delivered':
        return <Package size={14} />;
      case 'return':
        return <RefreshCw size={14} />;
      case 'support':
        return <Headphones size={14} />;
      case 'help':
        return <HelpCircle size={14} />;
      case 'guide':
        return <Book size={14} />;
      case 'tip':
        return <Lightbulb size={14} />;
      default:
        return <Bell size={14} />;
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: colors.bgPrimary,
      padding: '30px',
      position: 'relative',
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
    adminBadge: {
      padding: '4px 12px',
      background: colors.primary,
      color: colors.white,
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: '600',
      marginLeft: '10px',
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
    engagementStats: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '15px',
      marginBottom: '30px',
    },
    engagementCard: {
      background: colors.white,
      padding: '15px',
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
      textAlign: 'center',
    },
    engagementValue: {
      fontSize: '1.8rem',
      fontWeight: '700',
      color: colors.primary,
    },
    engagementLabel: {
      fontSize: '0.9rem',
      color: colors.textLight,
      marginTop: '5px',
    },
    engagementProgress: {
      marginTop: '10px',
      height: '6px',
      background: colors.border,
      borderRadius: '3px',
      overflow: 'hidden',
    },
    engagementFill: {
      height: '100%',
      background: colors.primary,
      borderRadius: '3px',
    },
    filtersContainer: {
      display: 'flex',
      gap: '15px',
      marginBottom: '20px',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    searchBox: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      background: colors.white,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      padding: '0 15px',
      flex: 1,
      minWidth: '300px',
    },
    searchInput: {
      border: 'none',
      padding: '12px 0',
      fontSize: '0.95rem',
      width: '100%',
      outline: 'none',
      background: 'transparent',
    },
    filterGroup: {
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap',
    },
    filterButton: {
      padding: '8px 16px',
      border: `1px solid ${colors.border}`,
      borderRadius: '20px',
      background: colors.white,
      color: colors.textSecondary,
      cursor: 'pointer',
      fontSize: '0.9rem',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    activeFilter: {
      background: colors.primary,
      color: colors.white,
      borderColor: colors.primary,
    },
    tableContainer: {
      background: colors.white,
      borderRadius: '16px',
      border: `1px solid ${colors.border}`,
      overflow: 'auto',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    th: {
      padding: '16px',
      textAlign: 'left',
      borderBottom: `2px solid ${colors.border}`,
      color: colors.textSecondary,
      fontWeight: '600',
      fontSize: '0.9rem',
    },
    td: {
      padding: '16px',
      borderBottom: `1px solid ${colors.border}`,
    },
    typeBadge: {
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: '0.8rem',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
    },
    statusBadge: {
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: '0.8rem',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
    },
    actionButton: {
      padding: '6px',
      border: `1px solid ${colors.border}`,
      borderRadius: '6px',
      background: 'transparent',
      cursor: 'pointer',
      marginRight: '5px',
      transition: 'all 0.3s ease',
    },
    pagination: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '10px',
      marginTop: '20px',
    },
    pageButton: {
      padding: '8px 12px',
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      background: colors.white,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    activePage: {
      background: colors.primary,
      color: colors.white,
      borderColor: colors.primary,
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modal: {
      background: colors.white,
      borderRadius: '16px',
      padding: '30px',
      maxWidth: '700px',
      width: '90%',
      maxHeight: '80vh',
      overflow: 'auto',
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
    },
    modalTitle: {
      fontSize: '1.5rem',
      fontWeight: '600',
      color: colors.textPrimary,
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '1.5rem',
      cursor: 'pointer',
      color: colors.textLight,
    },
    infoGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '15px',
      marginBottom: '20px',
    },
    infoItem: {
      padding: '10px',
      background: colors.bgSecondary,
      borderRadius: '8px',
    },
    infoLabel: {
      fontSize: '0.85rem',
      color: colors.textLight,
      marginBottom: '4px',
    },
    infoValue: {
      fontSize: '1rem',
      fontWeight: '500',
      color: colors.textPrimary,
    },
    formGroup: {
      marginBottom: '15px',
    },
    formLabel: {
      display: 'block',
      marginBottom: '5px',
      fontSize: '0.9rem',
      color: colors.textSecondary,
    },
    formInput: {
      width: '100%',
      padding: '10px',
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      fontSize: '0.95rem',
    },
    formSelect: {
      width: '100%',
      padding: '10px',
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      fontSize: '0.95rem',
      background: colors.white,
    },
    formTextarea: {
      width: '100%',
      padding: '10px',
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      fontSize: '0.95rem',
      minHeight: '100px',
    },
    formRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '10px',
    },
    checkboxGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '10px',
    },
    checkbox: {
      width: '18px',
      height: '18px',
      cursor: 'pointer',
    },
    modalActions: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'flex-end',
      marginTop: '20px',
    },
    primaryButton: {
      padding: '12px 24px',
      background: colors.primary,
      color: colors.white,
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    secondaryButton: {
      padding: '12px 24px',
      background: colors.white,
      color: colors.textSecondary,
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    successButton: {
      padding: '12px 24px',
      background: colors.success,
      color: colors.white,
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '600',
    },
    dangerButton: {
      padding: '12px 24px',
      background: colors.error,
      color: colors.white,
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '600',
    },
    messageBox: {
      padding: '12px 20px',
      borderRadius: '8px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      animation: 'slideIn 0.3s ease',
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
    templateGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '15px',
      marginTop: '20px',
      maxHeight: '400px',
      overflow: 'auto',
    },
    templateCard: {
      padding: '15px',
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      background: colors.white,
    },
    templateTitle: {
      fontSize: '1rem',
      fontWeight: '600',
      marginBottom: '5px',
      color: colors.textPrimary,
    },
    templateMessage: {
      fontSize: '0.9rem',
      color: colors.textLight,
      marginBottom: '10px',
    },
    templateType: {
      fontSize: '0.8rem',
    },
    toast: {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 24px',
      borderRadius: '8px',
      background: colors.white,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      zIndex: 2000,
      animation: 'slideInRight 0.3s ease',
      borderLeft: `4px solid ${colors.success}`,
    },
    toastError: {
      borderLeft: `4px solid ${colors.error}`,
    },
    userMessage: {
      background: colors.bgSecondary,
      padding: '20px',
      borderRadius: '12px',
      textAlign: 'center',
      marginBottom: '20px',
    }
  };

  // If on payment page, don't render anything
  if (isPaymentPage) {
    return null;
  }

  if (loading && !refreshing) {
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
        <p style={{ color: colors.textLight }}>Loading notifications...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          ...styles.toast,
          ...(toast.type === 'error' ? styles.toastError : {})
        }}>
          {toast.type === 'success' ? (
            <CheckCircle size={20} color={colors.success} />
          ) : (
            <AlertCircle size={20} color={colors.error} />
          )}
          <span style={{ color: colors.textPrimary }}>{toast.message}</span>
        </div>
      )}

      <div style={styles.header}>
        <div style={styles.titleSection}>
          <h1 style={styles.title}>Notifications</h1>
          {isAdmin() && <span style={styles.adminBadge}>Admin</span>}
          <button 
            style={styles.refreshButton}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={20} color={colors.primary} className={refreshing ? 'spin' : ''} />
          </button>
        </div>
        {isAdmin() && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              style={styles.secondaryButton}
              onClick={() => setShowTemplateModal(true)}
            >
              <Copy size={18} />
              Templates
            </button>
            <button 
              style={styles.primaryButton}
              onClick={handleCreateNotification}
            >
              <Send size={18} />
              New Notification
            </button>
          </div>
        )}
      </div>

      {/* User info message */}
      {!isAdmin() && (
        <div style={styles.userMessage}>
          <Bell size={24} color={colors.primary} />
          <p style={{ marginTop: '10px', color: colors.textSecondary }}>
            Showing your recent notifications
          </p>
        </div>
      )}

      {/* Stats Cards - Only for admin */}
      {isAdmin() && (
        <>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={{ ...styles.statIcon, background: `${colors.primary}15` }}>
                <Bell size={24} color={colors.primary} />
              </div>
              <div>
                <div style={styles.statValue}>{notificationStats.total}</div>
                <div style={styles.statLabel}>Total Notifications</div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={{ ...styles.statIcon, background: `${colors.success}15` }}>
                <CheckCircle size={24} color={colors.success} />
              </div>
              <div>
                <div style={styles.statValue}>{notificationStats.sent}</div>
                <div style={styles.statLabel}>Sent</div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={{ ...styles.statIcon, background: `${colors.warning}15` }}>
                <Clock size={24} color={colors.warning} />
              </div>
              <div>
                <div style={styles.statValue}>{notificationStats.pending}</div>
                <div style={styles.statLabel}>Pending</div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={{ ...styles.statIcon, background: `${colors.info}15` }}>
                <Calendar size={24} color={colors.info} />
              </div>
              <div>
                <div style={styles.statValue}>{notificationStats.scheduled}</div>
                <div style={styles.statLabel}>Scheduled</div>
              </div>
            </div>
          </div>

          {/* Engagement Stats */}
          <div style={styles.engagementStats}>
            <div style={styles.engagementCard}>
              <div style={styles.engagementValue}>{notificationStats.openRate}%</div>
              <div style={styles.engagementLabel}>Open Rate</div>
              <div style={styles.engagementProgress}>
                <div style={{ ...styles.engagementFill, width: `${notificationStats.openRate}%` }} />
              </div>
            </div>

            <div style={styles.engagementCard}>
              <div style={styles.engagementValue}>{notificationStats.clickRate}%</div>
              <div style={styles.engagementLabel}>Click Rate</div>
              <div style={styles.engagementProgress}>
                <div style={{ ...styles.engagementFill, width: `${notificationStats.clickRate}%` }} />
              </div>
            </div>

            <div style={styles.engagementCard}>
              <div style={styles.engagementValue}>{notificationStats.conversionRate}%</div>
              <div style={styles.engagementLabel}>Conversion Rate</div>
              <div style={styles.engagementProgress}>
                <div style={{ ...styles.engagementFill, width: `${notificationStats.conversionRate}%` }} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div style={{ ...styles.messageBox, ...styles.errorMessage }}>
          <AlertCircle size={20} />
          <span>{error}</span>
          <button 
            onClick={() => setError(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <XCircle size={16} color={colors.error} />
          </button>
        </div>
      )}

      {success && (
        <div style={{ ...styles.messageBox, ...styles.successMessage }}>
          <CheckCircle size={20} />
          <span>{success}</span>
          <button 
            onClick={() => setSuccess(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <XCircle size={16} color={colors.success} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={styles.filtersContainer}>
        <div style={styles.searchBox}>
          <Search size={20} color={colors.textLight} />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={handleSearch}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterGroup}>
          <select
            value={typeFilter}
            onChange={(e) => handleTypeFilterChange(e.target.value)}
            style={{
              ...styles.filterButton,
              minWidth: '120px',
            }}
          >
            <option value="all">All Types</option>
            <option value="promotional">Promotional</option>
            <option value="transactional">Transactional</option>
            <option value="alert">Alert</option>
            <option value="reminder">Reminder</option>
            <option value="newsletter">Newsletter</option>
            <option value="birthday">Birthday</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            style={{
              ...styles.filterButton,
              minWidth: '120px',
            }}
          >
            <option value="all">All Status</option>
            <option value="sent">Sent</option>
            <option value="scheduled">Scheduled</option>
            <option value="pending">Pending</option>
            <option value="draft">Draft</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => handleDateRangeChange(e.target.value)}
            style={{
              ...styles.filterButton,
              minWidth: '120px',
            }}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Notifications Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Title</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Date</th>
              {isAdmin() && <th style={styles.th}>Audience</th>}
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <tr key={notification.id || notification._id}>
                  <td style={styles.td}>
                    <strong>{notification.title}</strong>
                    <div style={{ fontSize: '0.85rem', color: colors.textLight }}>
                      {notification.message?.substring(0, 50)}...
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.typeBadge,
                      background: `${notificationTypeColors[notification.type] || colors.primary}15`,
                      color: notificationTypeColors[notification.type] || colors.primary
                    }}>
                      {getTypeIcon(notification.type)}
                      {notificationTypeLabels[notification.type] || notification.type}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      background: `${notificationStatusColors[notification.status] || colors.textLight}15`,
                      color: notificationStatusColors[notification.status] || colors.textLight
                    }}>
                      {notificationStatusLabels[notification.status] || notification.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {notification.sentAt ? (
                      <div>
                        <div>{formatDate(notification.sentAt, 'short')}</div>
                        <small style={{ color: colors.textLight }}>
                          {formatRelativeTime(notification.sentAt)}
                        </small>
                      </div>
                    ) : notification.scheduledFor ? (
                      <div>
                        <div>{formatDate(notification.scheduledFor, 'short')}</div>
                        <small style={{ color: colors.textLight }}>Scheduled</small>
                      </div>
                    ) : 'N/A'}
                  </td>
                  {isAdmin() && (
                    <td style={styles.td}>
                      {targetAudienceOptions.find(o => o.value === notification.targetAudience)?.label || notification.targetAudience}
                    </td>
                  )}
                  <td style={styles.td}>
                    <button
                      style={styles.actionButton}
                      onClick={() => handleViewDetails(notification)}
                      title="View Details"
                    >
                      <Eye size={14} color={colors.info} />
                    </button>
                    {isAdmin() && (
                      <>
                        <button
                          style={styles.actionButton}
                          onClick={() => handleEditNotification(notification)}
                          title="Edit"
                        >
                          <Edit size={14} color={colors.primary} />
                        </button>
                        <button
                          style={styles.actionButton}
                          onClick={() => duplicateNotification(notification)}
                          title="Duplicate"
                        >
                          <Copy size={14} color={colors.purple} />
                        </button>
                        {notification.status === 'scheduled' && (
                          <button
                            style={styles.actionButton}
                            onClick={() => cancelNotification(notification.id || notification._id)}
                            title="Cancel"
                          >
                            <XCircle size={14} color={colors.warning} />
                          </button>
                        )}
                        <button
                          style={styles.actionButton}
                          onClick={() => deleteNotification(notification.id || notification._id)}
                          title="Delete"
                        >
                          <Trash2 size={14} color={colors.error} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isAdmin() ? "6" : "5"} style={{ textAlign: 'center', padding: '40px' }}>
                  <Bell size={48} color={colors.textLight} />
                  <p style={{ color: colors.textLight, marginTop: '10px' }}>
                    No notifications found
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination - Only for admin */}
      {isAdmin() && totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            style={styles.pageButton}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
          </button>
          
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              style={{
                ...styles.pageButton,
                ...(currentPage === i + 1 ? styles.activePage : {})
              }}
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          
          <button
            style={styles.pageButton}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Create/Edit Notification Modal - Only for admin */}
      {showCreateModal && isAdmin() && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {selectedNotification ? 'Edit Notification' : 'Create New Notification'}
              </h2>
              <button style={styles.closeButton} onClick={() => setShowCreateModal(false)}>
                ×
              </button>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Title *</label>
              <input
                type="text"
                name="title"
                style={styles.formInput}
                value={notificationForm.title}
                onChange={handleFormChange}
                placeholder="e.g., Flash Sale Alert!"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Message *</label>
              <textarea
                name="message"
                style={styles.formTextarea}
                value={notificationForm.message}
                onChange={handleFormChange}
                placeholder="Enter your notification message..."
              />
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Type</label>
                <select
                  name="type"
                  style={styles.formSelect}
                  value={notificationForm.type}
                  onChange={handleFormChange}
                >
                  {Object.entries(notificationTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Target Audience</label>
                <select
                  name="targetAudience"
                  style={styles.formSelect}
                  value={notificationForm.targetAudience}
                  onChange={handleFormChange}
                >
                  {targetAudienceOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Action Button</label>
                <input
                  type="text"
                  name="actionButton"
                  style={styles.formInput}
                  value={notificationForm.actionButton}
                  onChange={handleFormChange}
                  placeholder="View Details"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Action URL</label>
                <input
                  type="text"
                  name="actionUrl"
                  style={styles.formInput}
                  value={notificationForm.actionUrl}
                  onChange={handleFormChange}
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Priority</label>
                <select
                  name="priority"
                  style={styles.formSelect}
                  value={notificationForm.priority}
                  onChange={handleFormChange}
                >
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div style={styles.checkboxGroup}>
              <input
                type="checkbox"
                name="isScheduled"
                id="isScheduled"
                style={styles.checkbox}
                checked={notificationForm.isScheduled}
                onChange={handleFormChange}
              />
              <label htmlFor="isScheduled" style={styles.formLabel}>Schedule for later</label>
            </div>

            {notificationForm.isScheduled && (
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Schedule Date & Time</label>
                <input
                  type="datetime-local"
                  name="scheduledFor"
                  style={styles.formInput}
                  value={notificationForm.scheduledFor}
                  onChange={handleFormChange}
                />
              </div>
            )}

            <div style={styles.modalActions}>
              <button 
                style={styles.secondaryButton} 
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              {notificationForm.isScheduled ? (
                <button 
                  style={styles.primaryButton}
                  onClick={scheduleNotification}
                  disabled={sendingNotification}
                >
                  {sendingNotification ? 'Scheduling...' : 'Schedule Notification'}
                </button>
              ) : (
                <button 
                  style={styles.primaryButton}
                  onClick={sendNotification}
                  disabled={sendingNotification}
                >
                  {sendingNotification ? 'Sending...' : 'Send Now'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notification Details Modal */}
      {showDetailsModal && selectedNotification && (
        <div style={styles.modalOverlay} onClick={() => setShowDetailsModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Notification Details</h2>
              <button style={styles.closeButton} onClick={() => setShowDetailsModal(false)}>
                ×
              </button>
            </div>

            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Title</div>
                <div style={styles.infoValue}>{selectedNotification.title}</div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Type</div>
                <div style={styles.infoValue}>
                  <span style={{
                    ...styles.typeBadge,
                    background: `${notificationTypeColors[selectedNotification.type] || colors.primary}15`,
                    color: notificationTypeColors[selectedNotification.type] || colors.primary
                  }}>
                    {getTypeIcon(selectedNotification.type)}
                    {notificationTypeLabels[selectedNotification.type] || selectedNotification.type}
                  </span>
                </div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Status</div>
                <div style={styles.infoValue}>
                  <span style={{
                    ...styles.statusBadge,
                    background: `${notificationStatusColors[selectedNotification.status] || colors.textLight}15`,
                    color: notificationStatusColors[selectedNotification.status] || colors.textLight
                  }}>
                    {notificationStatusLabels[selectedNotification.status] || selectedNotification.status}
                  </span>
                </div>
              </div>
              {isAdmin() && (
                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>Target Audience</div>
                  <div style={styles.infoValue}>
                    {targetAudienceOptions.find(o => o.value === selectedNotification.targetAudience)?.label || selectedNotification.targetAudience}
                  </div>
                </div>
              )}
            </div>

            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>Message</div>
              <div style={{ ...styles.infoValue, whiteSpace: 'pre-wrap' }}>
                {selectedNotification.message}
              </div>
            </div>

            <div style={styles.modalActions}>
              <button style={styles.secondaryButton} onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
              {isAdmin() && selectedNotification.status === 'scheduled' && (
                <button 
                  style={styles.dangerButton}
                  onClick={() => {
                    cancelNotification(selectedNotification.id || selectedNotification._id);
                    setShowDetailsModal(false);
                  }}
                >
                  Cancel Notification
                </button>
              )}
              {isAdmin() && (
                <button 
                  style={styles.primaryButton}
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleEditNotification(selectedNotification);
                  }}
                >
                  <Edit size={16} />
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal - Only for admin */}
      {showTemplateModal && isAdmin() && (
        <div style={styles.modalOverlay} onClick={() => setShowTemplateModal(false)}>
          <div style={{ ...styles.modal, maxWidth: '900px' }} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Notification Templates</h2>
              <button style={styles.closeButton} onClick={() => setShowTemplateModal(false)}>
                ×
              </button>
            </div>

            <p style={{ marginBottom: '20px', color: colors.textLight }}>
              Choose a template to get started quickly
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '15px',
              maxHeight: '500px',
              overflow: 'auto',
              padding: '5px'
            }}>
              {templates.map((template) => (
                <div
                  key={template.id}
                  style={{
                    ...styles.templateCard,
                    ':hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      borderColor: colors.primary
                    }
                  }}
                  onClick={() => handleUseTemplate(template)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <div style={styles.templateTitle}>{template.title}</div>
                      <span style={{
                        ...styles.typeBadge,
                        background: `${notificationTypeColors[template.type] || colors.primary}15`,
                        color: notificationTypeColors[template.type] || colors.primary,
                        fontSize: '0.7rem'
                      }}>
                        {notificationTypeLabels[template.type] || template.type}
                      </span>
                    </div>
                  </div>
                  <div style={styles.templateMessage}>{template.message}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        button:hover:not(:disabled) {
          opacity: 0.8;
          transform: translateY(-2px);
        }
        div[style*="cursor: pointer"]:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
};

export default Notifications;