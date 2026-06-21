import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, Calendar, Edit2, Camera, 
  Save, X, Shield, ShoppingBag, Package, CreditCard, 
  Star, Heart, Settings, Lock, Bell, Globe, CheckCircle, 
  AlertCircle, Plus, Loader, LogOut, Award, TrendingUp,
  Clock, Gift, Truck, RefreshCw
} from 'lucide-react';

// 🔥 FIXED: Correct import path
import { useAuth } from '../components/context/AuthContext';
import api, { orderAPI } from '../api/api';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    dateOfBirth: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    wishlistItems: 0,
    reviews: 0,
    memberSince: '',
    loyaltyPoints: 1250
  });
  const [fetchingOrders, setFetchingOrders] = useState(false);
  const [hoveredStat, setHoveredStat] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // HSL Color Variables - Same as Header
  const colors = {
    bgPrimary: 'hsl(222, 47%, 4%)',      // #0A0C14 - Dark background
    bgSecondary: 'hsl(222, 47%, 8%)',     // #141827 - Slightly lighter
    bgGlass: 'hsla(222, 47%, 4%, 0.85)',  // Glass background
    primary: 'hsl(217, 91%, 60%)',         // #3B82F6 - Bright blue
    primaryDark: 'hsl(222, 47%, 20%)',     // #1A2338 - Dark blue
    textPrimary: 'hsl(0, 0%, 100%)',       // White
    textSecondary: 'hsla(0, 0%, 100%, 0.7)', // White with opacity
    accent: 'hsl(217, 91%, 65%)',          // Lighter blue for accents
    border: 'hsla(217, 91%, 60%, 0.2)',     // Blue border with opacity
    success: 'hsl(142, 76%, 36%)',          // Green for success states
    warning: 'hsl(38, 92%, 50%)',           // Orange for warnings
    error: 'hsl(0, 84%, 60%)',              // Red for errors
  };

  useEffect(() => {
    if (user) {
      const userInitials = user.name ? user.name.charAt(0).toUpperCase() : 'U';
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || '',
        dateOfBirth: user.dateOfBirth || ''
      });
      
      // Use API-based avatar instead of localStorage
      const avatarUrl = user.profilePicture || 
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=3b82f6&color=fff&size=150&bold=true`;
      setPhotoPreview(avatarUrl);
      
      fetchUserData();
    }
  }, [user]);

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
      
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
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
      
      @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      .profile-card {
        animation: slideIn 0.6s ease-out;
        transition: all 0.3s ease;
      }
      
      .profile-card:hover {
        transform: translateY(-5px);
        border-color: ${colors.primary} !important;
        box-shadow: 0 20px 40px hsla(222, 47%, 4%, 0.5);
      }
      
      .stat-card {
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }
      
      .stat-card:hover {
        transform: translateY(-5px);
        border-color: ${colors.primary} !important;
        box-shadow: 0 10px 25px ${colors.primary};
      }
      
      .stat-card::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, ${colors.primary}, transparent);
        opacity: 0;
        transition: opacity 0.5s ease;
        transform: rotate(45deg);
      }
      
      .stat-card:hover::before {
        opacity: 0.1;
      }
      
      .nav-tab {
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }
      
      .nav-tab::before {
        content: '';
        position: absolute;
        left: 0;
        bottom: 0;
        width: 100%;
        height: 2px;
        background: linear-gradient(90deg, ${colors.primary}, ${colors.accent});
        transform: scaleX(0);
        transition: transform 0.3s ease;
      }
      
      .nav-tab:hover::before {
        transform: scaleX(1);
      }
      
      .nav-tab.active {
        background: linear-gradient(135deg, ${colors.bgSecondary} 0%, ${colors.bgPrimary} 100%);
        border-color: ${colors.primary} !important;
        color: ${colors.textPrimary} !important;
      }
      
      .nav-tab.active::before {
        transform: scaleX(1);
      }
      
      .avatar-container {
        position: relative;
        cursor: pointer;
      }
      
      .avatar-container:hover .avatar-overlay {
        opacity: 1;
        transform: scale(1);
      }
      
      .avatar-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: ${colors.bgGlass};
        backdropFilter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        opacity: 0;
        transform: scale(0.8);
        transition: all 0.3s ease;
        border: 2px solid ${colors.primary};
      }
      
      .input-field {
        transition: all 0.3s ease;
      }
      
      .input-field:focus {
        border-color: ${colors.primary} !important;
        box-shadow: 0 0 20px ${colors.primary} !important;
        outline: none;
        transform: translateY(-2px);
      }
      
      .save-button {
        position: relative;
        overflow: hidden;
      }
      
      .save-button::after {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        transform: rotate(45deg);
        animation: shimmer 3s infinite;
        opacity: 0;
      }
      
      .save-button:hover::after {
        opacity: 1;
      }
      
      .save-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 20px ${colors.primary};
      }
      
      .badge-glow {
        animation: glow 2s infinite;
      }
      
      .float-animation {
        animation: float 3s ease-in-out infinite;
      }
      
      .pulse-animation {
        animation: pulse 2s ease-in-out infinite;
      }
      
      .order-row {
        transition: all 0.3s ease;
      }
      
      .order-row:hover {
        background: ${colors.bgSecondary} !important;
        transform: translateX(5px);
        border-left: 3px solid ${colors.primary};
      }
      
      .success-message {
        animation: slideIn 0.5s ease-out, glow 2s infinite;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const fetchUserData = async () => {
    try {
      setFetchingOrders(true);
      
      if (user) {
        try {
          // Fetch orders from API (no localStorage)
          const ordersResponse = await orderAPI.getUserOrders();
          const ordersData = ordersResponse.data?.orders || ordersResponse.data || [];
          setOrders(ordersData);
          
          const totalOrders = ordersData.length || 0;
          const totalSpent = ordersData.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
          
          setStats(prev => ({
            ...prev,
            totalOrders,
            totalSpent,
            memberSince: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', {
              month: 'long',
              year: 'numeric'
            }) : 'Recently',
            wishlistItems: prev.wishlistItems // Keep existing or fetch from API
          }));
        } catch (orderError) {
          console.warn('Could not fetch orders:', orderError);
          // Use empty array instead of mock data
          setOrders([]);
        }
      }
      
      // Fetch real activity from API
      try {
        const activityResponse = await api.get('/users/activity');
        setRecentActivity(activityResponse.data || []);
      } catch (activityError) {
        // If API fails, show empty activity
        setRecentActivity([]);
      }
      
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setFetchingOrders(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showNotification('Please select an image file', 'error');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        showNotification('Image size should be less than 5MB', 'error');
        return;
      }
      
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.onerror = () => {
        showNotification('Error reading image file', 'error');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // API call to update profile
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      if (photoFile) {
        formDataToSend.append('profilePicture', photoFile);
      }

      const response = await api.put('/users/profile', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data && response.data.user) {
        updateUser(response.data.user);
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
        setIsEditing(false);
        showNotification('Profile updated successfully!', 'success');
      }
      
    } catch (error) {
      console.error('Error updating profile:', error);
      showNotification(error.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const showNotification = (message, type = 'success') => {
    const colors = {
      success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      info: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
    };

    const icon = {
      success: '✓',
      error: '✗',
      warning: '⚠',
      info: 'ℹ'
    };

    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: ${colors[type]};
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      z-index: 9999;
      animation: slideIn 0.3s ease-out;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: 350px;
      backdrop-filter: blur(8px);
      border: 1px solid hsla(0, 0%, 100%, 0.1);
    `;
    messageDiv.innerHTML = `
      <span style="font-size: 1.2rem;">${icon[type]}</span>
      <span>${message}</span>
    `;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
      messageDiv.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => document.body.removeChild(messageDiv), 300);
    }, 3000);
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User, color: colors.primary },
    { id: 'orders', label: 'My Orders', icon: ShoppingBag, color: colors.success },
    { id: 'security', label: 'Security', icon: Shield, color: colors.warning },
    { id: 'addresses', label: 'Addresses', icon: MapPin, color: colors.accent },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, color: colors.error },
    { id: 'rewards', label: 'Rewards', icon: Award, color: colors.primary }
  ];

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getMembershipTier = (points) => {
    if (points >= 5000) return { name: 'Platinum', color: '#94a3b8' };
    if (points >= 2000) return { name: 'Gold', color: '#fbbf24' };
    if (points >= 1000) return { name: 'Silver', color: '#94a3b8' };
    return { name: 'Bronze', color: '#b45309' };
  };

  const styles = {
    container: {
      maxWidth: '1400px',
      minHeight: '80vh',
      margin: '0 auto',
      padding: '20px',
      background: colors.bgPrimary,
    },
    row: {
      display: 'grid',
      gridTemplateColumns: '300px 1fr',
      gap: '24px',
    },
    sidebar: {
      background: colors.bgGlass,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderRadius: '24px',
      border: `1px solid ${colors.border}`,
      padding: '24px',
      boxShadow: `0 20px 40px hsla(222, 47%, 4%, 0.3)`,
      height: 'fit-content',
    },
    avatarContainer: {
      textAlign: 'center',
      marginBottom: '24px',
    },
    avatarWrapper: {
      position: 'relative',
      display: 'inline-block',
    },
    avatar: {
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      border: `3px solid ${colors.primary}`,
      boxShadow: `0 0 20px ${colors.primary}`,
      transition: 'all 0.3s ease',
    },
    avatarOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: colors.bgGlass,
      backdropFilter: 'blur(4px)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 0,
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      border: `2px solid ${colors.primary}`,
    },
    userName: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: '4px',
    },
    userEmail: {
      color: colors.textSecondary,
      fontSize: '0.9rem',
      marginBottom: '12px',
    },
    badge: {
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
      color: colors.textPrimary,
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      border: `1px solid ${colors.border}`,
      boxShadow: `0 0 10px ${colors.primary}`,
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px',
      marginBottom: '24px',
    },
    statCard: {
      background: colors.bgSecondary,
      borderRadius: '16px',
      padding: '16px',
      textAlign: 'center',
      border: `1px solid ${colors.border}`,
      transition: 'all 0.3s ease',
      cursor: 'pointer',
    },
    statIcon: {
      width: '40px',
      height: '40px',
      background: colors.bgGlass,
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 10px',
      border: `1px solid ${colors.border}`,
    },
    statValue: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: '4px',
    },
    statLabel: {
      color: colors.textSecondary,
      fontSize: '0.85rem',
    },
    navContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    navTab: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      borderRadius: '12px',
      border: `1px solid transparent`,
      background: 'transparent',
      color: colors.textSecondary,
      fontSize: '0.95rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      width: '100%',
      textAlign: 'left',
    },
    activeNavTab: {
      background: `linear-gradient(135deg, ${colors.bgSecondary} 0%, ${colors.bgPrimary} 100%)`,
      borderColor: colors.primary,
      color: colors.textPrimary,
      boxShadow: `0 0 15px ${colors.primary}`,
    },
    mainContent: {
      background: colors.bgGlass,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderRadius: '24px',
      border: `1px solid ${colors.border}`,
      padding: '32px',
      boxShadow: `0 20px 40px hsla(222, 47%, 4%, 0.3)`,
    },
    sectionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
      paddingBottom: '16px',
      borderBottom: `1px solid ${colors.border}`,
    },
    sectionTitle: {
      fontSize: '1.8rem',
      fontWeight: '700',
      color: colors.textPrimary,
      background: `linear-gradient(135deg, ${colors.textPrimary} 0%, ${colors.primary} 100%)`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    editButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 20px',
      background: colors.bgGlass,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      color: colors.textPrimary,
      fontSize: '0.95rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    form: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '20px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    fullWidth: {
      gridColumn: 'span 2',
    },
    label: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: colors.textSecondary,
      fontSize: '0.9rem',
      fontWeight: '500',
    },
    input: {
      padding: '12px 16px',
      background: colors.bgSecondary,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      color: colors.textPrimary,
      fontSize: '1rem',
      transition: 'all 0.3s ease',
    },
    textarea: {
      padding: '12px 16px',
      background: colors.bgSecondary,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      color: colors.textPrimary,
      fontSize: '1rem',
      minHeight: '100px',
      resize: 'vertical',
      transition: 'all 0.3s ease',
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end',
      marginTop: '20px',
    },
    saveButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 24px',
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
      border: 'none',
      borderRadius: '12px',
      color: colors.textPrimary,
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: `0 4px 12px ${colors.primary}`,
    },
    cancelButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 24px',
      background: colors.bgGlass,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      color: colors.textSecondary,
      fontSize: '1rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    table: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: '0 10px',
    },
    th: {
      textAlign: 'left',
      padding: '12px',
      color: colors.textSecondary,
      fontSize: '0.9rem',
      fontWeight: '600',
    },
    td: {
      padding: '16px 12px',
      background: colors.bgSecondary,
      borderRadius: '12px',
      color: colors.textPrimary,
    },
    statusBadge: {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: '600',
      display: 'inline-block',
    },
    actionButton: {
      padding: '8px 16px',
      background: colors.bgGlass,
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      color: colors.textPrimary,
      fontSize: '0.9rem',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: colors.textSecondary,
    },
    successMessage: {
      position: 'fixed',
      top: '100px',
      right: '20px',
      background: `linear-gradient(135deg, ${colors.success} 0%, ${colors.primaryDark} 100%)`,
      color: colors.textPrimary,
      padding: '16px 24px',
      borderRadius: '12px',
      boxShadow: `0 10px 25px hsla(222, 47%, 4%, 0.3)`,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      border: `1px solid ${colors.border}`,
      backdropFilter: 'blur(8px)',
    },
    loyaltyCard: {
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '24px',
      position: 'relative',
      overflow: 'hidden',
    },
    loyaltyPoints: {
      fontSize: '3rem',
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: '8px',
    },
    loyaltyTier: {
      fontSize: '1.2rem',
      color: colors.textPrimary,
      opacity: 0.9,
    },
    progressBar: {
      width: '100%',
      height: '8px',
      background: colors.bgSecondary,
      borderRadius: '4px',
      marginTop: '16px',
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      background: `linear-gradient(90deg, ${colors.textPrimary}, ${colors.accent})`,
      borderRadius: '4px',
      transition: 'width 0.5s ease',
    },
  };

  const membershipTier = getMembershipTier(stats.loyaltyPoints);

  return (
    <div style={styles.container}>
      {showSuccessMessage && (
        <div style={styles.successMessage} className="success-message">
          <CheckCircle size={24} />
          <span>Profile updated successfully!</span>
        </div>
      )}

      <div style={styles.row}>
        {/* Sidebar */}
        <div style={styles.sidebar} className="profile-card">
          <div style={styles.avatarContainer}>
            <div style={styles.avatarWrapper} className="avatar-container">
              <div style={styles.avatar}>
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Profile"
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.style.background = colors.primary;
                      e.target.parentElement.innerHTML = `
                        <div style="color: white; font-size: 2rem; font-weight: bold; display: flex; align-items: center; justify-content: center; height: 100%;">
                          ${getUserInitials()}
                        </div>
                      `;
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    background: colors.primary,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.textPrimary,
                    fontSize: '2rem',
                    fontWeight: 'bold'
                  }}>
                    {getUserInitials()}
                  </div>
                )}
              </div>
              
              {isEditing && (
                <label htmlFor="profile-photo" style={styles.avatarOverlay} className="avatar-overlay">
                  <Camera size={30} color={colors.textPrimary} />
                  <input
                    type="file"
                    id="profile-photo"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handlePhotoUpload}
                  />
                </label>
              )}
            </div>
            
            <h2 style={styles.userName}>{user?.name || 'User'}</h2>
            <p style={styles.userEmail}>{user?.email || 'user@example.com'}</p>
            <span style={styles.badge} className="badge-glow">
              <CheckCircle size={12} />
              Active Account
            </span>
          </div>

          {/* Quick Stats */}
          <div style={styles.statsGrid}>
            {[
              { icon: ShoppingBag, value: stats.totalOrders, label: 'Orders', color: colors.primary },
              { icon: Award, value: stats.loyaltyPoints, label: 'Points', color: colors.success },
              { icon: Heart, value: stats.wishlistItems, label: 'Wishlist', color: colors.error },
              { icon: Star, value: stats.reviews, label: 'Reviews', color: colors.warning },
            ].map((stat, index) => (
              <div
                key={index}
                style={styles.statCard}
                className="stat-card"
                onMouseEnter={() => setHoveredStat(index)}
                onMouseLeave={() => setHoveredStat(null)}
              >
                <div style={{
                  ...styles.statIcon,
                  background: hoveredStat === index ? colors.primary : colors.bgGlass,
                  transition: 'all 0.3s ease',
                }}>
                  <stat.icon size={20} color={hoveredStat === index ? colors.textPrimary : stat.color} />
                </div>
                <div style={styles.statValue}>{stat.value}</div>
                <div style={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div style={styles.navContainer}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                style={{
                  ...styles.navTab,
                  ...(activeTab === tab.id ? styles.activeNavTab : {}),
                }}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={18} color={activeTab === tab.id ? colors.primary : colors.textSecondary} />
                {tab.label}
              </button>
            ))}
            
            <button
              style={{
                ...styles.navTab,
                marginTop: '20px',
                borderColor: colors.error,
                color: colors.error,
              }}
              className="nav-tab"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={styles.mainContent} className="profile-card">
          {/* Personal Info Tab */}
          {activeTab === 'personal' && (
            <>
              <div style={styles.sectionHeader}>
                <h1 style={styles.sectionTitle}>Personal Information</h1>
                {!isEditing ? (
                  <button
                    style={styles.editButton}
                    onClick={() => setIsEditing(true)}
                    className="save-button"
                  >
                    <Edit2 size={18} />
                    Edit Profile
                  </button>
                ) : (
                  <div style={styles.buttonGroup}>
                    <button
                      style={styles.cancelButton}
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          name: user.name || '',
                          email: user.email || '',
                          phone: user.phone || '',
                          address: user.address || '',
                          city: user.city || '',
                          state: user.state || '',
                          pincode: user.pincode || '',
                          dateOfBirth: user.dateOfBirth || ''
                        });
                        const avatarUrl = user.profilePicture || 
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=3b82f6&color=fff&size=150&bold=true`;
                        setPhotoPreview(avatarUrl);
                        setPhotoFile(null);
                      }}
                    >
                      <X size={18} />
                      Cancel
                    </button>
                    <button
                      style={styles.saveButton}
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="save-button"
                    >
                      {isLoading ? (
                        <>
                          <div style={{ width: '18px', height: '18px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'rotate 1s linear infinite' }} />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <User size={16} color={colors.primary} />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    required
                    placeholder="Enter your full name"
                    style={styles.input}
                    className="input-field"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <Mail size={16} color={colors.primary} />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    style={{ ...styles.input, background: colors.bgGlass, opacity: 0.7 }}
                    className="input-field"
                  />
                  <small style={{ color: colors.textSecondary }}>Email cannot be changed</small>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <Phone size={16} color={colors.primary} />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Enter phone number"
                    style={styles.input}
                    className="input-field"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <Calendar size={16} color={colors.primary} />
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    style={styles.input}
                    className="input-field"
                  />
                </div>

                <div style={{ ...styles.formGroup, ...styles.fullWidth }}>
                  <label style={styles.label}>
                    <MapPin size={16} color={colors.primary} />
                    Address
                  </label>
                  <textarea
                    name="address"
                    rows="3"
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Enter your address"
                    style={styles.textarea}
                    className="input-field"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="City"
                    style={styles.input}
                    className="input-field"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="State"
                    style={styles.input}
                    className="input-field"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>PIN Code</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="PIN Code"
                    style={styles.input}
                    className="input-field"
                  />
                </div>
              </form>

              {/* Recent Activity */}
              {recentActivity.length > 0 && (
                <div style={{ marginTop: '40px' }}>
                  <h3 style={{ ...styles.sectionTitle, fontSize: '1.5rem', marginBottom: '20px' }}>
                    Recent Activity
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {recentActivity.map(activity => (
                      <div
                        key={activity.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          padding: '16px',
                          background: colors.bgSecondary,
                          borderRadius: '12px',
                          border: `1px solid ${colors.border}`,
                          transition: 'all 0.3s ease',
                        }}
                        className="order-row"
                      >
                        <div style={{
                          width: '40px',
                          height: '40px',
                          background: colors.bgGlass,
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `1px solid ${colors.border}`,
                        }}>
                          <activity.icon size={20} color={colors.primary} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ color: colors.textPrimary, fontSize: '1rem', marginBottom: '4px' }}>
                            {activity.action}
                          </h4>
                          <p style={{ color: colors.textSecondary, fontSize: '0.9rem' }}>
                            {activity.description}
                          </p>
                        </div>
                        <div style={{ color: colors.textSecondary, fontSize: '0.85rem' }}>
                          {activity.time}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <>
              <div style={styles.sectionHeader}>
                <h1 style={styles.sectionTitle}>My Orders</h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <span style={styles.badge}>
                    Total: {stats.totalOrders} orders
                  </span>
                  <span style={{ ...styles.badge, background: colors.success }}>
                    Spent: ₹{stats.totalSpent.toFixed(2)}
                  </span>
                </div>
              </div>
              
              {fetchingOrders ? (
                <div style={styles.emptyState}>
                  <Loader size={48} style={{ animation: 'rotate 2s linear infinite', marginBottom: '20px' }} />
                  <p>Loading your orders...</p>
                </div>
              ) : orders.length > 0 ? (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Order ID</th>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Items</th>
                      <th style={styles.th}>Total</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order, index) => (
                      <tr key={order._id || index} className="order-row">
                        <td style={styles.td}>
                          <span style={{ color: colors.primary, fontWeight: '600' }}>
                            #{order._id?.slice(-8) || `ORD${10000 + index}`}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={14} color={colors.textSecondary} />
                            {new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN')}
                          </div>
                        </td>
                        <td style={styles.td}>{order.items?.length || 1} items</td>
                        <td style={styles.td}>₹{order.totalPrice?.toFixed(2) || '999.99'}</td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.statusBadge,
                            background: order.status === 'Delivered' ? colors.success :
                              order.status === 'Shipped' ? colors.primary :
                                order.status === 'Processing' ? colors.warning : colors.bgSecondary,
                            color: colors.textPrimary,
                            border: `1px solid ${colors.border}`,
                          }}>
                            {order.status || 'Pending'}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <button
                            style={styles.actionButton}
                            className="save-button"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={styles.emptyState}>
                  <Package size={64} color={colors.textSecondary} style={{ marginBottom: '20px' }} />
                  <h3 style={{ color: colors.textPrimary, fontSize: '1.5rem', marginBottom: '10px' }}>
                    No orders yet
                  </h3>
                  <p style={{ color: colors.textSecondary, marginBottom: '20px' }}>
                    You haven't placed any orders yet.
                  </p>
                  <button
                    style={styles.saveButton}
                    onClick={() => navigate('/shop')}
                  >
                    Start Shopping
                  </button>
                </div>
              )}
            </>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <>
              <div style={styles.sectionHeader}>
                <h1 style={styles.sectionTitle}>Login & Security</h1>
              </div>

              <div style={{
                background: colors.bgGlass,
                backdropFilter: 'blur(8px)',
                borderRadius: '16px',
                padding: '24px',
                border: `1px solid ${colors.border}`,
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    background: colors.bgSecondary,
                    borderRadius: '12px',
                  }}>
                    <div>
                      <h4 style={{ color: colors.textPrimary, marginBottom: '4px' }}>Email Address</h4>
                      <p style={{ color: colors.textSecondary }}>{user?.email || 'Not set'}</p>
                    </div>
                    <span style={{ ...styles.badge, background: colors.success }}>Verified</span>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    background: colors.bgSecondary,
                    borderRadius: '12px',
                  }}>
                    <div>
                      <h4 style={{ color: colors.textPrimary, marginBottom: '4px' }}>Password</h4>
                      <p style={{ color: colors.textSecondary }}>••••••••</p>
                    </div>
                    <button
                      style={styles.editButton}
                      className="save-button"
                    >
                      <Lock size={16} />
                      Change Password
                    </button>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    background: colors.bgSecondary,
                    borderRadius: '12px',
                  }}>
                    <div>
                      <h4 style={{ color: colors.textPrimary, marginBottom: '4px' }}>Two-Factor Authentication</h4>
                      <p style={{ color: colors.textSecondary }}>Enhance your account security</p>
                    </div>
                    <button
                      style={{ ...styles.editButton, borderColor: colors.success }}
                      className="save-button"
                    >
                      <Shield size={16} />
                      Enable 2FA
                    </button>
                  </div>

                  <div style={{
                    padding: '16px',
                    background: colors.bgSecondary,
                    borderRadius: '12px',
                  }}>
                    <h4 style={{ color: colors.textPrimary, marginBottom: '8px' }}>Account Created</h4>
                    <p style={{ color: colors.textSecondary }}>
                      {stats.memberSince !== 'Recently' ? stats.memberSince : 'Recently'}
                    </p>
                  </div>

                  <div style={{
                    padding: '16px',
                    background: colors.bgSecondary,
                    borderRadius: '12px',
                    border: `1px solid ${colors.error}`,
                  }}>
                    <h4 style={{ color: colors.error, marginBottom: '8px' }}>Danger Zone</h4>
                    <p style={{ color: colors.textSecondary, marginBottom: '16px' }}>
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button
                      style={{ ...styles.editButton, borderColor: colors.error, color: colors.error }}
                    >
                      <X size={16} />
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <>
              <div style={styles.sectionHeader}>
                <h1 style={styles.sectionTitle}>My Addresses</h1>
                <button
                  style={styles.saveButton}
                  className="save-button"
                >
                  <Plus size={18} />
                  Add New Address
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                {formData.address && (
                  <div style={{
                    background: colors.bgSecondary,
                    borderRadius: '16px',
                    padding: '20px',
                    border: `1px solid ${colors.border}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ ...styles.badge }}>Home</span>
                      <button style={{ ...styles.editButton, padding: '8px' }}>
                        <Edit2 size={14} />
                      </button>
                    </div>
                    <p style={{ color: colors.textPrimary, marginBottom: '8px' }}>{formData.address}</p>
                    <p style={{ color: colors.textSecondary }}>
                      {formData.city}, {formData.state} - {formData.pincode}
                    </p>
                  </div>
                )}
                
                <div style={{
                  background: colors.bgGlass,
                  borderRadius: '16px',
                  padding: '20px',
                  border: `2px dashed ${colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: '10px',
                  cursor: 'pointer',
                  minHeight: '150px',
                }}>
                  <Plus size={30} color={colors.primary} />
                  <span style={{ color: colors.textSecondary }}>Add New Address</span>
                </div>
              </div>
            </>
          )}

          {/* Wishlist Tab */}
          {activeTab === 'wishlist' && (
            <>
              <div style={styles.sectionHeader}>
                <h1 style={styles.sectionTitle}>My Wishlist</h1>
                <span style={styles.badge}>{stats.wishlistItems} items</span>
              </div>

              <div style={styles.emptyState}>
                <Heart size={64} color={colors.textSecondary} style={{ marginBottom: '20px' }} />
                <h3 style={{ color: colors.textPrimary, fontSize: '1.5rem', marginBottom: '10px' }}>
                  Your wishlist is empty
                </h3>
                <p style={{ color: colors.textSecondary, marginBottom: '20px' }}>
                  Save your favorite items to wishlist
                </p>
                <button
                  style={styles.saveButton}
                  onClick={() => navigate('/shop')}
                >
                  Browse Products
                </button>
              </div>
            </>
          )}

          {/* Rewards Tab */}
          {activeTab === 'rewards' && (
            <>
              <div style={styles.sectionHeader}>
                <h1 style={styles.sectionTitle}>Rewards & Loyalty</h1>
                <span style={styles.badge}>{membershipTier.name} Member</span>
              </div>

              <div style={styles.loyaltyCard}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <h3 style={{ color: colors.textPrimary, opacity: 0.9, marginBottom: '10px' }}>
                    Available Points
                  </h3>
                  <div style={styles.loyaltyPoints}>
                    {stats.loyaltyPoints.toLocaleString()}
                  </div>
                  <div style={styles.loyaltyTier}>
                    {membershipTier.name} Tier
                  </div>
                  
                  <div style={styles.progressBar}>
                    <div style={{ ...styles.progressFill, width: '65%' }} />
                  </div>
                  <p style={{ color: colors.textPrimary, marginTop: '8px', fontSize: '0.9rem' }}>
                    1,350 points to reach Gold
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '30px' }}>
                {[
                  { icon: Gift, title: 'Welcome Bonus', points: 500, status: 'Redeemed' },
                  { icon: ShoppingBag, title: 'First Purchase', points: 1000, status: 'Available' },
                  { icon: Star, title: 'Product Review', points: 50, status: 'Available' },
                ].map((reward, index) => (
                  <div key={index} style={{
                    background: colors.bgSecondary,
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'center',
                    border: `1px solid ${colors.border}`,
                  }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      background: colors.bgGlass,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 15px',
                      border: `1px solid ${colors.primary}`,
                    }}>
                      <reward.icon size={24} color={colors.primary} />
                    </div>
                    <h4 style={{ color: colors.textPrimary, marginBottom: '5px' }}>{reward.title}</h4>
                    <p style={{ color: colors.primary, fontWeight: '600', marginBottom: '10px' }}>
                      +{reward.points} points
                    </p>
                    <span style={{
                      ...styles.statusBadge,
                      background: reward.status === 'Available' ? colors.success : colors.bgGlass,
                    }}>
                      {reward.status}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;