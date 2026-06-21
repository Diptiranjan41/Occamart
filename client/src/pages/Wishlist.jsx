// src/pages/Wishlist.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  ShoppingBag,
  Trash2,
  ShoppingCart,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Loader,
  Star,
  Eye
} from 'lucide-react';
import { useAuth } from '../components/context/AuthContext';
import { useWishlist } from '../components/context/WishlistContext';
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

const Wishlist = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { 
    wishlistItems, 
    wishlistCount, 
    loading, 
    fetchWishlist, 
    removeFromWishlist,
    isInWishlist 
  } = useWishlist();
  const { addToCart } = useCart();

  const [addingToCart, setAddingToCart] = useState({});
  const [removingItems, setRemovingItems] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

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
    warning: '#F59E0B',
    white: '#FFFFFF',
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    }
  }, [isAuthenticated, fetchWishlist]);

  const handleAddToCart = async (product, e) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      showNotification('Please login to add items to cart', 'warning');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    setAddingToCart(prev => ({ ...prev, [product._id]: true }));

    try {
      await addToCart(product._id, 1);
      showNotification(`${product.name} added to cart!`, 'success');
    } catch (err) {
      console.error('Error adding to cart:', err);
      showNotification('Failed to add to cart', 'error');
    } finally {
      setAddingToCart(prev => ({ ...prev, [product._id]: false }));
    }
  };

  const handleRemoveFromWishlist = async (productId, productName) => {
    if (!window.confirm(`Remove ${productName} from wishlist?`)) {
      return;
    }

    setRemovingItems(prev => ({ ...prev, [productId]: true }));

    try {
      const result = await removeFromWishlist(productId);
      if (result && result.success) {
        showNotification('Removed from wishlist', 'success');
      } else {
        showNotification('Failed to remove item', 'error');
      }
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      showNotification('Failed to remove item', 'error');
    } finally {
      setRemovingItems(prev => ({ ...prev, [productId]: false }));
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const getImageUrl = (item) => {
    if (item.image) {
      return item.image.startsWith('http') ? item.image : `http://localhost:5000${item.image}`;
    }
    return 'https://via.placeholder.com/300x300?text=No+Image';
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
          <Heart size={60} color={colors.primary} style={{ marginBottom: '20px' }} />
          <h2 style={{ color: colors.textPrimary, fontSize: '1.8rem', marginBottom: '10px' }}>
            Please Login
          </h2>
          <p style={{ color: colors.textSecondary, marginBottom: '30px' }}>
            You need to be logged in to view your wishlist
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
        <p style={{ color: colors.textSecondary }}>Loading your wishlist...</p>
      </div>
    );
  }

  if (!wishlistItems || wishlistItems.length === 0) {
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
          <Heart size={80} color={colors.primary} style={{ marginBottom: '20px' }} />
          <h2 style={{ color: colors.textPrimary, fontSize: '2rem', marginBottom: '10px' }}>
            Your Wishlist is Empty
          </h2>
          <p style={{ color: colors.textSecondary, fontSize: '1.1rem', marginBottom: '30px' }}>
            Save your favorite items here!
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
        }}>
          {notification.type === 'success' && <CheckCircle size={20} />}
          {notification.type === 'error' && <AlertCircle size={20} />}
          {notification.type === 'warning' && <AlertCircle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          flexWrap: 'wrap',
          gap: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              onClick={() => navigate(-1)}
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
              Back
            </button>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: colors.textPrimary,
              margin: 0,
            }}>
              My Wishlist
            </h1>
          </div>
          
          <div style={{
            background: colors.primary,
            padding: '8px 16px',
            borderRadius: '30px',
            color: colors.white,
            fontSize: '1rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Heart size={18} />
            {wishlistCount} {wishlistCount === 1 ? 'Item' : 'Items'}
          </div>
        </div>

        {/* Wishlist Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '25px',
        }}>
          {wishlistItems.map((product, index) => (
            <div
              key={`wishlist-${product._id}-${index}`}
              style={{
                background: colors.white,
                borderRadius: '16px',
                overflow: 'hidden',
                border: `1px solid ${colors.border}`,
                transition: 'all 0.3s ease',
                position: 'relative',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = `0 10px 25px ${colors.primary}20`;
                e.currentTarget.style.borderColor = colors.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = colors.border;
              }}
              onClick={() => navigate(`/product/${product._id}`)}
            >
              {/* Remove Button */}
              <button
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  width: '36px',
                  height: '36px',
                  background: colors.white,
                  border: `1px solid ${colors.error}`,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 2,
                  transition: 'all 0.3s ease',
                  opacity: removingItems[product._id] ? 0.6 : 1,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFromWishlist(product._id, product.name);
                }}
                disabled={removingItems[product._id]}
              >
                {removingItems[product._id] ? (
                  <Loader size={16} color={colors.error} />
                ) : (
                  <Trash2 size={16} color={colors.error} />
                )}
              </button>

              {/* Product Image */}
              <div style={{
                height: '200px',
                overflow: 'hidden',
                position: 'relative',
              }}>
                <img
                  src={getImageUrl(product)}
                  alt={product.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease',
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
                  }}
                />
              </div>

              {/* Product Info */}
              <div style={{ padding: '16px' }}>
                <div style={{
                  color: colors.primary,
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                }}>
                  {product.brand || 'Premium Brand'}
                </div>
                
                <h3 style={{
                  color: colors.textPrimary,
                  fontSize: '1rem',
                  fontWeight: '600',
                  marginBottom: '8px',
                  lineHeight: '1.4',
                  height: '2.8em',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {product.name}
                </h3>

                {/* Rating */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                }}>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        color={i < Math.floor(product.rating || 4) ? colors.primary : colors.border}
                        fill={i < Math.floor(product.rating || 4) ? colors.primary : 'none'}
                      />
                    ))}
                  </div>
                  <span style={{ color: colors.textLight, fontSize: '0.7rem' }}>
                    ({product.numReviews || 0})
                  </span>
                </div>

                {/* Price and Add to Cart */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <span style={{
                    fontSize: '1.2rem',
                    fontWeight: '700',
                    color: colors.primary,
                  }}>
                    ₹{product.price}
                  </span>
                  
                  <button
                    style={{
                      padding: '8px 16px',
                      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                      border: 'none',
                      borderRadius: '8px',
                      color: colors.white,
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.3s ease',
                      opacity: addingToCart[product._id] ? 0.7 : 1,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product, e);
                    }}
                    disabled={addingToCart[product._id]}
                  >
                    {addingToCart[product._id] ? (
                      <Loader size={14} />
                    ) : (
                      <ShoppingCart size={14} />
                    )}
                    {addingToCart[product._id] ? 'Adding...' : 'Add to Cart'}
                  </button>
                </div>

                {/* Quick View */}
                <button
                  style={{
                    width: '100%',
                    marginTop: '10px',
                    padding: '8px',
                    background: 'transparent',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    color: colors.textSecondary,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.3s ease',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/product/${product._id}`);
                  }}
                >
                  <Eye size={14} />
                  Quick View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Wishlist;