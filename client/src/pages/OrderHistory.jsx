// src/pages/OrderHistory.jsx
import React, { useState, useEffect } from 'react';
import { orderAPI } from '../api/api';
import { 
    Package, 
    Calendar, 
    DollarSign, 
    ChevronRight, 
    AlertCircle,
    ShoppingBag,
    Clock,
    Truck,
    CheckCircle,
    XCircle,
    Loader,
    Star,
    RotateCcw,
    MessageSquare,
    FileText,
    RefreshCw,
    ThumbsUp,
    HelpCircle,
    CheckSquare
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ProductReviewModal from '../components/ProductReviewModal';
import ReturnRequestModal from '../components/ReturnRequestModal';
import axios from 'axios';
import { useAuth } from '../components/context/AuthContext';

const API_URL = 'http://localhost:5000/api';

const OrderHistory = () => {
    const { user, token, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [hoveredOrder, setHoveredOrder] = useState(null);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
    
    // Review modal state
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [reviewSuccess, setReviewSuccess] = useState('');
    const [reviewError, setReviewError] = useState('');

    // Return modal state
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [returnSuccess, setReturnSuccess] = useState('');
    const [returnError, setReturnError] = useState('');
    const [returnRequests, setReturnRequests] = useState({});
    const [loadingReturns, setLoadingReturns] = useState(false);
    const [returnFeatureEnabled, setReturnFeatureEnabled] = useState(true);

    // Colors
    const colors = {
        bgPrimary: '#FAF7F2',
        bgSecondary: '#F5F0E8',
        bgGlass: 'rgba(250, 247, 242, 0.85)',
        bgGlassDark: 'rgba(245, 240, 232, 0.95)',
        primary: '#D4AF37',
        primaryDark: '#B8962E',
        primaryLight: '#E5C97A',
        textPrimary: '#1F2937',
        textSecondary: '#4B5563',
        textLight: '#6B7280',
        border: '#E0D9CD',
        success: '#10B981',
        successGlow: 'rgba(16, 185, 129, 0.3)',
        warning: '#F59E0B',
        warningGlow: 'rgba(245, 158, 11, 0.3)',
        error: '#EF4444',
        errorGlow: 'rgba(239, 68, 68, 0.3)',
        info: '#3B82F6',
        infoGlow: 'rgba(59, 130, 246, 0.3)',
        purple: '#8B5CF6',
        purpleGlow: 'rgba(139, 92, 246, 0.3)',
        pink: '#EC4899',
        pinkGlow: 'rgba(236, 72, 153, 0.3)',
        white: '#FFFFFF',
        black: '#000000',
    };

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Check authentication on mount
    useEffect(() => {
        console.log('🔐 Auth State:', { 
            isAuthenticated, 
            hasToken: !!token,
            user: user?.email 
        });
        
        if (!isAuthenticated || !token) {
            console.log('❌ Not authenticated, redirecting to login');
            navigate('/login');
        } else {
            fetchOrders();
        }
    }, [isAuthenticated, token, navigate]);

    // Fetch return requests for orders
    useEffect(() => {
        if (orders.length > 0 && token && isAuthenticated) {
            fetchReturnRequests();
        }
    }, [orders, token, isAuthenticated]);

    // Add CSS animations
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            @keyframes float {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-5px); }
                100% { transform: translateY(0px); }
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
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            
            .order-card {
                transition: all 0.3s ease;
            }
            
            .order-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 30px rgba(212, 175, 55, 0.15);
            }
            
            .status-badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 12px;
                border-radius: 30px;
                font-size: 0.85rem;
                font-weight: 600;
            }
            
            .status-delivered {
                background: ${colors.success}15;
                color: ${colors.success};
                border: 1px solid ${colors.success}30;
            }
            
            .status-out-for-delivery {
                background: ${colors.pink}15;
                color: ${colors.pink};
                border: 1px solid ${colors.pink}30;
            }
            
            .status-shipped {
                background: ${colors.info}15;
                color: ${colors.info};
                border: 1px solid ${colors.info}30;
            }
            
            .status-processing {
                background: ${colors.warning}15;
                color: ${colors.warning};
                border: 1px solid ${colors.warning}30;
            }
            
            .status-pending {
                background: ${colors.warning}15;
                color: ${colors.warning};
                border: 1px solid ${colors.warning}30;
            }
            
            .status-cancelled {
                background: ${colors.error}15;
                color: ${colors.error};
                border: 1px solid ${colors.error}30;
            }
            
            .item-badge {
                background: ${colors.bgSecondary};
                border: 1px solid ${colors.border};
                border-radius: 12px;
                padding: 12px;
                transition: all 0.3s ease;
            }
            
            .item-badge:hover {
                background: ${colors.white};
                border-color: ${colors.primary};
                transform: translateY(-2px);
                box-shadow: 0 5px 15px ${colors.primary}20;
            }
            
            .return-badge {
                background: ${colors.info}15;
                border: 1px solid ${colors.info}30;
                border-radius: 20px;
                padding: 4px 10px;
                font-size: 0.75rem;
                color: ${colors.info};
                display: inline-flex;
                align-items: center;
                gap: 4px;
            }
            
            .return-approved {
                background: ${colors.success}15;
                border: 1px solid ${colors.success}30;
                color: ${colors.success};
            }
            
            .return-rejected {
                background: ${colors.error}15;
                border: 1px solid ${colors.error}30;
                color: ${colors.error};
            }
            
            .return-pending {
                background: ${colors.warning}15;
                border: 1px solid ${colors.warning}30;
                color: ${colors.warning};
            }
            
            .review-btn, .return-btn {
                background: transparent;
                border: 2px solid ${colors.primary};
                color: ${colors.primary};
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: inline-flex;
                align-items: center;
                gap: 5px;
                width: 100%;
                justify-content: center;
            }
            
            .review-btn:hover, .return-btn:hover {
                background: ${colors.primary};
                color: ${colors.white};
            }
            
            .return-btn {
                border-color: ${colors.info};
                color: ${colors.info};
            }
            
            .return-btn:hover {
                background: ${colors.info};
                color: ${colors.white};
            }
            
            .reviewed-badge {
                background: ${colors.success}15;
                color: ${colors.success};
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: 600;
                display: inline-flex;
                align-items: center;
                gap: 5px;
                width: 100%;
                justify-content: center;
                border: 1px solid ${colors.success}30;
            }
            
            .view-details-btn {
                background: transparent;
                border: 2px solid ${colors.primary};
                color: ${colors.primary};
                padding: 8px 20px;
                border-radius: 30px;
                font-weight: 600;
                transition: all 0.3s ease;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                text-decoration: none;
            }
            
            .view-details-btn:hover {
                background: ${colors.primary};
                color: ${colors.white};
            }
            
            .empty-state {
                animation: float 3s ease-in-out infinite;
            }
            
            .return-timeline {
                display: flex;
                align-items: center;
                gap: 4px;
                margin-top: 4px;
                font-size: 0.75rem;
            }
            
            .return-timeline-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: ${colors.textLight};
            }
            
            @media (max-width: 768px) {
                .review-btn, .return-btn, .reviewed-badge {
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // Fetch orders and check review status
    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError('');
            
            console.log('📦 Fetching orders with token:', token ? 'Token exists' : 'No token');
            
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await orderAPI.getMyOrders();
            
            console.log('✅ Orders response:', response.data);

            let ordersData = [];
            if (response.data && response.data.orders) {
                ordersData = response.data.orders;
            } else if (Array.isArray(response.data)) {
                ordersData = response.data;
            } else if (response.data && response.data.data) {
                ordersData = response.data.data;
            }

            // Fetch reviews to check review status
            const reviewStatus = {};
            
            if (token) {
                try {
                    console.log('📝 Fetching user reviews...');
                    
                    const reviewResponse = await axios.get(`${API_URL}/reviews/user`, {
                        headers: { 
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (reviewResponse.data && reviewResponse.data.success) {
                        reviewResponse.data.data.forEach(review => {
                            if (review.product) {
                                const productId = review.product._id || review.product;
                                reviewStatus[productId] = true;
                            }
                        });
                        console.log('✅ Reviews fetched:', Object.keys(reviewStatus).length);
                    }
                } catch (err) {
                    console.error('❌ Error fetching reviews:', err.response?.data || err.message);
                }
            }
            
            // Update orders with review status
            const updatedOrders = ordersData.map(order => ({
                ...order,
                orderItems: order.orderItems?.map(item => {
                    const productId = item.product?._id || item.product;
                    return {
                        ...item,
                        productId: productId,
                        isReviewed: reviewStatus[productId] || false
                    };
                })
            }));

            setOrders(updatedOrders);
        } catch (error) {
            console.error('❌ Error fetching orders:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            
            if (error.response?.status === 401) {
                setError('Your session has expired. Please login again.');
            } else {
                setError(error.response?.data?.message || 'Failed to load orders');
            }
        } finally {
            setLoading(false);
        }
    };

    // Fetch return requests for all orders - UPDATED to handle 404 gracefully
    const fetchReturnRequests = async () => {
        try {
            setLoadingReturns(true);
            
            if (!token) {
                console.log('No token for return requests');
                return;
            }

            const requests = {};
            
            for (const order of orders) {
                try {
                    console.log(`Fetching returns for order ${order._id}`);
                    
                    const response = await axios.get(`${API_URL}/returns/order/${order._id}`, {
                        headers: { 
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        validateStatus: (status) => status < 500 // Don't throw on 404
                    });
                    
                    // Check if response is successful and has data
                    if (response.status === 200 && response.data && response.data.success) {
                        // Handle different response structures
                        const returnData = response.data.data || response.data.returns || response.data;
                        if (returnData && (Array.isArray(returnData) ? returnData.length > 0 : true)) {
                            requests[order._id] = returnData;
                            console.log(`Found returns for order ${order._id}:`, returnData);
                        } else {
                            console.log(`No returns found for order ${order._id} (empty response)`);
                        }
                    } else if (response.status === 404) {
                        // 404 means no returns - this is normal, not an error
                        console.log(`No returns found for order ${order._id} (404)`);
                    } else {
                        console.log(`Unexpected response for order ${order._id}:`, response.status);
                    }
                } catch (err) {
                    // Only log non-404 errors
                    if (err.response?.status !== 404) {
                        console.log(`Error fetching returns for order ${order._id}:`, err.message);
                    } else {
                        console.log(`No returns found for order ${order._id} (404 handled)`);
                    }
                }
            }
            
            setReturnRequests(requests);
            setReturnFeatureEnabled(true);
        } catch (error) {
            console.error('❌ Error in fetchReturnRequests:', error);
            setReturnFeatureEnabled(false);
        } finally {
            setLoadingReturns(false);
        }
    };

    // Handle return click
    const handleReturnClick = (order, item) => {
        console.log('🔄 Return clicked:', { orderId: order._id, item });
        setSelectedOrder(order);
        setSelectedProduct(item);
        setShowReturnModal(true);
    };

    // Handle return success
    const handleReturnSuccess = async (returnData) => {
        console.log('✅ Return success:', returnData);
        setReturnSuccess('Return request submitted successfully!');
        
        // Refresh return requests
        await fetchReturnRequests();
        
        setTimeout(() => setReturnSuccess(''), 3000);
    };

    // Handle return error
    const handleReturnError = (errorMsg) => {
        console.error('❌ Return error:', errorMsg);
        setReturnError(errorMsg);
        setTimeout(() => setReturnError(''), 3000);
    };

    // Handle review click
    const handleReviewClick = (order, product) => {
        console.log('⭐ Review clicked:', { orderId: order._id, product });
        setSelectedOrder(order);
        setSelectedProduct(product);
        setShowReviewModal(true);
    };

    // Handle review success
    const handleReviewSuccess = async (productId) => {
        console.log('✅ Review success for product:', productId);
        setReviewSuccess('Thank you for your review!');
        
        // Refresh orders to get updated review status
        await fetchOrders();
        
        setTimeout(() => setReviewSuccess(''), 3000);
    };

    // Handle review error
    const handleReviewError = (errorMsg) => {
        console.error('❌ Review error:', errorMsg);
        setReviewError(errorMsg);
        setTimeout(() => setReviewError(''), 3000);
    };

    // Get status details
    const getStatusDetails = (order) => {
        if (order.status === 'delivered' || order.isDelivered) {
            return { 
                text: 'Delivered', 
                icon: CheckCircle,
                color: colors.success,
                className: 'status-delivered'
            };
        } else if (order.status === 'out-for-delivery') {
            return { 
                text: 'Out for Delivery', 
                icon: Truck,
                color: colors.pink,
                className: 'status-out-for-delivery'
            };
        } else if (order.status === 'shipped') {
            return { 
                text: 'Shipped', 
                icon: Package,
                color: colors.info,
                className: 'status-shipped'
            };
        } else if (order.status === 'processing') {
            return { 
                text: 'Processing', 
                icon: Clock,
                color: colors.warning,
                className: 'status-processing'
            };
        } else if (order.status === 'cancelled') {
            return { 
                text: 'Cancelled', 
                icon: XCircle,
                color: colors.error,
                className: 'status-cancelled'
            };
        } else if (order.status === 'pending') {
            return { 
                text: 'Pending', 
                icon: Clock,
                color: colors.warning,
                className: 'status-pending'
            };
        } else if (order.isPaid) {
            return { 
                text: 'Paid', 
                icon: CheckCircle,
                color: colors.success,
                className: 'status-delivered'
            };
        } else {
            return { 
                text: 'Pending', 
                icon: Clock,
                color: colors.warning,
                className: 'status-pending'
            };
        }
    };

    // Get return status for an item
    const getItemReturnStatus = (orderId, itemId) => {
        try {
            const orderReturns = returnRequests[orderId];
            if (!orderReturns) return null;
            
            // Handle both array and object responses
            const returnsArray = Array.isArray(orderReturns) ? orderReturns : [orderReturns];
            
            const itemReturn = returnsArray.find(r => 
                r.items && r.items.some(i => {
                    const productId = i.product?.toString() || i.product;
                    return productId === itemId?.toString();
                })
            );
            
            if (!itemReturn) return null;
            
            return {
                status: itemReturn.status || 'pending',
                requestDate: itemReturn.createdAt || itemReturn.requestedAt,
                id: itemReturn._id || itemReturn.returnId
            };
        } catch (error) {
            console.error('Error getting return status:', error);
            return null;
        }
    };

    // Check if item is eligible for return
    const isReturnEligible = (order, item) => {
        try {
            // Check if order is delivered
            if (order.status !== 'delivered' && !order.isDelivered) {
                return false;
            }
            
            // Check if within 7 days of delivery (standard return window)
            const deliveryDate = order.deliveredAt || order.createdAt;
            if (!deliveryDate) return false;
            
            const daysSinceDelivery = (new Date() - new Date(deliveryDate)) / (1000 * 60 * 60 * 24);
            
            if (daysSinceDelivery > 7) {
                return false;
            }
            
            // Check if already returned
            const returnStatus = getItemReturnStatus(order._id, item.productId || item.product);
            if (returnStatus) {
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Error checking return eligibility:', error);
            return false;
        }
    };

    const formatDate = (dateString) => {
        try {
            return new Date(dateString).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return 'Invalid Date';
        }
    };

    const formatTime = (dateString) => {
        try {
            return new Date(dateString).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return '';
        }
    };

    const calculateOrderStats = () => {
        const totalOrders = orders.length;
        const totalSpent = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
        const deliveredOrders = orders.filter(o => o.status === 'delivered' || o.isDelivered).length;
        const outForDeliveryOrders = orders.filter(o => o.status === 'out-for-delivery').length;
        const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
        
        return { totalOrders, totalSpent, deliveredOrders, outForDeliveryOrders, pendingOrders };
    };

    const stats = calculateOrderStats();

    // Show login prompt if not authenticated
    if (!isAuthenticated || !token) {
        return (
            <div style={{
                minHeight: '100vh',
                background: colors.bgPrimary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '20px',
                padding: '20px'
            }}>
                <AlertCircle size={50} color={colors.error} />
                <h2 style={{ color: colors.textPrimary, fontSize: '1.5rem' }}>Authentication Required</h2>
                <p style={{ color: colors.textSecondary }}>Please log in to view your orders.</p>
                <button
                    onClick={() => navigate('/login')}
                    style={{
                        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                        color: colors.white,
                        border: 'none',
                        padding: '12px 30px',
                        borderRadius: '30px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    Go to Login
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: colors.bgPrimary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '20px',
            }}>
                <Loader size={50} color={colors.primary} style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ color: colors.textSecondary, fontSize: '1.1rem' }}>Loading your orders...</p>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: colors.bgPrimary,
            padding: '40px 20px',
            position: 'relative',
        }}>
            {/* Background gradients */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `radial-gradient(circle at 20% 30%, ${colors.primary}10 0%, transparent 50%)`,
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `radial-gradient(circle at 80% 70%, ${colors.primaryLight}10 0%, transparent 50%)`,
                pointerEvents: 'none',
            }} />

            {/* Success messages */}
            {reviewSuccess && (
                <div style={{
                    position: 'fixed',
                    top: '100px',
                    right: '20px',
                    background: colors.success,
                    color: colors.white,
                    padding: '15px 25px',
                    borderRadius: '12px',
                    boxShadow: `0 10px 30px ${colors.success}40`,
                    zIndex: 9999,
                    animation: 'slideIn 0.3s ease-out',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <CheckCircle size={20} />
                    {reviewSuccess}
                </div>
            )}

            {returnSuccess && (
                <div style={{
                    position: 'fixed',
                    top: '160px',
                    right: '20px',
                    background: colors.info,
                    color: colors.white,
                    padding: '15px 25px',
                    borderRadius: '12px',
                    boxShadow: `0 10px 30px ${colors.info}40`,
                    zIndex: 9999,
                    animation: 'slideIn 0.3s ease-out',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <RefreshCw size={20} />
                    {returnSuccess}
                </div>
            )}

            {/* Error messages */}
            {reviewError && (
                <div style={{
                    position: 'fixed',
                    top: '100px',
                    right: '20px',
                    background: colors.error,
                    color: colors.white,
                    padding: '15px 25px',
                    borderRadius: '12px',
                    boxShadow: `0 10px 30px ${colors.error}40`,
                    zIndex: 9999,
                    animation: 'slideIn 0.3s ease-out',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <AlertCircle size={20} />
                    {reviewError}
                </div>
            )}

            {returnError && (
                <div style={{
                    position: 'fixed',
                    top: '160px',
                    right: '20px',
                    background: colors.error,
                    color: colors.white,
                    padding: '15px 25px',
                    borderRadius: '12px',
                    boxShadow: `0 10px 30px ${colors.error}40`,
                    zIndex: 9999,
                    animation: 'slideIn 0.3s ease-out',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <AlertCircle size={20} />
                    {returnError}
                </div>
            )}

            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                position: 'relative',
                zIndex: 2,
            }}>
                {/* Header Section */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '30px',
                    flexWrap: 'wrap',
                    gap: '20px',
                }}>
                    <div>
                        <h1 style={{
                            fontSize: windowWidth <= 768 ? '2rem' : '2.5rem',
                            fontWeight: '800',
                            color: colors.textPrimary,
                            marginBottom: '8px',
                            background: `linear-gradient(135deg, ${colors.textPrimary}, ${colors.primary})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            Order History
                        </h1>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <span style={{
                                background: colors.white,
                                border: `1px solid ${colors.border}`,
                                padding: '6px 16px',
                                borderRadius: '30px',
                                fontSize: '0.9rem',
                                color: colors.textSecondary,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}>
                                <ShoppingBag size={16} color={colors.primary} />
                                {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
                            </span>
                            {stats.totalSpent > 0 && (
                                <span style={{
                                    background: colors.white,
                                    border: `1px solid ${colors.border}`,
                                    padding: '6px 16px',
                                    borderRadius: '30px',
                                    fontSize: '0.9rem',
                                    color: colors.textSecondary,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                }}>
                                    <DollarSign size={16} color={colors.primary} />
                                    Total Spent: ₹{stats.totalSpent.toFixed(2)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div style={{
                        display: 'flex',
                        gap: '15px',
                        flexWrap: 'wrap',
                    }}>
                        <div style={{
                            background: colors.white,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '16px',
                            padding: '12px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            boxShadow: `0 4px 12px rgba(0,0,0,0.02)`,
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                background: colors.bgSecondary,
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `1px solid ${colors.border}`,
                            }}>
                                <CheckCircle size={20} color={colors.success} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: colors.textLight }}>Delivered</div>
                                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: colors.textPrimary }}>
                                    {stats.deliveredOrders}
                                </div>
                            </div>
                        </div>

                        <div style={{
                            background: colors.white,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '16px',
                            padding: '12px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            boxShadow: `0 4px 12px rgba(0,0,0,0.02)`,
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                background: colors.bgSecondary,
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `1px solid ${colors.border}`,
                            }}>
                                <Truck size={20} color={colors.pink} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: colors.textLight }}>Out for Delivery</div>
                                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: colors.textPrimary }}>
                                    {stats.outForDeliveryOrders}
                                </div>
                            </div>
                        </div>

                        <div style={{
                            background: colors.white,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '16px',
                            padding: '12px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            boxShadow: `0 4px 12px rgba(0,0,0,0.02)`,
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                background: colors.bgSecondary,
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `1px solid ${colors.border}`,
                            }}>
                                <Clock size={20} color={colors.warning} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: colors.textLight }}>Pending</div>
                                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: colors.textPrimary }}>
                                    {stats.pendingOrders}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div style={{
                        background: `${colors.error}10`,
                        border: `1px solid ${colors.error}`,
                        borderRadius: '16px',
                        padding: '20px',
                        marginBottom: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        backdropFilter: 'blur(8px)',
                    }}>
                        <AlertCircle size={24} color={colors.error} />
                        <span style={{ color: colors.error, fontSize: '1rem' }}>{error}</span>
                    </div>
                )}

                {!error && orders.length === 0 ? (
                    <div className="empty-state" style={{
                        background: colors.white,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '32px',
                        padding: '60px 20px',
                        maxWidth: '500px',
                        margin: '40px auto',
                        textAlign: 'center',
                    }}>
                        <div style={{ marginBottom: '30px' }}>
                            <Package size={80} color={colors.primary} />
                        </div>
                        <h3 style={{ color: colors.textPrimary, fontSize: '1.8rem', marginBottom: '15px' }}>
                            No Orders Yet
                        </h3>
                        <p style={{ color: colors.textSecondary, fontSize: '1.1rem', marginBottom: '30px' }}>
                            Looks like you haven't placed any orders yet.
                        </p>
                        <Link to="/shop" style={{
                            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                            color: colors.white,
                            border: 'none',
                            padding: '14px 40px',
                            borderRadius: '30px',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px',
                            transition: 'all 0.3s ease',
                            boxShadow: `0 8px 20px -5px ${colors.primary}`,
                        }}>
                            <ShoppingBag size={20} />
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px',
                    }}>
                        {orders.map((order, index) => {
                            const status = getStatusDetails(order);
                            const StatusIcon = status.icon;
                            const isDelivered = order.status === 'delivered' || order.isDelivered;
                            
                            return (
                                <div
                                    key={order._id}
                                    className="order-card"
                                    style={{
                                        animation: `slideIn 0.5s ease-out ${index * 0.1}s`,
                                        background: colors.white,
                                        border: `1px solid ${colors.border}`,
                                        borderRadius: '20px',
                                        overflow: 'hidden',
                                    }}
                                    onMouseEnter={() => setHoveredOrder(order._id)}
                                    onMouseLeave={() => setHoveredOrder(null)}
                                >
                                    <div style={{ padding: '25px' }}>
                                        {/* Order Header */}
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '20px',
                                            flexWrap: 'wrap',
                                            gap: '15px',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                                                <div style={{
                                                    width: '50px',
                                                    height: '50px',
                                                    background: colors.bgSecondary,
                                                    borderRadius: '15px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    border: `1px solid ${colors.border}`,
                                                }}>
                                                    <Package size={24} color={colors.primary} />
                                                </div>
                                                <div>
                                                    <h3 style={{
                                                        fontSize: '1.2rem',
                                                        fontWeight: '600',
                                                        color: colors.textPrimary,
                                                        marginBottom: '5px',
                                                    }}>
                                                        Order #{order._id?.slice(-8).toUpperCase()}
                                                    </h3>
                                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                        <span className={`status-badge ${status.className}`}>
                                                            <StatusIcon size={14} />
                                                            {status.text}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{
                                                    fontSize: '1.5rem',
                                                    fontWeight: '700',
                                                    color: colors.primary,
                                                    marginBottom: '5px',
                                                }}>
                                                    ₹{order.totalPrice?.toFixed(2) || 0}
                                                </div>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                    color: colors.textLight,
                                                    fontSize: '0.9rem',
                                                }}>
                                                    <Calendar size={14} />
                                                    {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Order Items */}
                                        <div style={{ marginBottom: '20px' }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '15px',
                                            }}>
                                                <h4 style={{
                                                    fontSize: '1rem',
                                                    fontWeight: '600',
                                                    color: colors.textSecondary,
                                                }}>
                                                    Items ({order.orderItems?.length || 0})
                                                </h4>
                                                <button
                                                    onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: colors.primary,
                                                        cursor: 'pointer',
                                                        fontSize: '0.9rem',
                                                        fontWeight: '500',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '5px',
                                                    }}
                                                >
                                                    {expandedOrder === order._id ? 'Show Less' : 'Show All'}
                                                </button>
                                            </div>
                                            
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                                                gap: '10px',
                                            }}>
                                                {(expandedOrder === order._id 
                                                    ? order.orderItems 
                                                    : order.orderItems?.slice(0, 3)
                                                )?.map((item, itemIndex) => {
                                                    const returnStatus = getItemReturnStatus(order._id, item.productId || item.product);
                                                    
                                                    return (
                                                        <div
                                                            key={itemIndex}
                                                            className="item-badge"
                                                        >
                                                            <div style={{
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: '8px',
                                                            }}>
                                                                <div style={{
                                                                    fontWeight: '600',
                                                                    color: colors.textPrimary,
                                                                    fontSize: '0.95rem',
                                                                }}>
                                                                    {item.name}
                                                                </div>
                                                                
                                                                {/* Return Status Badge */}
                                                                {returnStatus && (
                                                                    <div className={`return-badge ${
                                                                        returnStatus.status === 'approved' ? 'return-approved' :
                                                                        returnStatus.status === 'rejected' ? 'return-rejected' :
                                                                        'return-pending'
                                                                    }`}>
                                                                        <RefreshCw size={12} />
                                                                        Return {returnStatus.status}
                                                                        <span className="return-timeline">
                                                                            • {formatDate(returnStatus.requestDate)}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                
                                                                <div style={{
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                }}>
                                                                    <span style={{
                                                                        fontSize: '0.85rem',
                                                                        color: colors.textLight,
                                                                    }}>
                                                                        Qty: {item.qty}
                                                                    </span>
                                                                    <span style={{
                                                                        fontSize: '0.95rem',
                                                                        fontWeight: '600',
                                                                        color: colors.primary,
                                                                    }}>
                                                                        ₹{item.price}
                                                                    </span>
                                                                </div>
                                                                
                                                                {/* Action Buttons for delivered items */}
                                                                {isDelivered && (
                                                                    <div style={{ 
                                                                        display: 'grid',
                                                                        gridTemplateColumns: '1fr 1fr',
                                                                        gap: '8px',
                                                                        marginTop: '5px'
                                                                    }}>
                                                                        {/* Review Button */}
                                                                        {item.isReviewed ? (
                                                                            <span className="reviewed-badge">
                                                                                <CheckCircle size={14} />
                                                                                Reviewed
                                                                            </span>
                                                                        ) : (
                                                                            <button
                                                                                className="review-btn"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    e.preventDefault();
                                                                                    handleReviewClick(order, {
                                                                                        ...item,
                                                                                        productId: item.productId || item.product,
                                                                                        product: item.product
                                                                                    });
                                                                                }}
                                                                            >
                                                                                <Star size={14} />
                                                                                Review
                                                                            </button>
                                                                        )}
                                                                        
                                                                        {/* Return Button - Only show if eligible and not already returned */}
                                                                        {!returnStatus && isReturnEligible(order, item) && (
                                                                            <button
                                                                                className="return-btn"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    e.preventDefault();
                                                                                    handleReturnClick(order, {
                                                                                        ...item,
                                                                                        productId: item.productId || item.product
                                                                                    });
                                                                                }}
                                                                            >
                                                                                <RotateCcw size={14} />
                                                                                Return
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            
                                            {!expandedOrder && order.orderItems?.length > 3 && (
                                                <div style={{
                                                    textAlign: 'center',
                                                    marginTop: '10px',
                                                    color: colors.textLight,
                                                    fontSize: '0.9rem',
                                                }}>
                                                    +{order.orderItems.length - 3} more items
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: '15px',
                                            marginTop: '10px',
                                            paddingTop: '20px',
                                            borderTop: `1px solid ${colors.border}`,
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                gap: '15px',
                                                flexWrap: 'wrap',
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                    color: colors.textLight,
                                                    fontSize: '0.9rem',
                                                    cursor: 'pointer',
                                                }}>
                                                    <RotateCcw size={16} color={colors.primary} />
                                                    <span>Reorder</span>
                                                </div>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                    color: colors.textLight,
                                                    fontSize: '0.9rem',
                                                    cursor: 'pointer',
                                                }}>
                                                    <HelpCircle size={16} color={colors.primary} />
                                                    <span>Need Help?</span>
                                                </div>
                                            </div>
                                            
                                            <Link
                                                to={`/order/${order._id}`}
                                                className="view-details-btn"
                                                onClick={() => console.log('🔗 Navigating to order:', order._id)}
                                            >
                                                View Details
                                                <ChevronRight size={16} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Review Modal */}
            {showReviewModal && selectedProduct && selectedOrder && (
                <ProductReviewModal
                    product={{
                        ...selectedProduct,
                        _id: selectedProduct.productId || selectedProduct.product
                    }}
                    order={selectedOrder}
                    onClose={() => {
                        setShowReviewModal(false);
                        setSelectedProduct(null);
                        setSelectedOrder(null);
                    }}
                    onSuccess={handleReviewSuccess}
                    onError={handleReviewError}
                />
            )}

            {/* Return Request Modal */}
            {showReturnModal && selectedProduct && selectedOrder && (
                <ReturnRequestModal
                    product={selectedProduct}
                    order={selectedOrder}
                    onClose={() => {
                        setShowReturnModal(false);
                        setSelectedProduct(null);
                        setSelectedOrder(null);
                    }}
                    onSuccess={handleReturnSuccess}
                    onError={handleReturnError}
                />
            )}
        </div>
    );
};

export default OrderHistory;