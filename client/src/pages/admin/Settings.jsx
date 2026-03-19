// src/pages/admin/Settings.jsx
import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Globe,
  Mail,
  Shield,
  Bell,
  CreditCard,
  Truck,
  Percent,
  Image,
  RefreshCw,
  Loader,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Users,
  ShoppingBag,
  Clock
} from 'lucide-react';
import axios from 'axios';

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

const AdminSettings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('general');

  const [settings, setSettings] = useState({
    general: {
      siteName: 'OccaMart',
      siteUrl: 'http://localhost:5173',
      adminEmail: 'admin@occamart.com',
      supportEmail: 'support@occamart.com',
      contactPhone: '+91 9876543210',
      address: '123 Business Park, Mumbai, India'
    },
    shipping: {
      freeShippingThreshold: 5000,
      standardShippingRate: 40,
      expressShippingRate: 100,
      internationalShipping: false,
      shippingCountries: ['India']
    },
    payment: {
      codEnabled: true,
      codExtraFee: 0,
      paypalEnabled: false,
      paypalClientId: '',
      stripeEnabled: false,
      stripePublicKey: '',
      razorpayEnabled: true,
      razorpayKeyId: 'rzp_test_...'
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: 'noreply@occamart.com',
      smtpPass: '********',
      fromEmail: 'noreply@occamart.com',
      fromName: 'OccaMart'
    },
    seo: {
      metaTitle: 'OccaMart - Your Shopping Destination',
      metaDescription: 'Shop the best products at amazing prices',
      metaKeywords: 'ecommerce, shopping, online store',
      googleAnalyticsId: 'UA-XXXXX-Y',
      facebookPixelId: '123456789'
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requireEmailVerification: true
    }
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
    error: '#EF4444'
  };

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'seo', label: 'SEO', icon: Globe },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setMessage({ type: 'success', text: 'Settings saved successfully' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all settings to default?')) {
      // Reset logic here
      setMessage({ type: 'success', text: 'Settings reset to default' });
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
    title: {
      fontSize: '2rem',
      fontWeight: '700',
      color: colors.textPrimary,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    actionButtons: {
      display: 'flex',
      gap: '15px',
    },
    saveButton: {
      padding: '12px 24px',
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
      color: colors.white,
      border: 'none',
      borderRadius: '12px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    resetButton: {
      padding: '12px 24px',
      background: colors.white,
      color: colors.textSecondary,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    tabs: {
      display: 'flex',
      gap: '10px',
      marginBottom: '30px',
      flexWrap: 'wrap',
      padding: '10px',
      background: colors.white,
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
    },
    tab: {
      padding: '10px 20px',
      border: 'none',
      background: 'transparent',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '0.95rem',
      color: colors.textSecondary,
      transition: 'all 0.3s ease',
    },
    activeTab: {
      background: colors.primary,
      color: colors.white,
    },
    content: {
      background: colors.white,
      borderRadius: '16px',
      padding: '30px',
      border: `1px solid ${colors.border}`,
    },
    section: {
      marginBottom: '30px',
    },
    sectionTitle: {
      fontSize: '1.1rem',
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: '20px',
      paddingBottom: '10px',
      borderBottom: `1px solid ${colors.border}`,
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '20px',
    },
    fullWidth: {
      gridColumn: 'span 2',
    },
    formGroup: {
      marginBottom: '15px',
    },
    label: {
      display: 'block',
      marginBottom: '5px',
      color: colors.textSecondary,
      fontWeight: '500',
    },
    input: {
      width: '100%',
      padding: '10px',
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      fontSize: '0.95rem',
    },
    checkbox: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '10px',
    },
    messageBox: {
      padding: '12px 20px',
      borderRadius: '8px',
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

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          <SettingsIcon size={32} color={colors.primary} />
          Admin Settings
        </h1>
        <div style={styles.actionButtons}>
          <button style={styles.resetButton} onClick={handleReset}>
            <RefreshCw size={18} />
            Reset
          </button>
          <button style={styles.saveButton} onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Save size={18} />
            )}
            Save Changes
          </button>
        </div>
      </div>

      {message.text && (
        <div style={{
          ...styles.messageBox,
          ...(message.type === 'success' ? styles.successMessage : styles.errorMessage)
        }}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      <div style={styles.tabs}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              style={{
                ...styles.tab,
                ...(activeTab === tab.id ? styles.activeTab : {})
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div style={styles.content}>
        {activeTab === 'general' && (
          <div>
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Site Information</h3>
              <div style={styles.formGrid}>
                <div>
                  <label style={styles.label}>Site Name</label>
                  <input
                    type="text"
                    value={settings.general.siteName}
                    onChange={(e) => setSettings({
                      ...settings,
                      general: { ...settings.general, siteName: e.target.value }
                    })}
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>Site URL</label>
                  <input
                    type="text"
                    value={settings.general.siteUrl}
                    onChange={(e) => setSettings({
                      ...settings,
                      general: { ...settings.general, siteUrl: e.target.value }
                    })}
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>Admin Email</label>
                  <input
                    type="email"
                    value={settings.general.adminEmail}
                    onChange={(e) => setSettings({
                      ...settings,
                      general: { ...settings.general, adminEmail: e.target.value }
                    })}
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>Support Email</label>
                  <input
                    type="email"
                    value={settings.general.supportEmail}
                    onChange={(e) => setSettings({
                      ...settings,
                      general: { ...settings.general, supportEmail: e.target.value }
                    })}
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>Contact Phone</label>
                  <input
                    type="text"
                    value={settings.general.contactPhone}
                    onChange={(e) => setSettings({
                      ...settings,
                      general: { ...settings.general, contactPhone: e.target.value }
                    })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.fullWidth}>
                  <label style={styles.label}>Address</label>
                  <textarea
                    value={settings.general.address}
                    onChange={(e) => setSettings({
                      ...settings,
                      general: { ...settings.general, address: e.target.value }
                    })}
                    style={{ ...styles.input, minHeight: '80px' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div>
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Shipping Settings</h3>
              <div style={styles.formGrid}>
                <div>
                  <label style={styles.label}>Free Shipping Threshold (₹)</label>
                  <input
                    type="number"
                    value={settings.shipping.freeShippingThreshold}
                    onChange={(e) => setSettings({
                      ...settings,
                      shipping: { ...settings.shipping, freeShippingThreshold: e.target.value }
                    })}
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>Standard Shipping Rate (₹)</label>
                  <input
                    type="number"
                    value={settings.shipping.standardShippingRate}
                    onChange={(e) => setSettings({
                      ...settings,
                      shipping: { ...settings.shipping, standardShippingRate: e.target.value }
                    })}
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>Express Shipping Rate (₹)</label>
                  <input
                    type="number"
                    value={settings.shipping.expressShippingRate}
                    onChange={(e) => setSettings({
                      ...settings,
                      shipping: { ...settings.shipping, expressShippingRate: e.target.value }
                    })}
                    style={styles.input}
                  />
                </div>
                <div>
                  <div style={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={settings.shipping.internationalShipping}
                      onChange={(e) => setSettings({
                        ...settings,
                        shipping: { ...settings.shipping, internationalShipping: e.target.checked }
                      })}
                    />
                    <label>Enable International Shipping</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payment' && (
          <div>
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Payment Methods</h3>
              <div style={styles.formGrid}>
                <div>
                  <div style={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={settings.payment.codEnabled}
                      onChange={(e) => setSettings({
                        ...settings,
                        payment: { ...settings.payment, codEnabled: e.target.checked }
                      })}
                    />
                    <label>Cash on Delivery (COD)</label>
                  </div>
                  {settings.payment.codEnabled && (
                    <input
                      type="number"
                      placeholder="COD Extra Fee (₹)"
                      value={settings.payment.codExtraFee}
                      onChange={(e) => setSettings({
                        ...settings,
                        payment: { ...settings.payment, codExtraFee: e.target.value }
                      })}
                      style={{ ...styles.input, marginTop: '10px' }}
                    />
                  )}
                </div>
                <div>
                  <div style={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={settings.payment.razorpayEnabled}
                      onChange={(e) => setSettings({
                        ...settings,
                        payment: { ...settings.payment, razorpayEnabled: e.target.checked }
                      })}
                    />
                    <label>Razorpay</label>
                  </div>
                  {settings.payment.razorpayEnabled && (
                    <input
                      type="text"
                      placeholder="Razorpay Key ID"
                      value={settings.payment.razorpayKeyId}
                      onChange={(e) => setSettings({
                        ...settings,
                        payment: { ...settings.payment, razorpayKeyId: e.target.value }
                      })}
                      style={{ ...styles.input, marginTop: '10px' }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add other tabs similarly... */}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminSettings;