// src/pages/Payment.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Wallet,
  Banknote,
  Loader,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Shield,
  Lock,
  Truck
} from 'lucide-react';
import { useAuth } from '../components/context/AuthContext';
import { useCart } from '../components/context/CartContext';
import OrderConfirmation from './OrderConfirmation';
import axios from 'axios';

// API setup
const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';
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

// ✅ Check if in development mode
const isDevelopment = import.meta.env?.DEV || process.env.NODE_ENV === 'development';

// ✅ Check if we're on Render
const isRender = window.location.hostname.includes('render.com') || 
                 window.location.hostname.includes('onrender.com');

// ✅ Get appropriate API URL
const getApiUrl = () => {
  if (isRender) {
    return 'https://occamart.onrender.com/api';
  }
  return import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';
};

const Payment = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { cartItems, clearCart } = useCart();
  
  const [loading, setLoading] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [shippingAddress, setShippingAddress] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [razorpayKey, setRazorpayKey] = useState('');

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

  // ✅ Load Razorpay script
  useEffect(() => {
    const loadRazorpayScript = async () => {
      try {
        if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
          console.log('✅ Razorpay script already loaded');
          setRazorpayLoaded(true);
          return;
        }

        console.log('📦 Loading Razorpay script...');
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          console.log('✅ Razorpay script loaded successfully');
          setRazorpayLoaded(true);
        };
        script.onerror = () => {
          console.error('❌ Failed to load Razorpay script');
          showNotification('Failed to load Razorpay payment gateway. Please refresh and try again.', 'error');
        };
        document.body.appendChild(script);
      } catch (error) {
        console.error('❌ Error loading Razorpay script:', error);
      }
    };

    if (paymentMethod === 'razorpay') {
      loadRazorpayScript();
    }
  }, [paymentMethod]);

  // ✅ Get Razorpay key
  useEffect(() => {
    const getRazorpayKey = async () => {
      try {
        console.log('🔑 Fetching Razorpay key...');
        const response = await api.get('/payments/key');
        console.log('✅ Razorpay key received:', response.data);
        setRazorpayKey(response.data.keyId);
      } catch (error) {
        console.error('❌ Failed to get Razorpay key:', error);
        showNotification('Failed to load payment configuration. Please refresh and try again.', 'error');
      }
    };

    getRazorpayKey();
  }, []);

  // Load shipping address from session storage
  useEffect(() => {
    const savedAddress = sessionStorage.getItem('shippingAddress');
    if (savedAddress) {
      try {
        const address = JSON.parse(savedAddress);
        console.log('📦 Shipping address loaded:', address);
        setShippingAddress(address);
      } catch (error) {
        console.error('Error parsing address:', error);
      }
    } else {
      showNotification('Please provide shipping address first', 'error');
      setTimeout(() => navigate('/checkout/address'), 1500);
    }
  }, [navigate]);

  // ✅ Check authentication and cart - Skip if order is placed
  useEffect(() => {
    if (orderPlaced && orderDetails) {
      return;
    }
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (!cartItems || cartItems.length === 0) {
      navigate('/cart');
      return;
    }
  }, [isAuthenticated, cartItems, navigate, orderPlaced, orderDetails]);

  const calculateSubtotal = () => {
    return cartItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  };

  const calculateShipping = () => {
    return 0; // Free shipping for all orders
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const shipping = calculateShipping();
    return subtotal + shipping;
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
  };

  // 🔥 CREATE ORDER FUNCTION
  const createOrder = async () => {
    try {
      console.log('📝 Creating order...');
      
      const subtotal = calculateSubtotal();
      const shipping = calculateShipping();
      const total = subtotal + shipping;

      const orderData = {
        orderItems: cartItems.map(item => ({
          name: item.name,
          qty: item.quantity,
          price: item.price,
          product: item._id || item.id || item.productId,
          image: item.image || item.images?.[0] || ''
        })),
        shippingAddress: {
          address: shippingAddress?.addressLine1 || shippingAddress?.address || '',
          city: shippingAddress?.city || '',
          postalCode: shippingAddress?.postalCode || shippingAddress?.pincode || '',
          country: 'India'
        },
        paymentMethod: paymentMethod === 'razorpay' ? 'Razorpay' : 'Cash on Delivery',
        itemsPrice: subtotal,
        taxPrice: 0,
        shippingPrice: shipping,
        totalPrice: total
      };

      console.log('📦 Order data:', orderData);

      const response = await api.post('/orders', orderData);
      
      console.log('✅ Order created:', response.data);
      
      if (response.data.success) {
        return response.data.order;
      } else {
        throw new Error(response.data.message || 'Failed to create order');
      }
      
    } catch (error) {
      console.error('❌ Create order error:', error);
      showNotification(
        error.response?.data?.message || error.message || 'Failed to create order',
        'error'
      );
      throw error;
    }
  };

  // 🔥 HANDLE PAYMENT
  const handlePayment = async () => {
    try {
      setPlacingOrder(true);
      setLoading(true);
      
      console.log('🚀 Starting payment process...');
      console.log('📌 Payment Method:', paymentMethod);
      
      const order = await createOrder();
      
      if (!order) {
        throw new Error('Failed to create order');
      }
      
      console.log('✅ Order created successfully:', order._id);
      
      // ✅ If payment method is COD - show confirmation directly
      if (paymentMethod === 'cod') {
        console.log('✅ COD Order placed successfully - showing confirmation');
        
        await clearCart();
        sessionStorage.removeItem('shippingAddress');
        
        setOrderDetails(order);
        setOrderPlaced(true);
        setLoading(false);
        setPlacingOrder(false);
        showNotification('✅ Order placed successfully!', 'success');
        return;
      }
      
      // ✅ For Razorpay - check if loaded
      if (paymentMethod === 'razorpay') {
        if (!razorpayLoaded) {
          showNotification('Razorpay is still loading. Please wait...', 'error');
          setLoading(false);
          setPlacingOrder(false);
          return;
        }
        
        if (!razorpayKey) {
          showNotification('Payment configuration not loaded. Please refresh.', 'error');
          setLoading(false);
          setPlacingOrder(false);
          return;
        }
        
        console.log('💰 Initializing Razorpay payment...');
        await initializeRazorpayPayment(order);
      }
      
    } catch (error) {
      console.error('❌ Payment error:', error);
      showNotification(error.message || 'Payment failed. Please try again.', 'error');
      setLoading(false);
      setPlacingOrder(false);
    }
  };

  // 🔥 INITIALIZE RAZORPAY
  const initializeRazorpayPayment = async (order) => {
    try {
      console.log('💰 Initializing Razorpay payment...');
      console.log('🔑 Razorpay Key:', razorpayKey);
      
      if (!window.Razorpay) {
        console.error('❌ Razorpay SDK not loaded');
        showNotification('Razorpay SDK not loaded. Please check your internet connection.', 'error');
        setLoading(false);
        setPlacingOrder(false);
        return;
      }

      console.log('📦 Creating Razorpay order for order ID:', order._id);
      console.log('💰 Amount:', order.totalPrice);
      
      const response = await api.post('/payments/create-razorpay-order', {
        orderId: order._id,
        amount: order.totalPrice
      });

      console.log('✅ Razorpay order created:', response.data);

      const { razorpayOrderId, razorpayKeyId } = response.data;
      
      if (!razorpayOrderId) {
        throw new Error('Failed to create Razorpay order');
      }

      const options = {
        key: razorpayKeyId || razorpayKey,
        amount: Math.round(order.totalPrice * 100),
        currency: 'INR',
        name: 'Occamart',
        description: `Order #${order.orderNumber || order._id.slice(-8).toUpperCase()}`,
        order_id: razorpayOrderId,
        handler: async function (response) {
          console.log('✅ Razorpay payment successful:', response);
          
          try {
            const verifyResponse = await api.post('/payments/verify-razorpay-payment', {
              orderId: order._id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature
            });

            if (verifyResponse.data.success) {
              console.log('✅ Payment verified successfully');
              
              await clearCart();
              sessionStorage.removeItem('shippingAddress');
              
              setOrderDetails(order);
              setOrderPlaced(true);
              setLoading(false);
              setPlacingOrder(false);
              showNotification('Payment successful! Order placed.', 'success');
            } else {
              throw new Error(verifyResponse.data.message || 'Payment verification failed');
            }
          } catch (error) {
            console.error('❌ Payment verification error:', error);
            showNotification(error.message || 'Payment verification failed. Please contact support.', 'error');
            setLoading(false);
            setPlacingOrder(false);
          }
        },
        prefill: {
          name: user?.name || shippingAddress?.fullName || '',
          email: user?.email || shippingAddress?.email || '',
          contact: shippingAddress?.phone || user?.phone || ''
        },
        theme: {
          color: '#D4AF37'
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal closed');
            setLoading(false);
            setPlacingOrder(false);
            showNotification('Payment cancelled', 'warning');
          }
        }
      };

      console.log('📦 Razorpay options:', options);
      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
      
    } catch (error) {
      console.error('❌ Razorpay initialization error:', error);
      console.error('📚 Error details:', error.response?.data);
      showNotification(error.response?.data?.message || error.message || 'Failed to initialize payment', 'error');
      setLoading(false);
      setPlacingOrder(false);
    }
  };

  // ✅ SHOW ORDER CONFIRMATION DIRECTLY
  if (orderPlaced && orderDetails) {
    return (
      <OrderConfirmation 
        orderData={{
          orderId: orderDetails._id,
          orderNumber: orderDetails.orderNumber || orderDetails._id.slice(-8).toUpperCase(),
          paymentMethod: paymentMethod === 'razorpay' ? 'razorpay' : 'cod',
          totalPrice: orderDetails.totalPrice,
          order: orderDetails,
          isDevelopment: isDevelopment && paymentMethod === 'razorpay'
        }}
      />
    );
  }

  // 🔥 PAYMENT VIEW
  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bgPrimary,
      padding: '40px 20px'
    }}>
      {/* Free Shipping Banner */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto 20px',
        padding: '12px 20px',
        background: `${colors.success}20`,
        border: `1px solid ${colors.success}`,
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        color: colors.success
      }}>
        <Truck size={20} />
        <span>
          <strong>🎉 Free Shipping</strong> on all orders! No delivery charges.
        </span>
      </div>

      {/* Razorpay Status Banner */}
      {paymentMethod === 'razorpay' && !razorpayLoaded && (
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto 20px',
          padding: '12px 20px',
          background: '#FEF3C7',
          border: '1px solid #F59E0B',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#92400E'
        }}>
          <Loader size={20} className="spinner" />
          <span>Loading Razorpay payment gateway...</span>
        </div>
      )}

      {notification.show && (
        <div style={{
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
          gap: '12px'
        }}>
          {notification.type === 'success' && <CheckCircle size={20} color={colors.success} />}
          {notification.type === 'error' && <AlertCircle size={20} color={colors.error} />}
          <span style={{ color: colors.textPrimary }}>{notification.message}</span>
        </div>
      )}

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          marginBottom: '40px'
        }}>
          <button
            onClick={() => navigate('/checkout/address')}
            style={{
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
              transition: 'all 0.3s ease'
            }}
          >
            <ArrowLeft size={18} />
            Back to Address
          </button>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: colors.textPrimary, margin: 0 }}>
            Payment
          </h1>
        </div>

        {/* Main Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 350px',
          gap: '30px'
        }}>
          {/* Payment Methods */}
          <div style={{
            background: colors.white,
            borderRadius: '24px',
            padding: '30px',
            border: `1px solid ${colors.border}`
          }}>
            <h3 style={{
              fontSize: '1.3rem',
              fontWeight: '600',
              color: colors.textPrimary,
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <CreditCard size={24} color={colors.primary} />
              Payment Method
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {/* Razorpay Option */}
              <div
                onClick={() => setPaymentMethod('razorpay')}
                style={{
                  padding: '20px',
                  border: `2px solid ${paymentMethod === 'razorpay' ? colors.primary : colors.border}`,
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: paymentMethod === 'razorpay' ? `${colors.primary}10` : colors.white
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    background: colors.bgSecondary,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Wallet size={28} color={colors.primary} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, color: colors.textPrimary, fontWeight: '600' }}>
                      Razorpay
                    </h4>
                    <p style={{ margin: '5px 0 0', color: colors.textSecondary, fontSize: '0.9rem' }}>
                      Pay with Credit/Debit Card, UPI, Net Banking
                    </p>
                    {!razorpayLoaded && (
                      <p style={{ margin: '5px 0 0', color: colors.warning, fontSize: '0.8rem' }}>
                        ⏳ Loading payment gateway...
                      </p>
                    )}
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: `2px solid ${paymentMethod === 'razorpay' ? colors.primary : colors.border}`,
                      background: paymentMethod === 'razorpay' ? colors.primary : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {paymentMethod === 'razorpay' && (
                        <CheckCircle size={14} color={colors.white} />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* COD Option */}
              <div
                onClick={() => setPaymentMethod('cod')}
                style={{
                  padding: '20px',
                  border: `2px solid ${paymentMethod === 'cod' ? colors.primary : colors.border}`,
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: paymentMethod === 'cod' ? `${colors.primary}10` : colors.white
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    background: colors.bgSecondary,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Banknote size={28} color={colors.primary} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, color: colors.textPrimary, fontWeight: '600' }}>
                      Cash on Delivery
                    </h4>
                    <p style={{ margin: '5px 0 0', color: colors.textSecondary, fontSize: '0.9rem' }}>
                      Pay when you receive your order
                    </p>
                    <p style={{ margin: '5px 0 0', color: colors.success, fontSize: '0.8rem' }}>
                      ✓ Free shipping on all orders
                    </p>
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: `2px solid ${paymentMethod === 'cod' ? colors.primary : colors.border}`,
                      background: paymentMethod === 'cod' ? colors.primary : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {paymentMethod === 'cod' && (
                        <CheckCircle size={14} color={colors.white} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Info */}
            <div style={{
              marginTop: '30px',
              padding: '15px',
              background: colors.bgSecondary,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <Lock size={18} color={colors.primary} />
              <span style={{ fontSize: '0.9rem', color: colors.textSecondary }}>
                Your payment information is secure and encrypted
              </span>
            </div>

            {/* Place Order Button */}
            <button
              onClick={handlePayment}
              disabled={placingOrder || loading || (paymentMethod === 'razorpay' && !razorpayLoaded)}
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '16px',
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                border: 'none',
                borderRadius: '12px',
                color: colors.white,
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                opacity: (placingOrder || loading || (paymentMethod === 'razorpay' && !razorpayLoaded)) ? 0.6 : 1
              }}
            >
              {placingOrder || loading ? (
                <>
                  <Loader size={20} className="spinner" />
                  Processing...
                </>
              ) : paymentMethod === 'razorpay' && !razorpayLoaded ? (
                <>
                  <Loader size={20} className="spinner" />
                  Loading Razorpay...
                </>
              ) : (
                <>
                  <Shield size={20} />
                  {paymentMethod === 'razorpay' ? 'Pay with Razorpay' : 'Place Order (COD)'} • ₹{calculateTotal().toFixed(2)}
                </>
              )}
            </button>

            {paymentMethod === 'razorpay' && razorpayLoaded && (
              <p style={{
                marginTop: '10px',
                textAlign: 'center',
                fontSize: '0.8rem',
                color: colors.textLight
              }}>
                🔒 Secure payment powered by Razorpay
              </p>
            )}
          </div>

          {/* Order Summary */}
          <div style={{
            background: colors.white,
            borderRadius: '24px',
            padding: '25px',
            border: `1px solid ${colors.border}`,
            position: 'sticky',
            top: '100px'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '20px' }}>
              Order Summary
            </h3>
            
            {shippingAddress && (
              <div style={{
                padding: '15px',
                background: colors.bgSecondary,
                borderRadius: '12px',
                marginBottom: '20px'
              }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: colors.textSecondary }}>
                  <Truck size={14} color={colors.primary} style={{ marginRight: '6px' }} />
                  Shipping to:
                </p>
                <p style={{ margin: '5px 0', color: colors.textPrimary, fontWeight: '500' }}>
                  {shippingAddress.fullName || shippingAddress.name}
                </p>
                <p style={{ margin: 0, color: colors.textSecondary, fontSize: '0.9rem' }}>
                  {shippingAddress.addressLine1 || shippingAddress.address}
                  {shippingAddress.addressLine2 && `, ${shippingAddress.addressLine2}`}
                </p>
                <p style={{ margin: 0, color: colors.textSecondary, fontSize: '0.9rem' }}>
                  {shippingAddress.city}, {shippingAddress.state || shippingAddress.city} - {shippingAddress.postalCode || shippingAddress.pincode}
                </p>
              </div>
            )}

            {cartItems && cartItems.length > 0 ? (
              cartItems.slice(0, 3).map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: `1px solid ${colors.border}`
                }}>
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

            {cartItems && cartItems.length > 3 && (
              <div style={{ textAlign: 'center', color: colors.textLight, fontSize: '0.9rem', padding: '5px 0' }}>
                +{cartItems.length - 3} more items
              </div>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 0',
              borderBottom: `1px solid ${colors.border}`
            }}>
              <span style={{ color: colors.textSecondary }}>Subtotal</span>
              <span style={{ color: colors.textPrimary, fontWeight: '600' }}>
                ₹{calculateSubtotal().toFixed(2)}
              </span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 0',
              borderBottom: `1px solid ${colors.border}`
            }}>
              <span style={{ color: colors.textSecondary }}>Shipping</span>
              <span style={{ 
                color: colors.success,
                fontWeight: '600'
              }}>
                FREE 🎉
              </span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '15px 0',
              fontSize: '1.2rem',
              fontWeight: '700',
              color: colors.primary,
              borderTop: `2px solid ${colors.border}`,
              marginTop: '5px'
            }}>
              <span>Total</span>
              <span>₹{calculateTotal().toFixed(2)}</span>
            </div>

            <div style={{
              marginTop: '10px',
              padding: '10px',
              background: `${colors.success}20`,
              borderRadius: '8px',
              textAlign: 'center',
              fontSize: '0.85rem',
              color: colors.success
            }}>
              🎉 Free shipping on all orders!
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
        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default Payment;