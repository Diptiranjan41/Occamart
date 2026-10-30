import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Clock, ShoppingBag, Percent, Loader, Zap, Gift, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

/* =====================================================================
   DealsSection.jsx  (ALL-IN-ONE FILE)

   Exports:
     default  -> DealsSection  (home page section, first 8 deals + View All button)
     named    -> DealsPage     (full page with ALL deals, route: /deals)

   Usage:
     import DealsSection, { DealsPage } from './components/DealsSection';
     <Route path="/deals" element={<DealsPage />} />
   ===================================================================== */

/* ---------------------------------------------------------------------
   CONFIG
--------------------------------------------------------------------- */
const API_URL = 'http://localhost:5000';
const PREVIEW_COUNT = 8; // how many deals to show on the home page

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const colors = {
  primary: '#D4AF37',
  primaryDark: '#B8962E',
  bgPrimary: '#EDE8D0',
  bgSecondary: '#F5F0E8',
  cardBg: '#F9F9F9',
  textPrimary: '#1F2937',
  textSecondary: '#4B5563',
  textLight: '#6B7280',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  white: '#FFFFFF',
};

const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#F5F0E8"/><text x="200" y="210" font-family="Arial" font-size="22" fill="#9CA3AF" text-anchor="middle">No image</text></svg>`
  );

/* ---------------------------------------------------------------------
   HELPERS
--------------------------------------------------------------------- */
const getCurrentPrice = (d) => (d.dealPrice && d.dealPrice < d.price ? d.dealPrice : d.price);

const getOriginalPrice = (d) => {
  const current = getCurrentPrice(d);
  if (d.originalPrice && d.originalPrice > current) return d.originalPrice;
  if (d.dealPrice && d.price > d.dealPrice) return d.price;
  return null;
};

const calculateDiscount = (d) => {
  if (d.discount) return Math.round(d.discount);
  const original = getOriginalPrice(d);
  const current = getCurrentPrice(d);
  if (original && current) return Math.round(((original - current) / original) * 100);
  return 0;
};

const isTrue = (v) => v === true || v === 'true';

const isDealProduct = (p) => isTrue(p.isDeal) || isTrue(p.deal) || calculateDiscount(p) > 0;

const getImageUrl = (d) => {
  const toUrl = (s) => (s.startsWith('http') || s.startsWith('data:') ? s : `${API_URL}${s}`);
  if (typeof d.image === 'string' && d.image) return toUrl(d.image);
  if (Array.isArray(d.images) && d.images.length > 0) {
    const img = d.images[0];
    if (typeof img === 'string') return toUrl(img);
    if (img && typeof img.url === 'string') return toUrl(img.url);
  }
  return FALLBACK_IMAGE;
};

const getGridColumns = (width) => (width <= 768 ? 1 : width <= 1024 ? 2 : width <= 1400 ? 3 : 4);

const maxDiscountOf = (deals) => deals.reduce((m, d) => Math.max(m, calculateDiscount(d)), 0);

/* ---------------------------------------------------------------------
   HOOKS
--------------------------------------------------------------------- */
const useWindowWidth = () => {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return w;
};

const useCountdown = () => {
  const calc = () => {
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const distance = Math.max(0, midnight - new Date());
    const pad = (n) => String(n).padStart(2, '0');
    return {
      hours: pad(Math.floor(distance / 3600000)),
      minutes: pad(Math.floor((distance % 3600000) / 60000)),
      seconds: pad(Math.floor((distance % 60000) / 1000)),
    };
  };
  const [timeLeft, setTimeLeft] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(t);
  }, []);
  return timeLeft;
};

// Fetches ALL products once and keeps every deal (no limit=8 cut-off)
const useDeals = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/products', { params: { limit: 1000 } });
      const data = res.data;
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.products)
        ? data.products
        : Array.isArray(data.data)
        ? data.data
        : [];

      const seen = new Set();
      const result = list.filter((p) => {
        const id = p._id || p.id;
        if (!id || seen.has(id) || !isDealProduct(p)) return false;
        seen.add(id);
        return true;
      });

      setDeals(result);
      setError(null);
    } catch (err) {
      console.error('Error fetching deals:', err);
      setError('Failed to load deals. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { deals, loading, error, reload: load };
};

const useDealActions = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [addingToCart, setAddingToCart] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const handleAddToCart = async (deal, e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      showNotification('Please login to add items to cart', 'warning');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    if (!(deal.countInStock > 0)) {
      showNotification('Product is out of stock', 'error');
      return;
    }
    setAddingToCart((p) => ({ ...p, [deal._id]: true }));
    try {
      await addToCart(deal._id, 1);
      showNotification(`${deal.name} added to cart!`, 'success');
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      console.error('Error adding to cart:', err);
      showNotification('Failed to add to cart', 'error');
    } finally {
      setAddingToCart((p) => ({ ...p, [deal._id]: false }));
    }
  };

  return { navigate, addingToCart, notification, handleAddToCart };
};

