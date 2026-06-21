// src/pages/AddressInfo.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Home,
  Building,
  Phone,
  Mail,
  User,
  Save,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';
import { useAuth } from '../components/context/AuthContext';
import { useCart } from '../components/context/CartContext';
import axios from 'axios';

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

const AddressInfo = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { cartItems, fetchCart } = useCart();
  
  const [loading, setLoading] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
  // Form state
  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    alternatePhone: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    addressType: 'home' // home or work
  });

  const [errors, setErrors] = useState({});

  // Load user data if available
  useEffect(() => {
    if (user) {
      setAddress(prev => ({
        ...prev,
        fullName: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        addressLine1: user.address || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || ''
      }));
    }
  }, [user]);

  // 🔥 FIXED: Better redirect logic
  useEffect(() => {
    console.log('🔍 Checking authentication and cart...');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('cartItems:', cartItems);
    
    if (!isAuthenticated) {
      console.log('❌ Not authenticated, redirecting to login');
      navigate('/login');
      return;
    }
    
    // Check if cart is empty or undefined
    if (!cartItems || cartItems.length === 0) {
      console.log('❌ Cart is empty, redirecting to cart');
      navigate('/cart');
      return;
    }
    
    console.log('✅ Authentication and cart check passed');
  }, [isAuthenticated, cartItems, navigate]);

  // Color scheme
  const colors = {
    bgPrimary: '#FAF7F2',
    bgSecondary: '#F5F0E8',
    primary: '#D4AF37',
    primaryDark: '#B8962E',
    textPrimary: '#1F2937',
    textSecondary: '#4B5563',
    textLight: '#6B7280',
    border: '#E0D9CD',
    success: '#10B981',
    error: '#EF4444',
    white: '#FFFFFF',
    warning: '#F59E0B',
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!address.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!address.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(address.phone)) {
      newErrors.phone = 'Enter valid 10-digit phone number';
    }

    if (!address.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(address.email)) {
      newErrors.email = 'Enter valid email address';
    }

    if (!address.addressLine1.trim()) {
      newErrors.addressLine1 = 'Address line 1 is required';
    }

    if (!address.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!address.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!address.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(address.pincode)) {
      newErrors.pincode = 'Enter valid 6-digit pincode';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Save address to user profile
  const saveAddressToProfile = async () => {
    if (!validateForm()) {
      showNotification('Please fill all required fields', 'error');
      return;
    }

    setSavingAddress(true);
    try {
      const response = await api.put('/users/profile', {
        name: address.fullName,
        phone: address.phone,
        address: address.addressLine1,
        city: address.city,
        state: address.state,
        pincode: address.pincode
      });

      if (response.data.success) {
        showNotification('Address saved to profile', 'success');
      }
    } catch (error) {
      console.error('Error saving address:', error);
      showNotification('Failed to save address', 'error');
    } finally {
      setSavingAddress(false);
    }
  };

  // 🔥 FIXED: Better error handling and navigation
  const handleProceedToPayment = async () => {
    console.log('🚀 handleProceedToPayment started');
    
    // Double-check cart before proceeding
    if (!cartItems || cartItems.length === 0) {
      console.log('❌ Cart is empty, cannot proceed');
      showNotification('Your cart is empty', 'error');
      setTimeout(() => navigate('/cart'), 1500);
      return;
    }

    if (!validateForm()) {
      console.log('❌ Form validation failed');
      showNotification('Please fill all required fields', 'error');
      return;
    }

    console.log('✅ Form validation passed');
    setLoading(true);
    
    try {
      // Format address for shipping
      const shippingAddress = {
        fullName: address.fullName,
        phone: address.phone,
        email: address.email,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 || '',
        landmark: address.landmark || '',
        city: address.city,
        state: address.state,
        postalCode: address.pincode,
        country: 'India',
        addressType: address.addressType
      };

      console.log('📦 Saving shipping address:', shippingAddress);

      // Save address to session storage
      sessionStorage.setItem('shippingAddress', JSON.stringify(shippingAddress));

      // Verify address was saved
      const savedAddress = sessionStorage.getItem('shippingAddress');
      if (!savedAddress) {
        throw new Error('Failed to save address');
      }
      
      console.log('✅ Address saved successfully:', JSON.parse(savedAddress));

      // Show success message
      showNotification('Address saved! Redirecting to payment...', 'success');

      // Small delay to show success message
      setTimeout(() => {
        console.log('🔄 Navigating to /checkout/payment');
        navigate('/checkout/payment');
      }, 500);

    } catch (error) {
      console.error('❌ Error in handleProceedToPayment:', error);
      showNotification('Failed to proceed to payment: ' + error.message, 'error');
      setLoading(false);
    }
  };

  const calculateSubtotal = () => {
    return cartItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      background: colors.bgPrimary,
      padding: '40px 20px',
    },
    wrapper: {
      maxWidth: '1000px',
      margin: '0 auto',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      marginBottom: '40px',
    },
    backButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 20px',
      background: colors.white,
      border: `1px solid ${colors.border}`,
      borderRadius: '30px',
      color: colors.textPrimary,
      fontSize: '0.95rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    title: {
      fontSize: '2rem',
      fontWeight: '700',
      color: colors.textPrimary,
      margin: 0,
    },
    content: {
      display: 'grid',
      gridTemplateColumns: '1fr 350px',
      gap: '30px',
    },
    formSection: {
      background: colors.white,
      borderRadius: '24px',
      padding: '30px',
      border: `1px solid ${colors.border}`,
    },
    sectionTitle: {
      fontSize: '1.3rem',
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
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
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      color: colors.textSecondary,
      fontSize: '0.9rem',
      fontWeight: '500',
      marginBottom: '8px',
    },
    input: {
      width: '100%',
      padding: '12px 15px',
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      fontSize: '0.95rem',
      color: colors.textPrimary,
      transition: 'all 0.3s ease',
      outline: 'none',
    },
    inputError: {
      borderColor: colors.error,
    },
    errorText: {
      color: colors.error,
      fontSize: '0.8rem',
      marginTop: '5px',
    },
    addressType: {
      display: 'flex',
      gap: '20px',
      marginBottom: '20px',
    },
    addressTypeBtn: {
      flex: 1,
      padding: '12px',
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      background: colors.white,
      color: colors.textSecondary,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.3s ease',
    },
    addressTypeActive: {
      background: colors.primary,
      color: colors.white,
      borderColor: colors.primary,
    },
    orderSummary: {
      background: colors.white,
      borderRadius: '24px',
      padding: '25px',
      border: `1px solid ${colors.border}`,
      position: 'sticky',
      top: '100px',
    },
    summaryRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: `1px solid ${colors.border}`,
    },
    totalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '15px 0',
      fontSize: '1.2rem',
      fontWeight: '700',
      color: colors.primary,
    },
    buttonGroup: {
      display: 'flex',
      gap: '15px',
      marginTop: '20px',
    },
    saveButton: {
      flex: 1,
      padding: '14px',
      background: colors.white,
      border: `1px solid ${colors.primary}`,
      borderRadius: '12px',
      color: colors.primary,
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.3s ease',
    },
    proceedButton: {
      flex: 2,
      padding: '14px',
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
      border: 'none',
      borderRadius: '12px',
      color: colors.white,
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.3s ease',
    },
    notification: {
      position: 'fixed',
      top: '100px',
      right: '20px',
      background: colors.white,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      padding: '16px 24px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
  };

  return (
    <div style={styles.container}>
      {notification.show && (
        <div style={styles.notification}>
          {notification.type === 'success' && <CheckCircle size={20} color={colors.success} />}
          {notification.type === 'error' && <AlertCircle size={20} color={colors.error} />}
          <span style={{ color: colors.textPrimary }}>{notification.message}</span>
        </div>
      )}

      <div style={styles.wrapper}>
        {/* Header */}
        <div style={styles.header}>
          <button
            style={styles.backButton}
            onClick={() => navigate('/cart')}
          >
            <ArrowLeft size={18} />
            Back to Cart
          </button>
          <h1 style={styles.title}>Shipping Information</h1>
        </div>

        {/* Main Content */}
        <div style={styles.content}>
          {/* Address Form */}
          <div style={styles.formSection}>
            <div style={styles.sectionTitle}>
              <MapPin size={24} color={colors.primary} />
              Delivery Address
            </div>

            {/* Address Type */}
            <div style={styles.addressType}>
              <button
                style={{
                  ...styles.addressTypeBtn,
                  ...(address.addressType === 'home' ? styles.addressTypeActive : {})
                }}
                onClick={() => setAddress(prev => ({ ...prev, addressType: 'home' }))}
              >
                <Home size={18} />
                Home
              </button>
              <button
                style={{
                  ...styles.addressTypeBtn,
                  ...(address.addressType === 'work' ? styles.addressTypeActive : {})
                }}
                onClick={() => setAddress(prev => ({ ...prev, addressType: 'work' }))}
              >
                <Building size={18} />
                Work
              </button>
            </div>

            <div style={styles.formGrid}>
              {/* Full Name */}
              <div style={styles.fullWidth}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <User size={16} color={colors.primary} />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={address.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    style={{
                      ...styles.input,
                      ...(errors.fullName ? styles.inputError : {})
                    }}
                  />
                  {errors.fullName && <div style={styles.errorText}>{errors.fullName}</div>}
                </div>
              </div>

              {/* Phone */}
              <div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <Phone size={16} color={colors.primary} />
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={address.phone}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    style={{
                      ...styles.input,
                      ...(errors.phone ? styles.inputError : {})
                    }}
                  />
                  {errors.phone && <div style={styles.errorText}>{errors.phone}</div>}
                </div>
              </div>

              {/* Alternate Phone */}
              <div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <Phone size={16} color={colors.primary} />
                    Alternate Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    name="alternatePhone"
                    value={address.alternatePhone}
                    onChange={handleChange}
                    placeholder="Alternate number"
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Email */}
              <div style={styles.fullWidth}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <Mail size={16} color={colors.primary} />
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={address.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    style={{
                      ...styles.input,
                      ...(errors.email ? styles.inputError : {})
                    }}
                  />
                  {errors.email && <div style={styles.errorText}>{errors.email}</div>}
                </div>
              </div>

              {/* Address Line 1 */}
              <div style={styles.fullWidth}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <MapPin size={16} color={colors.primary} />
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={address.addressLine1}
                    onChange={handleChange}
                    placeholder="House/Flat No., Building, Street"
                    style={{
                      ...styles.input,
                      ...(errors.addressLine1 ? styles.inputError : {})
                    }}
                  />
                  {errors.addressLine1 && <div style={styles.errorText}>{errors.addressLine1}</div>}
                </div>
              </div>

              {/* Address Line 2 */}
              <div style={styles.fullWidth}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <MapPin size={16} color={colors.primary} />
                    Address Line 2 (Optional)
                  </label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={address.addressLine2}
                    onChange={handleChange}
                    placeholder="Locality, Area"
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Landmark */}
              <div style={styles.fullWidth}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <MapPin size={16} color={colors.primary} />
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    name="landmark"
                    value={address.landmark}
                    onChange={handleChange}
                    placeholder="Nearby landmark"
                    style={styles.input}
                  />
                </div>
              </div>

              {/* City */}
              <div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <MapPin size={16} color={colors.primary} />
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={address.city}
                    onChange={handleChange}
                    placeholder="City"
                    style={{
                      ...styles.input,
                      ...(errors.city ? styles.inputError : {})
                    }}
                  />
                  {errors.city && <div style={styles.errorText}>{errors.city}</div>}
                </div>
              </div>

              {/* State */}
              <div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <MapPin size={16} color={colors.primary} />
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={address.state}
                    onChange={handleChange}
                    placeholder="State"
                    style={{
                      ...styles.input,
                      ...(errors.state ? styles.inputError : {})
                    }}
                  />
                  {errors.state && <div style={styles.errorText}>{errors.state}</div>}
                </div>
              </div>

              {/* Pincode */}
              <div style={styles.fullWidth}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <MapPin size={16} color={colors.primary} />
                    Pincode *
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={address.pincode}
                    onChange={handleChange}
                    placeholder="6-digit pincode"
                    style={{
                      ...styles.input,
                      ...(errors.pincode ? styles.inputError : {})
                    }}
                  />
                  {errors.pincode && <div style={styles.errorText}>{errors.pincode}</div>}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={styles.buttonGroup}>
              <button
                style={styles.saveButton}
                onClick={saveAddressToProfile}
                disabled={savingAddress}
              >
                {savingAddress ? (
                  <Loader size={16} className="spinner" />
                ) : (
                  <>
                    <Save size={16} />
                    Save to Profile
                  </>
                )}
              </button>
              <button
                style={styles.proceedButton}
                onClick={handleProceedToPayment}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader size={16} className="spinner" />
                    Processing...
                  </>
                ) : (
                  'Proceed to Payment'
                )}
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div style={styles.orderSummary}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '20px' }}>
              Order Summary
            </h3>
            
            {cartItems && cartItems.length > 0 ? (
              cartItems.map((item, idx) => (
                <div key={idx} style={styles.summaryRow}>
                  <span style={{ color: colors.textSecondary }}>
                    {item.name} x {item.quantity}
                  </span>
                  <span style={{ color: colors.textPrimary, fontWeight: '500' }}>
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: colors.textLight, padding: '20px' }}>
                Your cart is empty
              </div>
            )}

            <div style={styles.summaryRow}>
              <span style={{ color: colors.textSecondary }}>Subtotal</span>
              <span style={{ color: colors.textPrimary, fontWeight: '600' }}>
                ₹{calculateSubtotal().toFixed(2)}
              </span>
            </div>

            <div style={styles.summaryRow}>
              <span style={{ color: colors.textSecondary }}>Shipping</span>
              <span style={{ color: calculateSubtotal() >= 5000 ? colors.success : colors.warning }}>
                {calculateSubtotal() >= 5000 ? 'FREE' : '₹40'}
              </span>
            </div>

            <div style={styles.totalRow}>
              <span>Total</span>
              <span>
                ₹{(calculateSubtotal() + (calculateSubtotal() >= 5000 ? 0 : 40)).toFixed(2)}
              </span>
            </div>

            <div style={{
              padding: '15px',
              background: colors.bgSecondary,
              borderRadius: '12px',
              marginTop: '20px',
              fontSize: '0.9rem',
              color: colors.textSecondary,
            }}>
              <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} color={colors.primary} />
                Cash on Delivery available
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
        input:focus {
          border-color: ${colors.primary};
          box-shadow: 0 0 0 3px ${colors.primary}20;
        }
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
};

export default AddressInfo;