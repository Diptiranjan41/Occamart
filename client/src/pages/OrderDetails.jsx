// src/pages/OrderDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { orderAPI } from '../api/api';
import { 
    Package, 
    Calendar, 
    DollarSign, 
    MapPin, 
    CreditCard, 
    ArrowLeft, 
    AlertCircle,
    Truck,
    CheckCircle,
    Clock,
    XCircle,
    ShoppingBag,
    Home,
    Phone,
    Mail,
    Printer,
    Download,
    Share2,
    Heart,
    Star,
    Award,
    Sparkles,
    Loader,
    RefreshCw,
    Send,
    Ban,
    PackageCheck,
    PackageSearch,
    Box,
    Store,
    Building2,
    ChevronRight,
    Circle
} from 'lucide-react';

const OrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('items');
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
    const [cancelling, setCancelling] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    // 🔥 DEBUG: Log the ID from URL immediately
    console.log('🔍 OrderDetails mounted with ID from URL:', id);
    console.log('🔗 Full URL:', window.location.href);

    // Beige and Gold color scheme
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
        outForDelivery: '#EC4899',
        outForDeliveryGlow: 'rgba(236, 72, 153, 0.3)',
        cancelled: '#6B7280',
        cancelledGlow: 'rgba(107, 114, 128, 0.3)',
        white: '#FFFFFF',
        black: '#000000',
    };

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        console.log('🔄 useEffect triggered with ID:', id);
        fetchOrderDetails();
    }, [id]);

    // Add CSS animations
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes float {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-5px); }
                100% { transform: translateY(0px); }
            }
            
            @keyframes glow {
                0% { box-shadow: 0 0 5px ${colors.primary}; }
                50% { box-shadow: 0 0 20px ${colors.primary}; }
                100% { box-shadow: 0 0 5px ${colors.primary}; }
            }
            
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes slideOut {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100%);
                }
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.02); }
                100% { transform: scale(1); }
            }
            
            @keyframes shimmer {
                0% { transform: translateX(-100%) rotate(45deg); opacity: 0; }
                20% { opacity: 0.3; }
                40% { transform: translateX(100%) rotate(45deg); opacity: 0; }
                100% { transform: translateX(100%) rotate(45deg); opacity: 0; }
            }
            
            .detail-card {
                animation: slideIn 0.6s ease-out;
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                background: ${colors.white};
                border: 1px solid ${colors.border};
                border-radius: 24px;
                position: relative;
                overflow: hidden;
            }
            
            .detail-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 20px 40px -10px ${colors.primary}40;
                border-color: ${colors.primary};
            }
            
            .detail-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, ${colors.primary}10, transparent);
                transition: left 0.6s ease;
            }
            
            .detail-card:hover::before {
                left: 100%;
            }
            
            .status-badge {
                padding: 8px 16px;
                border-radius: 30px;
                font-size: 0.9rem;
                font-weight: 600;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                border: 1px solid transparent;
                transition: all 0.3s ease;
                backdrop-filter: blur(4px);
            }
            
            .status-badge:hover {
                transform: translateY(-2px);
                filter: brightness(1.1);
            }
            
            .status-delivered {
                background: ${colors.success}15;
                color: ${colors.success};
                border-color: ${colors.success}40;
            }
            
            .status-shipped {
                background: ${colors.info}15;
                color: ${colors.info};
                border-color: ${colors.info}40;
            }
            
            .status-out-for-delivery {
                background: ${colors.outForDelivery}15;
                color: ${colors.outForDelivery};
                border-color: ${colors.outForDelivery}40;
            }
            
            .status-processing {
                background: ${colors.warning}15;
                color: ${colors.warning};
                border-color: ${colors.warning}40;
            }
            
            .status-pending {
                background: ${colors.warning}15;
                color: ${colors.warning};
                border-color: ${colors.warning}40;
            }
            
            .status-cancelled {
                background: ${colors.cancelled}15;
                color: ${colors.cancelled};
                border-color: ${colors.cancelled}40;
            }
            
            .info-card {
                background: ${colors.bgSecondary};
                border: 1px solid ${colors.border};
                border-radius: 18px;
                padding: 20px;
                transition: all 0.3s ease;
            }
            
            .info-card:hover {
                background: ${colors.white};
                border-color: ${colors.primary};
                transform: translateY(-3px);
                box-shadow: 0 10px 25px -5px ${colors.primary}40;
            }
            
            .tracking-item {
                position: relative;
                padding-left: 40px;
                padding-bottom: 30px;
                border-left: 2px solid ${colors.border};
                margin-left: 20px;
                transition: all 0.3s ease;
            }
            
            .tracking-item:last-child {
                border-left: 2px solid transparent;
                padding-bottom: 0;
            }
            
            .tracking-item:hover {
                border-left-color: ${colors.primary};
            }
            
            .tracking-dot {
                position: absolute;
                left: -11px;
                top: 0;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: ${colors.white};
                border: 2px solid ${colors.border};
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }
            
            .tracking-item:hover .tracking-dot {
                border-color: ${colors.primary};
                transform: scale(1.2);
            }
            
            .tracking-dot.completed {
                background: ${colors.success};
                border-color: ${colors.success};
                color: ${colors.white};
            }
            
            .tracking-dot.active {
                background: ${colors.primary};
                border-color: ${colors.primary};
                color: ${colors.white};
                animation: glow 2s infinite;
            }
            
            .tracking-dot.cancelled {
                background: ${colors.cancelled};
                border-color: ${colors.cancelled};
                color: ${colors.white};
            }
            
            .tracking-content {
                background: ${colors.bgSecondary};
                border: 1px solid ${colors.border};
                border-radius: 16px;
                padding: 15px;
                transition: all 0.3s ease;
            }
            
            .tracking-item:hover .tracking-content {
                background: ${colors.white};
                border-color: ${colors.primary};
                transform: translateX(5px);
                box-shadow: 0 5px 15px ${colors.primary}20;
            }
            
            .table-row {
                transition: all 0.3s ease;
            }
            
            .table-row:hover {
                background: ${colors.bgSecondary};
                transform: translateX(5px);
            }
            
            .action-btn {
                background: transparent;
                border: 1px solid ${colors.border};
                color: ${colors.textSecondary};
                padding: 10px 18px;
                border-radius: 30px;
                font-size: 0.9rem;
                font-weight: 500;
                transition: all 0.3s ease;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
            }
            
            .action-btn:hover:not(:disabled) {
                background: ${colors.primary};
                border-color: ${colors.primary};
                color: ${colors.white};
                transform: translateY(-2px);
                box-shadow: 0 5px 15px ${colors.primary}40;
            }
            
            .action-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .cancel-btn {
                background: transparent;
                border: 1px solid ${colors.error};
                color: ${colors.error};
            }
            
            .cancel-btn:hover:not(:disabled) {
                background: ${colors.error};
                border-color: ${colors.error};
                color: ${colors.white};
            }
            
            .gold-gradient {
                background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%);
            }
            
            .glass-card {
                background: ${colors.bgGlass};
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 1px solid ${colors.border};
            }
            
            .progress-step {
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                flex: 1;
            }
            
            .progress-step::before {
                content: '';
                position: absolute;
                top: 20px;
                left: -50%;
                width: 100%;
                height: 2px;
                background: ${colors.border};
                z-index: 1;
            }
            
            .progress-step:first-child::before {
                display: none;
            }
            
            .step-dot {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: ${colors.bgSecondary};
                border: 2px solid ${colors.border};
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2;
                transition: all 0.3s ease;
            }
            
            .step-dot.active {
                background: ${colors.primary};
                border-color: ${colors.primary};
                color: ${colors.white};
                box-shadow: 0 0 15px ${colors.primary};
            }
            
            .step-dot.completed {
                background: ${colors.success};
                border-color: ${colors.success};
                color: ${colors.white};
            }
            
            .step-dot.cancelled {
                background: ${colors.cancelled};
                border-color: ${colors.cancelled};
                color: ${colors.white};
            }
            
            .modal {
                animation: slideIn 0.3s ease-out;
            }
            
            .notification {
                animation: slideIn 0.3s ease-out;
            }
            
            @media (max-width: 768px) {
                .detail-card {
                    margin-bottom: 15px;
                }
                
                .info-card {
                    margin-bottom: 15px;
                }
                
                .action-btn {
                    width: 100%;
                    justify-content: center;
                }
                
                .tracking-item {
                    padding-left: 30px;
                }
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            
            // 🔥 Validate ID
            if (!id) {
                console.error('❌ No order ID provided');
                setError('No order ID provided');
                setLoading(false);
                return;
            }

            console.log('📦 Fetching order details for ID:', id);
            console.log('📡 API URL:', `/orders/${id}`);
            
            const response = await orderAPI.getOrderById(id);
            
            console.log('✅ Order details response:', response.data);
            
            if (response.data && response.data.order) {
                setOrder(response.data.order);
            } else if (response.data && response.data._id) {
                setOrder(response.data);
            } else {
                setError('Order not found');
            }
            
            setError('');
        } catch (error) {
            console.error('❌ Error fetching order:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                requestedId: id
            });
            
            if (error.response?.status === 404) {
                setError('Order not found. Please check the order ID.');
            } else {
                setError(error.response?.data?.message || 'Failed to load order details');
            }
        } finally {
            setLoading(false);
        }
    };

    const getStatusDetails = (order) => {
        if (!order) return { text: 'Unknown', icon: AlertCircle, color: colors.textLight, className: '' };
        
        if (order.status === 'cancelled') {
            return { 
                text: 'Cancelled', 
                icon: XCircle,
                color: colors.cancelled,
                className: 'status-cancelled'
            };
        } else if (order.status === 'delivered' || order.isDelivered) {
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
                color: colors.outForDelivery,
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
                icon: RefreshCw,
                color: colors.warning,
                className: 'status-processing'
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

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).replace(',', '');
    };

    const formatDateOnly = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }).replace(',', '');
    };

    const formatTimeOnly = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Generate tracking timeline based on order status
    const getTrackingTimeline = (order) => {
        if (!order) return [];
        
        const timeline = [];
        
        // Order Confirmed
        if (order.createdAt) {
            timeline.push({
                id: 'confirmed',
                title: 'Order Confirmed',
                description: 'Your Order has been placed.',
                date: formatDateOnly(order.createdAt),
                time: formatTimeOnly(order.createdAt),
                status: 'completed',
                icon: CheckCircle
            });
        }
        
        // Processing
        if (order.status === 'processing' || order.status === 'shipped' || order.status === 'out-for-delivery' || order.status === 'delivered') {
            timeline.push({
                id: 'processed',
                title: 'Processed',
                description: 'Seller has processed your order.',
                date: formatDateOnly(order.updatedAt || order.createdAt),
                time: formatTimeOnly(order.updatedAt || order.createdAt),
                status: order.status === 'processing' ? 'active' : 'completed',
                icon: RefreshCw
            });
        }
        
        // Picked Up
        if (order.status === 'shipped' || order.status === 'out-for-delivery' || order.status === 'delivered') {
            timeline.push({
                id: 'picked',
                title: 'Picked Up',
                description: 'Your item has been picked up by delivery partner.',
                date: formatDateOnly(order.shippedAt || order.updatedAt),
                time: formatTimeOnly(order.shippedAt || order.updatedAt),
                status: order.status === 'shipped' ? 'active' : 'completed',
                icon: PackageSearch
            });
        }
        
        // Shipped with tracking
        if (order.status === 'shipped' || order.status === 'out-for-delivery' || order.status === 'delivered') {
            timeline.push({
                id: 'shipped',
                title: 'Shipped',
                description: order.trackingNumber ? 
                    `Ekart Logistics - ${order.trackingNumber}` : 
                    'Your item has been shipped.',
                date: formatDateOnly(order.shippedAt || order.updatedAt),
                time: formatTimeOnly(order.shippedAt || order.updatedAt),
                status: order.status === 'shipped' ? 'active' : 'completed',
                icon: Package,
                subEvents: [
                    {
                        description: 'Your item has been shipped.',
                        time: formatTimeOnly(order.shippedAt || order.updatedAt)
                    },
                    {
                        description: 'Your item has been received in the hub nearest to you',
                        time: formatTimeOnly(order.updatedAt)
                    }
                ]
            });
        }
        
        // Out for Delivery
        if (order.status === 'out-for-delivery' || order.status === 'delivered') {
            timeline.push({
                id: 'outfordelivery',
                title: 'Out for Delivery',
                description: 'Your item is out for delivery',
                date: formatDateOnly(order.outForDeliveryAt || order.updatedAt),
                time: formatTimeOnly(order.outForDeliveryAt || order.updatedAt),
                status: order.status === 'out-for-delivery' ? 'active' : 'completed',
                icon: Truck
            });
        }
        
        // Delivered
        if (order.status === 'delivered' || order.isDelivered) {
            timeline.push({
                id: 'delivered',
                title: 'Delivered',
                description: 'Your item has been delivered',
                date: formatDateOnly(order.deliveredAt),
                time: formatTimeOnly(order.deliveredAt),
                status: 'completed',
                icon: CheckCircle
            });
        }
        
        // Cancelled
        if (order.status === 'cancelled') {
            timeline.push({
                id: 'cancelled',
                title: 'Cancelled',
                description: order.cancellationReason || 'Your order has been cancelled',
                date: formatDateOnly(order.cancelledAt || order.updatedAt),
                time: formatTimeOnly(order.cancelledAt || order.updatedAt),
                status: 'cancelled',
                icon: XCircle
            });
        }
        
        return timeline;
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadInvoice = () => {
        // Implement invoice download logic
        alert('Invoice download feature coming soon!');
    };

    const handleReorder = () => {
        // Implement reorder logic
        alert('Reorder feature coming soon!');
    };

    // Handle order cancellation
    const handleCancelOrder = async () => {
        if (!cancelReason.trim()) {
            showNotification('Please provide a reason for cancellation', 'error');
            return;
        }

        setCancelling(true);
        try {
            const response = await orderAPI.updateOrderStatus(id, 'cancelled', {
                reason: cancelReason,
                cancelledBy: 'user',
                cancelledAt: new Date().toISOString()
            });

            if (response.data.success) {
                showNotification('Order cancelled successfully', 'success');
                setShowCancelConfirm(false);
                fetchOrderDetails(); // Refresh order details
            } else {
                showNotification(response.data.message || 'Failed to cancel order', 'error');
            }
        } catch (error) {
            console.error('Error cancelling order:', error);
            showNotification(error.response?.data?.message || 'Failed to cancel order', 'error');
        } finally {
            setCancelling(false);
        }
    };

    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    };

    // Check if order can be cancelled
    const canCancelOrder = () => {
        if (!order) return false;
        const nonCancellableStatuses = ['shipped', 'out-for-delivery', 'delivered', 'cancelled'];
        return !nonCancellableStatuses.includes(order.status);
    };

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
                <p style={{ color: colors.textSecondary, fontSize: '1.1rem' }}>Loading order details...</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div style={{
                minHeight: '100vh',
                background: colors.bgPrimary,
                padding: '40px 20px',
            }}>
                <div style={{
                    maxWidth: '500px',
                    margin: '0 auto',
                    background: colors.white,
                    border: `1px solid ${colors.error}`,
                    borderRadius: '24px',
                    padding: '40px',
                    textAlign: 'center',
                }}>
                    <AlertCircle size={60} color={colors.error} style={{ marginBottom: '20px' }} />
                    <h2 style={{ color: colors.textPrimary, fontSize: '1.8rem', marginBottom: '10px' }}>
                        Order Not Found
                    </h2>
                    <p style={{ color: colors.textSecondary, marginBottom: '30px' }}>
                        {error || 'The order you\'re looking for doesn\'t exist.'}
                    </p>
                    <button 
                        onClick={() => navigate('/orders')}
                        style={{
                            background: colors.primary,
                            color: colors.white,
                            border: 'none',
                            padding: '12px 30px',
                            borderRadius: '30px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            margin: '0 auto',
                        }}
                    >
                        <ArrowLeft size={18} />
                        Back to Orders
                    </button>
                </div>
            </div>
        );
    }

    const status = getStatusDetails(order);
    const StatusIcon = status.icon;
    const trackingTimeline = getTrackingTimeline(order);

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

            {/* Notification */}
            {notification.show && (
                <div style={{
                    position: 'fixed',
                    top: '100px',
                    right: '20px',
                    background: notification.type === 'success' ? colors.success : colors.error,
                    color: colors.white,
                    padding: '16px 24px',
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    zIndex: 9999,
                    animation: 'slideIn 0.3s ease-out',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                }}>
                    {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <span>{notification.message}</span>
                </div>
            )}

            {/* Cancel Confirmation Modal */}
            {showCancelConfirm && (
                <div style={{
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
                }} onClick={() => setShowCancelConfirm(false)}>
                    <div className="modal" style={{
                        background: colors.white,
                        borderRadius: '24px',
                        padding: '30px',
                        maxWidth: '400px',
                        width: '100%',
                    }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '15px' }}>
                            Cancel Order
                        </h3>
                        <p style={{ color: colors.textSecondary, marginBottom: '20px' }}>
                            Are you sure you want to cancel this order? This action cannot be undone.
                        </p>
                        
                        <label style={{ display: 'block', marginBottom: '10px', color: colors.textSecondary }}>
                            Reason for cancellation *
                        </label>
                        <select
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: `1px solid ${colors.border}`,
                                borderRadius: '8px',
                                marginBottom: '15px',
                                fontSize: '0.95rem',
                            }}
                        >
                            <option value="">Select a reason</option>
                            <option value="Changed my mind">Changed my mind</option>
                            <option value="Found better price">Found better price</option>
                            <option value="Ordered by mistake">Ordered by mistake</option>
                            <option value="Shipping too slow">Shipping too slow</option>
                            <option value="Other">Other</option>
                        </select>
                        
                        <textarea
                            placeholder="Additional comments (optional)"
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: `1px solid ${colors.border}`,
                                borderRadius: '8px',
                                minHeight: '80px',
                                marginBottom: '20px',
                                fontSize: '0.95rem',
                            }}
                        />
                        
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setShowCancelConfirm(false)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: colors.bgSecondary,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                }}
                            >
                                Keep Order
                            </button>
                            <button
                                onClick={handleCancelOrder}
                                disabled={cancelling || !cancelReason}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: colors.error,
                                    color: colors.white,
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    opacity: cancelling ? 0.7 : 1,
                                }}
                            >
                                {cancelling ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : 'Cancel Order'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{
                maxWidth: '1400px',
                margin: '0 auto',
                position: 'relative',
                zIndex: 2,
            }}>
                {/* Header with Navigation */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '30px',
                    flexWrap: 'wrap',
                    gap: '15px',
                }}>
                    <button 
                        onClick={() => navigate('/orders')}
                        className="action-btn"
                        style={{
                            background: colors.white,
                            border: `1px solid ${colors.border}`,
                        }}
                    >
                        <ArrowLeft size={18} />
                        Back to Orders
                    </button>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button onClick={handlePrint} className="action-btn">
                            <Printer size={18} />
                            Print
                        </button>
                        <button onClick={handleDownloadInvoice} className="action-btn">
                            <Download size={18} />
                            Invoice
                        </button>
                        <button onClick={handleReorder} className="action-btn">
                            <ShoppingBag size={18} />
                            Reorder
                        </button>
                        {canCancelOrder() && (
                            <button 
                                onClick={() => setShowCancelConfirm(true)} 
                                className="action-btn cancel-btn"
                            >
                                <XCircle size={18} />
                                Cancel Order
                            </button>
                        )}
                    </div>
                </div>

                {/* Order Header Card */}
                <div className="detail-card" style={{ marginBottom: '30px' }}>
                    <div style={{ padding: '30px' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '20px',
                            marginBottom: '20px',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                                <div style={{
                                    width: '70px',
                                    height: '70px',
                                    background: colors.bgSecondary,
                                    borderRadius: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: `1px solid ${colors.border}`,
                                }}>
                                    <Package size={35} color={colors.primary} />
                                </div>
                                <div>
                                    <h1 style={{
                                        fontSize: windowWidth <= 768 ? '1.8rem' : '2.2rem',
                                        fontWeight: '800',
                                        color: colors.textPrimary,
                                        marginBottom: '8px',
                                    }}>
                                        Order #{order._id?.slice(-8).toUpperCase()}
                                    </h1>
                                    <div className={`status-badge ${status.className}`}>
                                        <StatusIcon size={16} />
                                        {status.text}
                                    </div>
                                </div>
                            </div>
                            <div style={{
                                background: colors.bgSecondary,
                                padding: '15px 25px',
                                borderRadius: '16px',
                                textAlign: 'center',
                                border: `1px solid ${colors.border}`,
                            }}>
                                <div style={{ fontSize: '0.9rem', color: colors.textLight, marginBottom: '5px' }}>
                                    Total Amount
                                </div>
                                <div style={{
                                    fontSize: '2rem',
                                    fontWeight: '800',
                                    color: colors.primary,
                                }}>
                                    ₹{order.totalPrice?.toFixed(2)}
                                </div>
                            </div>
                        </div>

                        {/* Order Progress - Updated with Out for Delivery */}
                        {order.status !== 'cancelled' && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginTop: '30px',
                                padding: '20px',
                                background: colors.bgSecondary,
                                borderRadius: '16px',
                                border: `1px solid ${colors.border}`,
                            }}>
                                {['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'].map((step, index) => {
                                    const statusMap = {
                                        0: 'pending',
                                        1: 'processing',
                                        2: 'shipped',
                                        3: 'out-for-delivery',
                                        4: 'delivered'
                                    };
                                    
                                    const stepStatus = statusMap[index];
                                    const isCompleted = 
                                        (index === 0 && true) ||
                                        (index === 1 && (order.status === 'processing' || order.status === 'shipped' || order.status === 'out-for-delivery' || order.status === 'delivered')) ||
                                        (index === 2 && (order.status === 'shipped' || order.status === 'out-for-delivery' || order.status === 'delivered')) ||
                                        (index === 3 && (order.status === 'out-for-delivery' || order.status === 'delivered')) ||
                                        (index === 4 && order.status === 'delivered');
                                    
                                    const isActive = order.status === stepStatus;
                                    
                                    return (
                                        <div key={step} className="progress-step">
                                            <div className={`step-dot ${isCompleted ? 'completed' : isActive ? 'active' : ''}`}>
                                                {index === 0 && <Clock size={18} />}
                                                {index === 1 && <RefreshCw size={18} />}
                                                {index === 2 && <Package size={18} />}
                                                {index === 3 && <Truck size={18} />}
                                                {index === 4 && <CheckCircle size={18} />}
                                            </div>
                                            <div style={{
                                                marginTop: '10px',
                                                fontSize: '0.85rem',
                                                fontWeight: isActive ? '600' : '400',
                                                color: isActive ? colors.primary : colors.textLight,
                                                textAlign: 'center',
                                            }}>
                                                {step}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Cancelled Order Message */}
                        {order.status === 'cancelled' && (
                            <div style={{
                                marginTop: '20px',
                                padding: '15px',
                                background: `${colors.cancelled}10`,
                                borderRadius: '12px',
                                border: `1px solid ${colors.cancelled}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                            }}>
                                <Ban size={20} color={colors.cancelled} />
                                <div>
                                    <p style={{ fontWeight: '600', color: colors.cancelled, marginBottom: '5px' }}>
                                        This order has been cancelled
                                    </p>
                                    {order.cancellationReason && (
                                        <p style={{ fontSize: '0.9rem', color: colors.textSecondary }}>
                                            Reason: {order.cancellationReason}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    gap: '10px',
                    marginBottom: '25px',
                    borderBottom: `1px solid ${colors.border}`,
                    paddingBottom: '10px',
                }}>
                    {['items', 'summary', 'tracking'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                background: activeTab === tab ? colors.primary : 'transparent',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '30px',
                                color: activeTab === tab ? colors.white : colors.textSecondary,
                                fontSize: '0.95rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                textTransform: 'capitalize',
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: activeTab === 'items' ? '1fr 350px' : '1fr',
                    gap: '25px',
                }}>
                    {/* Main Content */}
                    <div>
                        {activeTab === 'items' && (
                            <div className="detail-card">
                                <div style={{ padding: '25px' }}>
                                    <h3 style={{
                                        fontSize: '1.3rem',
                                        fontWeight: '700',
                                        color: colors.textPrimary,
                                        marginBottom: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                    }}>
                                        <ShoppingBag size={20} color={colors.primary} />
                                        Order Items
                                    </h3>

                                    <div style={{
                                        display: 'grid',
                                        gap: '15px',
                                    }}>
                                        {order.orderItems?.map((item, index) => (
                                            <div
                                                key={index}
                                                className="table-row"
                                                style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: '2fr 1fr 1fr 1fr',
                                                    gap: '15px',
                                                    padding: '15px',
                                                    background: colors.bgSecondary,
                                                    borderRadius: '12px',
                                                    border: `1px solid ${colors.border}`,
                                                }}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: '600', color: colors.textPrimary }}>
                                                        {item.name}
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', color: colors.textLight }}>
                                                        SKU: {item._id?.slice(-6) || 'N/A'}
                                                    </div>
                                                </div>
                                                <div style={{ color: colors.textSecondary }}>Qty: {item.qty}</div>
                                                <div style={{ color: colors.textSecondary }}>₹{item.price}</div>
                                                <div style={{ color: colors.primary, fontWeight: '600' }}>
                                                    ₹{(item.price * item.qty).toFixed(2)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'summary' && (
                            <div className="detail-card">
                                <div style={{ padding: '25px' }}>
                                    <h3 style={{
                                        fontSize: '1.3rem',
                                        fontWeight: '700',
                                        color: colors.textPrimary,
                                        marginBottom: '20px',
                                    }}>
                                        Order Summary
                                    </h3>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '15px',
                                            background: colors.bgSecondary,
                                            borderRadius: '12px',
                                            border: `1px solid ${colors.border}`,
                                        }}>
                                            <span style={{ color: colors.textSecondary }}>Items Total:</span>
                                            <span style={{ fontWeight: '600', color: colors.textPrimary }}>
                                                ₹{order.itemsPrice?.toFixed(2)}
                                            </span>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '15px',
                                            background: colors.bgSecondary,
                                            borderRadius: '12px',
                                            border: `1px solid ${colors.border}`,
                                        }}>
                                            <span style={{ color: colors.textSecondary }}>Tax (GST):</span>
                                            <span style={{ fontWeight: '600', color: colors.textPrimary }}>
                                                ₹{order.taxPrice?.toFixed(2)}
                                            </span>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '15px',
                                            background: colors.bgSecondary,
                                            borderRadius: '12px',
                                            border: `1px solid ${colors.border}`,
                                        }}>
                                            <span style={{ color: colors.textSecondary }}>Shipping:</span>
                                            <span style={{ fontWeight: '600', color: colors.textPrimary }}>
                                                {order.shippingPrice === 0 ? 'Free' : `₹${order.shippingPrice?.toFixed(2)}`}
                                            </span>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '20px',
                                            background: `linear-gradient(135deg, ${colors.primary}10, transparent)`,
                                            borderRadius: '12px',
                                            border: `1px solid ${colors.primary}`,
                                        }}>
                                            <span style={{ fontWeight: '700', color: colors.textPrimary }}>Grand Total:</span>
                                            <span style={{ fontWeight: '800', fontSize: '1.3rem', color: colors.primary }}>
                                                ₹{order.totalPrice?.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'tracking' && (
                            <div className="detail-card">
                                <div style={{ padding: '25px' }}>
                                    <h3 style={{
                                        fontSize: '1.3rem',
                                        fontWeight: '700',
                                        color: colors.textPrimary,
                                        marginBottom: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                    }}>
                                        <Truck size={20} color={colors.primary} />
                                        Tracking Information
                                    </h3>

                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '20px',
                                    }}>
                                        {/* Tracking Timeline */}
                                        <div className="info-card" style={{ padding: '25px' }}>
                                            {trackingTimeline.map((item, index) => (
                                                <div key={item.id} className="tracking-item">
                                                    <div className={`tracking-dot ${
                                                        item.status === 'completed' ? 'completed' : 
                                                        item.status === 'active' ? 'active' : 
                                                        item.status === 'cancelled' ? 'cancelled' : ''
                                                    }`}>
                                                        {item.status === 'completed' && <CheckCircle size={12} />}
                                                        {item.status === 'active' && <Circle size={12} />}
                                                        {item.status === 'cancelled' && <XCircle size={12} />}
                                                    </div>
                                                    
                                                    <div className="tracking-content">
                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            marginBottom: '10px',
                                                            flexWrap: 'wrap',
                                                            gap: '10px',
                                                        }}>
                                                            <h4 style={{
                                                                fontSize: '1.1rem',
                                                                fontWeight: '700',
                                                                color: 
                                                                    item.status === 'completed' ? colors.success :
                                                                    item.status === 'active' ? colors.primary :
                                                                    item.status === 'cancelled' ? colors.cancelled :
                                                                    colors.textPrimary
                                                            }}>
                                                                {item.title}
                                                            </h4>
                                                            <div style={{
                                                                fontSize: '0.9rem',
                                                                color: colors.textLight,
                                                            }}>
                                                                {item.date}
                                                            </div>
                                                        </div>
                                                        
                                                        <p style={{
                                                            color: colors.textSecondary,
                                                            marginBottom: '5px',
                                                        }}>
                                                            {item.description}
                                                        </p>
                                                        
                                                        <div style={{
                                                            fontSize: '0.85rem',
                                                            color: colors.textLight,
                                                            marginBottom: item.subEvents ? '10px' : '0',
                                                        }}>
                                                            {item.time}
                                                        </div>
                                                        
                                                        {item.subEvents && (
                                                            <div style={{
                                                                marginTop: '10px',
                                                                paddingTop: '10px',
                                                                borderTop: `1px dashed ${colors.border}`,
                                                            }}>
                                                                {item.subEvents.map((subEvent, idx) => (
                                                                    <div key={idx} style={{
                                                                        display: 'flex',
                                                                        justifyContent: 'space-between',
                                                                        alignItems: 'center',
                                                                        padding: '5px 0',
                                                                        fontSize: '0.9rem',
                                                                    }}>
                                                                        <span style={{ color: colors.textSecondary }}>
                                                                            {subEvent.description}
                                                                        </span>
                                                                        <span style={{ color: colors.textLight, fontSize: '0.8rem' }}>
                                                                            {subEvent.time}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            {trackingTimeline.length === 0 && (
                                                <div style={{
                                                    textAlign: 'center',
                                                    padding: '40px',
                                                    color: colors.textLight,
                                                }}>
                                                    No tracking information available
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Only for Items tab */}
                    {activeTab === 'items' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                            {/* Shipping Address */}
                            <div className="info-card">
                                <h4 style={{
                                    fontSize: '1.1rem',
                                    fontWeight: '600',
                                    color: colors.textPrimary,
                                    marginBottom: '15px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}>
                                    <MapPin size={18} color={colors.primary} />
                                    Shipping Address
                                </h4>
                                <div style={{ color: colors.textSecondary, lineHeight: '1.6' }}>
                                    <p style={{ marginBottom: '5px' }}>{order.shippingAddress?.address}</p>
                                    <p style={{ marginBottom: '5px' }}>
                                        {order.shippingAddress?.city}, {order.shippingAddress?.state}
                                    </p>
                                    <p style={{ marginBottom: '5px' }}>
                                        {order.shippingAddress?.postalCode}
                                    </p>
                                    <p>{order.shippingAddress?.country}</p>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="info-card">
                                <h4 style={{
                                    fontSize: '1.1rem',
                                    fontWeight: '600',
                                    color: colors.textPrimary,
                                    marginBottom: '15px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}>
                                    <CreditCard size={18} color={colors.primary} />
                                    Payment Method
                                </h4>
                                <div style={{ color: colors.textSecondary }}>
                                    <p style={{ marginBottom: '10px', fontWeight: '500' }}>
                                        {order.paymentMethod}
                                    </p>
                                    {order.isPaid ? (
                                        <div style={{
                                            background: `${colors.success}10`,
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: `1px solid ${colors.success}`,
                                        }}>
                                            <p style={{ color: colors.success, marginBottom: '5px' }}>
                                                ✓ Payment Successful
                                            </p>
                                            <p style={{ fontSize: '0.85rem', color: colors.textLight }}>
                                                {formatDate(order.paidAt)}
                                            </p>
                                        </div>
                                    ) : order.status === 'cancelled' ? (
                                        <div style={{
                                            background: `${colors.cancelled}10`,
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: `1px solid ${colors.cancelled}`,
                                        }}>
                                            <p style={{ color: colors.cancelled, marginBottom: '5px' }}>
                                                ✗ Payment Cancelled
                                            </p>
                                        </div>
                                    ) : (
                                        <div style={{
                                            background: `${colors.warning}10`,
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: `1px solid ${colors.warning}`,
                                        }}>
                                            <p style={{ color: colors.warning, marginBottom: '5px' }}>
                                                ⏳ Payment Pending
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Need Help */}
                            <div className="info-card" style={{
                                background: `linear-gradient(135deg, ${colors.primary}10, transparent)`,
                            }}>
                                <h4 style={{
                                    fontSize: '1.1rem',
                                    fontWeight: '600',
                                    color: colors.textPrimary,
                                    marginBottom: '15px',
                                }}>
                                    Need Help?
                                </h4>
                                <p style={{ color: colors.textSecondary, marginBottom: '15px' }}>
                                    Having issues with this order? Contact our support team.
                                </p>
                                <button className="action-btn" style={{ width: '100%' }}>
                                    Contact Support
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;