/* ---------------------------------------------------------------------
   SMALL UI PIECES
--------------------------------------------------------------------- */
const DealStyles = () => (
  <style>{`
    @keyframes deal-spin { to { transform: rotate(360deg); } }
    @keyframes deal-slide { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
    .deal-spinner { animation: deal-spin 1s linear infinite; }
  `}</style>
);

const Spinner = () => (
  <div
    style={{
      width: '50px',
      height: '50px',
      border: '3px solid #F5F0E8',
      borderTop: `3px solid ${colors.primary}`,
      borderRadius: '50%',
      animation: 'deal-spin 1s linear infinite',
    }}
  />
);

const RetryButton = ({ onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: '12px 30px',
      background: colors.primary,
      color: colors.white,
      border: 'none',
      borderRadius: '30px',
      fontWeight: 600,
      cursor: 'pointer',
    }}
  >
    Try Again
  </button>
);

const DealNotification = ({ notification }) => {
  if (!notification.show) return null;
  return (
    <div
      style={{
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
        animation: 'deal-slide 0.3s ease-out',
      }}
    >
      {notification.type === 'success' && <ShoppingBag size={20} color={colors.success} />}
      {notification.type === 'error' && <Percent size={20} color={colors.error} />}
      {notification.type === 'warning' && <Clock size={20} color={colors.warning} />}
      <span style={{ color: colors.textPrimary }}>{notification.message}</span>
    </div>
  );
};

const CountdownBanner = ({ timeLeft, isMobile }) => {
  const value = { fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 700, color: colors.primary };
  const label = {
    fontSize: isMobile ? '0.7rem' : '0.8rem',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  };
  const sep = { color: colors.primary, fontSize: '1.5rem', fontWeight: 300 };
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isMobile ? '15px' : '20px',
        padding: isMobile ? '12px' : '15px',
        background: colors.white,
        borderRadius: '50px',
        border: `1px solid ${colors.border}`,
        maxWidth: '400px',
        margin: '20px auto 0',
      }}
    >
      {[
        ['hours', 'Hours'],
        ['minutes', 'Mins'],
        ['seconds', 'Secs'],
      ].map(([key, text], i) => (
        <React.Fragment key={key}>
          {i > 0 && <div style={sep}>:</div>}
          <div style={{ textAlign: 'center' }}>
            <div style={value}>{timeLeft[key]}</div>
            <div style={label}>{text}</div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

/* ---------------------------------------------------------------------
   DEAL CARD
--------------------------------------------------------------------- */
const DealCard = ({ deal, timeLeft, isMobile, isAdding, onAddToCart, onOpen }) => {
  const [hovered, setHovered] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  const discount = calculateDiscount(deal);
  const current = getCurrentPrice(deal);
  const original = getOriginalPrice(deal);
  const sold = deal.sold || 0;
  const left = deal.countInStock || 0;
  const total = deal.total || sold + left;
  const progress = total > 0 ? Math.min(100, (sold / total) * 100) : 0;
  const outOfStock = left <= 0;

  return (
    <div
      onClick={() => onOpen(deal._id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: colors.cardBg,
        borderRadius: isMobile ? '16px' : '20px',
        padding: isMobile ? '15px' : '20px',
        border: `1px solid ${hovered ? colors.primary : colors.border}`,
        transform: hovered ? 'translateY(-8px)' : 'none',
        boxShadow: hovered ? `0 20px 30px ${colors.primary}30` : 'none',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      }}
    >
      {deal.category && (
        <span
          style={{
            position: 'absolute',
            top: '15px',
            left: '15px',
            background: colors.bgSecondary,
            color: colors.textPrimary,
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '0.7rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            border: `1px solid ${colors.border}`,
            zIndex: 2,
          }}
        >
          {deal.category}
        </span>
      )}

      {discount > 0 && (
        <span
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: colors.primary,
            color: colors.textPrimary,
            padding: '8px 12px',
            borderRadius: '30px',
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: 700,
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: `0 4px 12px ${colors.primary}60`,
          }}
        >
          <Percent size={14} /> {discount}% OFF
        </span>
      )}

      {/* Full image visible (contain, not cropped) */}
      <div
        style={{
          width: '100%',
          aspectRatio: '1 / 1',
          marginBottom: '15px',
          borderRadius: '12px',
          overflow: 'hidden',
          background: colors.white,
          boxShadow: '0 4px 8px rgba(0,0,0,0.08)',
        }}
      >
        <img
          src={getImageUrl(deal)}
          alt={deal.name}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            padding: '8px',
            boxSizing: 'border-box',
            display: 'block',
          }}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = FALLBACK_IMAGE;
          }}
        />
      </div>

      <h3
        style={{
          fontSize: isMobile ? '1rem' : '1.1rem',
          fontWeight: 600,
          margin: '0 0 8px',
          color: colors.textPrimary,
          lineHeight: 1.4,
          minHeight: '3em',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {deal.name}
      </h3>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: isMobile ? '1.3rem' : '1.5rem', fontWeight: 700, color: colors.primary }}>
          ₹{current?.toLocaleString('en-IN')}
        </span>
        {original && (
          <span style={{ color: colors.textLight, textDecoration: 'line-through' }}>
            ₹{original.toLocaleString('en-IN')}
          </span>
        )}
        {discount > 0 && (
          <span
            style={{
              background: colors.bgSecondary,
              color: colors.primary,
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            -{discount}%
          </span>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: colors.textSecondary,
          fontSize: '0.9rem',
          marginBottom: '12px',
          padding: '8px 12px',
          background: colors.bgSecondary,
          borderRadius: '8px',
          border: `1px solid ${colors.border}`,
        }}
      >
        <Clock size={16} color={colors.primary} />
        <span>
          Ends in: {timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}
        </span>
      </div>

      <div style={{ marginBottom: '15px', marginTop: 'auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '5px',
            fontSize: '0.8rem',
            color: colors.textSecondary,
          }}
        >
          <span>🔥 {sold} sold</span>
          <span>{outOfStock ? 'Out of stock' : `Only ${left} left`}</span>
        </div>
        <div style={{ width: '100%', height: '6px', background: colors.border, borderRadius: '3px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: colors.primary,
              borderRadius: '3px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      <button
        onClick={(e) => onAddToCart(deal, e)}
        onMouseEnter={() => setBtnHover(true)}
        onMouseLeave={() => setBtnHover(false)}
        disabled={isAdding || outOfStock}
        style={{
          width: '100%',
          padding: '12px',
          background: btnHover && !outOfStock ? colors.primary : 'transparent',
          color: btnHover && !outOfStock ? colors.textPrimary : colors.primary,
          border: `2px solid ${colors.primary}`,
          borderRadius: '10px',
          fontWeight: 600,
          cursor: isAdding || outOfStock ? 'not-allowed' : 'pointer',
          opacity: outOfStock ? 0.5 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.3s ease',
          fontSize: '1rem',
        }}
      >
        {isAdding ? (
          <>
            <Loader size={14} className="deal-spinner" /> Adding...
          </>
        ) : outOfStock ? (
          'Out of Stock'
        ) : (
          <>
            <ShoppingBag size={16} /> Grab Deal
          </>
        )}
      </button>
    </div>
  );
};

/* =====================================================================
   1) HOME PAGE SECTION  (default export)
===================================================================== */
const DealsSection = () => {
  const width = useWindowWidth();
  const timeLeft = useCountdown();
  const { deals, loading, error, reload } = useDeals();
  const { navigate, addingToCart, notification, handleAddToCart } = useDealActions();

  const isMobile = width <= 768;
  const isTablet = width > 768 && width <= 1024;
  const columns = getGridColumns(width);
  const preview = deals.slice(0, isMobile ? 4 : PREVIEW_COUNT);
  const maxDiscount = maxDiscountOf(deals);

  const section = {
    padding: isMobile ? '40px 15px' : isTablet ? '50px 20px' : '60px 20px',
    background: colors.bgPrimary,
    position: 'relative',
    overflow: 'hidden',
  };

  if (loading) {
    return (
      <section style={section}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px', gap: '20px' }}>
          <Spinner />
          <p style={{ color: colors.textSecondary }}>Loading amazing deals...</p>
        </div>
        <DealStyles />
      </section>
    );
  }

  if (error) {
    return (
      <section style={section}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: colors.error, marginBottom: '16px' }}>{error}</p>
          <RetryButton onClick={reload} />
        </div>
      </section>
    );
  }

  if (deals.length === 0) return null; // no deals -> hide the section

  return (
    <section style={section}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 30% 50%, ${colors.primary}15 0%, transparent 50%)`,
          pointerEvents: 'none',
        }}
      />
      <DealNotification notification={notification} />

      <div style={{ maxWidth: width > 1400 ? '1400px' : '1200px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '30px' : '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '15px' }}>
            <Zap size={isMobile ? 28 : 32} color={colors.primary} />
            <span style={{ color: colors.primary, fontWeight: 600, fontSize: '1.2rem' }}>FLASH DEALS</span>
          </div>
          <h2
            style={{
              fontSize: isMobile ? '1.8rem' : isTablet ? '2.2rem' : '3rem',
              fontWeight: 800,
              margin: '0 0 10px',
              color: colors.textPrimary,
            }}
          >
            Limited Time <span style={{ color: colors.primary }}>Offers</span>
          </h2>
          <p style={{ color: colors.textSecondary, fontSize: isMobile ? '0.95rem' : '1.1rem', margin: '0 auto' }}>
            Grab these amazing deals before they're gone!
            {maxDiscount > 0 && ` Up to ${maxDiscount}% OFF`}
          </p>
          <CountdownBanner timeLeft={timeLeft} isMobile={isMobile} />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gap: isMobile ? '15px' : '20px',
            marginTop: '30px',
          }}
        >
          {preview.map((deal) => (
            <DealCard
              key={deal._id}
              deal={deal}
              timeLeft={timeLeft}
              isMobile={isMobile}
              isAdding={addingToCart[deal._id]}
              onAddToCart={handleAddToCart}
              onOpen={(id) => navigate(`/product/${id}`)}
            />
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
          <button
            onClick={() => {
              navigate('/deals');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            style={{
              background: colors.primary,
              color: colors.textPrimary,
              border: `2px solid ${colors.primary}`,
              padding: isMobile ? '12px 30px' : '14px 40px',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            View All Deals ({deals.length}) <Gift size={18} />
          </button>
        </div>
      </div>

      <DealStyles />
    </section>
  );
};

/* =====================================================================
   2) FULL DEALS PAGE  (named export, route: /deals)
===================================================================== */
export const DealsPage = () => {
  const width = useWindowWidth();
  const timeLeft = useCountdown();
  const { deals, loading, error, reload } = useDeals();
  const { navigate, addingToCart, notification, handleAddToCart } = useDealActions();
  const [sortBy, setSortBy] = useState('discount');

  const isMobile = width <= 768;
  const columns = getGridColumns(width);

  const sorted = useMemo(() => {
    const list = [...deals];
    if (sortBy === 'discount') list.sort((a, b) => calculateDiscount(b) - calculateDiscount(a));
    if (sortBy === 'price-low') list.sort((a, b) => getCurrentPrice(a) - getCurrentPrice(b));
    if (sortBy === 'price-high') list.sort((a, b) => getCurrentPrice(b) - getCurrentPrice(a));
    return list;
  }, [deals, sortBy]);

  return (
    <section
      style={{
        minHeight: '100vh',
        padding: isMobile ? '30px 15px' : '50px 20px',
        background: colors.bgPrimary,
      }}
    >
      <DealNotification notification={notification} />

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: colors.white,
            border: `1px solid ${colors.border}`,
            borderRadius: '30px',
            padding: '8px 16px',
            color: colors.textPrimary,
            cursor: 'pointer',
            marginBottom: '20px',
          }}
        >
          <ChevronLeft size={16} /> Back
        </button>

        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <Zap size={28} color={colors.primary} />
            <span style={{ color: colors.primary, fontWeight: 600, fontSize: '1.2rem' }}>ALL FLASH DEALS</span>
          </div>
          <h1
            style={{
              fontSize: isMobile ? '1.8rem' : '2.8rem',
              fontWeight: 800,
              color: colors.textPrimary,
              margin: '10px 0',
            }}
          >
            Limited Time <span style={{ color: colors.primary }}>Offers</span>
          </h1>
          <CountdownBanner timeLeft={timeLeft} isMobile={isMobile} />
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px', gap: '16px' }}>
            <Spinner />
            <span style={{ color: colors.textSecondary }}>Loading deals...</span>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ color: colors.error, marginBottom: '16px' }}>{error}</p>
            <RetryButton onClick={reload} />
          </div>
        ) : deals.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px',
              background: colors.white,
              borderRadius: '24px',
              border: `1px solid ${colors.border}`,
              maxWidth: '500px',
              margin: '0 auto',
            }}
          >
            <h3 style={{ color: colors.textPrimary }}>No deals right now</h3>
            <p style={{ color: colors.textSecondary }}>Check back later for new offers.</p>
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                padding: '14px 22px',
                marginBottom: '30px',
                background: colors.white,
                borderRadius: '16px',
                border: `1px solid ${colors.border}`,
              }}
            >
              <span style={{ color: colors.textSecondary }}>
                {deals.length} deals · up to {maxDiscountOf(deals)}% OFF
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '10px 20px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '30px',
                  background: colors.bgSecondary,
                  color: colors.textPrimary,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="discount">Biggest discount</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gap: isMobile ? '15px' : '20px',
              }}
            >
              {sorted.map((deal) => (
                <DealCard
                  key={deal._id}
                  deal={deal}
                  timeLeft={timeLeft}
                  isMobile={isMobile}
                  isAdding={addingToCart[deal._id]}
                  onAddToCart={handleAddToCart}
                  onOpen={(id) => navigate(`/product/${id}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <DealStyles />
    </section>
  );
};

export default DealsSection;
