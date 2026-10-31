// src/pages/Cart.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  ShoppingBag,
  Shield,
  Truck,
  CreditCard,
  Loader,
  ArrowLeft,
  ArrowDown,
  AlertCircle,
  CheckCircle,
  Archive,
  Zap,
  Star
} from 'lucide-react';
import { useAuth } from '../components/context/AuthContext';
import { useCart } from '../components/context/CartContext';
import axios from 'axios';

// API setup
const SERVER_URL = 'http://localhost:5000';
const API_URL = `${SERVER_URL}/api`;
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

// ---------- Colors ----------
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
  green: '#16A34A', // Flipkart jaisa green (rating / discount)
  warning: '#F59E0B',
  error: '#EF4444',
  white: '#FFFFFF'
};

const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect width='120' height='120' fill='%23F5F0E8'/%3E%3Ctext x='20' y='65' font-family='Arial' font-size='14' fill='%23D4AF37'%3ENo image%3C/text%3E%3C/svg%3E";

// ---------- Helpers ----------
const getImageUrl = (item) => {
  const first = item.images?.[0];
  const src = item.image || (typeof first === 'object' ? first?.url : first);
  if (!src || typeof src !== 'string') return PLACEHOLDER_IMG;
  return src.startsWith('http') ? src : `${SERVER_URL}/${src.replace(/^\/+/, '')}`;
};

// "Nov 5, Thu" format me delivery date
const getDeliveryDate = (daysFromNow = 5) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
  return `${month} ${d.getDate()}, ${weekday}`;
};

// Cart item ki unique key (same product ke alag sizes alag lines)
const itemKey = (item) => `${item._id}-${item.size || 'nosize'}`;

const formatINR = (n) =>
  Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

// Green stars (decimal rating ke hisaab se bharte hain)
const GreenStars = ({ rating = 0, size = 15 }) => {
  const pct = Math.min(100, Math.max(0, (rating / 5) * 100));
  const row = (color) => (
    <div style={{ display: 'flex', gap: '1px', whiteSpace: 'nowrap' }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} size={size} color={color} fill={color} style={{ flexShrink: 0 }} />
      ))}
    </div>
  );
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {row('#D1D5DB')}
      <div style={{ position: 'absolute', top: 0, left: 0, width: `${pct}%`, overflow: 'hidden' }}>
        {row(colors.green)}
      </div>
    </div>
  );
};

