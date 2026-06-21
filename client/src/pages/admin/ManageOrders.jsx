// src/pages/admin/ManageOrders.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ShoppingBag,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader,
  Eye,
  Edit,
  Printer,
  Download,
  RefreshCw,
  MapPin,
  User,
  Calendar,
  CreditCard,
  TrendingUp,
  Zap,
  Award,
  Star,
  Gift,
  Mail,
  Phone,
  Home,
  Building,
  MoreVertical,
  FileText,
  Send,
  Check,
  X
} from 'lucide-react';

// API setup
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

const ManageOrders = () => {
  const navigate = useNavigate();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Orders state
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [ordersPerPage] = useState(10);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  
  // Status update
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  
  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    outForDelivery: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0
  });

  // Colors
  const colors = {
    bgPrimary: '#FAF7F2',
    bgSecondary: '#F5F0E8',
    primary: '#D4AF37',
    primaryDark: '#B8962E',
    primaryLight: '#F5E7C8',
    textPrimary: '#1F2937',
    textSecondary: '#4B5563',
    textLight: '#6B7280',
    border: '#E5E7EB',
    white: '#FFFFFF',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
    pending: '#F59E0B',
    processing: '#3B82F6',
    shipped: '#8B5CF6',
    outForDelivery: '#EC4899',
    delivered: '#10B981',
    cancelled: '#EF4444'
  };

  // Order status options
  const statusOptions = [
    { value: 'pending', label: 'Pending', color: colors.pending, icon: Clock },
    { value: 'processing', label: 'Processing', color: colors.processing, icon: RefreshCw },
    { value: 'shipped', label: 'Shipped', color: colors.shipped, icon: Package },
    { value: 'out-for-delivery', label: 'Out for Delivery', color: colors.outForDelivery, icon: Truck },
    { value: 'delivered', label: 'Delivered', color: colors.delivered, icon: CheckCircle },
    { value: 'cancelled', label: 'Cancelled', color: colors.cancelled, icon: XCircle }
  ];

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch orders on mount and when filters change
  useEffect(() => {
    fetchOrders();
    fetchOrderStats();
  }, [currentPage, statusFilter, sortBy]);

  // Apply search filter
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(order => 
        order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOrders(filtered);
    }
  }, [searchTerm, orders]);

  // Fetch orders from backend
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: ordersPerPage,
        sort: sortBy
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await api.get('/orders', { params });

      if (response.data.success) {
        const ordersData = response.data.orders || [];
        
        // Transform orders to consistent format
        const formattedOrders = ordersData.map(order => ({
          id: order._id,
          orderNumber: order.orderNumber || `ORD-${order._id.slice(-8)}`,
          customer: {
            name: order.user?.name || 'Guest User',
            email: order.user?.email || 'N/A',
            phone: order.shippingAddress?.phone || 'N/A'
          },
          items: order.orderItems || [],
          total: order.totalPrice || 0,
          status: order.status || 'pending',
          paymentMethod: order.paymentMethod || 'COD',
          paymentStatus: order.isPaid ? 'paid' : 'pending',
          shippingAddress: order.shippingAddress || {},
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          deliveredAt: order.deliveredAt,
          trackingNumber: order.trackingNumber
        }));

        setOrders(formattedOrders);
        setFilteredOrders(formattedOrders);
        setTotalPages(response.data.totalPages || 1);
        setTotalOrders(response.data.total || formattedOrders.length);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  // Fetch order statistics
  const fetchOrderStats = async () => {
    try {
      const response = await api.get('/orders/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching order stats:', err);
    }
  };

  // Update order status
  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return;

    setUpdatingOrder(selectedOrder.id);
    try {
      const response = await api.put(`/orders/${selectedOrder.id}/status`, {
        status: newStatus,
        note: statusNote
      });

      if (response.data.success) {
        setSuccess(`Order status updated to ${getStatusLabel(newStatus)}`);
        
        // Update local orders
        const updatedOrders = orders.map(order => 
          order.id === selectedOrder.id 
            ? { ...order, status: newStatus }
            : order
        );
        setOrders(updatedOrders);
        
        // Refresh stats
        await fetchOrderStats();
        
        // Close modal
        setShowStatusModal(false);
        setNewStatus('');
        setStatusNote('');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status');
    } finally {
      setUpdatingOrder(null);
    }
  };

  // Get status label
  const getStatusLabel = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  // Get status color
  const getStatusColor = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.color : colors.textSecondary;
  };

  // Get status icon
  const getStatusIcon = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    const Icon = option ? option.icon : Clock;
    return <Icon size={16} />;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle view order details
  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  // Handle print invoice
  const handlePrintInvoice = (order) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${order.orderNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; background: #FAF7F2; }
            .invoice { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 16px; border: 1px solid #E5E7EB; }
            .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .title { color: #D4AF37; font-size: 24px; font-weight: bold; }
            .order-info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #E5E7EB; }
            th { background: #F5F0E8; color: #1F2937; }
            .total { text-align: right; font-size: 18px; font-weight: bold; color: #D4AF37; }
          </style>
        </head>
        <body>
          <div class="invoice">
            <div class="header">
              <div class="title">OccaMart</div>
              <div>Invoice #${order.orderNumber}</div>
            </div>
            <div class="order-info">
              <p><strong>Customer:</strong> ${order.customer.name}</p>
              <p><strong>Email:</strong> ${order.customer.email}</p>
              <p><strong>Phone:</strong> ${order.customer.phone}</p>
              <p><strong>Date:</strong> ${formatDate(order.createdAt)}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.qty}</td>
                    <td>₹${item.price}</td>
                    <td>₹${(item.price * item.qty).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="total">
              Total: ₹${order.total.toFixed(2)}
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Handle export as CSV
  const handleExportCSV = () => {
    const headers = ['Order ID', 'Customer', 'Email', 'Phone', 'Total', 'Status', 'Payment', 'Date'];
    const rows = filteredOrders.map(order => [
      order.orderNumber,
      order.customer.name,
      order.customer.email,
      order.customer.phone,
      order.total,
      order.status,
      order.paymentMethod,
      formatDate(order.createdAt)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Styles
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
    title: {
      fontSize: windowWidth <= 768 ? '1.8rem' : '2.2rem',
      fontWeight: '700',
      color: colors.textPrimary,
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(7, 1fr)',
      gap: '15px',
      marginBottom: '30px',
    },
    statCard: {
      background: colors.white,
      padding: '15px',
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
      textAlign: 'center',
    },
    statValue: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: colors.primary,
      marginBottom: '5px',
    },
    statLabel: {
      fontSize: '0.8rem',
      color: colors.textLight,
    },
    filtersBar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      flexWrap: 'wrap',
      gap: '15px',
      padding: '20px',
      background: colors.white,
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
    },
    searchBox: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 15px',
      background: colors.bgPrimary,
      borderRadius: '8px',
      border: `1px solid ${colors.border}`,
      flex: 1,
      minWidth: '250px',
    },
    searchInput: {
      border: 'none',
      background: 'transparent',
      outline: 'none',
      fontSize: '0.95rem',
      width: '100%',
      color: colors.textPrimary,
    },
    filterGroup: {
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap',
    },
    select: {
      padding: '8px 12px',
      borderRadius: '8px',
      border: `1px solid ${colors.border}`,
      background: colors.white,
      color: colors.textPrimary,
      fontSize: '0.9rem',
      cursor: 'pointer',
      outline: 'none',
    },
    exportButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      background: colors.primary,
      color: colors.white,
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: '500',
    },
    tableContainer: {
      background: colors.white,
      borderRadius: '16px',
      border: `1px solid ${colors.border}`,
      overflow: 'auto',
      marginBottom: '20px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: '1200px',
    },
    th: {
      padding: '15px',
      textAlign: 'left',
      background: colors.bgSecondary,
      color: colors.textPrimary,
      fontWeight: '600',
      fontSize: '0.9rem',
      borderBottom: `2px solid ${colors.border}`,
    },
    td: {
      padding: '15px',
      borderBottom: `1px solid ${colors.border}`,
      color: colors.textSecondary,
      fontSize: '0.9rem',
    },
    statusBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 8px',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: '600',
    },
    actionButtons: {
      display: 'flex',
      gap: '8px',
    },
    actionButton: {
      padding: '6px',
      background: colors.bgSecondary,
      border: `1px solid ${colors.border}`,
      borderRadius: '6px',
      cursor: 'pointer',
      color: colors.textSecondary,
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
      background: colors.white,
      borderRadius: '8px',
      cursor: 'pointer',
      color: colors.textPrimary,
      transition: 'all 0.3s ease',
    },
    activePage: {
      background: colors.primary,
      color: colors.white,
      borderColor: colors.primary,
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    },
    modalContent: {
      background: colors.white,
      borderRadius: '24px',
      padding: '30px',
      maxWidth: '600px',
      width: '100%',
      maxHeight: '90vh',
      overflowY: 'auto',
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
    },
    modalTitle: {
      fontSize: '1.3rem',
      fontWeight: '600',
      color: colors.textPrimary,
    },
    closeButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '5px',
    },
    orderDetails: {
      marginBottom: '20px',
    },
    detailRow: {
      display: 'flex',
      padding: '10px 0',
      borderBottom: `1px solid ${colors.border}`,
    },
    detailLabel: {
      width: '120px',
      color: colors.textLight,
      fontWeight: '500',
    },
    detailValue: {
      flex: 1,
      color: colors.textPrimary,
    },
    itemsList: {
      marginTop: '15px',
    },
    itemRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: `1px solid ${colors.border}`,
    },
    statusOptions: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '10px',
      margin: '20px 0',
    },
    statusOption: {
      padding: '15px',
      border: `2px solid ${colors.border}`,
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      textAlign: 'center',
    },
    statusOptionActive: {
      borderColor: colors.primary,
      background: `${colors.primary}10`,
    },
    noteInput: {
      width: '100%',
      padding: '12px',
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      margin: '15px 0',
      fontSize: '0.95rem',
    },
    modalActions: {
      display: 'flex',
      gap: '15px',
      marginTop: '20px',
    },
    saveButton: {
      flex: 1,
      padding: '12px',
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
      color: colors.white,
      border: 'none',
      borderRadius: '8px',
      fontWeight: '600',
      cursor: 'pointer',
    },
    cancelButton: {
      flex: 1,
      padding: '12px',
      background: colors.bgSecondary,
      color: colors.textSecondary,
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      fontWeight: '600',
      cursor: 'pointer',
    },
    messageBox: {
      padding: '15px 20px',
      borderRadius: '12px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    successMessage: {
      background: `${colors.success}10`,
      border: `1px solid ${colors.success}`,
      color: colors.success,
    },
    errorMessage: {
      background: `${colors.error}10`,
      border: `1px solid ${colors.error}`,
      color: colors.error,
    },
  };

  if (loading && orders.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: colors.bgPrimary }}>
        <Loader size={50} color={colors.primary} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Manage Orders</h1>
        <button 
          style={styles.exportButton}
          onClick={handleExportCSV}
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

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

      {/* Statistics Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.total}</div>
          <div style={styles.statLabel}>Total Orders</div>
        </div>
        <div style={{ ...styles.statCard, borderTop: `3px solid ${colors.pending}` }}>
          <div style={styles.statValue}>{stats.pending}</div>
          <div style={styles.statLabel}>Pending</div>
        </div>
        <div style={{ ...styles.statCard, borderTop: `3px solid ${colors.processing}` }}>
          <div style={styles.statValue}>{stats.processing}</div>
          <div style={styles.statLabel}>Processing</div>
        </div>
        <div style={{ ...styles.statCard, borderTop: `3px solid ${colors.shipped}` }}>
          <div style={styles.statValue}>{stats.shipped}</div>
          <div style={styles.statLabel}>Shipped</div>
        </div>
        <div style={{ ...styles.statCard, borderTop: `3px solid ${colors.outForDelivery}` }}>
          <div style={styles.statValue}>{stats.outForDelivery}</div>
          <div style={styles.statLabel}>Out for Delivery</div>
        </div>
        <div style={{ ...styles.statCard, borderTop: `3px solid ${colors.delivered}` }}>
          <div style={styles.statValue}>{stats.delivered}</div>
          <div style={styles.statLabel}>Delivered</div>
        </div>
        <div style={{ ...styles.statCard, borderTop: `3px solid ${colors.cancelled}` }}>
          <div style={styles.statValue}>{stats.cancelled}</div>
          <div style={styles.statLabel}>Cancelled</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={styles.filtersBar}>
        <div style={styles.searchBox}>
          <Search size={18} color={colors.textLight} />
          <input
            type="text"
            placeholder="Search by order ID, customer name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterGroup}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={styles.select}
          >
            <option value="all">All Status</option>
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={styles.select}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Total</option>
            <option value="lowest">Lowest Total</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Order ID</th>
              <th style={styles.th}>Customer</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Items</th>
              <th style={styles.th}>Total</th>
              <th style={styles.th}>Payment</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id}>
                <td style={styles.td}>
                  <strong>{order.orderNumber}</strong>
                </td>
                <td style={styles.td}>
                  <div>
                    <div style={{ fontWeight: '500' }}>{order.customer.name}</div>
                    <div style={{ fontSize: '0.8rem', color: colors.textLight }}>{order.customer.email}</div>
                  </div>
                </td>
                <td style={styles.td}>
                  {formatDate(order.createdAt)}
                </td>
                <td style={styles.td}>
                  {order.items.length} items
                </td>
                <td style={styles.td}>
                  <strong style={{ color: colors.primary }}>₹{order.total.toFixed(2)}</strong>
                </td>
                <td style={styles.td}>
                  {order.paymentMethod}
                </td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.statusBadge,
                    background: `${getStatusColor(order.status)}15`,
                    color: getStatusColor(order.status)
                  }}>
                    {getStatusIcon(order.status)}
                    {getStatusLabel(order.status)}
                  </span>
                </td>
                <td style={styles.td}>
                  <div style={styles.actionButtons}>
                    <button
                      style={styles.actionButton}
                      onClick={() => handleViewDetails(order)}
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      style={styles.actionButton}
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowStatusModal(true);
                      }}
                      title="Update Status"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      style={styles.actionButton}
                      onClick={() => handlePrintInvoice(order)}
                      title="Print Invoice"
                    >
                      <Printer size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            style={styles.pageButton}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          
          <button
            style={styles.pageButton}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div style={styles.modal} onClick={() => setShowOrderDetails(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Order Details</h3>
              <button style={styles.closeButton} onClick={() => setShowOrderDetails(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.orderDetails}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Order ID:</span>
                <span style={styles.detailValue}>{selectedOrder.orderNumber}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Status:</span>
                <span style={{
                  ...styles.statusBadge,
                  background: `${getStatusColor(selectedOrder.status)}15`,
                  color: getStatusColor(selectedOrder.status)
                }}>
                  {getStatusIcon(selectedOrder.status)}
                  {getStatusLabel(selectedOrder.status)}
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Date:</span>
                <span style={styles.detailValue}>{formatDate(selectedOrder.createdAt)}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Customer:</span>
                <span style={styles.detailValue}>{selectedOrder.customer.name}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Email:</span>
                <span style={styles.detailValue}>{selectedOrder.customer.email}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Phone:</span>
                <span style={styles.detailValue}>{selectedOrder.customer.phone}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Payment:</span>
                <span style={styles.detailValue}>{selectedOrder.paymentMethod}</span>
              </div>
            </div>

            <h4 style={{ margin: '20px 0 10px', color: colors.textPrimary }}>Shipping Address</h4>
            <div style={styles.orderDetails}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Address:</span>
                <span style={styles.detailValue}>{selectedOrder.shippingAddress.address}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>City:</span>
                <span style={styles.detailValue}>{selectedOrder.shippingAddress.city}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Postal Code:</span>
                <span style={styles.detailValue}>{selectedOrder.shippingAddress.postalCode}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Country:</span>
                <span style={styles.detailValue}>{selectedOrder.shippingAddress.country}</span>
              </div>
            </div>

            <h4 style={{ margin: '20px 0 10px', color: colors.textPrimary }}>Order Items</h4>
            <div style={styles.itemsList}>
              {selectedOrder.items.map((item, idx) => (
                <div key={idx} style={styles.itemRow}>
                  <div>
                    <span style={{ fontWeight: '500' }}>{item.name}</span>
                    <span style={{ color: colors.textLight, marginLeft: '10px' }}>x{item.qty}</span>
                  </div>
                  <span style={{ color: colors.primary, fontWeight: '600' }}>
                    ₹{(item.price * item.qty).toFixed(2)}
                  </span>
                </div>
              ))}
              <div style={{ ...styles.itemRow, fontWeight: '700', fontSize: '1.1rem' }}>
                <span>Total</span>
                <span style={{ color: colors.primary }}>₹{selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedOrder && (
        <div style={styles.modal} onClick={() => setShowStatusModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Update Order Status</h3>
              <button style={styles.closeButton} onClick={() => setShowStatusModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.orderDetails}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Order:</span>
                <span style={styles.detailValue}>{selectedOrder.orderNumber}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Current Status:</span>
                <span style={{
                  ...styles.statusBadge,
                  background: `${getStatusColor(selectedOrder.status)}15`,
                  color: getStatusColor(selectedOrder.status)
                }}>
                  {getStatusIcon(selectedOrder.status)}
                  {getStatusLabel(selectedOrder.status)}
                </span>
              </div>
            </div>

            <h4 style={{ margin: '20px 0 10px', color: colors.textPrimary }}>Select New Status</h4>
            <div style={styles.statusOptions}>
              {statusOptions.map(option => (
                <div
                  key={option.value}
                  style={{
                    ...styles.statusOption,
                    ...(newStatus === option.value ? styles.statusOptionActive : {})
                  }}
                  onClick={() => setNewStatus(option.value)}
                >
                  <option.icon size={24} color={option.color} />
                  <div style={{ marginTop: '8px', fontWeight: '500', color: colors.textPrimary }}>
                    {option.label}
                  </div>
                </div>
              ))}
            </div>

            <textarea
              placeholder="Add a note (optional)"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              style={styles.noteInput}
              rows="3"
            />

            <div style={styles.modalActions}>
              <button
                style={styles.cancelButton}
                onClick={() => setShowStatusModal(false)}
              >
                Cancel
              </button>
              <button
                style={styles.saveButton}
                onClick={handleStatusUpdate}
                disabled={!newStatus || updatingOrder === selectedOrder.id}
              >
                {updatingOrder === selectedOrder.id ? (
                  <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  'Update Status'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default ManageOrders;