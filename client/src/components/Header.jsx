// src/components/Header.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShoppingCart, User, LogOut, Home, Store, LayoutDashboard, 
  ChevronDown, Menu, X, Package, BarChart3, Users, 
  ShoppingBag, Sparkles, Shield, Heart, ListOrdered,
  Bell, Settings, AlertCircle
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useCart } from './context/CartContext';
import { useWishlist } from './context/WishlistContext';
import axios from 'axios';

const Header = () => {
    const { user, isAuthenticated, logout, isAdmin, token } = useAuth();
    const location = useLocation();
    
    // 🔥 PURE BACKEND DATA
    const { 
        cartCount = 0,
        fetchCart 
    } = useCart() || {};
    
    const { 
        wishlistCount = 0,
        fetchWishlist 
    } = useWishlist() || {};
    
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
    
    // 🔥 BACKEND NOTIFICATION STATE
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const [notificationError, setNotificationError] = useState(false);

    // ✅ Check if current page is payment/checkout page
    const isPaymentPage = location.pathname.includes('/payment') || 
                          location.pathname.includes('/checkout') ||
                          location.pathname.includes('/cart');

    // ✅ FIXED: Use import.meta.env for Vite
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    // Debug log
    console.log('🔍 Header Debug:', {
        isAuthenticated,
        hasToken: !!token,
        isPaymentPage,
        isAdmin: isAdmin(),
        path: location.pathname
    });

    // Color Scheme
    const colors = {
        bgPrimary: '#FAF7F2',
        bgSecondary: '#F5F0E8',
        bgGlass: 'rgba(250, 247, 242, 0.85)',
        primary: '#D4AF37',
        primaryDark: '#B8962E',
        textPrimary: '#1F2937',
        textSecondary: '#4B5563',
        border: '#E5E7EB',
        error: '#EF4444',
        success: '#10B981',
        warning: '#F59E0B',
    };

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 🔥 FETCH ALL BACKEND DATA when authenticated (but not on payment pages)
    useEffect(() => {
        if (isAuthenticated && token && !isPaymentPage) {
            // Fetch cart from backend
            if (fetchCart && typeof fetchCart === 'function') {
                fetchCart().catch(err => {
                    console.warn('Error fetching cart:', err);
                });
            }
            
            // Fetch wishlist from backend
            if (fetchWishlist && typeof fetchWishlist === 'function') {
                fetchWishlist().catch(err => {
                    console.warn('Error fetching wishlist:', err);
                });
            }

            // Fetch notifications from backend (only for admin users)
            if (isAdmin()) {
                fetchNotifications();
            } else {
                // For regular users, set empty notifications
                setNotifications([]);
                setUnreadCount(0);
            }
        }
    }, [isAuthenticated, token, isPaymentPage, isAdmin]);

    // 🔥 FETCH NOTIFICATIONS FROM BACKEND - FIXED with better error handling
    const fetchNotifications = async () => {
        // Don't fetch on payment pages
        if (isPaymentPage) {
            console.log('On payment page, skipping notification fetch');
            return;
        }

        // Don't fetch for non-admin users
        if (!isAdmin()) {
            console.log('User is not admin, skipping notification fetch');
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        if (!token) {
            console.log('No token available, skipping notification fetch');
            return;
        }
        
        setLoadingNotifications(true);
        setNotificationError(false);
        
        try {
            console.log('Fetching notifications from:', `${API_BASE_URL}/notifications`);
            
            const response = await axios.get(`${API_BASE_URL}/notifications`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 8000,
                // Don't throw error for 403/404, handle them gracefully
                validateStatus: function (status) {
                    return status < 500; // Resolve for all status codes < 500
                }
            });
            
            console.log('Notifications response:', response.status, response.data);
            
            if (response.status === 200 && response.data.success) {
                setNotifications(response.data.notifications || []);
                const unread = (response.data.notifications || []).filter(n => !n.read).length;
                setUnreadCount(unread);
                setNotificationError(false);
            } else if (response.status === 401 || response.status === 403) {
                console.warn('Authentication error for notifications:', response.status);
                setNotificationError(true);
                // Don't show error to user, just set empty notifications
                setNotifications([]);
                setUnreadCount(0);
            } else if (response.status === 404) {
                console.warn('Notifications endpoint not found (404)');
                // Endpoint doesn't exist, set empty notifications
                setNotifications([]);
                setUnreadCount(0);
                setNotificationError(false); // Not an error, just feature not available
            } else {
                console.warn('Unexpected response for notifications:', response.status);
                setNotifications([]);
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error.message);
            
            // Handle network errors gracefully
            if (error.code === 'ECONNABORTED') {
                console.warn('Notifications request timeout');
            } else if (error.code === 'ERR_NETWORK') {
                console.warn('Network error - backend might be down');
            }
            
            // Set empty notifications on error
            setNotifications([]);
            setUnreadCount(0);
            setNotificationError(true);
        } finally {
            setLoadingNotifications(false);
        }
    };

    // 🔥 MARK NOTIFICATION AS READ - BACKEND
    const markAsRead = async (notificationId) => {
        if (!token || !isAdmin() || isPaymentPage) return;

        try {
            const response = await axios.patch(
                `${API_BASE_URL}/notifications/${notificationId}/read`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            if (response.data.success) {
                // Update local state
                setNotifications(prev => 
                    prev.map(notif => 
                        notif.id === notificationId ? { ...notif, read: true } : notif
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // 🔥 MARK ALL AS READ - BACKEND
    const markAllAsRead = async () => {
        if (!token || !isAdmin() || isPaymentPage) return;

        try {
            const response = await axios.patch(
                `${API_BASE_URL}/notifications/read-all`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            if (response.data.success) {
                setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    // 🔥 DELETE NOTIFICATION - BACKEND
    const deleteNotification = async (notificationId) => {
        if (!token || !isAdmin() || isPaymentPage) return;

        try {
            const response = await axios.delete(
                `${API_BASE_URL}/notifications/${notificationId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            if (response.data.success) {
                // Remove from local state
                const deletedNotification = notifications.find(n => n.id === notificationId);
                setNotifications(prev => prev.filter(n => n.id !== notificationId));
                if (deletedNotification && !deletedNotification.read) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    // 🔥 POLL FOR NEW NOTIFICATIONS (every 30 seconds) - only for admin and not on payment pages
    useEffect(() => {
        if (!isAuthenticated || !token || isPaymentPage || !isAdmin()) return;

        const intervalId = setInterval(() => {
            fetchNotifications();
        }, 30000); // 30 seconds

        return () => clearInterval(intervalId);
    }, [isAuthenticated, token, isPaymentPage, isAdmin]);

    // Scroll effect
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.user-menu') && !event.target.closest('.notification-menu')) {
                setIsUserMenuOpen(false);
                setIsNotificationOpen(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Determine if mobile based on window width
    const isMobile = windowWidth <= 768;
    const isTablet = windowWidth > 768 && windowWidth <= 1024;
    const isLargeScreen = windowWidth > 1400;

    const handleLogout = () => {
        logout();
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
        setIsNotificationOpen(false);
        navigate('/');
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
        setIsUserMenuOpen(false);
        setIsNotificationOpen(false);
    };
    
    const toggleUserMenu = () => {
        setIsUserMenuOpen(!isUserMenuOpen);
        setIsNotificationOpen(false);
    };

    const toggleNotification = () => {
        setIsNotificationOpen(!isNotificationOpen);
        setIsUserMenuOpen(false);
        // Refresh notifications when opening (only for admin)
        if (!isNotificationOpen && isAdmin() && !isPaymentPage) {
            fetchNotifications();
        }
    };

    const getUserInitials = () => {
        if (user?.name) {
            return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        return 'U';
    };

    const getDisplayName = () => {
        if (!user) return 'User';
        if (user.name) return user.name.split(' ')[0];
        return 'User';
    };

    // Format notification time
    const formatNotificationTime = (timestamp) => {
        if (!timestamp) return 'Recently';
        
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins} min ago`;
            if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
            if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
            
            return date.toLocaleDateString();
        } catch (e) {
            return 'Recently';
        }
    };

    // Get notification icon based on type
    const getNotificationIcon = (type) => {
        switch(type) {
            case 'order':
                return <ShoppingBag size={16} color={colors.primary} />;
            case 'stock':
                return <Package size={16} color={colors.warning} />;
            case 'promotion':
                return <Sparkles size={16} color={colors.success} />;
            default:
                return <Bell size={16} color={colors.textSecondary} />;
        }
    };

    // Check if should show notification bell (only for admin and not on payment pages)
    const shouldShowNotifications = isAdmin() && !isPaymentPage;

    // Responsive styles (your existing styles remain the same)
    const styles = {
        navbar: {
            backgroundColor: scrolled ? colors.bgGlass : colors.bgPrimary,
            backdropFilter: 'blur(12px) saturate(180%)',
            WebkitBackdropFilter: 'blur(12px) saturate(180%)',
            boxShadow: scrolled 
                ? `0 8px 32px rgba(0, 0, 0, 0.05), 0 0 0 1px ${colors.border} inset` 
                : `0 4px 24px rgba(0, 0, 0, 0.02), 0 0 0 1px ${colors.border} inset`,
            padding: scrolled 
                ? (isMobile ? '6px 0' : isTablet ? '8px 0' : '10px 0') 
                : (isMobile ? '10px 0' : isTablet ? '12px 0' : '15px 0'),
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            borderBottom: `1px solid ${colors.border}`,
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            width: '100%',
        },
        container: {
            maxWidth: isLargeScreen ? '1600px' : '1400px',
            margin: '0 auto',
            padding: isMobile ? '0 16px' : isTablet ? '0 24px' : '0 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: isMobile ? '10px' : '20px',
        },
        brand: {
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            fontSize: isMobile ? '1.4rem' : isTablet ? '1.6rem' : '1.85rem',
            fontWeight: '800',
            letterSpacing: '-0.5px',
            color: colors.textPrimary,
            transition: 'all 0.3s ease',
            gap: isMobile ? '8px' : '12px',
            padding: '5px 0',
            whiteSpace: 'nowrap',
            flexShrink: 0,
        },
        brandIcon: {
            width: isMobile ? '35px' : isTablet ? '40px' : '45px',
            height: isMobile ? '35px' : isTablet ? '40px' : '45px',
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
            borderRadius: isMobile ? '8px' : '10px',
            padding: isMobile ? '6px' : '8px',
            color: '#FFFFFF',
            boxShadow: `0 4px 12px ${colors.primary}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
        },
        brandText: {
            color: colors.textPrimary,
            fontSize: 'inherit',
            lineHeight: 1,
            display: 'inline-block',
        },
        navLinks: {
            display: 'flex',
            alignItems: 'center',
            listStyle: 'none',
            margin: 0,
            padding: 0,
            gap: isMobile ? '4px' : isTablet ? '6px' : '8px',
            flexWrap: 'wrap',
        },
        navLink: {
            textDecoration: 'none',
            color: colors.textSecondary,
            fontSize: isMobile ? '0.85rem' : isTablet ? '0.9rem' : '0.95rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '4px' : '6px',
            padding: isMobile ? '8px 12px' : isTablet ? '9px 14px' : '10px 16px',
            borderRadius: '12px',
            transition: 'all 0.3s ease',
            border: `1px solid transparent`,
            whiteSpace: 'nowrap',
            background: 'transparent',
            cursor: 'pointer',
            width: 'auto',
        },
        cartBadge: {
            position: 'absolute',
            top: '-4px',
            right: isMobile ? '0px' : '2px',
            backgroundColor: colors.primary,
            color: '#FFFFFF',
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            fontWeight: '700',
            minWidth: isMobile ? '18px' : '20px',
            height: isMobile ? '18px' : '20px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            boxShadow: `0 2px 10px ${colors.primary}`,
            border: `2px solid #FFFFFF`,
        },
        notificationIcon: {
            position: 'relative',
            background: colors.bgSecondary,
            border: `1px solid ${colors.border}`,
            padding: isMobile ? '8px' : '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            color: colors.textPrimary,
        },
        notificationBadge: {
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            backgroundColor: colors.error,
            color: '#FFFFFF',
            fontSize: '0.65rem',
            fontWeight: '700',
            minWidth: '18px',
            height: '18px',
            borderRadius: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            border: `2px solid #FFFFFF`,
        },
        notificationDropdown: {
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            backgroundColor: '#FFFFFF',
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            borderRadius: '16px',
            boxShadow: `0 20px 60px rgba(0, 0, 0, 0.1), 0 0 0 1px ${colors.border} inset`,
            minWidth: isMobile ? '300px' : '360px',
            maxWidth: isMobile ? 'calc(100vw - 32px)' : '400px',
            border: `1px solid ${colors.border}`,
            opacity: 0,
            visibility: 'hidden',
            transform: 'translateY(-10px)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 1000,
        },
        notificationDropdownOpen: {
            opacity: 1,
            visibility: 'visible',
            transform: 'translateY(0)'
        },
        notificationHeader: {
            padding: '16px 20px',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: colors.bgSecondary,
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
        },
        notificationTitle: {
            fontWeight: '700',
            color: colors.textPrimary,
            fontSize: '1rem',
        },
        markAllRead: {
            color: colors.primary,
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '8px',
            transition: 'all 0.2s ease',
        },
        notificationList: {
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '8px 0',
        },
        notificationItem: {
            padding: '12px 16px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            borderBottom: `1px solid ${colors.border}`,
            backgroundColor: 'transparent',
            position: 'relative',
        },
        notificationItemUnread: {
            backgroundColor: 'rgba(212, 175, 55, 0.05)',
        },
        notificationIconStyle: {
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: colors.bgSecondary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
        },
        notificationContent: {
            flex: 1,
        },
        notificationMessage: {
            color: colors.textPrimary,
            fontSize: '0.9rem',
            marginBottom: '4px',
            fontWeight: '500',
        },
        notificationTime: {
            color: colors.textSecondary,
            fontSize: '0.75rem',
        },
        notificationDelete: {
            position: 'absolute',
            top: '12px',
            right: '12px',
            color: colors.textSecondary,
            opacity: 0,
            transition: 'opacity 0.2s ease',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
        },
        notificationEmpty: {
            padding: '40px 20px',
            textAlign: 'center',
            color: colors.textSecondary,
            fontSize: '0.9rem',
        },
        notificationLoading: {
            padding: '20px',
            textAlign: 'center',
            color: colors.textSecondary,
        },
        notificationError: {
            padding: '20px',
            textAlign: 'center',
            color: colors.error,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
        },
        userSection: {
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '8px' : '12px',
            flexShrink: 0,
        },
        loginButton: {
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
            color: '#FFFFFF',
            border: 'none',
            padding: isMobile ? '8px 16px' : isTablet ? '10px 22px' : '12px 28px',
            borderRadius: '12px',
            fontSize: isMobile ? '0.85rem' : isTablet ? '0.9rem' : '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: isMobile ? '6px' : '8px',
            transition: 'all 0.3s ease',
            boxShadow: `0 4px 12px ${colors.primary}`,
            border: `1px solid ${colors.border}`,
            whiteSpace: 'nowrap',
        },
        userButton: {
            background: colors.bgSecondary,
            border: `1px solid ${colors.border}`,
            padding: isMobile ? '6px 10px 6px 6px' : '8px 16px 8px 8px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '6px' : '8px',
            cursor: 'pointer',
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            fontWeight: '600',
            color: colors.textPrimary,
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(8px)',
            boxShadow: `0 2px 8px rgba(0, 0, 0, 0.02)`,
            whiteSpace: 'nowrap',
            position: 'relative',
        },
        userAvatar: {
            width: isMobile ? '32px' : '36px',
            height: isMobile ? '32px' : '36px',
            borderRadius: '10px',
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: '700',
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            flexShrink: 0,
            boxShadow: `0 2px 8px ${colors.primary}`,
            border: `2px solid #FFFFFF`,
        },
        adminBadge: {
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
            color: '#FFFFFF',
            fontSize: isMobile ? '0.6rem' : '0.65rem',
            fontWeight: '700',
            padding: isMobile ? '2px 6px' : '4px 8px',
            borderRadius: '8px',
            marginLeft: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
        },
        dropdownMenu: {
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            backgroundColor: '#FFFFFF',
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            borderRadius: '16px',
            boxShadow: `0 20px 60px rgba(0, 0, 0, 0.1), 0 0 0 1px ${colors.border} inset`,
            minWidth: isMobile ? '240px' : '280px',
            padding: '8px 0',
            border: `1px solid ${colors.border}`,
            opacity: 0,
            visibility: 'hidden',
            transform: 'translateY(-10px)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 1000,
        },
        dropdownMenuOpen: {
            opacity: 1,
            visibility: 'visible',
            transform: 'translateY(0)'
        },
        dropdownHeader: {
            padding: isMobile ? '12px 16px' : '16px 20px',
            borderBottom: `1px solid ${colors.border}`,
            marginBottom: '8px',
            background: colors.bgSecondary,
        },
        userName: {
            fontWeight: '700',
            color: colors.textPrimary,
            fontSize: isMobile ? '0.9rem' : '1rem',
            marginBottom: '4px',
        },
        userEmail: {
            color: colors.textSecondary,
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            wordBreak: 'break-all',
        },
        dropdownItem: {
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '10px' : '12px',
            padding: isMobile ? '10px 16px' : '12px 20px',
            textDecoration: 'none',
            color: colors.textSecondary,
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            border: 'none',
            background: 'transparent',
            width: '100%',
            textAlign: 'left',
            cursor: 'pointer',
        },
        dropdownDivider: {
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${colors.border}, transparent)`,
            margin: '8px 0'
        },
        mobileMenuButton: {
            display: isMobile ? 'flex' : 'none',
            alignItems: 'center',
            justifyContent: 'center',
            background: colors.bgSecondary,
            border: `1px solid ${colors.border}`,
            cursor: 'pointer',
            padding: '10px',
            borderRadius: '12px',
            color: colors.textPrimary,
            width: '40px',
            height: '40px',
            flexShrink: 0,
        },
        mobileMenu: {
            position: 'fixed',
            top: scrolled ? '60px' : '70px',
            left: '16px',
            right: '16px',
            backgroundColor: '#FFFFFF',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            padding: '20px',
            borderRadius: '20px',
            boxShadow: `0 30px 60px rgba(0, 0, 0, 0.1), 0 0 0 1px ${colors.border} inset`,
            border: `1px solid ${colors.border}`,
            zIndex: 999,
            maxHeight: 'calc(100vh - 100px)',
            overflowY: 'auto',
        },
        mobileUserInfo: {
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '16px',
            background: colors.bgSecondary,
            borderRadius: '16px',
            marginBottom: '20px',
            border: `1px solid ${colors.border}`,
        },
        badgeCount: {
            background: colors.primary,
            color: '#FFFFFF',
            fontSize: '0.7rem',
            fontWeight: '600',
            padding: '2px 6px',
            borderRadius: '10px',
            marginLeft: '8px',
        },
    };

    // Not authenticated
    if (!isAuthenticated) {
        return (
            <header style={styles.navbar}>
                <div style={styles.container}>
                    <Link to="/" style={styles.brand}>
                        <div style={styles.brandIcon}>
                            <Store size={isMobile ? 20 : 24} />
                        </div>
                        <span style={styles.brandText}>OccaMart</span>
                    </Link>
                    
                    <div style={styles.userSection}>
                        <Link to="/login" style={styles.loginButton}>
                            <User size={isMobile ? 16 : 18} />
                            {!isMobile && 'Sign In'}
                        </Link>
                    </div>
                </div>
            </header>
        );
    }

    // Authenticated
    return (
        <header style={styles.navbar}>
            <div style={styles.container}>
                <Link to="/" style={styles.brand}>
                    <div style={styles.brandIcon}>
                        <Store size={isMobile ? 20 : 24} />
                    </div>
                    <span style={styles.brandText}>OccaMart</span>
                </Link>

                {/* Desktop Navigation */}
                {!isMobile && (
                    <nav>
                        <ul style={styles.navLinks}>
                            <li key="desktop-home">
                                <Link to="/" style={styles.navLink}>
                                    <Home size={isTablet ? 16 : 18} />
                                    {!isTablet && 'Home'}
                                </Link>
                            </li>
                            <li key="desktop-shop">
                                <Link to="/shop" style={styles.navLink}>
                                    <Store size={isTablet ? 16 : 18} />
                                    {!isTablet && 'Shop'}
                                </Link>
                            </li>
                            <li key="desktop-cart" style={{ position: 'relative' }}>
                                <Link to="/cart" style={styles.navLink}>
                                    <ShoppingCart size={isTablet ? 16 : 18} />
                                    {!isTablet && 'Cart'}
                                    {/* 🔥 BACKEND CART COUNT */}
                                    {cartCount > 0 && (
                                        <span style={styles.cartBadge}>
                                            {cartCount > 99 ? '99+' : cartCount}
                                        </span>
                                    )}
                                </Link>
                            </li>

                            {/* 🔥 NOTIFICATION BELL - ONLY FOR ADMIN AND NOT ON PAYMENT PAGES */}
                            {shouldShowNotifications && (
                                <li key="desktop-notification" style={{ position: 'relative' }} className="notification-menu">
                                    <button 
                                        style={styles.notificationIcon} 
                                        onClick={toggleNotification}
                                        aria-label="Notifications"
                                    >
                                        <Bell size={isTablet ? 18 : 20} />
                                        {unreadCount > 0 && (
                                            <span style={styles.notificationBadge}>
                                                {unreadCount > 99 ? '99+' : unreadCount}
                                            </span>
                                        )}
                                    </button>

                                    {/* 🔥 NOTIFICATION DROPDOWN - BACKEND DATA */}
                                    <div style={{
                                        ...styles.notificationDropdown,
                                        ...(isNotificationOpen ? styles.notificationDropdownOpen : {})
                                    }}>
                                        <div style={styles.notificationHeader}>
                                            <span style={styles.notificationTitle}>Notifications</span>
                                            {unreadCount > 0 && !notificationError && (
                                                <button 
                                                    style={styles.markAllRead}
                                                    onClick={markAllAsRead}
                                                >
                                                    Mark all as read
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div style={styles.notificationList}>
                                            {loadingNotifications ? (
                                                <div key="loading" style={styles.notificationLoading}>
                                                    Loading notifications...
                                                </div>
                                            ) : notificationError ? (
                                                <div key="error" style={styles.notificationError}>
                                                    <AlertCircle size={18} />
                                                    <span>Unable to load notifications</span>
                                                </div>
                                            ) : notifications.length > 0 ? (
                                                notifications.map(notification => (
                                                    <div 
                                                        key={notification.id}
                                                        style={{
                                                            ...styles.notificationItem,
                                                            ...(!notification.read ? styles.notificationItemUnread : {})
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            const deleteBtn = e.currentTarget.querySelector('.delete-btn');
                                                            if (deleteBtn) deleteBtn.style.opacity = '1';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            const deleteBtn = e.currentTarget.querySelector('.delete-btn');
                                                            if (deleteBtn) deleteBtn.style.opacity = '0';
                                                        }}
                                                    >
                                                        <div style={styles.notificationIconStyle}>
                                                            {getNotificationIcon(notification.type)}
                                                        </div>
                                                        <div style={styles.notificationContent}>
                                                            <div style={styles.notificationMessage}>
                                                                {notification.message}
                                                            </div>
                                                            <div style={styles.notificationTime}>
                                                                {formatNotificationTime(notification.createdAt)}
                                                            </div>
                                                        </div>
                                                        <button 
                                                            className="delete-btn"
                                                            style={styles.notificationDelete}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteNotification(notification.id);
                                                            }}
                                                            aria-label="Delete notification"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                <div key="empty" style={styles.notificationEmpty}>
                                                    No notifications
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            )}

                            {/* User Menu */}
                            <li key="desktop-user" style={{ position: 'relative' }} className="user-menu">
                                <button style={styles.userButton} onClick={toggleUserMenu}>
                                    <div style={styles.userAvatar}>
                                        {getUserInitials()}
                                    </div>
                                    {!isTablet && <span>{getDisplayName()}</span>}
                                    {isAdmin() && (
                                        <span style={styles.adminBadge}>
                                            <Shield size={10} />
                                            {!isTablet && 'ADMIN'}
                                        </span>
                                    )}
                                    <ChevronDown size={isTablet ? 14 : 16} style={{
                                        transform: isUserMenuOpen ? 'rotate(180deg)' : 'rotate(0)',
                                        transition: 'transform 0.3s ease'
                                    }} />
                                </button>
                                
                                <div style={{
                                    ...styles.dropdownMenu,
                                    ...(isUserMenuOpen ? styles.dropdownMenuOpen : {})
                                }}>
                                    <div style={styles.dropdownHeader}>
                                        <div style={styles.userName}>{user?.name}</div>
                                        <div style={styles.userEmail}>{user?.email}</div>
                                    </div>

                                    {/* 👑 ADMIN MENU */}
                                    {isAdmin() && (
                                        <>
                                            <Link key="admin-dashboard" to="/admin" style={styles.dropdownItem} onClick={() => setIsUserMenuOpen(false)}>
                                                <LayoutDashboard size={18} />
                                                Dashboard
                                            </Link>
                                            <Link key="admin-products" to="/admin/products" style={styles.dropdownItem} onClick={() => setIsUserMenuOpen(false)}>
                                                <Package size={18} />
                                                Manage Products
                                            </Link>
                                            <Link key="admin-orders" to="/admin/orders" style={styles.dropdownItem} onClick={() => setIsUserMenuOpen(false)}>
                                                <ShoppingBag size={18} />
                                                Manage Orders
                                            </Link>
                                            <Link key="admin-users" to="/admin/users" style={styles.dropdownItem} onClick={() => setIsUserMenuOpen(false)}>
                                                <Users size={18} />
                                                Manage Users
                                            </Link>
                                            <Link key="admin-analytics" to="/admin/analytics" style={styles.dropdownItem} onClick={() => setIsUserMenuOpen(false)}>
                                                <BarChart3 size={18} />
                                                Analytics
                                            </Link>
                                            <Link key="admin-settings" to="/admin/settings" style={styles.dropdownItem} onClick={() => setIsUserMenuOpen(false)}>
                                                <Settings size={18} />
                                                Settings
                                            </Link>
                                            <div key="admin-divider" style={styles.dropdownDivider}></div>
                                        </>
                                    )}

                                    {/* 👤 USER MENU */}
                                    {!isAdmin() && (
                                        <>
                                            <Link key="user-wishlist" to="/wishlist" style={styles.dropdownItem} onClick={() => setIsUserMenuOpen(false)}>
                                                <Heart size={18} />
                                                My Wishlist
                                                {/* 🔥 BACKEND WISHLIST COUNT */}
                                                {wishlistCount > 0 && <span style={styles.badgeCount}>{wishlistCount}</span>}
                                            </Link>
                                            
                                            <Link key="user-cart" to="/cart" style={styles.dropdownItem} onClick={() => setIsUserMenuOpen(false)}>
                                                <ShoppingCart size={18} />
                                                My Cart
                                                {/* 🔥 BACKEND CART COUNT */}
                                                {cartCount > 0 && <span style={styles.badgeCount}>{cartCount}</span>}
                                            </Link>
                                            
                                            <Link key="user-orders" to="/orders" style={styles.dropdownItem} onClick={() => setIsUserMenuOpen(false)}>
                                                <ListOrdered size={18} />
                                                My Orders
                                            </Link>
                                            <div key="user-divider" style={styles.dropdownDivider}></div>
                                        </>
                                    )}
                                    
                                    {/* Logout */}
                                    <button key="logout" style={styles.dropdownItem} onClick={handleLogout}>
                                        <LogOut size={18} />
                                        Logout
                                    </button>
                                </div>
                            </li>
                        </ul>
                    </nav>
                )}

                {/* Mobile Menu Button */}
                {isMobile && (
                    <div key="mobile-buttons" style={{ display: 'flex', gap: '8px' }}>
                        {/* Notification Bell for Mobile - ONLY FOR ADMIN */}
                        {shouldShowNotifications && (
                            <button 
                                key="mobile-notification"
                                style={styles.notificationIcon} 
                                onClick={toggleNotification}
                                aria-label="Notifications"
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span style={styles.notificationBadge}>
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>
                        )}
                        
                        <button key="mobile-menu" style={styles.mobileMenuButton} onClick={toggleMobileMenu}>
                            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                )}
            </div>

            {/* Notification Dropdown for Mobile - ONLY FOR ADMIN */}
            {isMobile && isNotificationOpen && shouldShowNotifications && (
                <div key="mobile-notification-dropdown" style={{
                    ...styles.notificationDropdown,
                    ...styles.notificationDropdownOpen,
                    left: '16px',
                    right: '16px',
                    width: 'auto',
                }}>
                    <div style={styles.notificationHeader}>
                        <span style={styles.notificationTitle}>Notifications</span>
                        {unreadCount > 0 && !notificationError && (
                            <button 
                                style={styles.markAllRead}
                                onClick={markAllAsRead}
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>
                    
                    <div style={styles.notificationList}>
                        {loadingNotifications ? (
                            <div key="mobile-loading" style={styles.notificationLoading}>
                                Loading notifications...
                            </div>
                        ) : notificationError ? (
                            <div key="mobile-error" style={styles.notificationError}>
                                <AlertCircle size={18} />
                                <span>Unable to load notifications</span>
                            </div>
                        ) : notifications.length > 0 ? (
                            notifications.map(notification => (
                                <div 
                                    key={notification.id}
                                    style={{
                                        ...styles.notificationItem,
                                        ...(!notification.read ? styles.notificationItemUnread : {})
                                    }}
                                >
                                    <div style={styles.notificationIconStyle}>
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div style={styles.notificationContent}>
                                        <div style={styles.notificationMessage}>
                                            {notification.message}
                                        </div>
                                        <div style={styles.notificationTime}>
                                            {formatNotificationTime(notification.createdAt)}
                                        </div>
                                    </div>
                                    <button 
                                        style={styles.notificationDelete}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteNotification(notification.id);
                                        }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div key="mobile-empty" style={styles.notificationEmpty}>
                                No notifications
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Mobile Menu */}
            {isMobile && isMobileMenuOpen && (
                <div key="mobile-menu-container" style={styles.mobileMenu}>
                    <div style={styles.mobileUserInfo}>
                        <div style={styles.userAvatar}>{getUserInitials()}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: '700', color: colors.textPrimary, fontSize: '0.95rem' }}>
                                {user?.name}
                                {isAdmin() && (
                                    <span style={{ ...styles.adminBadge, position: 'relative', display: 'inline-block', marginLeft: '8px', top: '-2px' }}>
                                        ADMIN
                                    </span>
                                )}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: colors.textSecondary, wordBreak: 'break-all' }}>
                                {user?.email}
                            </div>
                        </div>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {/* Common Links */}
                        <li key="mobile-home">
                            <Link to="/" style={styles.navLink} onClick={toggleMobileMenu}>
                                <Home size={18} /> Home
                            </Link>
                        </li>
                        <li key="mobile-shop">
                            <Link to="/shop" style={styles.navLink} onClick={toggleMobileMenu}>
                                <Store size={18} /> Shop
                            </Link>
                        </li>
                        <li key="mobile-cart">
                            <Link to="/cart" style={styles.navLink} onClick={toggleMobileMenu}>
                                <ShoppingCart size={18} /> Cart 
                                {/* 🔥 BACKEND CART COUNT */}
                                {cartCount > 0 && <span style={styles.badgeCount}>{cartCount}</span>}
                            </Link>
                        </li>

                        {/* 👑 ADMIN MOBILE MENU */}
                        {isAdmin() && (
                            <>
                                <li key="mobile-admin-dashboard">
                                    <Link to="/admin" style={styles.navLink} onClick={toggleMobileMenu}>
                                        <LayoutDashboard size={18} /> Dashboard
                                    </Link>
                                </li>
                                <li key="mobile-admin-products">
                                    <Link to="/admin/products" style={styles.navLink} onClick={toggleMobileMenu}>
                                        <Package size={18} /> Products
                                    </Link>
                                </li>
                                <li key="mobile-admin-orders">
                                    <Link to="/admin/orders" style={styles.navLink} onClick={toggleMobileMenu}>
                                        <ShoppingBag size={18} /> Orders
                                    </Link>
                                </li>
                                <li key="mobile-admin-users">
                                    <Link to="/admin/users" style={styles.navLink} onClick={toggleMobileMenu}>
                                        <Users size={18} /> Users
                                    </Link>
                                </li>
                                <li key="mobile-admin-analytics">
                                    <Link to="/admin/analytics" style={styles.navLink} onClick={toggleMobileMenu}>
                                        <BarChart3 size={18} /> Analytics
                                    </Link>
                                </li>
                                <li key="mobile-admin-settings">
                                    <Link to="/admin/settings" style={styles.navLink} onClick={toggleMobileMenu}>
                                        <Settings size={18} /> Settings
                                    </Link>
                                </li>
                            </>
                        )}

                        {/* 👤 USER MOBILE MENU */}
                        {!isAdmin() && (
                            <>
                                <li key="mobile-user-wishlist">
                                    <Link to="/wishlist" style={styles.navLink} onClick={toggleMobileMenu}>
                                        <Heart size={18} /> Wishlist 
                                        {/* 🔥 BACKEND WISHLIST COUNT */}
                                        {wishlistCount > 0 && <span style={styles.badgeCount}>{wishlistCount}</span>}
                                    </Link>
                                </li>
                                <li key="mobile-user-orders">
                                    <Link to="/orders" style={styles.navLink} onClick={toggleMobileMenu}>
                                        <ListOrdered size={18} /> My Orders
                                    </Link>
                                </li>
                            </>
                        )}

                        <li key="mobile-logout">
                            <button 
                                style={{ 
                                    ...styles.navLink, 
                                    background: 'none', 
                                    border: 'none', 
                                    color: colors.error,
                                    width: '100%',
                                    cursor: 'pointer'
                                }} 
                                onClick={handleLogout}
                            >
                                <LogOut size={18} /> Logout
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </header>
    );
};

export default Header;