const Cart = () => {
  const [updatingItems, setUpdatingItems] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const {
    cartItems,
    cartCount,
    loading,
    updateQuantity,
    removeFromCart,
    fetchCart
  } = useCart();

  // Fetch cart on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  // CSS (responsive + spin)
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

      .cart-layout { display: grid; grid-template-columns: 1fr 350px; gap: 30px; align-items: start; }
      .cart-card { animation: slideIn 0.4s ease-out; }
      .cart-action:hover:not(:disabled) { background: ${colors.bgSecondary}; color: ${colors.textPrimary}; }
      .cart-qty:focus { outline: 2px solid ${colors.primary}; }
      .checkout-btn { transition: all 0.3s ease; }
      .checkout-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 25px ${colors.primary}66; }

      @media (max-width: 900px) {
        .cart-layout { grid-template-columns: 1fr; }
        .cart-summary { position: static !important; }
      }
      @media (max-width: 560px) {
        .cart-body { flex-direction: column; }
        .cart-action span { display: none; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const setBusy = (key, value) =>
    setUpdatingItems((prev) => ({ ...prev, [key]: value }));

  // ---------- Quantity ----------
  const handleUpdateQuantity = async (item, newQuantity) => {
    if (newQuantity < 1 || newQuantity === item.quantity) return;
    const key = itemKey(item);

    setBusy(key, true);
    try {
      // size teesra argument hai: CartContext me size support ho to use hoga, warna ignore
      const result = await updateQuantity(item._id, newQuantity, item.size);
      if (result && result.success === false) {
        showNotification(result.message || 'Failed to update quantity', 'error');
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      showNotification('Failed to update quantity', 'error');
    } finally {
      setBusy(key, false);
    }
  };

  // ---------- Remove ----------
  const handleRemoveItem = async (item) => {
    if (!window.confirm('Are you sure you want to remove this item?')) return;
    const key = itemKey(item);

    setBusy(key, true);
    try {
      const result = await removeFromCart(item._id, item.size);
      if (result && result.success === false) {
        showNotification('Failed to remove item', 'error');
      } else {
        showNotification('Item removed from cart', 'success');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      showNotification('Failed to remove item', 'error');
    } finally {
      setBusy(key, false);
    }
  };

  // ---------- Save for later (wishlist me daalo, cart se hatao) ----------
  const handleSaveForLater = async (item) => {
    const key = itemKey(item);
    setBusy(key, true);
    try {
      const response = await api.post('/wishlist/add', { productId: item._id });
      if (response.data.success) {
        await removeFromCart(item._id, item.size);
        showNotification('Saved for later (Wishlist me add hua)', 'success');
      } else {
        showNotification('Failed to save for later', 'error');
      }
    } catch (error) {
      console.error('Error saving for later:', error);
      showNotification(error.response?.data?.message || 'Failed to save for later', 'error');
    } finally {
      setBusy(key, false);
    }
  };

  // ---------- Buy this now ----------
  const handleBuyNow = (item) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    // Checkout page `location.state.buyNowItem` padh sakta hai (sirf ye ek item order karne ke liye)
    navigate('/checkout/address', { state: { buyNowItem: item } });
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!cartItems || cartItems.length === 0) {
      showNotification('Your cart is empty', 'warning');
      return;
    }
    navigate('/checkout/address');
  };

  // ---------- Price calculations ----------
  const calculateSubtotal = () =>
    (cartItems || []).reduce((sum, item) => sum + item.price * item.quantity, 0);

  // MRP total (originalPrice nahi hai to price hi MRP)
  const calculateMRPTotal = () =>
    (cartItems || []).reduce(
      (sum, item) => sum + Math.max(item.originalPrice || 0, item.price) * item.quantity,
      0
    );

  const calculateSavings = () => Math.max(calculateMRPTotal() - calculateSubtotal(), 0);

  const totalUnits = (cartItems || []).reduce((sum, item) => sum + item.quantity, 0);

  // ---------- Guards ----------
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bgPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ maxWidth: '400px', textAlign: 'center', background: colors.white, borderRadius: '24px', padding: '40px', border: `1px solid ${colors.border}` }}>
          <ShoppingBag size={60} color={colors.primary} style={{ marginBottom: '20px' }} />
          <h2 style={{ color: colors.textPrimary, fontSize: '1.8rem', marginBottom: '10px' }}>Please Login</h2>
          <p style={{ color: colors.textSecondary, marginBottom: '30px' }}>You need to be logged in to view your cart</p>
          <button
            onClick={() => navigate('/login')}
            style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`, color: colors.white, border: 'none', padding: '12px 30px', borderRadius: '30px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bgPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
        <Loader size={50} color={colors.primary} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: colors.textSecondary }}>Loading your cart...</p>
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bgPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ maxWidth: '500px', textAlign: 'center', background: colors.white, borderRadius: '24px', padding: '50px', border: `1px solid ${colors.border}` }}>
          <ShoppingBag size={80} color={colors.primary} style={{ marginBottom: '20px' }} />
          <h2 style={{ color: colors.textPrimary, fontSize: '2rem', marginBottom: '10px' }}>Your Cart is Empty</h2>
          <p style={{ color: colors.textSecondary, fontSize: '1.1rem', marginBottom: '30px' }}>
            Looks like you haven't added anything to your cart yet
          </p>
          <button
            onClick={() => navigate('/shop')}
            style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`, color: colors.white, border: 'none', padding: '12px 30px', borderRadius: '30px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}
          >
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  const deliveryDate = getDeliveryDate(5);

  // Action bar ka common button style
  const actionBtn = (withDivider) => ({
    flex: 1,
    padding: '14px 10px',
    background: colors.white,
    border: 'none',
    borderLeft: withDivider ? `1px solid ${colors.border}` : 'none',
    color: colors.textLight,
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'all 0.2s ease'
  });

  return (
    <div style={{ minHeight: '100vh', background: colors.bgPrimary, padding: '40px 20px', position: 'relative' }}>
      {/* Notification */}
      {notification.show && (
        <div
          style={{
            position: 'fixed',
            top: '100px',
            right: '20px',
            background:
              notification.type === 'success' ? colors.success :
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
            maxWidth: '350px'
          }}
        >
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: '800', color: colors.textPrimary, marginBottom: '8px' }}>
              Shopping Cart
            </h1>
            <span style={{ color: colors.textSecondary, fontSize: '0.95rem' }}>
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} • {cartCount ?? totalUnits} qty
            </span>
          </div>

          <button
            onClick={() => navigate('/shop')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: colors.white, border: `1px solid ${colors.border}`, borderRadius: '30px', color: colors.textPrimary, fontSize: '0.95rem', fontWeight: '500', cursor: 'pointer' }}
          >
            <ArrowLeft size={18} />
            Continue Shopping
          </button>
        </div>

        <div className="cart-layout">
          {/* ================= CART ITEMS ================= */}
          <div>
            {cartItems.map((item, index) => {
              const key = itemKey(item);
              const busy = !!updatingItems[key];

              const hasDiscount = item.originalPrice && item.originalPrice > item.price;
              const discountPct = hasDiscount
                ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
                : 0;

              const rating = Number(item.rating) || 0;
              const numReviews = Number(item.numReviews) || 0;
              const hasRating = rating > 0 && numReviews > 0;

              // Qty dropdown: max 10, ya stock jitna (jo kam ho)
              const maxQty = Math.max(
                1,
                Math.min(10, Number(item.stock ?? item.countInStock) || 10)
              );
              const qtyOptions = Array.from(
                { length: Math.max(maxQty, item.quantity) },
                (_, i) => i + 1
              );

              return (
                <div
                  key={`cart-${key}-${index}`}
                  className="cart-card"
                  style={{
                    background: colors.white,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '12px',
                    marginBottom: '16px',
                    overflow: 'hidden',
                    opacity: busy ? 0.65 : 1,
                    transition: 'opacity 0.2s ease',
                    animationDelay: `${index * 0.06}s`
                  }}
                >
                  {/* ----- Body ----- */}
                  <div className="cart-body" style={{ display: 'flex', gap: '20px', padding: '20px' }}>
                    {/* Left: image + qty */}
                    <div style={{ width: '112px', flexShrink: 0 }}>
                      <Link to={`/product/${item._id}`}>
                        <div
                          style={{
                            width: '112px',
                            height: '112px',
                            border: `1px solid ${colors.border}`,
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: colors.white,
                            overflow: 'hidden'
                          }}
                        >
                          <img
                            src={getImageUrl(item)}
                            alt={item.name}
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = PLACEHOLDER_IMG;
                            }}
                          />
                        </div>
                      </Link>

                      <select
                        className="cart-qty"
                        value={item.quantity}
                        disabled={busy}
                        onChange={(e) => handleUpdateQuantity(item, Number(e.target.value))}
                        style={{
                          marginTop: '14px',
                          width: '100%',
                          padding: '8px 10px',
                          border: `1px solid ${colors.border}`,
                          borderRadius: '4px',
                          background: colors.white,
                          color: colors.textPrimary,
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          cursor: busy ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {qtyOptions.map((q) => (
                          <option key={q} value={q}>
                            Qty: {q}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Right: details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link to={`/product/${item._id}`} style={{ textDecoration: 'none' }}>
                        <h3
                          style={{
                            color: colors.textPrimary,
                            fontSize: '1.05rem',
                            fontWeight: '500',
                            lineHeight: 1.4,
                            margin: '0 0 6px'
                          }}
                        >
                          {item.name}
                        </h3>
                      </Link>

                      {/* Size, Pack of */}
                      {(item.size || item.packOf || item.brand) && (
                        <div style={{ color: colors.textLight, fontSize: '0.85rem', marginBottom: '8px' }}>
                          {[
                            item.size ? `Size: ${item.size}` : null,
                            item.packOf ? `Pack of ${item.packOf}` : null,
                            item.brand || null
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      )}

                      {/* Rating row: ★★★★☆ 3.8 • (13,107) */}
                      {hasRating && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                          <GreenStars rating={rating} size={15} />
                          <span style={{ color: colors.green, fontWeight: '600', fontSize: '0.9rem' }}>
                            {rating.toFixed(1)}
                          </span>
                          <span style={{ color: colors.textLight }}>•</span>
                          <span style={{ color: colors.textLight, fontWeight: '600', fontSize: '0.9rem' }}>
                            ({numReviews.toLocaleString('en-IN')})
                          </span>
                        </div>
                      )}

                      {/* Price row: ↓77% ₹2,199 ₹488 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
                        {hasDiscount && (
                          <span style={{ color: colors.green, fontWeight: '700', fontSize: '1rem', display: 'inline-flex', alignItems: 'center' }}>
                            <ArrowDown size={16} strokeWidth={3} />
                            {discountPct}%
                          </span>
                        )}
                        {hasDiscount && (
                          <span style={{ color: colors.textLight, textDecoration: 'line-through', fontSize: '0.95rem', fontWeight: '500' }}>
                            ₹{formatINR(item.originalPrice)}
                          </span>
                        )}
                        <span style={{ color: colors.textPrimary, fontSize: '1.4rem', fontWeight: '700' }}>
                          ₹{formatINR(item.price)}
                        </span>
                      </div>

                      {/* Delivery */}
                      <div style={{ color: colors.textPrimary, fontSize: '0.85rem' }}>
                        Delivery by {deliveryDate}
                      </div>

                      {item.quantity > 1 && (
                        <div style={{ color: colors.textLight, fontSize: '0.8rem', marginTop: '6px' }}>
                          Item total: <strong>₹{formatINR(item.price * item.quantity)}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ----- Action bar: Save for later | Remove | Buy this now ----- */}
                  <div style={{ display: 'flex', borderTop: `1px solid ${colors.border}` }}>
                    <button
                      className="cart-action"
                      style={actionBtn(false)}
                      disabled={busy}
                      onClick={() => handleSaveForLater(item)}
                    >
                      <Archive size={18} />
                      <span>Save for later</span>
                    </button>

                    <button
                      className="cart-action"
                      style={actionBtn(true)}
                      disabled={busy}
                      onClick={() => handleRemoveItem(item)}
                    >
                      <Trash2 size={18} />
                      <span>Remove</span>
                    </button>

                    <button
                      className="cart-action"
                      style={actionBtn(true)}
                      disabled={busy}
                      onClick={() => handleBuyNow(item)}
                    >
                      <Zap size={18} />
                      <span>Buy this now</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ================= PRICE DETAILS ================= */}
          <div
            className="cart-summary"
            style={{
              background: colors.white,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '22px',
              height: 'fit-content',
              position: 'sticky',
              top: '100px'
            }}
          >
            <h2
              style={{
                fontSize: '0.95rem',
                fontWeight: '700',
                color: colors.textLight,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                paddingBottom: '14px',
                borderBottom: `1px solid ${colors.border}`,
                marginBottom: '16px'
              }}
            >
              Price Details
            </h2>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ color: colors.textPrimary }}>
                Price ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
              </span>
              <span style={{ color: colors.textPrimary }}>₹{formatINR(calculateMRPTotal())}</span>
            </div>

            {calculateSavings() > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ color: colors.textPrimary }}>Discount</span>
                <span style={{ color: colors.green }}>− ₹{formatINR(calculateSavings())}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '16px', borderBottom: `1px dashed ${colors.border}` }}>
              <span style={{ color: colors.textPrimary }}>Delivery Charges</span>
              <span style={{ color: colors.green, fontWeight: '600' }}>FREE</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ color: colors.textPrimary, fontSize: '1.1rem', fontWeight: '700' }}>Total Amount</span>
              <span style={{ fontSize: '1.3rem', fontWeight: '800', color: colors.textPrimary }}>
                ₹{formatINR(calculateSubtotal())}
              </span>
            </div>

            {calculateSavings() > 0 && (
              <div
                style={{
                  color: colors.green,
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  marginBottom: '18px',
                  paddingTop: '14px',
                  borderTop: `1px dashed ${colors.border}`
                }}
              >
                You will save ₹{formatINR(calculateSavings())} on this order
              </div>
            )}

            <button
              className="checkout-btn"
              onClick={handleCheckout}
              disabled={cartItems.length === 0}
              style={{
                width: '100%',
                padding: '15px',
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                border: 'none',
                borderRadius: '10px',
                color: colors.white,
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                marginBottom: '20px'
              }}
            >
              Place Order
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { icon: Shield, text: 'Safe and Secure Payments' },
                { icon: Truck, text: 'Free Delivery on All Orders' },
                { icon: CreditCard, text: 'Easy Returns' }
              ].map((f, i) => (
                <div key={`feature-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: colors.textSecondary, fontSize: '0.9rem' }}>
                  <f.icon size={16} color={colors.primary} />
                  {f.text}
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
