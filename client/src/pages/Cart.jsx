// src/pages/Cart.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ShoppingCart,
  Shield,
  Truck,
  CreditCard,
  Sparkles,
  Zap,
  Award,
  Clock,
  Star,
  Heart,
  Gift,
  Tag,
  Loader,
  ArrowLeft,
  AlertCircle,
  CheckCircle
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

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const Cart = () => {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [updatingItems, setUpdatingItems] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const { 
    cartItems,        
    cartCount,
    cartTotal,
    loading, 
    updateQuantity, 
    removeFromCart, 
    fetchCart,
    isInCart,
    getItemQuantity
  } = useCart();

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
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    white: '#FFFFFF',
    black: '#000000',
  };

  // Fetch cart on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  // Add CSS animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
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
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .cart-item {
        animation: slideIn 0.5s ease-out;
        transition: all 0.3s ease;
      }
      
      .cart-item:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 30px ${colors.primary}20;
        border-color: ${colors.primary};
      }
      
      .quantity-btn {
        transition: all 0.3s ease;
      }
      
      .quantity-btn:hover:not(:disabled) {
        background: ${colors.primary};
        color: white;
        transform: translateY(-2px);
      }
      
      .remove-btn {
        transition: all 0.3s ease;
      }
      
      .remove-btn:hover {
        background: ${colors.error};
        color: white;
        transform: rotate(90deg);
      }
      
      .checkout-btn {
        transition: all 0.3s ease;
      }
      
      .checkout-btn:hover:not(:disabled) {
        transform: translateY(-3px);
        box-shadow: 0 10px 25px ${colors.primary};
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setUpdatingItems(prev => ({ ...prev, [productId]: true }));
    try {
      const result = await updateQuantity(productId, newQuantity);
      if (result && result.success) {
        showNotification('Quantity updated', 'success');
      } else {
        showNotification('Failed to update quantity', 'error');
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      showNotification('Failed to update quantity', 'error');
    } finally {
      setUpdatingItems(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleRemoveItem = async (productId) => {
    if (!window.confirm('Are you sure you want to remove this item?')) {
      return;
    }

    setUpdatingItems(prev => ({ ...prev, [productId]: true }));
    try {
      const result = await removeFromCart(productId);
      if (result && result.success) {
        showNotification('Item removed from cart', 'success');
      } else {
        showNotification('Failed to remove item', 'error');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      showNotification('Failed to remove item', 'error');
    } finally {
      setUpdatingItems(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleAddToWishlist = async (product) => {
    try {
      const response = await api.post('/wishlist/add', { 
        productId: product._id 
      });
      
      if (response.data.success) {
        showNotification('Added to wishlist', 'success');
      } else {
        showNotification('Failed to add to wishlist', 'error');
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      showNotification('Failed to add to wishlist', 'error');
    }
  };

  // 🔥 FIXED: Redirect to AddressInfo page instead of direct checkout
  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (cartItems.length === 0) {
      showNotification('Your cart is empty', 'warning');
      return;
    }

    // Redirect to address collection page
    navigate('/checkout/address');
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const calculateSubtotal = () => {
    if (!cartItems || cartItems.length === 0) return 0;
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateSavings = () => {
    if (!cartItems || cartItems.length === 0) return 0;
    return cartItems.reduce((sum, item) => {
      if (item.originalPrice) {
        return sum + ((item.originalPrice - item.price) * item.quantity);
      }
      return sum;
    }, 0);
  };

  const calculateShippingProgress = () => {
    const subtotal = calculateSubtotal();
    const freeShippingThreshold = 5000;
    return Math.min((subtotal / freeShippingThreshold) * 100, 100);
  };

  const getRemainingForFreeShipping = () => {
    const subtotal = calculateSubtotal();
    const freeShippingThreshold = 5000;
    return Math.max(freeShippingThreshold - subtotal, 0).toFixed(2);
  };

  const getImageUrl = (item) => {
    if (item.image) {
      return item.image.startsWith('http') ? item.image : `http://localhost:5000${item.image}`;
    }
    return null;
  };

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: colors.bgPrimary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}>
        <div style={{
          maxWidth: '400px',
          textAlign: 'center',
          background: colors.white,
          borderRadius: '24px',
          padding: '40px',
          border: `1px solid ${colors.border}`,
          boxShadow: `0 20px 40px rgba(0, 0, 0, 0.02)`,
        }}>
          <ShoppingBag size={60} color={colors.primary} style={{ marginBottom: '20px' }} />
          <h2 style={{ color: colors.textPrimary, fontSize: '1.8rem', marginBottom: '10px' }}>
            Please Login
          </h2>
          <p style={{ color: colors.textSecondary, marginBottom: '30px' }}>
            You need to be logged in to view your cart
          </p>
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
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            Go to Login
          </button>
        </div>
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
        <p style={{ color: colors.textSecondary }}>Loading your cart...</p>
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        background: colors.bgPrimary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}>
        <div style={{
          maxWidth: '500px',
          textAlign: 'center',
          background: colors.white,
          borderRadius: '24px',
          padding: '50px',
          border: `1px solid ${colors.border}`,
          boxShadow: `0 20px 40px rgba(0, 0, 0, 0.02)`,
        }}>
          <ShoppingBag size={80} color={colors.primary} style={{ marginBottom: '20px' }} />
          <h2 style={{ color: colors.textPrimary, fontSize: '2rem', marginBottom: '10px' }}>
            Your Cart is Empty
          </h2>
          <p style={{ color: colors.textSecondary, fontSize: '1.1rem', marginBottom: '30px' }}>
            Looks like you haven't added anything to your cart yet
          </p>
          <button
            onClick={() => navigate('/shop')}
            style={{
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
              color: colors.white,
              border: 'none',
              padding: '12px 30px',
              borderRadius: '30px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            Start Shopping
          </button>
        </div>
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
      {/* Notification */}
      {notification.show && (
        <div style={{
          position: 'fixed',
          top: '100px',
          right: '20px',
          background: notification.type === 'success' ? colors.success : 
                     notification.type === 'error' ? colors.error : 
                     notification.type === 'warning' ? colors.warning : colors.primary,
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          zIndex: 9999,
          animation: 'slideIn 0.3s ease-out',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          maxWidth: '350px',
        }}>
          {notification.type === 'success' && <CheckCircle size={20} />}
          {notification.type === 'error' && <AlertCircle size={20} />}
          {notification.type === 'warning' && <AlertCircle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Confetti effect */}
      {showConfetti && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 9999,
        }}>
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${Math.random() * 100}%`,
                top: '-10%',
                width: '12px',
                height: '24px',
                background: i % 2 === 0 ? colors.primary : colors.primaryLight,
                animation: `rotate ${Math.random() * 3 + 2}s linear infinite`,
                opacity: 0.7 + Math.random() * 0.3,
                borderRadius: '4px',
              }}
            />
          ))}
        </div>
      )}

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
      }}>
        {/* Header */}
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
              fontSize: '2.5rem',
              fontWeight: '800',
              color: colors.textPrimary,
              marginBottom: '8px',
            }}>
              Shopping Cart
            </h1>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{
                background: colors.bgSecondary,
                padding: '4px 12px',
                borderRadius: '30px',
                fontSize: '0.9rem',
                color: colors.textSecondary,
                border: `1px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <ShoppingBag size={14} color={colors.primary} />
                {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}
              </span>
              <span style={{
                background: colors.bgSecondary,
                padding: '4px 12px',
                borderRadius: '30px',
                fontSize: '0.9rem',
                color: colors.textSecondary,
                border: `1px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <Tag size={14} color={colors.primary} />
                Subtotal: ₹{calculateSubtotal().toFixed(2)}
              </span>
              <span style={{
                background: colors.primary,
                padding: '4px 12px',
                borderRadius: '30px',
                fontSize: '0.9rem',
                color: colors.white,
                border: `1px solid ${colors.primary}`,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <ShoppingCart size={14} />
                Cart: {cartCount}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/shop')}
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
              transition: 'all 0.3s ease',
            }}
          >
            <ArrowLeft size={18} />
            Continue Shopping
          </button>
        </div>

        {/* Shipping progress */}
        {calculateSubtotal() < 5000 && (
          <div style={{
            background: colors.white,
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '30px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: colors.textSecondary }}>
              <span>Add ₹{getRemainingForFreeShipping()} more for FREE shipping</span>
              <span style={{ color: colors.primary, fontWeight: '600' }}>
                {calculateShippingProgress().toFixed(0)}%
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              background: colors.bgSecondary,
              borderRadius: '4px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                background: `linear-gradient(90deg, ${colors.primary}, ${colors.primaryLight})`,
                borderRadius: '4px',
                transition: 'width 0.5s ease',
                width: `${calculateShippingProgress()}%`,
              }} />
            </div>
          </div>
        )}

        {/* Cart Items */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }}>
          <div>
            {cartItems.map((item, index) => (
              <div
                key={`cart-${item._id}-${index}`}
                className="cart-item"
                style={{
                  background: colors.white,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '20px',
                  padding: '20px',
                  marginBottom: '15px',
                  display: 'flex',
                  gap: '20px',
                  position: 'relative',
                  animationDelay: `${index * 0.1}s`,
                }}
                onMouseEnter={() => setHoveredItem(item._id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Product Image */}
                <div style={{ width: '120px', height: '120px', flexShrink: 0 }}>
                  {item.image ? (
                    <img
                      src={getImageUrl(item)}
                      alt={item.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '12px',
                        border: `1px solid ${colors.border}`,
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/120x120?text=No+Image';
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: colors.bgSecondary,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <ShoppingBag size={40} color={colors.primary} />
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div style={{ flex: 1 }}>
                  <Link to={`/product/${item._id}`} style={{ textDecoration: 'none' }}>
                    <h3 style={{
                      color: colors.textPrimary,
                      fontSize: '1.2rem',
                      fontWeight: '600',
                      marginBottom: '8px',
                    }}>
                      {item.name}
                    </h3>
                  </Link>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    marginBottom: '15px',
                  }}>
                    <span style={{
                      fontSize: '1.3rem',
                      fontWeight: '700',
                      color: colors.primary,
                    }}>
                      ₹{item.price.toFixed(2)}
                    </span>
                    {item.originalPrice && (
                      <span style={{
                        fontSize: '1rem',
                        color: colors.textLight,
                        textDecoration: 'line-through',
                      }}>
                        ₹{item.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Quantity Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      className="quantity-btn"
                      onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                      disabled={item.quantity <= 1 || updatingItems[item._id]}
                      style={{
                        width: '40px',
                        height: '40px',
                        background: colors.bgSecondary,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '10px',
                        color: colors.textPrimary,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: updatingItems[item._id] ? 0.6 : 1,
                      }}
                    >
                      <Minus size={16} />
                    </button>
                    
                    <span style={{
                      minWidth: '50px',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: colors.textPrimary,
                    }}>
                      {item.quantity}
                    </span>
                    
                    <button
                      className="quantity-btn"
                      onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                      disabled={updatingItems[item._id]}
                      style={{
                        width: '40px',
                        height: '40px',
                        background: colors.bgSecondary,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '10px',
                        color: colors.textPrimary,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: updatingItems[item._id] ? 0.6 : 1,
                      }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Item Total & Actions */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  minWidth: '150px',
                }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: colors.textLight, fontSize: '0.9rem', marginBottom: '5px' }}>
                      Item Total
                    </div>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: colors.primary,
                    }}>
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveItem(item._id)}
                      disabled={updatingItems[item._id]}
                      style={{
                        width: '40px',
                        height: '40px',
                        background: colors.bgSecondary,
                        border: `1px solid ${colors.error}`,
                        borderRadius: '10px',
                        color: colors.error,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: updatingItems[item._id] ? 0.6 : 1,
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                    
                    <button
                      onClick={() => handleAddToWishlist(item)}
                      disabled={updatingItems[item._id]}
                      style={{
                        width: '40px',
                        height: '40px',
                        background: colors.bgSecondary,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '10px',
                        color: colors.textSecondary,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: updatingItems[item._id] ? 0.6 : 1,
                      }}
                    >
                      <Heart size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div style={{
            background: colors.white,
            border: `1px solid ${colors.border}`,
            borderRadius: '20px',
            padding: '25px',
            height: 'fit-content',
            position: 'sticky',
            top: '100px',
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: colors.textPrimary,
              marginBottom: '20px',
            }}>
              Order Summary
            </h2>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '15px',
              paddingBottom: '10px',
              borderBottom: `1px dashed ${colors.border}`,
            }}>
              <span style={{ color: colors.textSecondary }}>Subtotal</span>
              <span style={{ color: colors.textPrimary, fontWeight: '600' }}>
                ₹{calculateSubtotal().toFixed(2)}
              </span>
            </div>

            {calculateSavings() > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '15px',
                paddingBottom: '10px',
                borderBottom: `1px dashed ${colors.border}`,
                color: colors.success,
              }}>
                <span>Savings</span>
                <span>-₹{calculateSavings().toFixed(2)}</span>
              </div>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '15px',
              paddingBottom: '10px',
              borderBottom: `1px dashed ${colors.border}`,
            }}>
              <span style={{ color: colors.textSecondary }}>Shipping</span>
              <span style={{
                color: calculateSubtotal() >= 5000 ? colors.success : colors.warning,
                fontWeight: '600',
              }}>
                {calculateSubtotal() >= 5000 ? 'FREE' : '₹40'}
              </span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '20px',
              paddingTop: '10px',
              borderTop: `2px solid ${colors.primary}`,
            }}>
              <span style={{ color: colors.textPrimary, fontSize: '1.2rem', fontWeight: '600' }}>
                Total
              </span>
              <span style={{
                fontSize: '1.8rem',
                fontWeight: '800',
                color: colors.primary,
              }}>
                ₹{(calculateSubtotal() + (calculateSubtotal() >= 5000 ? 0 : 40)).toFixed(2)}
              </span>
            </div>

            <button
              className="checkout-btn"
              onClick={handleCheckout}
              disabled={cartItems.length === 0}
              style={{
                width: '100%',
                padding: '15px',
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                border: 'none',
                borderRadius: '12px',
                color: colors.white,
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '20px',
              }}
            >
              Proceed to Checkout
            </button>

            {/* Features */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { icon: Shield, text: 'Secure Checkout' },
                { icon: Truck, text: 'Free Shipping on ₹5000+' },
                { icon: CreditCard, text: 'Easy Returns' },
              ].map((item, index) => (
                <div key={`feature-${index}`} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: colors.textSecondary,
                  fontSize: '0.9rem',
                }}>
                  <item.icon size={16} color={colors.primary} />
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;