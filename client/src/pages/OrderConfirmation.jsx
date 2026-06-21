// src/pages/Confirmation.jsx
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  CheckCircle, 
  Package, 
  Truck, 
  Clock, 
  Home, 
  ArrowRight,
  Printer,
  Download
} from 'lucide-react';

const Confirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const orderData = location.state || {};

  const colors = {
    primary: '#D4AF37',
    primaryDark: '#B8962E',
    bgPrimary: '#FAF7F2',
    bgSecondary: '#F5F0E8',
    textPrimary: '#1F2937',
    textSecondary: '#4B5563',
    textLight: '#6B7280',
    border: '#E0D9CD',
    success: '#10B981',
    white: '#FFFFFF',
    error: '#EF4444',
  };

  // Redirect if no order data
  useEffect(() => {
    if (!orderData.orderId) {
      navigate('/');
    }
  }, [orderData, navigate]);

  if (!orderData.orderId) {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bgPrimary,
      padding: '40px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        background: colors.white,
        borderRadius: '24px',
        padding: '50px 40px',
        border: `1px solid ${colors.border}`,
        boxShadow: '0 20px 60px rgba(0,0,0,0.05)',
        textAlign: 'center'
      }}>
        {/* Success Icon */}
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: `${colors.success}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          <CheckCircle size={60} color={colors.success} />
        </div>

        <h1 style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: colors.textPrimary,
          marginBottom: '10px'
        }}>
          Order Placed! 🎉
        </h1>
        <p style={{ 
          color: colors.textSecondary, 
          marginBottom: '30px',
          fontSize: '1rem'
        }}>
          Thank you for your order! We'll send you a confirmation email shortly.
        </p>

        {/* Order Details */}
        <div style={{
          background: colors.bgSecondary,
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '30px',
          textAlign: 'left'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '10px 0',
            borderBottom: `1px solid ${colors.border}`
          }}>
            <span style={{ color: colors.textSecondary }}>Order Number</span>
            <span style={{ color: colors.textPrimary, fontWeight: '600' }}>
              #{orderData.orderNumber || orderData.orderId.slice(-8).toUpperCase()}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '10px 0',
            borderBottom: `1px solid ${colors.border}`
          }}>
            <span style={{ color: colors.textSecondary }}>Order Date</span>
            <span style={{ color: colors.textPrimary, fontWeight: '600' }}>
              {new Date().toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '10px 0',
            borderBottom: `1px solid ${colors.border}`
          }}>
            <span style={{ color: colors.textSecondary }}>Payment Method</span>
            <span style={{ color: colors.textPrimary, fontWeight: '600' }}>
              {orderData.paymentMethod === 'razorpay' ? 'Razorpay' : 'Cash on Delivery'}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '10px 0'
          }}>
            <span style={{ color: colors.textSecondary }}>Total Amount</span>
            <span style={{ 
              color: colors.primary, 
              fontWeight: '700', 
              fontSize: '1.1rem' 
            }}>
              ₹{orderData.totalPrice?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>

        {/* Order Status */}
        <div style={{
          display: 'inline-block',
          padding: '8px 20px',
          background: `${colors.success}20`,
          color: colors.success,
          borderRadius: '20px',
          fontSize: '0.9rem',
          fontWeight: '600',
          marginBottom: '30px'
        }}>
          {orderData.paymentMethod === 'cod' ? 'Pending Payment' : 'Payment Successful'}
        </div>

        {/* What's Next */}
        <div style={{
          background: `${colors.primary}10`,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px',
          textAlign: 'left'
        }}>
          <h3 style={{
            color: colors.textPrimary,
            fontSize: '1rem',
            marginBottom: '12px',
            fontWeight: '600'
          }}>
            What's Next?
          </h3>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            padding: '8px 0', 
            color: colors.textSecondary 
          }}>
            <Package size={18} color={colors.primary} />
            <span>We'll process your order within 24 hours</span>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            padding: '8px 0', 
            color: colors.textSecondary 
          }}>
            <Truck size={18} color={colors.primary} />
            <span>Delivery typically takes 3-5 business days</span>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            padding: '8px 0', 
            color: colors.textSecondary 
          }}>
            <Clock size={18} color={colors.primary} />
            <span>Track your order in 'My Orders' section</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            onClick={() => navigate('/orders')}
            style={{
              flex: 1,
              padding: '14px',
              background: colors.white,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              color: colors.textPrimary,
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Package size={18} />
            My Orders
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              flex: 1,
              padding: '14px',
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
              border: 'none',
              borderRadius: '12px',
              color: colors.white,
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
          >
            <Home size={18} />
            Continue Shopping
          </button>
        </div>

        {/* Print Button */}
        <button
          onClick={() => window.print()}
          style={{
            width: '100%',
            marginTop: '15px',
            padding: '12px',
            background: 'transparent',
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            cursor: 'pointer',
            color: colors.textSecondary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.3s ease'
          }}
        >
          <Printer size={18} />
          Print Order Summary
        </button>

        <p style={{
          marginTop: '20px',
          color: colors.textLight,
          fontSize: '0.8rem',
          borderTop: `1px solid ${colors.border}`,
          paddingTop: '20px'
        }}>
          Need help? Contact us at support@occamart.com or call +91 12345 67890
        </p>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        @media print {
          button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Confirmation;