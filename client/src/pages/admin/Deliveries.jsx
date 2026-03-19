import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Filter,
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Calendar,
  User,
  Phone,
  Mail,
  Home,
  PackageCheck,
  PackageX,
  PackageSearch,
  TrendingUp,
  BarChart3,
  Loader,
  MoreVertical,
  Send,
  Printer,
  FileText,
  MessageSquare
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';

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

const Deliveries = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('today');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDeliveries, setTotalDeliveries] = useState(0);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deliveryStats, setDeliveryStats] = useState({
    total: 0,
    pending: 0,
    outForDelivery: 0,
    delivered: 0,
    failed: 0,
    returned: 0
  });

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
    pink: '#EC4899'
  };

  const statusColors = {
    'pending': colors.warning,
    'processing': colors.info,
    'shipped': colors.purple,
    'out-for-delivery': colors.primary,
    'delivered': colors.success,
    'cancelled': colors.error,
    'failed': colors.error,
    'returned': colors.error
  };

  const statusLabels = {
    'pending': 'Pending',
    'processing': 'Processing',
    'shipped': 'Shipped',
    'out-for-delivery': 'Out for Delivery',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
    'failed': 'Failed',
    'returned': 'Returned'
  };

  useEffect(() => {
    fetchDeliveries();
    fetchDeliveryStats();
  }, [currentPage, statusFilter, dateRange]);

  useEffect(() => {
    filterDeliveries();
  }, [searchTerm, deliveries]);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10,
        sort: 'newest'
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      // Add date range filter
      if (dateRange !== 'all') {
        const dates = getDateRange(dateRange);
        if (dates) {
          params.startDate = dates.startDate;
          params.endDate = dates.endDate;
        }
      }

      const response = await api.get('/orders', { params });

      if (response.data.success) {
        setDeliveries(response.data.orders);
        setFilteredDeliveries(response.data.orders);
        setTotalPages(response.data.totalPages);
        setTotalDeliveries(response.data.total);
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      setError('Failed to load deliveries');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchDeliveryStats = async () => {
    try {
      const response = await api.get('/orders/stats');
      if (response.data.success) {
        const stats = response.data.data;
        setDeliveryStats({
          total: stats.total || 0,
          pending: stats.pending || 0,
          outForDelivery: stats.outForDelivery || 0,
          delivered: stats.delivered || 0,
          failed: stats.failed || 0,
          returned: stats.returned || 0
        });
      }
    } catch (error) {
      console.error('Error fetching delivery stats:', error);
    }
  };

  const filterDeliveries = () => {
    if (!searchTerm.trim()) {
      setFilteredDeliveries(deliveries);
      return;
    }

    const filtered = deliveries.filter(delivery => {
      const searchLower = searchTerm.toLowerCase();
      return (
        delivery.orderNumber?.toLowerCase().includes(searchLower) ||
        delivery.user?.name?.toLowerCase().includes(searchLower) ||
        delivery.user?.email?.toLowerCase().includes(searchLower) ||
        delivery.shippingAddress?.address?.toLowerCase().includes(searchLower) ||
        delivery.shippingAddress?.city?.toLowerCase().includes(searchLower)
      );
    });

    setFilteredDeliveries(filtered);
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
        return { startDate, endDate: today };
      case 'month':
        startDate.setMonth(today.getMonth() - 1);
        return { startDate, endDate: today };
      case 'all':
      default:
        return null;
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDeliveries();
    fetchDeliveryStats();
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleViewDetails = (delivery) => {
    setSelectedDelivery(delivery);
    setShowDetailsModal(true);
  };

  const handleUpdateStatus = (delivery) => {
    setSelectedDelivery(delivery);
    setShowUpdateStatusModal(true);
  };

  const updateDeliveryStatus = async (newStatus, trackingInfo = {}) => {
    if (!selectedDelivery) return;

    setUpdatingStatus(true);
    try {
      const response = await api.put(`/orders/${selectedDelivery._id}/status`, {
        status: newStatus,
        trackingNumber: trackingInfo.trackingNumber,
        estimatedDelivery: trackingInfo.estimatedDelivery,
        deliveryNotes: trackingInfo.notes
      });

      if (response.data.success) {
        // Update local state
        setDeliveries(prev => prev.map(d => 
          d._id === selectedDelivery._id ? { ...d, status: newStatus } : d
        ));
        setFilteredDeliveries(prev => prev.map(d => 
          d._id === selectedDelivery._id ? { ...d, status: newStatus } : d
        ));
        setShowUpdateStatusModal(false);
        fetchDeliveryStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update delivery status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd MMM yyyy, hh:mm a');
    } catch {
      return 'Invalid Date';
    }
  };

  const formatAddress = (address) => {
    if (!address) return 'N/A';
    const parts = [
      address.address,
      address.city,
      address.state,
      address.pincode
    ].filter(Boolean);
    return parts.join(', ');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle size={16} />;
      case 'cancelled':
      case 'failed':
      case 'returned':
        return <XCircle size={16} />;
      case 'out-for-delivery':
        return <Truck size={16} />;
      case 'shipped':
        return <PackageSearch size={16} />;
      case 'processing':
        return <Package size={16} />;
      default:
        return <Clock size={16} />;
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
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
    statusBadge: {
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '0.85rem',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
    },
    actionButton: {
      padding: '8px',
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      background: 'transparent',
      cursor: 'pointer',
      marginRight: '8px',
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
      maxWidth: '600px',
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
    timeline: {
      marginTop: '20px',
      padding: '20px',
      background: colors.bgSecondary,
      borderRadius: '12px',
    },
    timelineItem: {
      display: 'flex',
      gap: '15px',
      marginBottom: '15px',
      position: 'relative',
    },
    timelineDot: {
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      marginTop: '4px',
    },
    timelineContent: {
      flex: 1,
    },
    timelineTitle: {
      fontWeight: '600',
      marginBottom: '4px',
    },
    timelineTime: {
      fontSize: '0.85rem',
      color: colors.textLight,
    },
    statusOptions: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '10px',
      marginBottom: '20px',
    },
    statusOption: {
      padding: '12px',
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      background: colors.white,
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.3s ease',
    },
    selectedStatus: {
      borderColor: colors.primary,
      background: `${colors.primary}10`,
    },
    trackingForm: {
      marginTop: '20px',
      padding: '20px',
      background: colors.bgSecondary,
      borderRadius: '12px',
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
    formTextarea: {
      width: '100%',
      padding: '10px',
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      fontSize: '0.95rem',
      minHeight: '80px',
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
    },
    secondaryButton: {
      padding: '12px 24px',
      background: colors.white,
      color: colors.textSecondary,
      border: `1px solid ${colors.border}`,
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
    },
    errorMessage: {
      background: `${colors.error}10`,
      border: `1px solid ${colors.error}`,
      color: colors.error,
    },
  };

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
        <p style={{ color: colors.textLight }}>Loading deliveries...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <h1 style={styles.title}>Deliveries</h1>
          <button 
            style={styles.refreshButton}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={20} color={colors.primary} className={refreshing ? 'spin' : ''} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={styles.secondaryButton}>
            <Download size={18} />
            Export
          </button>
          <button style={styles.primaryButton}>
            <Package size={18} />
            Schedule Pickup
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: `${colors.primary}15` }}>
            <Package size={24} color={colors.primary} />
          </div>
          <div>
            <div style={styles.statValue}>{deliveryStats.total}</div>
            <div style={styles.statLabel}>Total Deliveries</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: `${colors.warning}15` }}>
            <Clock size={24} color={colors.warning} />
          </div>
          <div>
            <div style={styles.statValue}>{deliveryStats.pending}</div>
            <div style={styles.statLabel}>Pending</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: `${colors.info}15` }}>
            <Truck size={24} color={colors.info} />
          </div>
          <div>
            <div style={styles.statValue}>{deliveryStats.outForDelivery}</div>
            <div style={styles.statLabel}>Out for Delivery</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: `${colors.success}15` }}>
            <CheckCircle size={24} color={colors.success} />
          </div>
          <div>
            <div style={styles.statValue}>{deliveryStats.delivered}</div>
            <div style={styles.statLabel}>Delivered</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: `${colors.error}15` }}>
            <XCircle size={24} color={colors.error} />
          </div>
          <div>
            <div style={styles.statValue}>{deliveryStats.failed + deliveryStats.returned}</div>
            <div style={styles.statLabel}>Failed/Returned</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filtersContainer}>
        <div style={styles.searchBox}>
          <Search size={20} color={colors.textLight} />
          <input
            type="text"
            placeholder="Search by order #, customer, address..."
            value={searchTerm}
            onChange={handleSearch}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterGroup}>
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            style={{
              ...styles.filterButton,
              minWidth: '120px',
            }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="out-for-delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
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
            <option value="all">All Time</option>
          </select>

          <button style={styles.filterButton}>
            <Filter size={16} />
            More Filters
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ ...styles.messageBox, ...styles.errorMessage }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Deliveries Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Order #</th>
              <th style={styles.th}>Customer</th>
              <th style={styles.th}>Delivery Address</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Scheduled Date</th>
              <th style={styles.th}>Delivered Date</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeliveries.length > 0 ? (
              filteredDeliveries.map((delivery) => (
                <tr key={delivery._id}>
                  <td style={styles.td}>
                    <strong>{delivery.orderNumber || delivery._id.slice(-8).toUpperCase()}</strong>
                  </td>
                  <td style={styles.td}>
                    <div>{delivery.user?.name || 'N/A'}</div>
                    <div style={{ fontSize: '0.85rem', color: colors.textLight }}>
                      {delivery.user?.email || ''}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div>{formatAddress(delivery.shippingAddress)}</div>
                    <div style={{ fontSize: '0.85rem', color: colors.textLight }}>
                      {delivery.shippingAddress?.phone || ''}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      background: `${statusColors[delivery.returnStatus || delivery.status]}15`,
                      color: statusColors[delivery.returnStatus || delivery.status] || colors.textSecondary
                    }}>
                      {getStatusIcon(delivery.returnStatus || delivery.status)}
                      {statusLabels[delivery.returnStatus || delivery.status] || delivery.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {delivery.scheduledDate ? formatDate(delivery.scheduledDate) : 'Not scheduled'}
                  </td>
                  <td style={styles.td}>
                    {delivery.deliveredAt ? formatDate(delivery.deliveredAt) : '-'}
                  </td>
                  <td style={styles.td}>
                    <button
                      style={styles.actionButton}
                      onClick={() => handleViewDetails(delivery)}
                      title="View Details"
                    >
                      <Eye size={16} color={colors.info} />
                    </button>
                    <button
                      style={styles.actionButton}
                      onClick={() => handleUpdateStatus(delivery)}
                      title="Update Status"
                    >
                      <Edit size={16} color={colors.primary} />
                    </button>
                    <button style={styles.actionButton} title="Print Label">
                      <Printer size={16} color={colors.purple} />
                    </button>
                    <button style={styles.actionButton} title="Contact Customer">
                      <MessageSquare size={16} color={colors.success} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                  <Package size={48} color={colors.textLight} />
                  <p style={{ color: colors.textLight, marginTop: '10px' }}>
                    No deliveries found
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
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

      {/* Delivery Details Modal */}
      {showDetailsModal && selectedDelivery && (
        <div style={styles.modalOverlay} onClick={() => setShowDetailsModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Delivery Details</h2>
              <button style={styles.closeButton} onClick={() => setShowDetailsModal(false)}>
                ×
              </button>
            </div>

            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Order Number</div>
                <div style={styles.infoValue}>
                  {selectedDelivery.orderNumber || selectedDelivery._id.slice(-8).toUpperCase()}
                </div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Status</div>
                <div style={styles.infoValue}>
                  <span style={{
                    ...styles.statusBadge,
                    background: `${statusColors[selectedDelivery.returnStatus || selectedDelivery.status]}15`,
                    color: statusColors[selectedDelivery.returnStatus || selectedDelivery.status]
                  }}>
                    {statusLabels[selectedDelivery.returnStatus || selectedDelivery.status]}
                  </span>
                </div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Total Amount</div>
                <div style={styles.infoValue}>₹{selectedDelivery.totalPrice?.toLocaleString()}</div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Payment Method</div>
                <div style={styles.infoValue}>{selectedDelivery.paymentMethod}</div>
              </div>
            </div>

            <h3 style={{ marginBottom: '15px' }}>Customer Information</h3>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Name</div>
                <div style={styles.infoValue}>{selectedDelivery.user?.name || 'N/A'}</div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Email</div>
                <div style={styles.infoValue}>{selectedDelivery.user?.email || 'N/A'}</div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Phone</div>
                <div style={styles.infoValue}>{selectedDelivery.shippingAddress?.phone || 'N/A'}</div>
              </div>
            </div>

            <h3 style={{ marginBottom: '15px' }}>Delivery Address</h3>
            <div style={{
              padding: '15px',
              background: colors.bgSecondary,
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <p>{selectedDelivery.shippingAddress?.address}</p>
              <p>
                {selectedDelivery.shippingAddress?.city}, {selectedDelivery.shippingAddress?.state} - {selectedDelivery.shippingAddress?.pincode}
              </p>
            </div>

            <h3 style={{ marginBottom: '15px' }}>Order Items</h3>
            <div style={{ maxHeight: '200px', overflow: 'auto' }}>
              {selectedDelivery.orderItems?.map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px',
                  borderBottom: `1px solid ${colors.border}`
                }}>
                  <div>
                    <div style={{ fontWeight: '500' }}>{item.name}</div>
                    <div style={{ fontSize: '0.85rem', color: colors.textLight }}>
                      Qty: {item.qty}
                    </div>
                  </div>
                  <div style={{ fontWeight: '600' }}>
                    ₹{(item.price * item.qty).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.modalActions}>
              <button style={styles.secondaryButton} onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
              <button 
                style={styles.primaryButton}
                onClick={() => {
                  setShowDetailsModal(false);
                  handleUpdateStatus(selectedDelivery);
                }}
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showUpdateStatusModal && selectedDelivery && (
        <div style={styles.modalOverlay} onClick={() => setShowUpdateStatusModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Update Delivery Status</h2>
              <button style={styles.closeButton} onClick={() => setShowUpdateStatusModal(false)}>
                ×
              </button>
            </div>

            <p style={{ marginBottom: '20px', color: colors.textSecondary }}>
              Order: {selectedDelivery.orderNumber || selectedDelivery._id.slice(-8).toUpperCase()}
            </p>

            <StatusUpdateForm
              currentStatus={selectedDelivery.status}
              onUpdate={updateDeliveryStatus}
              onCancel={() => setShowUpdateStatusModal(false)}
              colors={colors}
              styles={styles}
              statusLabels={statusLabels}
            />
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
      `}</style>
    </div>
  );
};

// Status Update Form Component
const StatusUpdateForm = ({ currentStatus, onUpdate, onCancel, colors, styles, statusLabels }) => {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [trackingInfo, setTrackingInfo] = useState({
    trackingNumber: '',
    estimatedDelivery: '',
    notes: ''
  });

  const statusOptions = [
    'pending',
    'processing',
    'shipped',
    'out-for-delivery',
    'delivered',
    'cancelled'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(selectedStatus, trackingInfo);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={styles.statusOptions}>
        {statusOptions.map((status) => (
          <div
            key={status}
            style={{
              ...styles.statusOption,
              ...(selectedStatus === status ? styles.selectedStatus : {})
            }}
            onClick={() => setSelectedStatus(status)}
          >
            {statusLabels[status] || status}
          </div>
        ))}
      </div>

      {(selectedStatus === 'shipped' || selectedStatus === 'out-for-delivery') && (
        <div style={styles.trackingForm}>
          <h4 style={{ marginBottom: '15px' }}>Tracking Information</h4>
          
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Tracking Number</label>
            <input
              type="text"
              style={styles.formInput}
              value={trackingInfo.trackingNumber}
              onChange={(e) => setTrackingInfo({ ...trackingInfo, trackingNumber: e.target.value })}
              placeholder="Enter tracking number"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Estimated Delivery Date</label>
            <input
              type="date"
              style={styles.formInput}
              value={trackingInfo.estimatedDelivery}
              onChange={(e) => setTrackingInfo({ ...trackingInfo, estimatedDelivery: e.target.value })}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Delivery Notes</label>
            <textarea
              style={styles.formTextarea}
              value={trackingInfo.notes}
              onChange={(e) => setTrackingInfo({ ...trackingInfo, notes: e.target.value })}
              placeholder="Add any special instructions or notes"
            />
          </div>
        </div>
      )}

      {selectedStatus === 'cancelled' && (
        <div style={{ ...styles.trackingForm, background: `${colors.error}10` }}>
          <h4 style={{ marginBottom: '15px', color: colors.error }}>Cancellation Reason</h4>
          
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Reason for cancellation</label>
            <textarea
              style={styles.formTextarea}
              value={trackingInfo.notes}
              onChange={(e) => setTrackingInfo({ ...trackingInfo, notes: e.target.value })}
              placeholder="Enter reason for cancellation"
              required
            />
          </div>
        </div>
      )}

      {selectedStatus === 'delivered' && (
        <div style={{ ...styles.trackingForm, background: `${colors.success}10` }}>
          <h4 style={{ marginBottom: '15px', color: colors.success }}>Delivery Confirmation</h4>
          
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Delivery Notes</label>
            <textarea
              style={styles.formTextarea}
              value={trackingInfo.notes}
              onChange={(e) => setTrackingInfo({ ...trackingInfo, notes: e.target.value })}
              placeholder="Add delivery notes or recipient name"
            />
          </div>
        </div>
      )}

      <div style={styles.modalActions}>
        <button type="button" style={styles.secondaryButton} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" style={styles.primaryButton}>
          Update Status
        </button>
      </div>
    </form>
  );
};

export default Deliveries;