// src/pages/Returns.jsx
import React, { useState, useEffect } from 'react';
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Download,
  Printer,
  Mail,
  Phone,
  MapPin,
  Calendar,
  RefreshCw,
  Shield,
  Truck,
  HelpCircle,
  ArrowLeft,
  Upload,
  Star,
  FileText,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Save,
  Plus,
  Minus,
  Info,
  Check,
  AlertTriangle,
  MessageSquare,
  LogIn
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Returns = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('policy');
  const [returns, setReturns] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [returnableItems, setReturnableItems] = useState([]);
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [returnDetails, setReturnDetails] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [orders, setOrders] = useState([]);
  const [authLoading, setAuthLoading] = useState(true);

  // Colors
  const colors = {
    primary: '#D4AF37',
    primaryDark: '#B8962E',
    primaryLight: '#E5C97A',
    bgPrimary: '#FAF7F2',
    bgSecondary: '#F5F0E8',
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
    indigo: '#6366F1',
    pink: '#EC4899'
  };

  // API URL
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Check authentication status
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setAuthLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAuthenticated(false);
        setAuthLoading(false);
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data) {
        setIsAuthenticated(true);
        fetchUserReturns();
        fetchUserOrders();
      }
    } catch (err) {
      console.log('User not authenticated:', err.response?.status);
      setIsAuthenticated(false);
    } finally {
      setAuthLoading(false);
      setLoading(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchReturnPolicy();
    fetchReturnReasons();
  }, []);

  const fetchReturnPolicy = async () => {
    try {
      const response = await axios.get(`${API_URL}/return-policy`);
      if (response.data.success) {
        setPolicy(response.data.policy);
      } else {
        setDefaultPolicy();
      }
    } catch (err) {
      console.error('Error fetching return policy:', err);
      setDefaultPolicy();
    }
  };

  const setDefaultPolicy = () => {
    setPolicy({
      returnWindow: 7,
      returnWindowUnit: 'days',
      eligibleStatuses: ['delivered'],
      conditions: [
        'Items must be unused and in original condition',
        'Original packaging must be intact',
        'All tags and labels must be attached',
        'Return request must be initiated within 7 days of delivery'
      ],
      nonReturnableItems: [
        'Personal care products',
        'Intimate apparel',
        'Perishable goods',
        'Customized items',
        'Digital products'
      ],
      refundProcess: {
        timeline: '5-7 business days after return is processed',
        method: 'Original payment method',
        deduction: 'Shipping charges may be deducted for certain returns'
      },
      replacementProcess: {
        timeline: '7-10 business days',
        availability: 'Subject to stock availability'
      }
    });
  };

  const fetchReturnReasons = async () => {
    try {
      const response = await axios.get(`${API_URL}/returns/reasons`);
      if (response.data.success) {
        setReasons(response.data.reasons);
      }
    } catch (err) {
      console.error('Error fetching return reasons:', err);
      setReasons([
        { id: 'damaged', label: 'Damaged product', description: 'Product arrived damaged or broken' },
        { id: 'wrong_item', label: 'Wrong item delivered', description: 'Received different item than ordered' },
        { id: 'not_as_described', label: 'Item not as described', description: 'Product does not match description' },
        { id: 'size_issue', label: 'Size/fit issue', description: 'Wrong size or doesn\'t fit' },
        { id: 'quality_issue', label: 'Quality issue', description: 'Poor quality or defective' },
        { id: 'missing_parts', label: 'Missing parts', description: 'Accessories or parts missing' },
        { id: 'defective', label: 'Defective product', description: 'Product not working properly' },
        { id: 'changed_mind', label: 'Changed mind', description: 'No longer needed or wanted' },
        { id: 'other', label: 'Other', description: 'Other reason' }
      ]);
    }
  };

  // ✅ FIXED: Use correct endpoint /api/orders/:orderId/return
  const fetchUserReturns = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const ordersResponse = await axios.get(`${API_URL}/orders/myorders`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const ordersData = ordersResponse.data.orders || ordersResponse.data || [];
      const returnRequests = [];

      for (const order of ordersData) {
        try {
          // ✅ CORRECT: /api/orders/:orderId/return
          const returnResponse = await axios.get(`${API_URL}/orders/${order._id}/return`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (returnResponse.data.success && returnResponse.data.returnDetails) {
            const returnData = returnResponse.data.returnDetails;
            returnRequests.push({
              _id: returnData.returnId || order._id,
              returnId: returnData.returnId,
              orderId: order._id,
              orderNumber: order._id.slice(-8).toUpperCase(),
              productName: order.orderItems?.[0]?.name || 'Product',
              status: returnData.returnStatus || 'pending',
              requestDate: returnData.returnRequestedAt || order.createdAt,
              reason: returnData.returnReason || 'other',
              refundAmount: returnData.returnRefundAmount,
              processedDate: returnData.returnProcessedAt || returnData.returnApprovedAt
            });
          }
        } catch (err) {
          if (err.response?.status !== 404) {
            console.log(`Error checking return for order ${order._id}:`, err.message);
          }
        }
      }

      setReturns(returnRequests);
    } catch (err) {
      console.error('Error fetching returns:', err);
      if (err.response?.status === 401) {
        setIsAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Use correct endpoint
  const fetchUserOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/orders/myorders`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const ordersData = response.data.orders || response.data || [];
      const eligibleOrders = ordersData.filter(order => 
        order.status === 'delivered' || order.isDelivered
      );
      setOrders(eligibleOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  // ✅ FIXED: Use correct endpoint /api/orders/:orderId/returnable-items
  const fetchReturnableItems = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      // ✅ CORRECT: /api/orders/:orderId/returnable-items
      const response = await axios.get(`${API_URL}/orders/${orderId}/returnable-items`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setReturnableItems(response.data.items || []);
        const items = (response.data.items || []).map(item => ({
          productId: item._id || item.productId,
          quantity: 1,
          selected: false,
          price: item.price,
          productName: item.name,
          sku: item.sku || item._id?.slice(-6)
        }));
        
        setFormData(prev => ({ 
          ...prev, 
          orderId,
          items: items
        }));
      }
    } catch (err) {
      console.error('Error fetching returnable items:', err);
      setError('Failed to fetch returnable items');
      setReturnableItems([]);
    }
  };

  // ✅ FIXED: Use correct endpoint /api/orders/:returnId/return
  const handleTrackReturn = async (returnId) => {
    try {
      const token = localStorage.getItem('token');
      // ✅ CORRECT: /api/orders/:returnId/return
      const response = await axios.get(`${API_URL}/orders/${returnId}/return`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const returnData = response.data.returnDetails || response.data.data;
        setTrackingInfo({
          trackingNumber: returnData.returnId || returnId,
          status: returnData.returnStatus || 'pending',
          ...returnData
        });
        setReturnDetails(returnData);
      }
    } catch (err) {
      console.error('Error tracking return:', err);
      setError('Failed to track return');
    }
  };

  // ✅ ADDED: Handle cancel return
  const handleCancelReturn = async (returnId) => {
    if (!window.confirm('Are you sure you want to cancel this return request?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      // ✅ CORRECT: /api/orders/:returnId/return/cancel
      const response = await axios.post(
        `${API_URL}/orders/${returnId}/return/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        setSuccess('Return request cancelled successfully');
        fetchUserReturns();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error cancelling return:', err);
      setError(err.response?.data?.message || 'Failed to cancel return request');
    }
  };

  // Form states
  const [formData, setFormData] = useState({
    orderId: '',
    items: [],
    reason: '',
    reasonDetails: '',
    comments: '',
    images: []
  });

  // Image upload states
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + imageFiles.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} is larger than 5MB`);
        return false;
      }
      return true;
    });

    setImageFiles(prev => [...prev, ...validFiles]);

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ✅ FIXED: Use correct endpoint /api/orders/:orderId/return
  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to submit a return request');
        return;
      }

      if (!formData.orderId) {
        setError('Please select an order');
        return;
      }

      const selectedItems = formData.items.filter(item => item.selected);
      if (selectedItems.length === 0) {
        setError('Please select at least one item to return');
        return;
      }

      if (!formData.reason) {
        setError('Please select a return reason');
        return;
      }

      if (!formData.reasonDetails) {
        setError('Please provide additional details about the issue');
        return;
      }

      setUploadingImages(true);

      const returnData = {
        items: selectedItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          reason: formData.reason,
          reasonLabel: reasons.find(r => r.id === formData.reason)?.label || formData.reason,
          comments: formData.reasonDetails
        })),
        reason: formData.reason,
        comments: formData.reasonDetails,
        returnType: 'refund'
      };

      // ✅ CORRECT ENDPOINT: /api/orders/:orderId/return
      const response = await axios.post(
        `${API_URL}/orders/${formData.orderId}/return`,
        returnData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSuccess('Return request submitted successfully');
        setShowReturnForm(false);
        resetForm();
        fetchUserReturns();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error submitting return:', err);
      setError(err.response?.data?.message || 'Failed to submit return request');
    } finally {
      setUploadingImages(false);
    }
  };

  const resetForm = () => {
    setFormData({
      orderId: '',
      items: [],
      reason: '',
      reasonDetails: '',
      comments: '',
      images: []
    });
    setImageFiles([]);
    setImagePreviews([]);
    setSelectedOrder(null);
    setReturnableItems([]);
  };

  const handleItemSelection = (index, selected) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], selected };
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const handleQuantityChange = (index, change) => {
    const updatedItems = [...formData.items];
    const newQuantity = updatedItems[index].quantity + change;
    const maxQuantity = returnableItems[index]?.maxQuantity || returnableItems[index]?.quantity || 1;
    
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      updatedItems[index] = { ...updatedItems[index], quantity: newQuantity };
      setFormData(prev => ({ ...prev, items: updatedItems }));
    }
  };

  const handleOrderSelect = async (e) => {
    const orderId = e.target.value;
    setFormData(prev => ({ ...prev, orderId }));
    
    if (orderId) {
      await fetchReturnableItems(orderId);
      const selectedOrder = orders.find(o => o._id === orderId);
      setSelectedOrder(selectedOrder);
    } else {
      setReturnableItems([]);
      setSelectedOrder(null);
    }
  };

  const handleLoginRedirect = () => {
    navigate('/login', { state: { from: '/returns' } });
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      'return-requested': { color: colors.warning, bg: `${colors.warning}15`, icon: Clock, label: 'Pending' },
      'return-approved': { color: colors.info, bg: `${colors.info}15`, icon: CheckCircle, label: 'Approved' },
      'return-rejected': { color: colors.error, bg: `${colors.error}15`, icon: XCircle, label: 'Rejected' },
      'return-picked-up': { color: colors.purple, bg: `${colors.purple}15`, icon: Truck, label: 'Picked Up' },
      'return-processed': { color: colors.indigo, bg: `${colors.indigo}15`, icon: RefreshCw, label: 'Processing' },
      'return-completed': { color: colors.success, bg: `${colors.success}15`, icon: CheckCircle, label: 'Completed' },
      pending: { color: colors.warning, bg: `${colors.warning}15`, icon: Clock, label: 'Pending' },
      approved: { color: colors.info, bg: `${colors.info}15`, icon: CheckCircle, label: 'Approved' },
      processing: { color: colors.purple, bg: `${colors.purple}15`, icon: RefreshCw, label: 'Processing' },
      picked_up: { color: colors.indigo, bg: `${colors.indigo}15`, icon: Truck, label: 'Picked Up' },
      completed: { color: colors.success, bg: `${colors.success}15`, icon: CheckCircle, label: 'Completed' },
      rejected: { color: colors.error, bg: `${colors.error}15`, icon: XCircle, label: 'Rejected' },
      cancelled: { color: colors.textLight, bg: `${colors.textLight}15`, icon: XCircle, label: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: '500',
        background: config.bg,
        color: config.color
      }}>
        <Icon size={14} />
        {config.label}
      </span>
    );
  };

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      background: colors.bgPrimary,
      padding: '40px 20px'
    },
    wrapper: {
      maxWidth: '1200px',
      margin: '0 auto'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
      flexWrap: 'wrap',
      gap: '20px'
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px'
    },
    backButton: {
      background: colors.white,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      padding: '10px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s ease'
    },
    title: {
      fontSize: '2rem',
      fontWeight: '700',
      color: colors.textPrimary,
      margin: 0
    },
    subtitle: {
      color: colors.textLight,
      fontSize: '1rem',
      marginTop: '5px'
    },
    tabs: {
      display: 'flex',
      gap: '10px',
      marginBottom: '30px',
      borderBottom: `2px solid ${colors.border}`,
      paddingBottom: '10px'
    },
    tab: {
      padding: '10px 20px',
      background: 'none',
      border: 'none',
      borderRadius: '8px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      color: colors.textLight,
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    activeTab: {
      background: colors.primary,
      color: colors.white
    },
    messageBox: {
      padding: '15px 20px',
      borderRadius: '12px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    successMessage: {
      background: `${colors.success}10`,
      border: `1px solid ${colors.success}`,
      color: colors.success
    },
    errorMessage: {
      background: `${colors.error}10`,
      border: `1px solid ${colors.error}`,
      color: colors.error
    },
    policyGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    },
    policyCard: {
      background: colors.white,
      borderRadius: '16px',
      padding: '25px',
      border: `1px solid ${colors.border}`,
      boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
    },
    policyIcon: {
      width: '50px',
      height: '50px',
      borderRadius: '12px',
      background: `${colors.primary}15`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '15px',
      color: colors.primary
    },
    policyTitle: {
      fontSize: '1.2rem',
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: '10px'
    },
    policyList: {
      listStyle: 'none',
      padding: 0,
      margin: 0
    },
    policyItem: {
      padding: '8px 0',
      color: colors.textSecondary,
      fontSize: '0.95rem',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      borderBottom: `1px solid ${colors.border}`,
      '&:last-child': {
        borderBottom: 'none'
      }
    },
    contactInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      padding: '15px',
      background: colors.bgSecondary,
      borderRadius: '12px',
      marginTop: '20px'
    },
    filterBar: {
      display: 'flex',
      gap: '15px',
      marginBottom: '20px',
      flexWrap: 'wrap'
    },
    searchBox: {
      flex: 1,
      minWidth: '250px',
      position: 'relative'
    },
    searchInput: {
      width: '100%',
      padding: '12px 40px',
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      fontSize: '0.95rem',
      background: colors.white
    },
    searchIcon: {
      position: 'absolute',
      left: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: colors.textLight
    },
    filterSelect: {
      padding: '12px 20px',
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      fontSize: '0.95rem',
      background: colors.white,
      minWidth: '150px'
    },
    returnsGrid: {
      display: 'grid',
      gap: '20px'
    },
    returnCard: {
      background: colors.white,
      borderRadius: '16px',
      padding: '20px',
      border: `1px solid ${colors.border}`,
      transition: 'all 0.3s ease'
    },
    returnHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '15px',
      flexWrap: 'wrap',
      gap: '10px'
    },
    returnId: {
      fontSize: '1.1rem',
      fontWeight: '600',
      color: colors.textPrimary
    },
    returnDate: {
      fontSize: '0.9rem',
      color: colors.textLight,
      display: 'flex',
      alignItems: 'center',
      gap: '5px'
    },
    returnDetails: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '15px',
      marginBottom: '15px',
      padding: '15px',
      background: colors.bgSecondary,
      borderRadius: '12px'
    },
    returnItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    returnItemLabel: {
      fontSize: '0.85rem',
      color: colors.textLight
    },
    returnItemValue: {
      fontSize: '0.95rem',
      fontWeight: '500',
      color: colors.textPrimary
    },
    returnActions: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'flex-end'
    },
    actionButton: {
      padding: '8px 16px',
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      background: colors.white,
      color: colors.textSecondary,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '0.9rem',
      transition: 'all 0.3s ease'
    },
    primaryButton: {
      background: colors.primary,
      color: colors.white,
      border: 'none',
      padding: '12px 24px',
      borderRadius: '12px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.3s ease'
    },
    secondaryButton: {
      background: colors.white,
      color: colors.textSecondary,
      border: `1px solid ${colors.border}`,
      padding: '12px 24px',
      borderRadius: '12px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.3s ease'
    },
    loginPrompt: {
      textAlign: 'center',
      padding: '60px 20px',
      background: colors.white,
      borderRadius: '16px',
      border: `1px solid ${colors.border}`
    },
    loginIcon: {
      width: '80px',
      height: '80px',
      margin: '0 auto 20px',
      background: colors.bgSecondary,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: colors.primary
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
      padding: '20px'
    },
    modalContent: {
      background: colors.white,
      borderRadius: '24px',
      padding: '30px',
      maxWidth: '800px',
      width: '100%',
      maxHeight: '90vh',
      overflowY: 'auto'
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    },
    modalTitle: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: colors.textPrimary
    },
    closeButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '5px',
      color: colors.textLight
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    label: {
      color: colors.textSecondary,
      fontSize: '0.9rem',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    input: {
      padding: '12px',
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      fontSize: '0.95rem',
      background: colors.bgPrimary
    },
    select: {
      padding: '12px',
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      fontSize: '0.95rem',
      background: colors.bgPrimary
    },
    textarea: {
      padding: '12px',
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      fontSize: '0.95rem',
      minHeight: '100px',
      background: colors.bgPrimary,
      resize: 'vertical'
    },
    itemList: {
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      overflow: 'hidden'
    },
    itemHeader: {
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto auto',
      gap: '15px',
      padding: '15px',
      background: colors.bgSecondary,
      fontWeight: '600',
      color: colors.textSecondary,
      fontSize: '0.9rem'
    },
    itemRow: {
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto auto',
      gap: '15px',
      padding: '15px',
      borderTop: `1px solid ${colors.border}`,
      alignItems: 'center'
    },
    quantityControl: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    quantityButton: {
      width: '30px',
      height: '30px',
      borderRadius: '6px',
      border: `1px solid ${colors.border}`,
      background: colors.white,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    imageUploadArea: {
      border: `2px dashed ${colors.border}`,
      borderRadius: '12px',
      padding: '20px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      background: colors.bgSecondary
    },
    imagePreviews: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
      gap: '10px',
      marginTop: '15px'
    },
    imagePreview: {
      position: 'relative',
      paddingTop: '100%',
      borderRadius: '8px',
      overflow: 'hidden',
      border: `1px solid ${colors.border}`
    },
    previewImage: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    },
    removeImageButton: {
      position: 'absolute',
      top: '5px',
      right: '5px',
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      background: colors.error,
      color: colors.white,
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px'
    },
    modalActions: {
      display: 'flex',
      gap: '15px',
      marginTop: '20px'
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '400px'
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      background: colors.white,
      borderRadius: '16px',
      border: `1px solid ${colors.border}`
    },
    emptyIcon: {
      width: '80px',
      height: '80px',
      margin: '0 auto 20px',
      background: colors.bgSecondary,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: colors.textLight
    }
  };

  if (authLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <RefreshCw size={40} color={colors.primary} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <button 
              style={styles.backButton}
              onClick={() => navigate(-1)}
              onMouseEnter={(e) => e.currentTarget.style.background = colors.bgSecondary}
              onMouseLeave={(e) => e.currentTarget.style.background = colors.white}
            >
              <ArrowLeft size={20} color={colors.textPrimary} />
            </button>
            <div>
              <h1 style={styles.title}>Returns & Refunds</h1>
              <p style={styles.subtitle}>Manage your returns and track refund status</p>
            </div>
          </div>
          {isAuthenticated ? (
            <button 
              style={styles.primaryButton}
              onClick={() => setShowReturnForm(true)}
            >
              <Package size={18} />
              Request Return
            </button>
          ) : (
            <button 
              style={styles.primaryButton}
              onClick={handleLoginRedirect}
            >
              <LogIn size={18} />
              Login to Request Return
            </button>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div style={{ ...styles.messageBox, ...styles.errorMessage }}>
            <AlertCircle size={20} />
            <span>{error}</span>
            <button 
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => setError('')}
            >
              <XCircle size={16} />
            </button>
          </div>
        )}

        {success && (
          <div style={{ ...styles.messageBox, ...styles.successMessage }}>
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'policy' ? styles.activeTab : {})
            }}
            onClick={() => setActiveTab('policy')}
          >
            <FileText size={18} />
            Return Policy
          </button>
          {isAuthenticated && (
            <button
              style={{
                ...styles.tab,
                ...(activeTab === 'my-returns' ? styles.activeTab : {})
              }}
              onClick={() => setActiveTab('my-returns')}
            >
              <Package size={18} />
              My Returns
            </button>
          )}
        </div>

        {/* Return Policy Tab */}
        {activeTab === 'policy' && policy && (
          <div>
            <div style={styles.policyGrid}>
              <div style={styles.policyCard}>
                <div style={styles.policyIcon}>
                  <Clock size={24} />
                </div>
                <h3 style={styles.policyTitle}>Return Period</h3>
                <p style={{ color: colors.textSecondary }}>
                  You have <strong>{policy.returnWindow} {policy.returnWindowUnit}</strong> from delivery date to initiate a return.
                </p>
              </div>

              <div style={styles.policyCard}>
                <div style={styles.policyIcon}>
                  <Truck size={24} />
                </div>
                <h3 style={styles.policyTitle}>Free Returns</h3>
                <p style={{ color: colors.textSecondary }}>
                  We offer free returns on all eligible items within the return period.
                </p>
              </div>

              <div style={styles.policyCard}>
                <div style={styles.policyIcon}>
                  <RefreshCw size={24} />
                </div>
                <h3 style={styles.policyTitle}>Refund Timeframe</h3>
                <p style={{ color: colors.textSecondary }}>
                  Refunds are processed within {policy.refundProcess?.timeline || '5-7 business days'} after inspection.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
              <div>
                <div style={styles.policyCard}>
                  <h3 style={styles.policyTitle}>Return Conditions</h3>
                  <ul style={styles.policyList}>
                    {policy.conditions && policy.conditions.map((condition, index) => (
                      <li key={index} style={styles.policyItem}>
                        <CheckCircle size={16} color={colors.success} style={{ flexShrink: 0, marginTop: '3px' }} />
                        <span>{condition}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <div style={styles.policyCard}>
                  <h3 style={styles.policyTitle}>Non-Returnable Items</h3>
                  <ul style={styles.policyList}>
                    {policy.nonReturnableItems && policy.nonReturnableItems.map((item, index) => (
                      <li key={index} style={styles.policyItem}>
                        <XCircle size={16} color={colors.error} style={{ flexShrink: 0, marginTop: '3px' }} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* My Returns Tab - Only shown if authenticated */}
        {activeTab === 'my-returns' && isAuthenticated && (
          <div>
            {/* Filters */}
            <div style={styles.filterBar}>
              <div style={styles.searchBox}>
                <Search size={18} style={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search by order ID or product..."
                  style={styles.searchInput}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                style={styles.filterSelect}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Returns List */}
            {loading ? (
              <div style={styles.loadingContainer}>
                <RefreshCw size={40} color={colors.primary} style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : returns.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>
                  <Package size={40} />
                </div>
                <h3 style={{ color: colors.textPrimary, marginBottom: '10px' }}>No Returns Yet</h3>
                <p style={{ color: colors.textLight, marginBottom: '20px' }}>
                  You haven't submitted any return requests yet.
                </p>
                <button 
                  style={styles.primaryButton}
                  onClick={() => setShowReturnForm(true)}
                >
                  Request a Return
                </button>
              </div>
            ) : (
              <div style={styles.returnsGrid}>
                {returns
                  .filter(ret => {
                    const matchesSearch = ret.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        ret.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        ret.returnId?.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesStatus = statusFilter === 'all' || ret.status === statusFilter || ret.status?.includes(statusFilter);
                    return matchesSearch && matchesStatus;
                  })
                  .map((ret, index) => (
                    <div key={ret._id || index} style={styles.returnCard}>
                      <div style={styles.returnHeader}>
                        <div>
                          <span style={styles.returnId}>Return #{ret.returnId || ret._id?.slice(-8).toUpperCase()}</span>
                          <div style={styles.returnDate}>
                            <Calendar size={14} />
                            Requested on {new Date(ret.requestDate).toLocaleDateString()}
                          </div>
                        </div>
                        <StatusBadge status={ret.status} />
                      </div>

                      <div style={styles.returnDetails}>
                        <div style={styles.returnItem}>
                          <Package size={16} color={colors.primary} />
                          <div>
                            <div style={styles.returnItemLabel}>Order ID</div>
                            <div style={styles.returnItemValue}>#{ret.orderNumber || ret.orderId?.slice(-8).toUpperCase()}</div>
                          </div>
                        </div>

                        <div style={styles.returnItem}>
                          <FileText size={16} color={colors.primary} />
                          <div>
                            <div style={styles.returnItemLabel}>Product</div>
                            <div style={styles.returnItemValue}>{ret.productName}</div>
                          </div>
                        </div>

                        <div style={styles.returnItem}>
                          <AlertCircle size={16} color={colors.primary} />
                          <div>
                            <div style={styles.returnItemLabel}>Reason</div>
                            <div style={styles.returnItemValue}>
                              {reasons.find(r => r.id === ret.reason)?.label || ret.reason || 'N/A'}
                            </div>
                          </div>
                        </div>

                        {ret.refundAmount && (
                          <div style={styles.returnItem}>
                            <DollarSign size={16} color={colors.primary} />
                            <div>
                              <div style={styles.returnItemLabel}>Refund Amount</div>
                              <div style={styles.returnItemValue}>₹{ret.refundAmount}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={styles.returnActions}>
                        <button
                          style={styles.actionButton}
                          onClick={() => handleTrackReturn(ret._id)}
                        >
                          <Eye size={14} />
                          Track
                        </button>
                        {(ret.status === 'pending' || ret.status === 'return-requested') && (
                          <button
                            style={{ ...styles.actionButton, color: colors.error }}
                            onClick={() => handleCancelReturn(ret._id)}
                          >
                            <XCircle size={14} />
                            Cancel Request
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Login Prompt for My Returns Tab when not authenticated */}
        {activeTab === 'my-returns' && !isAuthenticated && (
          <div style={styles.loginPrompt}>
            <div style={styles.loginIcon}>
              <LogIn size={40} />
            </div>
            <h3 style={{ color: colors.textPrimary, marginBottom: '10px' }}>Login Required</h3>
            <p style={{ color: colors.textLight, marginBottom: '20px' }}>
              Please login to view your return requests and track refund status.
            </p>
            <button 
              style={styles.primaryButton}
              onClick={handleLoginRedirect}
            >
              Login to Your Account
            </button>
          </div>
        )}

        {/* Return Request Modal */}
        {showReturnForm && isAuthenticated && (
          <div style={styles.modal} onClick={() => setShowReturnForm(false)}>
            <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Request Return</h2>
                <button style={styles.closeButton} onClick={() => setShowReturnForm(false)}>
                  <XCircle size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitReturn} style={styles.form}>
                {/* Order Selection */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <Package size={16} /> Order ID
                  </label>
                  <select
                    name="orderId"
                    value={formData.orderId}
                    onChange={handleOrderSelect}
                    style={styles.select}
                    required
                  >
                    <option value="">Select an order</option>
                    {orders.map(order => (
                      <option key={order._id} value={order._id}>
                        #{order._id?.slice(-8).toUpperCase()} - {new Date(order.createdAt).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Items to Return */}
                {returnableItems.length > 0 && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      <Package size={16} /> Items to Return
                    </label>
                    <div style={styles.itemList}>
                      <div style={styles.itemHeader}>
                        <div>Select</div>
                        <div>Product</div>
                        <div>Quantity</div>
                        <div>Price</div>
                      </div>
                      {returnableItems.map((item, index) => (
                        <div key={item._id || index} style={styles.itemRow}>
                          <div>
                            <input
                              type="checkbox"
                              checked={formData.items[index]?.selected || false}
                              onChange={(e) => handleItemSelection(index, e.target.checked)}
                            />
                          </div>
                          <div>
                            <div style={{ fontWeight: '500', color: colors.textPrimary }}>
                              {item.name || item.productName}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: colors.textLight }}>
                              SKU: {item.sku || item._id?.slice(-6)}
                            </div>
                          </div>
                          <div>
                            <div style={styles.quantityControl}>
                              <button
                                type="button"
                                style={styles.quantityButton}
                                onClick={() => handleQuantityChange(index, -1)}
                                disabled={!formData.items[index]?.selected}
                              >
                                <Minus size={12} />
                              </button>
                              <span style={{ minWidth: '30px', textAlign: 'center' }}>
                                {formData.items[index]?.quantity || 1}
                              </span>
                              <button
                                type="button"
                                style={styles.quantityButton}
                                onClick={() => handleQuantityChange(index, 1)}
                                disabled={!formData.items[index]?.selected || formData.items[index]?.quantity >= (item.purchasedQuantity || item.quantity || 1)}
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>
                          <div style={{ fontWeight: '500', color: colors.primary }}>
                            ₹{item.price || 0}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Return Reason */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <AlertCircle size={16} /> Return Reason
                  </label>
                  <select
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    style={styles.select}
                    required
                  >
                    <option value="">Select a reason</option>
                    {reasons.map(reason => (
                      <option key={reason.id} value={reason.id}>
                        {reason.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reason Details */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <FileText size={16} /> Additional Details
                  </label>
                  <textarea
                    name="reasonDetails"
                    value={formData.reasonDetails}
                    onChange={handleInputChange}
                    style={styles.textarea}
                    placeholder="Please provide more details about the issue..."
                    required
                  />
                </div>

                {/* Comments */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <MessageSquare size={16} /> Comments (Optional)
                  </label>
                  <textarea
                    name="comments"
                    value={formData.comments}
                    onChange={handleInputChange}
                    style={styles.textarea}
                    placeholder="Any additional comments..."
                  />
                </div>

                {/* Image Upload */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <Upload size={16} /> Upload Images (Max 5)
                  </label>
                  {imagePreviews.length < 5 && (
                    <div 
                      style={styles.imageUploadArea}
                      onClick={() => document.getElementById('return-images').click()}
                    >
                      <Upload size={30} color={colors.primary} />
                      <p style={{ marginTop: '10px', color: colors.textLight }}>
                        Click to upload images (JPEG, PNG, max 5MB each)
                      </p>
                      <input
                        type="file"
                        id="return-images"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                      />
                    </div>
                  )}
                  
                  {imagePreviews.length > 0 && (
                    <div style={styles.imagePreviews}>
                      {imagePreviews.map((preview, index) => (
                        <div key={index} style={styles.imagePreview}>
                          <img src={preview} alt={`Preview ${index + 1}`} style={styles.previewImage} />
                          <button
                            type="button"
                            style={styles.removeImageButton}
                            onClick={() => removeImage(index)}
                          >
                            <XCircle size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={styles.modalActions}>
                  <button
                    type="button"
                    style={{ ...styles.secondaryButton, flex: 1 }}
                    onClick={() => {
                      setShowReturnForm(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ ...styles.primaryButton, flex: 1 }}
                    disabled={uploadingImages}
                  >
                    {uploadingImages ? (
                      <>
                        <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Submit Request
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tracking Info Modal */}
        {trackingInfo && (
          <div style={styles.modal} onClick={() => setTrackingInfo(null)}>
            <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Return Tracking</h2>
                <button style={styles.closeButton} onClick={() => setTrackingInfo(null)}>
                  <XCircle size={20} />
                </button>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: `${colors.success}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px'
                }}>
                  <Truck size={40} color={colors.success} />
                </div>
                <h3 style={{ color: colors.textPrimary, marginBottom: '10px' }}>
                  Return #{trackingInfo.trackingNumber || trackingInfo._id?.slice(-8).toUpperCase()}
                </h3>
                <StatusBadge status={trackingInfo.status} />
              </div>

              <div style={styles.returnDetails}>
                <div style={styles.returnItem}>
                  <Calendar size={16} color={colors.primary} />
                  <div>
                    <div style={styles.returnItemLabel}>Request Date</div>
                    <div style={styles.returnItemValue}>
                      {returnDetails?.returnRequestedAt ? new Date(returnDetails.returnRequestedAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>

                <div style={styles.returnItem}>
                  <Package size={16} color={colors.primary} />
                  <div>
                    <div style={styles.returnItemLabel}>Order ID</div>
                    <div style={styles.returnItemValue}>#{returnDetails?.order?.slice(-8).toUpperCase() || 'N/A'}</div>
                  </div>
                </div>

                <div style={styles.returnItem}>
                  <Clock size={16} color={colors.primary} />
                  <div>
                    <div style={styles.returnItemLabel}>Refund Amount</div>
                    <div style={styles.returnItemValue}>
                      {returnDetails?.returnRefundAmount ? `₹${returnDetails.returnRefundAmount}` : 'Processing'}
                    </div>
                  </div>
                </div>
              </div>

              <div style={styles.modalActions}>
                <button
                  style={styles.secondaryButton}
                  onClick={() => setTrackingInfo(null)}
                >
                  Close
                </button>
                <button
                  style={styles.primaryButton}
                  onClick={() => window.print()}
                >
                  <Printer size={18} />
                  Print Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

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

export default Returns;