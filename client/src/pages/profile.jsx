// src/pages/profile.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  User, Mail, Phone, MapPin, Calendar, Edit2, Camera,
  Save, X, Shield, ShoppingBag, Package,
  Star, Heart, Lock, CheckCircle, AlertCircle,
  Plus, Loader, LogOut, Award, Clock, Gift
} from 'lucide-react';

import { useAuth } from '../components/context/AuthContext';
import { useWishlist } from '../components/context/WishlistContext';
import api, { orderAPI } from '../api/api';
import { useNavigate } from 'react-router-dom';

// Same palette as Header
const colors = {
  bgPrimary: '#FAF7F2',
  bgSecondary: '#F5F0E8',
  bgGlass: 'rgba(250, 247, 242, 0.85)',
  card: '#FFFFFF',
  primary: '#D4AF37',
  primaryDark: '#B8962E',
  textPrimary: '#1F2937',
  textSecondary: '#4B5563',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
};

const activityIcons = {
  order: ShoppingBag,
  review: Star,
  wishlist: Heart,
  login: Shield,
};

const toDateInput = (value) => (value ? String(value).slice(0, 10) : '');

const buildFormData = (user) => ({
  name: user?.name || '',
  email: user?.email || '',
  phone: user?.phone || '',
  address: user?.address || '',
  city: user?.city || '',
  state: user?.state || '',
  pincode: user?.pincode || '',
  dateOfBirth: toDateInput(user?.dateOfBirth),
});

const avatarFor = (user) =>
  user?.profilePicture ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=D4AF37&color=fff&size=150&bold=true`;

const getMembershipTier = (points) => {
  if (points >= 5000) return { name: 'Platinum', color: '#64748b' };
  if (points >= 2000) return { name: 'Gold', color: colors.primary };
  if (points >= 1000) return { name: 'Silver', color: '#94a3b8' };
  return { name: 'Bronze', color: '#b45309' };
};

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const { wishlistCount = 0 } = useWishlist() || {};
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState(buildFormData(null));
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [fetchingOrders, setFetchingOrders] = useState(false);
  const [hoveredStat, setHoveredStat] = useState(null);
  const [toast, setToast] = useState(null);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  const toastTimer = useRef(null);

  const isMobile = windowWidth <= 768;
  const isTablet = windowWidth > 768 && windowWidth <= 1024;

  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const loyaltyPoints = user?.loyaltyPoints ?? 0;
  const reviewsCount = user?.reviewsCount ?? 0;
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : 'Recently';

  const membershipTier = getMembershipTier(loyaltyPoints);
  const nextTier =
    loyaltyPoints >= 5000 ? null : loyaltyPoints >= 2000 ? 5000 : loyaltyPoints >= 1000 ? 2000 : 1000;
  const nextTierName = nextTier === 5000 ? 'Platinum' : nextTier === 2000 ? 'Gold' : 'Silver';
  const pointsToNext = nextTier ? nextTier - loyaltyPoints : 0;
  const progress = nextTier ? Math.min(100, (loyaltyPoints / nextTier) * 100) : 100;

  // Resize
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Clear toast timer on unmount
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // Sync form + fetch data when user changes
  useEffect(() => {
    if (user) {
      setFormData(buildFormData(user));
      setPhotoPreview(avatarFor(user));
      fetchUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Animations / hover styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes profSlideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes profRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .profile-card { animation: profSlideIn 0.5s ease-out; }
      .stat-card { transition: all 0.3s ease; }
      .stat-card:hover { transform: translateY(-4px); border-color: ${colors.primary} !important; box-shadow: 0 10px 25px rgba(212,175,55,0.25); }
      .nav-tab { transition: all 0.25s ease; }
      .nav-tab:hover { background: ${colors.bgSecondary} !important; }
      .avatar-container .avatar-overlay { opacity: 0; transform: scale(0.9); transition: all 0.3s ease; }
      .avatar-container:hover .avatar-overlay { opacity: 1; transform: scale(1); }
      .input-field { transition: all 0.25s ease; }
      .input-field:focus { border-color: ${colors.primary} !important; box-shadow: 0 0 0 3px rgba(212,175,55,0.25) !important; outline: none; }
      .input-field:disabled { cursor: not-allowed; }
      .save-button { transition: all 0.25s ease; }
      .save-button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(212,175,55,0.35); }
      .order-row { transition: all 0.25s ease; }
      .order-row:hover td { background: ${colors.bgSecondary} !important; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const showToast = (message, type = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  const fetchUserData = async () => {
    setFetchingOrders(true);
    try {
      try {
        const res = await orderAPI.getUserOrders();
        const data = res.data?.orders || res.data || [];
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn('Could not fetch orders:', err);
        setOrders([]);
      }

      try {
        const res = await api.get('/users/activity');
        const data = Array.isArray(res.data) ? res.data : res.data?.activities || [];
        setRecentActivity(data);
      } catch {
        setRecentActivity([]);
      }
    } finally {
      setFetchingOrders(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be less than 5MB', 'error');
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.onerror = () => showToast('Error reading image file', 'error');
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setIsEditing(false);
    setFormData(buildFormData(user));
    setPhotoPreview(avatarFor(user));
    setPhotoFile(null);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!isEditing) return;
    setIsLoading(true);
    try {
      const body = new FormData();
      Object.keys(formData).forEach((key) => body.append(key, formData[key]));
      if (photoFile) body.append('profilePicture', photoFile);

      // Let axios set the multipart boundary itself
      const response = await api.put('/users/profile', body);

      if (response.data?.user) {
        updateUser(response.data.user);
        setIsEditing(false);
        setPhotoFile(null);
        showToast('Profile updated successfully!', 'success');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast(error.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'orders', label: 'My Orders', icon: ShoppingBag },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'rewards', label: 'Rewards', icon: Award },
  ];

  const styles = {
    container: {
      maxWidth: '1400px',
      minHeight: '80vh',
      margin: '0 auto',
      padding: isMobile ? '12px' : '20px',
      background: colors.bgPrimary,
    },
    row: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : isTablet ? '260px 1fr' : '300px 1fr',
      gap: isMobile ? '16px' : '24px',
    },
    sidebar: {
      background: colors.card,
      borderRadius: '24px',
      border: `1px solid ${colors.border}`,
      padding: isMobile ? '16px' : '24px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
      height: 'fit-content',
    },
    avatarContainer: { textAlign: 'center', marginBottom: '24px' },
    avatarWrapper: { position: 'relative', display: 'inline-block' },
    avatar: {
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      border: `3px solid ${colors.primary}`,
      boxShadow: '0 0 20px rgba(212,175,55,0.35)',
      overflow: 'hidden',
    },
    avatarOverlay: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(31,41,55,0.55)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
    },
    userName: { fontSize: '1.5rem', fontWeight: 700, color: colors.textPrimary, margin: '12px 0 4px' },
    userEmail: { color: colors.textSecondary, fontSize: '0.9rem', marginBottom: '12px', wordBreak: 'break-all' },
    badge: {
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
      color: '#FFFFFF',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: 600,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
    },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' },
    statCard: {
      background: colors.bgSecondary,
      borderRadius: '16px',
      padding: '16px',
      textAlign: 'center',
      border: `1px solid ${colors.border}`,
    },
    statIcon: {
      width: '40px', height: '40px',
      borderRadius: '12px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      margin: '0 auto 10px',
      border: `1px solid ${colors.border}`,
    },
    statValue: { fontSize: '1.5rem', fontWeight: 700, color: colors.textPrimary, marginBottom: '4px' },
    statLabel: { color: colors.textSecondary, fontSize: '0.85rem' },
    navContainer: {
      display: 'flex',
      flexDirection: isMobile ? 'row' : 'column',
      flexWrap: isMobile ? 'wrap' : 'nowrap',
      gap: '8px',
    },
    navTab: {
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 16px',
      borderRadius: '12px',
      border: '1px solid transparent',
      background: 'transparent',
      color: colors.textSecondary,
      fontSize: '0.95rem',
      fontWeight: 600,
      cursor: 'pointer',
      width: isMobile ? 'auto' : '100%',
      textAlign: 'left',
    },
    activeNavTab: {
      background: colors.bgSecondary,
      borderColor: colors.primary,
      color: colors.textPrimary,
    },
    mainContent: {
      background: colors.card,
      borderRadius: '24px',
      border: `1px solid ${colors.border}`,
      padding: isMobile ? '16px' : '32px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
      minWidth: 0,
    },
    sectionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: isMobile ? 'flex-start' : 'center',
      flexDirection: isMobile ? 'column' : 'row',
      gap: '12px',
      marginBottom: '24px',
      paddingBottom: '16px',
      borderBottom: `1px solid ${colors.border}`,
    },
    sectionTitle: {
      fontSize: isMobile ? '1.4rem' : '1.8rem',
      fontWeight: 700,
      color: colors.textPrimary,
      margin: 0,
    },
    editButton: {
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '10px 20px',
      background: colors.bgSecondary,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      color: colors.textPrimary,
      fontSize: '0.95rem',
      fontWeight: 500,
      cursor: 'pointer',
    },
    form: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
      gap: '20px',
    },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    fullWidth: { gridColumn: isMobile ? 'span 1' : 'span 2' },
    label: { display: 'flex', alignItems: 'center', gap: '8px', color: colors.textSecondary, fontSize: '0.9rem', fontWeight: 500 },
    input: {
      padding: '12px 16px',
      background: colors.bgSecondary,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      color: colors.textPrimary,
      fontSize: '1rem',
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
      fontFamily: 'inherit',
    },
    buttonGroup: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
    saveButton: {
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '12px 24px',
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
      border: 'none',
      borderRadius: '12px',
      color: '#FFFFFF',
      fontSize: '1rem',
      fontWeight: 600,
      cursor: 'pointer',
    },
    cancelButton: {
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '12px 24px',
      background: colors.bgSecondary,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      color: colors.textSecondary,
      fontSize: '1rem',
      fontWeight: 500,
      cursor: 'pointer',
    },
    tableWrap: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px', minWidth: '640px' },
    th: { textAlign: 'left', padding: '12px', color: colors.textSecondary, fontSize: '0.9rem', fontWeight: 600 },
    td: { padding: '16px 12px', background: colors.bgPrimary, color: colors.textPrimary },
    statusBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, display: 'inline-block', color: '#FFFFFF' },
    actionButton: {
      padding: '8px 16px',
      background: colors.bgSecondary,
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      color: colors.textPrimary,
      fontSize: '0.9rem',
      cursor: 'pointer',
    },
    emptyState: { textAlign: 'center', padding: '60px 20px', color: colors.textSecondary },
    infoRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '12px',
      padding: '16px',
      background: colors.bgSecondary,
      borderRadius: '12px',
    },
    loyaltyCard: {
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '24px',
      color: '#FFFFFF',
    },
    progressBar: { width: '100%', height: '8px', background: 'rgba(255,255,255,0.3)', borderRadius: '4px', marginTop: '16px', overflow: 'hidden' },
    progressFill: { height: '100%', background: '#FFFFFF', borderRadius: '4px', transition: 'width 0.5s ease' },
    toast: {
      position: 'fixed',
      top: '90px',
      right: isMobile ? '12px' : '20px',
      left: isMobile ? '12px' : 'auto',
      maxWidth: '360px',
      color: '#FFFFFF',
      padding: '14px 20px',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontWeight: 500,
    },
  };

  const statusColor = (status) =>
    status === 'Delivered' ? colors.success :
    status === 'Shipped' ? colors.primary :
    status === 'Processing' ? colors.warning :
    status === 'Cancelled' ? colors.error : colors.textSecondary;

  const quickStats = [
    { icon: ShoppingBag, value: totalOrders, label: 'Orders', color: colors.primary },
    { icon: Award, value: loyaltyPoints, label: 'Points', color: colors.success },
    { icon: Heart, value: wishlistCount, label: 'Wishlist', color: colors.error },
    { icon: Star, value: reviewsCount, label: 'Reviews', color: colors.warning },
  ];

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <Loader size={40} style={{ animation: 'profRotate 2s linear infinite' }} />
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {toast && (
        <div
          style={{
            ...styles.toast,
            background: toast.type === 'error' ? colors.error : colors.success,
          }}
          role="status"
        >
          {toast.type === 'error' ? <AlertCircle size={22} /> : <CheckCircle size={22} />}
          <span>{toast.message}</span>
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
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={() => setPhotoPreview('')}
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%', background: colors.primary,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#FFFFFF', fontSize: '2rem', fontWeight: 'bold',
                  }}>
                    {getUserInitials()}
                  </div>
                )}
              </div>

              {isEditing && (
                <label htmlFor="profile-photo" style={styles.avatarOverlay} className="avatar-overlay">
                  <Camera size={30} color="#FFFFFF" />
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

            <h2 style={styles.userName}>{user.name || 'User'}</h2>
            <p style={styles.userEmail}>{user.email}</p>
            <span style={styles.badge}>
              <CheckCircle size={12} />
              Active Account
            </span>
          </div>

          {/* Quick stats */}
          <div style={styles.statsGrid}>
            {quickStats.map((stat, index) => (
              <div
                key={stat.label}
                style={styles.statCard}
                className="stat-card"
                onMouseEnter={() => setHoveredStat(index)}
                onMouseLeave={() => setHoveredStat(null)}
              >
                <div style={{
                  ...styles.statIcon,
                  background: hoveredStat === index ? colors.primary : colors.card,
                  transition: 'all 0.3s ease',
                }}>
                  <stat.icon size={20} color={hoveredStat === index ? '#FFFFFF' : stat.color} />
                </div>
                <div style={styles.statValue}>{stat.value}</div>
                <div style={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={styles.navContainer}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                style={{ ...styles.navTab, ...(activeTab === tab.id ? styles.activeNavTab : {}) }}
                className="nav-tab"
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={18} color={activeTab === tab.id ? colors.primary : colors.textSecondary} />
                {tab.label}
              </button>
            ))}

            <button
              style={{
                ...styles.navTab,
                marginTop: isMobile ? 0 : '20px',
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

        {/* Main content */}
        <div style={styles.mainContent} className="profile-card">
          {/* Personal */}
          {activeTab === 'personal' && (
            <>
              <div style={styles.sectionHeader}>
                <h1 style={styles.sectionTitle}>Personal Information</h1>
                {!isEditing ? (
                  <button style={styles.editButton} onClick={() => setIsEditing(true)} className="save-button">
                    <Edit2 size={18} />
                    Edit Profile
                  </button>
                ) : (
                  <div style={styles.buttonGroup}>
                    <button type="button" style={styles.cancelButton} onClick={resetForm}>
                      <X size={18} />
                      Cancel
                    </button>
                    <button
                      type="button"
                      style={{ ...styles.saveButton, opacity: isLoading ? 0.7 : 1 }}
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="save-button"
                    >
                      {isLoading ? (
                        <>
                          <div style={{
                            width: '18px', height: '18px',
                            border: '2px solid white', borderTop: '2px solid transparent',
                            borderRadius: '50%', animation: 'profRotate 1s linear infinite',
                          }} />
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
                  <label style={styles.label}><User size={16} color={colors.primary} /> Full Name *</label>
                  <input
                    type="text" name="name" value={formData.name}
                    onChange={handleInputChange} disabled={!isEditing} required
                    placeholder="Enter your full name"
                    style={styles.input} className="input-field"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}><Mail size={16} color={colors.primary} /> Email Address</label>
                  <input
                    type="email" value={formData.email} disabled
                    style={{ ...styles.input, opacity: 0.7 }} className="input-field"
                  />
                  <small style={{ color: colors.textSecondary }}>Email cannot be changed</small>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}><Phone size={16} color={colors.primary} /> Phone Number</label>
                  <input
                    type="tel" name="phone" value={formData.phone}
                    onChange={handleInputChange} disabled={!isEditing}
                    placeholder="Enter phone number"
                    style={styles.input} className="input-field"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}><Calendar size={16} color={colors.primary} /> Date of Birth</label>
                  <input
                    type="date" name="dateOfBirth" value={formData.dateOfBirth}
                    onChange={handleInputChange} disabled={!isEditing}
                    style={styles.input} className="input-field"
                  />
                </div>

                <div style={{ ...styles.formGroup, ...styles.fullWidth }}>
                  <label style={styles.label}><MapPin size={16} color={colors.primary} /> Address</label>
                  <textarea
                    name="address" rows="3" value={formData.address}
                    onChange={handleInputChange} disabled={!isEditing}
                    placeholder="Enter your address"
                    style={styles.textarea} className="input-field"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>City</label>
                  <input
                    type="text" name="city" value={formData.city}
                    onChange={handleInputChange} disabled={!isEditing}
                    placeholder="City" style={styles.input} className="input-field"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>State</label>
                  <input
                    type="text" name="state" value={formData.state}
                    onChange={handleInputChange} disabled={!isEditing}
                    placeholder="State" style={styles.input} className="input-field"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>PIN Code</label>
                  <input
                    type="text" name="pincode" value={formData.pincode}
                    onChange={handleInputChange} disabled={!isEditing}
                    placeholder="PIN Code" style={styles.input} className="input-field"
                  />
                </div>
              </form>

              {recentActivity.length > 0 && (
                <div style={{ marginTop: '40px' }}>
                  <h3 style={{ ...styles.sectionTitle, fontSize: '1.4rem', marginBottom: '20px' }}>
                    Recent Activity
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {recentActivity.map((activity, i) => {
                      const Icon = activityIcons[activity.type] || Clock;
                      return (
                        <div
                          key={activity.id || i}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '16px',
                            padding: '16px', background: colors.bgSecondary,
                            borderRadius: '12px', border: `1px solid ${colors.border}`,
                          }}
                        >
                          <div style={{
                            width: '40px', height: '40px', background: colors.card,
                            borderRadius: '10px', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            border: `1px solid ${colors.border}`, flexShrink: 0,
                          }}>
                            <Icon size={20} color={colors.primary} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ color: colors.textPrimary, fontSize: '1rem', margin: '0 0 4px' }}>
                              {activity.action}
                            </h4>
                            <p style={{ color: colors.textSecondary, fontSize: '0.9rem', margin: 0 }}>
                              {activity.description}
                            </p>
                          </div>
                          <div style={{ color: colors.textSecondary, fontSize: '0.85rem' }}>
                            {activity.time}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Orders */}
          {activeTab === 'orders' && (
            <>
              <div style={styles.sectionHeader}>
                <h1 style={styles.sectionTitle}>My Orders</h1>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={styles.badge}>Total: {totalOrders} orders</span>
                  <span style={{ ...styles.badge, background: colors.success }}>
                    Spent: ₹{totalSpent.toFixed(2)}
                  </span>
                </div>
              </div>

              {fetchingOrders ? (
                <div style={styles.emptyState}>
                  <Loader size={48} style={{ animation: 'profRotate 2s linear infinite', marginBottom: '20px' }} />
                  <p>Loading your orders...</p>
                </div>
              ) : orders.length > 0 ? (
                <div style={styles.tableWrap}>
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
                          <td style={{ ...styles.td, borderRadius: '12px 0 0 12px' }}>
                            <span style={{ color: colors.primaryDark, fontWeight: 600 }}>
                              #{order._id ? order._id.slice(-8) : '—'}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Clock size={14} color={colors.textSecondary} />
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : '—'}
                            </div>
                          </td>
                          <td style={styles.td}>{order.items?.length ?? 0} items</td>
                          <td style={styles.td}>
                            {typeof order.totalPrice === 'number' ? `₹${order.totalPrice.toFixed(2)}` : '—'}
                          </td>
                          <td style={styles.td}>
                            <span style={{ ...styles.statusBadge, background: statusColor(order.status) }}>
                              {order.status || 'Pending'}
                            </span>
                          </td>
                          <td style={{ ...styles.td, borderRadius: '0 12px 12px 0' }}>
                            <button
                              style={styles.actionButton}
                              className="save-button"
                              onClick={() => navigate(`/order/${order._id}`)}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={styles.emptyState}>
                  <Package size={64} color={colors.textSecondary} style={{ marginBottom: '20px' }} />
                  <h3 style={{ color: colors.textPrimary, fontSize: '1.5rem', marginBottom: '10px' }}>No orders yet</h3>
                  <p style={{ marginBottom: '20px' }}>You haven't placed any orders yet.</p>
                  <button style={{ ...styles.saveButton, margin: '0 auto' }} onClick={() => navigate('/shop')} className="save-button">
                    Start Shopping
                  </button>
                </div>
              )}
            </>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <>
              <div style={styles.sectionHeader}>
                <h1 style={styles.sectionTitle}>Login & Security</h1>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={styles.infoRow}>
                  <div>
                    <h4 style={{ color: colors.textPrimary, margin: '0 0 4px' }}>Email Address</h4>
                    <p style={{ color: colors.textSecondary, margin: 0, wordBreak: 'break-all' }}>
                      {user.email || 'Not set'}
                    </p>
                  </div>
                  <span style={{ ...styles.badge, background: colors.success }}>Verified</span>
                </div>

                <div style={styles.infoRow}>
                  <div>
                    <h4 style={{ color: colors.textPrimary, margin: '0 0 4px' }}>Password</h4>
                    <p style={{ color: colors.textSecondary, margin: 0 }}>••••••••</p>
                  </div>
                  <button
                    style={styles.editButton}
                    className="save-button"
                    onClick={() => navigate('/forgot-password')}
                  >
                    <Lock size={16} />
                    Change Password
                  </button>
                </div>

                <div style={{ padding: '16px', background: colors.bgSecondary, borderRadius: '12px' }}>
                  <h4 style={{ color: colors.textPrimary, margin: '0 0 8px' }}>Member Since</h4>
                  <p style={{ color: colors.textSecondary, margin: 0 }}>{memberSince}</p>
                </div>
              </div>
            </>
          )}

          {/* Addresses */}
          {activeTab === 'addresses' && (
            <>
              <div style={styles.sectionHeader}>
                <h1 style={styles.sectionTitle}>My Addresses</h1>
                <button
                  style={styles.saveButton}
                  className="save-button"
                  onClick={() => { setActiveTab('personal'); setIsEditing(true); }}
                >
                  <Plus size={18} />
                  {formData.address ? 'Edit Address' : 'Add Address'}
                </button>
              </div>

              {formData.address ? (
                <div style={{
                  background: colors.bgSecondary, borderRadius: '16px',
                  padding: '20px', border: `1px solid ${colors.border}`,
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={styles.badge}>Home</span>
                  </div>
                  <p style={{ color: colors.textPrimary, marginBottom: '8px' }}>{formData.address}</p>
                  <p style={{ color: colors.textSecondary, margin: 0 }}>
                    {[formData.city, formData.state].filter(Boolean).join(', ')}
                    {formData.pincode ? ` - ${formData.pincode}` : ''}
                  </p>
                </div>
              ) : (
                <div style={styles.emptyState}>
                  <MapPin size={64} color={colors.textSecondary} style={{ marginBottom: '20px' }} />
                  <h3 style={{ color: colors.textPrimary, fontSize: '1.5rem', marginBottom: '10px' }}>No address saved</h3>
                  <p>Add an address to speed up checkout.</p>
                </div>
              )}
            </>
          )}

          {/* Wishlist */}
          {activeTab === 'wishlist' && (
            <>
              <div style={styles.sectionHeader}>
                <h1 style={styles.sectionTitle}>My Wishlist</h1>
                <span style={styles.badge}>{wishlistCount} items</span>
              </div>

              <div style={styles.emptyState}>
                <Heart size={64} color={colors.textSecondary} style={{ marginBottom: '20px' }} />
                <h3 style={{ color: colors.textPrimary, fontSize: '1.5rem', marginBottom: '10px' }}>
                  {wishlistCount > 0 ? `You have ${wishlistCount} saved items` : 'Your wishlist is empty'}
                </h3>
                <p style={{ marginBottom: '20px' }}>
                  {wishlistCount > 0 ? 'View them all on your wishlist page.' : 'Save your favorite items to wishlist'}
                </p>
                <button
                  style={{ ...styles.saveButton, margin: '0 auto' }}
                  className="save-button"
                  onClick={() => navigate(wishlistCount > 0 ? '/wishlist' : '/shop')}
                >
                  {wishlistCount > 0 ? 'Open Wishlist' : 'Browse Products'}
                </button>
              </div>
            </>
          )}

          {/* Rewards */}
          {activeTab === 'rewards' && (
            <>
              <div style={styles.sectionHeader}>
                <h1 style={styles.sectionTitle}>Rewards & Loyalty</h1>
                <span style={{ ...styles.badge, background: membershipTier.color }}>
                  {membershipTier.name} Member
                </span>
              </div>

              <div style={styles.loyaltyCard}>
                <h3 style={{ opacity: 0.9, margin: '0 0 10px' }}>Available Points</h3>
                <div style={{ fontSize: isMobile ? '2.4rem' : '3rem', fontWeight: 800, marginBottom: '8px' }}>
                  {loyaltyPoints.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '1.2rem', opacity: 0.9 }}>{membershipTier.name} Tier</div>

                <div style={styles.progressBar}>
                  <div style={{ ...styles.progressFill, width: `${progress}%` }} />
                </div>
                <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>
                  {nextTier
                    ? `${pointsToNext.toLocaleString('en-IN')} points to reach ${nextTierName}`
                    : "You've reached the top tier!"}
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: '20px',
                marginTop: '30px',
              }}>
                {[
                  { icon: Gift, title: 'Welcome Bonus', points: 500 },
                  { icon: ShoppingBag, title: 'First Purchase', points: 1000 },
                  { icon: Star, title: 'Product Review', points: 50 },
                ].map((reward) => (
                  <div key={reward.title} style={{
                    background: colors.bgSecondary, borderRadius: '16px',
                    padding: '20px', textAlign: 'center',
                    border: `1px solid ${colors.border}`,
                  }}>
                    <div style={{
                      width: '50px', height: '50px', background: colors.card,
                      borderRadius: '12px', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 15px', border: `1px solid ${colors.primary}`,
                    }}>
                      <reward.icon size={24} color={colors.primary} />
                    </div>
                    <h4 style={{ color: colors.textPrimary, margin: '0 0 5px' }}>{reward.title}</h4>
                    <p style={{ color: colors.primaryDark, fontWeight: 600, margin: 0 }}>
                      +{reward.points} points
                    </p>
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
