// src/pages/OrderHistory.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { orderAPI } from '../api/api';
import {
  Package,
  Calendar,
  IndianRupee,
  ChevronRight,
  AlertCircle,
  ShoppingBag,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  Loader,
  Star,
  RotateCcw,
  RefreshCw,
  MessageCircle,
  X,
  MapPin,
  CreditCard,
  Eye,
  Check,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProductReviewModal from '../components/ProductReviewModal';
import ReturnRequestModal from '../components/ReturnRequestModal';
import { useAuth } from '../components/context/AuthContext';
import { useCart } from '../components/context/CartContext';

const API_URL = 'http://localhost:5000/api';
const SERVER_URL = 'http://localhost:5000';

/* =====================================================================
   THEME + CONSTANTS
===================================================================== */
const colors = {
  bgPrimary: '#FAF7F2',
  bgSecondary: '#F5F0E8',
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
  pink: '#EC4899',
  white: '#FFFFFF',
};

const STATUS_META = {
  pending: { text: 'Pending', icon: Clock, color: colors.warning, step: 0 },
  processing: { text: 'Processing', icon: Clock, color: colors.warning, step: 1 },
  shipped: { text: 'Shipped', icon: Package, color: colors.info, step: 2 },
  'out-for-delivery': { text: 'Out for Delivery', icon: Truck, color: colors.pink, step: 3 },
  delivered: { text: 'Delivered', icon: CheckCircle, color: colors.success, step: 4 },
  cancelled: { text: 'Cancelled', icon: XCircle, color: colors.error, step: -1 },
};

const STEPS = ['Placed', 'Processing', 'Shipped', 'Out for delivery', 'Delivered'];

const ACTIVE_KEYS = ['pending', 'processing', 'shipped', 'out-for-delivery'];

const RETURN_WINDOW_DAYS = 7;

/* =====================================================================
   HELPERS
===================================================================== */
const getStatusKey = (order) => {
  const raw = String(order.status || '').toLowerCase().trim().replace(/[\s_]+/g, '-');
  if (raw === 'cancelled' || raw === 'canceled') return 'cancelled';
  if (raw === 'delivered' || order.isDelivered) return 'delivered';
  return STATUS_META[raw] ? raw : 'pending';
};

const getProductId = (item) => item?.product?._id || item?.product || item?.productId || null;

const toImageUrl = (src) => {
  if (!src || typeof src !== 'string') return '';
  return src.startsWith('http') || src.startsWith('data:') ? src : `${SERVER_URL}${src}`;
};

const getProductImage = (product) => {
  if (!product) return '';
  if (product.image) return toImageUrl(product.image);
  if (Array.isArray(product.images) && product.images.length > 0) {
    const img = product.images[0];
    return toImageUrl(typeof img === 'string' ? img : img?.url);
  }
  return '';
};

const formatDate = (d) => {
  try {
    return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

const formatTime = (d) => {
  try {
    return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const formatMoney = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Product details cache (one request per product, shared by all cards)
const productCache = new Map();
const loadProduct = (id) => {
  if (!id) return Promise.resolve(null);
  if (!productCache.has(id)) {
    productCache.set(
      id,
      axios
        .get(`${API_URL}/products/${id}`)
        .then((res) => {
          const d = res.data;
          return d?.product || d?.data || d;
        })
        .catch(() => null)
    );
  }
  return productCache.get(id);
};

const useProduct = (id) => {
  const [product, setProduct] = useState(null);
  useEffect(() => {
    let alive = true;
    if (id) loadProduct(id).then((p) => alive && setProduct(p));
    return () => {
      alive = false;
    };
  }, [id]);
  return product;
};

/* =====================================================================
   STYLES
===================================================================== */
const css = `
  @keyframes oh-spin { to { transform: rotate(360deg); } }
  @keyframes oh-slide { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes oh-toast { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }

  .oh-spin { animation: oh-spin 1s linear infinite; }

  .oh-card {
    background: ${colors.white};
    border: 1px solid ${colors.border};
    border-radius: 20px;
    overflow: hidden;
    animation: oh-slide 0.4s ease-out both;
    transition: box-shadow 0.3s ease, border-color 0.3s ease;
  }
  .oh-card:hover { box-shadow: 0 10px 30px rgba(212,175,55,0.15); border-color: ${colors.primaryLight}; }

  .oh-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 12px; border-radius: 30px;
    font-size: 0.82rem; font-weight: 600; border: 1px solid transparent;
  }

  /* stepper */
  .oh-stepper { display: flex; margin: 4px 0 22px; }
  .oh-step { flex: 1; position: relative; display: flex; flex-direction: column; align-items: center; text-align: center; }
  .oh-step-dot {
    width: 20px; height: 20px; border-radius: 50%;
    background: ${colors.white}; border: 2px solid ${colors.border};
    display: flex; align-items: center; justify-content: center;
    color: ${colors.white}; z-index: 2;
  }
  .oh-step.done .oh-step-dot { background: ${colors.primary}; border-color: ${colors.primary}; }
  .oh-step.current .oh-step-dot { box-shadow: 0 0 0 4px ${colors.primary}30; }
  .oh-step-line { position: absolute; top: 9px; left: 50%; width: 100%; height: 2px; background: ${colors.border}; z-index: 1; }
  .oh-step-line.done { background: ${colors.primary}; }
  .oh-step-label { margin-top: 8px; font-size: 0.75rem; color: ${colors.textLight}; }
  .oh-step.done .oh-step-label { color: ${colors.textPrimary}; font-weight: 600; }
  .oh-cancelled-bar {
    display: flex; align-items: center; gap: 8px;
    background: ${colors.error}10; color: ${colors.error};
    border: 1px solid ${colors.error}30; border-radius: 12px;
    padding: 10px 14px; margin-bottom: 20px; font-size: 0.9rem; font-weight: 600;
  }

  /* items */
  .oh-item {
    display: grid; grid-template-columns: 72px 1fr auto; gap: 14px; align-items: start;
    background: ${colors.bgSecondary}; border: 1px solid ${colors.border};
    border-radius: 14px; padding: 12px;
  }
  .oh-thumb {
    width: 72px; height: 72px; border-radius: 10px; background: ${colors.white};
    border: 1px solid ${colors.border}; overflow: hidden;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .oh-thumb img { width: 100%; height: 100%; object-fit: contain; display: block; }
  .oh-item-name { font-weight: 600; color: ${colors.textPrimary}; font-size: 0.98rem; margin-bottom: 4px; }
  .oh-item-meta { color: ${colors.textLight}; font-size: 0.85rem; }
  .oh-item-price { text-align: right; font-weight: 700; color: ${colors.primary}; white-space: nowrap; }
  .oh-item-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }

  /* review */
  .oh-review-box {
    margin-top: 10px; background: ${colors.white}; border: 1px solid ${colors.success}40;
    border-left: 4px solid ${colors.success}; border-radius: 10px; padding: 10px 12px;
  }
  .oh-review-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 0.8rem; color: ${colors.success}; font-weight: 600; }
  .oh-review-date { color: ${colors.textLight}; font-weight: 400; margin-left: auto; }
  .oh-review-title { font-weight: 600; color: ${colors.textPrimary}; font-size: 0.9rem; margin-top: 6px; }
  .oh-review-text { color: ${colors.textSecondary}; font-size: 0.88rem; margin: 4px 0 0; line-height: 1.5; word-break: break-word; }

  /* buttons */
  .oh-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    background: transparent; border: 2px solid ${colors.primary}; color: ${colors.primary};
    padding: 7px 16px; border-radius: 30px; font-size: 0.85rem; font-weight: 600;
    cursor: pointer; transition: all 0.25s ease; text-decoration: none; font-family: inherit;
  }
  .oh-btn:hover:not(:disabled) { background: ${colors.primary}; color: ${colors.white}; }
  .oh-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .oh-btn.info { border-color: ${colors.info}; color: ${colors.info}; }
  .oh-btn.info:hover:not(:disabled) { background: ${colors.info}; color: ${colors.white}; }
  .oh-btn.solid { background: linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark}); color: ${colors.white}; border-color: ${colors.primary}; }
  .oh-btn.solid:hover:not(:disabled) { filter: brightness(1.05); }
  .oh-btn.lg { padding: 10px 22px; font-size: 0.95rem; }

  .oh-return-badge {
    display: inline-flex; align-items: center; gap: 4px; margin-top: 8px;
    padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;
  }

  /* tabs */
  .oh-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; }
  .oh-tab {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 9px 18px; border-radius: 30px; border: 1px solid ${colors.border};
    background: ${colors.white}; color: ${colors.textSecondary};
    font-size: 0.9rem; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.25s ease;
  }
  .oh-tab:hover { border-color: ${colors.primary}; color: ${colors.primary}; }
  .oh-tab.active { background: linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark}); color: ${colors.white}; border-color: ${colors.primary}; }
  .oh-tab-count { background: ${colors.bgSecondary}; color: ${colors.textSecondary}; border-radius: 20px; padding: 1px 8px; font-size: 0.75rem; }
  .oh-tab.active .oh-tab-count { background: ${colors.white}; color: ${colors.primary}; }

  /* modal */
  .oh-overlay {
    position: fixed; inset: 0; background: rgba(17,24,39,0.5); z-index: 1000;
    display: flex; align-items: center; justify-content: center; padding: 20px;
    animation: oh-toast 0.2s ease-out;
  }
  .oh-modal {
    background: ${colors.bgPrimary}; width: 100%; max-width: 780px; max-height: 92vh;
    overflow-y: auto; border-radius: 24px; border: 1px solid ${colors.border};
    box-shadow: 0 30px 60px rgba(0,0,0,0.25);
  }
  .oh-modal-head {
    position: sticky; top: 0; z-index: 3; background: ${colors.bgPrimary};
    display: flex; justify-content: space-between; align-items: center; gap: 12px;
    padding: 20px 24px; border-bottom: 1px solid ${colors.border};
  }
  .oh-modal-body { padding: 24px; display: flex; flex-direction: column; gap: 22px; }
  .oh-panel { background: ${colors.white}; border: 1px solid ${colors.border}; border-radius: 16px; padding: 18px; }
  .oh-panel h4 { margin: 0 0 12px; font-size: 1rem; color: ${colors.textPrimary}; display: flex; align-items: center; gap: 8px; }
  .oh-close {
    width: 38px; height: 38px; border-radius: 50%; border: 1px solid ${colors.border};
    background: ${colors.white}; cursor: pointer; display: flex; align-items: center; justify-content: center;
  }
  .oh-close:hover { border-color: ${colors.primary}; color: ${colors.primary}; }
  .oh-detail-item { display: grid; grid-template-columns: 90px 1fr auto; gap: 16px; padding: 14px 0; border-bottom: 1px solid ${colors.bgSecondary}; }
  .oh-detail-item:last-child { border-bottom: none; padding-bottom: 0; }
  .oh-detail-item:first-of-type { padding-top: 0; }
  .oh-detail-thumb { width: 90px; height: 90px; }
  .oh-desc { color: ${colors.textSecondary}; font-size: 0.85rem; line-height: 1.5; margin: 6px 0 0;
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  .oh-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.92rem; color: ${colors.textSecondary}; }
  .oh-row.total { border-top: 1px dashed ${colors.border}; margin-top: 6px; padding-top: 12px; font-weight: 700; font-size: 1.05rem; color: ${colors.textPrimary}; }
  .oh-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

  /* toast */
  .oh-toast {
    position: fixed; top: 100px; right: 20px; z-index: 9999; color: ${colors.white};
    padding: 14px 22px; border-radius: 12px; display: flex; align-items: center; gap: 10px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.18); animation: oh-toast 0.3s ease-out; max-width: 90vw;
  }

  @media (max-width: 768px) {
    .oh-item { grid-template-columns: 60px 1fr; }
    .oh-item-price { grid-column: 2; text-align: left; }
    .oh-thumb { width: 60px; height: 60px; }
    .oh-step-label { font-size: 0.65rem; }
    .oh-two-col { grid-template-columns: 1fr; }
    .oh-detail-item { grid-template-columns: 70px 1fr; }
    .oh-detail-item .oh-item-price { grid-column: 2; text-align: left; }
    .oh-detail-thumb { width: 70px; height: 70px; }
    .oh-modal-body { padding: 16px; }
  }
`;

/* =====================================================================
   SMALL COMPONENTS
===================================================================== */
const StatusBadge = ({ statusKey }) => {
  const meta = STATUS_META[statusKey];
  const Icon = meta.icon;
  return (
    <span
      className="oh-badge"
      style={{ background: `${meta.color}15`, color: meta.color, borderColor: `${meta.color}30` }}
    >
      <Icon size={14} /> {meta.text}
    </span>
  );
};

const OrderStepper = ({ statusKey }) => {
  if (statusKey === 'cancelled') {
    return (
      <div className="oh-cancelled-bar">
        <XCircle size={16} /> This order was cancelled
      </div>
    );
  }
  const current = STATUS_META[statusKey].step;
  return (
    <div className="oh-stepper">
      {STEPS.map((label, i) => (
        <div key={label} className={`oh-step ${i <= current ? 'done' : ''} ${i === current ? 'current' : ''}`}>
          <div className="oh-step-dot">{i <= current && <Check size={11} strokeWidth={3} />}</div>
          {i < STEPS.length - 1 && <div className={`oh-step-line ${i < current ? 'done' : ''}`} />}
          <span className="oh-step-label">{label}</span>
        </div>
      ))}
    </div>
  );
};

const StarRow = ({ rating = 0, size = 14 }) => (
  <span style={{ display: 'inline-flex', gap: '2px' }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        size={size}
        color={i <= Math.round(rating) ? colors.primary : colors.border}
        fill={i <= Math.round(rating) ? colors.primary : 'none'}
      />
    ))}
  </span>
);

const ItemThumb = ({ item, className = 'oh-thumb' }) => {
  const hasOwn = !!item.image;
  const product = useProduct(hasOwn ? null : getProductId(item));
  const src = hasOwn ? toImageUrl(item.image) : getProductImage(product);
  const [failed, setFailed] = useState(false);

  return (
    <div className={className}>
      {src && !failed ? (
        <img src={src} alt={item.name} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <Package size={26} color={colors.primary} />
      )}
    </div>
  );
};

const ReviewBox = ({ review }) => {
  const text = review.comment || review.text || review.review || '';
  return (
    <div className="oh-review-box">
      <div className="oh-review-head">
        <CheckCircle size={14} /> Your review
        <StarRow rating={review.rating} />
        {review.createdAt && <span className="oh-review-date">{formatDate(review.createdAt)}</span>}
      </div>
      {review.title && <div className="oh-review-title">{review.title}</div>}
      {text && <p className="oh-review-text">{text}</p>}
    </div>
  );
};

const returnColor = (status) =>
  status === 'approved' ? colors.success : status === 'rejected' ? colors.error : colors.warning;

/* One product row inside an order card */
const OrderItemRow = ({ item, review, returnStatus, isDelivered, returnEligible, onReview, onReturn }) => (
  <div className="oh-item">
    <ItemThumb item={item} />

    <div style={{ minWidth: 0 }}>
      <div className="oh-item-name">{item.name}</div>
      <div className="oh-item-meta">
        Qty: {item.qty} × {formatMoney(item.price)}
      </div>

      {returnStatus && (
        <div
          className="oh-return-badge"
          style={{
            background: `${returnColor(returnStatus.status)}15`,
            color: returnColor(returnStatus.status),
            border: `1px solid ${returnColor(returnStatus.status)}30`,
          }}
        >
          <RefreshCw size={12} /> Return {returnStatus.status}
          {returnStatus.requestDate && <span>• {formatDate(returnStatus.requestDate)}</span>}
        </div>
      )}

      {/* Real review saved in backend */}
      {review && <ReviewBox review={review} />}

      {/* After delivery: review option (+ return option) */}
      {isDelivered && (
        <div className="oh-item-actions">
          {!review && (
            <button className="oh-btn" onClick={onReview}>
              <Star size={14} /> Write a Review
            </button>
          )}
          {!returnStatus && returnEligible && (
            <button className="oh-btn info" onClick={onReturn}>
              <RotateCcw size={14} /> Return
            </button>
          )}
        </div>
      )}
    </div>

    <div className="oh-item-price">{formatMoney((item.price || 0) * (item.qty || 1))}</div>
  </div>
);

/* Product row inside the details modal (loads full product details) */
const DetailItem = ({ item, review }) => {
  const productId = getProductId(item);
  const product = useProduct(productId);

  return (
    <div className="oh-detail-item">
      <ItemThumb item={item} className="oh-thumb oh-detail-thumb" />
      <div style={{ minWidth: 0 }}>
        <div className="oh-item-name">{product?.name || item.name}</div>
        <div className="oh-item-meta" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {product?.brand && <span>Brand: {product.brand}</span>}
          {product?.category && <span>Category: {product.category}</span>}
          <span>Qty: {item.qty}</span>
          <span>Unit: {formatMoney(item.price)}</span>
        </div>
        {product?.description && <p className="oh-desc">{product.description}</p>}
        {review && <ReviewBox review={review} />}
        {productId && (
          <Link to={`/product/${productId}`} className="oh-btn" style={{ marginTop: '10px' }}>
            <Eye size={14} /> View Product
          </Link>
        )}
      </div>
      <div className="oh-item-price">{formatMoney((item.price || 0) * (item.qty || 1))}</div>
    </div>
  );
};

/* =====================================================================
   ORDER DETAILS MODAL
===================================================================== */
const OrderDetailsModal = ({ order, reviews, reordering, onClose, onReorder, onHelp }) => {
  const statusKey = getStatusKey(order);
  const addr = order.shippingAddress || {};
  const addressLine = [addr.address, addr.city, addr.state, addr.postalCode, addr.country]
    .filter(Boolean)
    .join(', ');

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const summaryRows = [
    ['Items', order.itemsPrice],
    ['Shipping', order.shippingPrice],
    ['Tax', order.taxPrice],
    ['Discount', order.discountPrice ? -order.discountPrice : undefined],
  ].filter(([, v]) => v !== undefined && v !== null);

  return (
    <div className="oh-overlay" onClick={onClose}>
      <div className="oh-modal" onClick={(e) => e.stopPropagation()}>
        <div className="oh-modal-head">
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: colors.textPrimary }}>
              Order #{order._id?.slice(-8).toUpperCase()}
            </h3>
            <div style={{ marginTop: '6px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <StatusBadge statusKey={statusKey} />
              <span style={{ color: colors.textLight, fontSize: '0.85rem' }}>
                Placed on {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
              </span>
            </div>
          </div>
          <button className="oh-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="oh-modal-body">
          <div className="oh-panel">
            <OrderStepper statusKey={statusKey} />
            {order.deliveredAt && statusKey === 'delivered' && (
              <div style={{ color: colors.success, fontSize: '0.88rem', fontWeight: 600 }}>
                Delivered on {formatDate(order.deliveredAt)}
              </div>
            )}
          </div>

          <div className="oh-panel">
            <h4>
              <Package size={18} color={colors.primary} /> Products ({order.orderItems?.length || 0})
            </h4>
            {(order.orderItems || []).map((item, i) => (
              <DetailItem key={i} item={item} review={reviews[getProductId(item)]} />
            ))}
          </div>

          <div className="oh-two-col">
            <div className="oh-panel">
              <h4>
                <MapPin size={18} color={colors.primary} /> Shipping address
              </h4>
              {addr.fullName && <div style={{ fontWeight: 600, color: colors.textPrimary }}>{addr.fullName}</div>}
              <div style={{ color: colors.textSecondary, fontSize: '0.92rem', lineHeight: 1.6 }}>
                {addressLine || 'Address not available'}
              </div>
              {addr.phone && (
                <div style={{ color: colors.textSecondary, fontSize: '0.9rem', marginTop: '4px' }}>
                  Phone: {addr.phone}
                </div>
              )}
            </div>

            <div className="oh-panel">
              <h4>
                <CreditCard size={18} color={colors.primary} /> Payment
              </h4>
              <div style={{ color: colors.textSecondary, fontSize: '0.92rem' }}>
                Method: <strong>{order.paymentMethod || 'N/A'}</strong>
              </div>
              <div
                style={{
                  marginTop: '6px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: order.isPaid ? colors.success : colors.warning,
                }}
              >
                {order.isPaid ? `Paid on ${formatDate(order.paidAt)}` : 'Payment pending'}
              </div>
            </div>
          </div>

          <div className="oh-panel">
            <h4>Price details</h4>
            {summaryRows.map(([label, value]) => (
              <div className="oh-row" key={label}>
                <span>{label}</span>
                <span>{value < 0 ? `-${formatMoney(-value)}` : formatMoney(value)}</span>
              </div>
            ))}
            <div className="oh-row total">
              <span>Total</span>
              <span style={{ color: colors.primary }}>{formatMoney(order.totalPrice)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="oh-btn solid lg" onClick={() => onReorder(order)} disabled={reordering}>
              {reordering ? <Loader size={16} className="oh-spin" /> : <RotateCcw size={16} />} Reorder
            </button>
            <button className="oh-btn lg" onClick={() => onHelp(order)}>
              <MessageCircle size={16} /> Need Help?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =====================================================================
   MAIN PAGE
===================================================================== */
const OrderHistory = () => {
  const { user, token, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // reviews saved in backend: { [productId]: review }
  const [userReviews, setUserReviews] = useState({});

  // return requests: { [orderId]: data }
  const [returnRequests, setReturnRequests] = useState({});

  // modals
  const [detailsOrderId, setDetailsOrderId] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [reorderingId, setReorderingId] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  };

  const authHeaders = useCallback(
    () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }),
    [token]
  );

  /* ---------------- data loading ---------------- */
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      if (!token) throw new Error('No authentication token found');

      const response = await orderAPI.getMyOrders();
      const data = response.data;
      let list = [];
      if (Array.isArray(data)) list = data;
      else if (Array.isArray(data?.orders)) list = data.orders;
      else if (Array.isArray(data?.data)) list = data.data;

      setOrders(list);
    } catch (err) {
      console.error('Error fetching orders:', err);
      if (err.response?.status === 401) setError('Your session has expired. Please login again.');
      else setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Real reviews of this user (saved in backend)
  const fetchUserReviews = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/reviews/user`, { headers: authHeaders() });
      const d = res.data;
      const list = Array.isArray(d) ? d : d?.data || d?.reviews || [];
      const map = {};
      list.forEach((r) => {
        const pid = r.product?._id || r.product;
        if (pid) map[pid] = r;
      });
      setUserReviews(map);
    } catch (err) {
      console.error('Error fetching reviews:', err.response?.data || err.message);
    }
  }, [token, authHeaders]);

  // Return requests only for delivered orders
  const fetchReturnRequests = useCallback(async () => {
    if (!token) return;
    const requests = {};
    for (const order of orders) {
      if (getStatusKey(order) !== 'delivered') continue;
      try {
        const res = await axios.get(`${API_URL}/returns/order/${order._id}`, {
          headers: authHeaders(),
          validateStatus: (s) => s < 500,
        });
        if (res.status === 200 && res.data?.success) {
          const rd = res.data.data || res.data.returns || res.data;
          if (rd && (!Array.isArray(rd) || rd.length > 0)) requests[order._id] = rd;
        }
      } catch (err) {
        console.log(`Could not load returns for order ${order._id}:`, err.message);
      }
    }
    setReturnRequests(requests);
  }, [orders, token, authHeaders]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/login');
    } else {
      fetchOrders();
      fetchUserReviews();
    }
  }, [isAuthenticated, token, navigate, fetchOrders, fetchUserReviews]);

  useEffect(() => {
    if (orders.length > 0 && token && isAuthenticated) fetchReturnRequests();
  }, [orders, token, isAuthenticated, fetchReturnRequests]);

  /* ---------------- actions ---------------- */
  // REORDER: all items go to cart again, then user continues to checkout
  const handleReorder = async (order) => {
    setReorderingId(order._id);
    let added = 0;
    let failed = 0;

    for (const item of order.orderItems || []) {
      const pid = getProductId(item);
      if (!pid) {
        failed += 1;
        continue;
      }
      try {
        await addToCart(pid, item.qty || 1);
        added += 1;
      } catch (err) {
        console.error('Reorder failed for', item.name, err);
        failed += 1;
      }
    }

    setReorderingId(null);

    if (added > 0) {
      window.dispatchEvent(new Event('cartUpdated'));
      showToast(
        failed > 0
          ? `${added} item(s) added to cart, ${failed} unavailable`
          : `${added} item(s) added to cart`,
        failed > 0 ? 'warning' : 'success'
      );
      setDetailsOrderId(null);
      setTimeout(() => navigate('/cart'), 900);
    } else {
      showToast('Could not reorder. Items may be out of stock.', 'error');
    }
  };

  // NEED HELP: opens the chatbot with this order's context
  const handleNeedHelp = (order) => {
    const number = order._id?.slice(-8).toUpperCase();
    const statusText = STATUS_META[getStatusKey(order)].text;
    window.dispatchEvent(
      new CustomEvent('openChatbot', {
        detail: {
          source: 'order-history',
          orderId: order._id,
          orderNumber: number,
          status: statusText,
          message: `Hi, I need help with my order #${number} (${statusText}).`,
        },
      })
    );
    showToast('Opening support chat...', 'info');
  };

  const handleReviewClick = (order, item) => {
    setSelectedOrder(order);
    setSelectedProduct({ ...item, productId: getProductId(item), product: item.product });
    setShowReviewModal(true);
  };

  const handleReviewSuccess = async () => {
    // review is saved in backend by the modal; reload so the real review shows up
    await fetchUserReviews();
    showToast('Thank you for your review!', 'success');
  };

  const handleReturnClick = (order, item) => {
    setSelectedOrder(order);
    setSelectedProduct({ ...item, productId: getProductId(item) });
    setShowReturnModal(true);
  };

  const handleReturnSuccess = async () => {
    await fetchReturnRequests();
    showToast('Return request submitted successfully!', 'info');
  };

  const closeActionModals = () => {
    setShowReviewModal(false);
    setShowReturnModal(false);
    setSelectedProduct(null);
    setSelectedOrder(null);
  };

  /* ---------------- return helpers ---------------- */
  const getItemReturnStatus = (orderId, productId) => {
    try {
      const rr = returnRequests[orderId];
      if (!rr) return null;
      const arr = Array.isArray(rr) ? rr : [rr];
      const found = arr.find((r) =>
        r.items?.some((i) => String(i.product?._id || i.product) === String(productId))
      );
      if (!found) return null;
      return {
        status: found.status || 'pending',
        requestDate: found.createdAt || found.requestedAt,
      };
    } catch {
      return null;
    }
  };

  const isReturnEligible = (order) => {
    if (getStatusKey(order) !== 'delivered') return false;
    const date = order.deliveredAt || order.createdAt;
    if (!date) return false;
    const days = (Date.now() - new Date(date).getTime()) / 86400000;
    return days <= RETURN_WINDOW_DAYS;
  };

  /* ---------------- derived data ---------------- */
  const keyOf = (o) => getStatusKey(o);
  const stats = {
    delivered: orders.filter((o) => keyOf(o) === 'delivered').length,
    outForDelivery: orders.filter((o) => keyOf(o) === 'out-for-delivery').length,
    pending: orders.filter((o) => ['pending', 'processing'].includes(keyOf(o))).length,
    totalSpent: orders
      .filter((o) => keyOf(o) !== 'cancelled')
      .reduce((sum, o) => sum + (o.totalPrice || 0), 0),
  };

  const tabs = [
    { id: 'all', label: 'All', count: orders.length },
    { id: 'active', label: 'In progress', count: orders.filter((o) => ACTIVE_KEYS.includes(keyOf(o))).length },
    { id: 'delivered', label: 'Delivered', count: stats.delivered },
    { id: 'cancelled', label: 'Cancelled', count: orders.filter((o) => keyOf(o) === 'cancelled').length },
  ];

  const filteredOrders = orders.filter((o) => {
    if (filter === 'all') return true;
    if (filter === 'active') return ACTIVE_KEYS.includes(keyOf(o));
    return keyOf(o) === filter;
  });

  const detailsOrder = orders.find((o) => o._id === detailsOrderId);

  /* ---------------- early returns ---------------- */
  const pageStyle = {
    minHeight: '100vh',
    background: colors.bgPrimary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: '20px',
    padding: '20px',
  };

  if (!isAuthenticated || !token) {
    return (
      <div style={pageStyle}>
        <style>{css}</style>
        <AlertCircle size={50} color={colors.error} />
        <h2 style={{ color: colors.textPrimary }}>Authentication Required</h2>
        <p style={{ color: colors.textSecondary }}>Please log in to view your orders.</p>
        <button className="oh-btn solid lg" onClick={() => navigate('/login')}>
          Go to Login
        </button>
      </div>
    );
  }

  if (loading && orders.length === 0) {
    return (
      <div style={pageStyle}>
        <style>{css}</style>
        <Loader size={50} color={colors.primary} className="oh-spin" />
        <p style={{ color: colors.textSecondary, fontSize: '1.1rem' }}>Loading your orders...</p>
      </div>
    );
  }

  const toastColor = {
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
  }[toast.type];

  const statCards = [
    { label: 'Delivered', value: stats.delivered, icon: CheckCircle, color: colors.success },
    { label: 'Out for Delivery', value: stats.outForDelivery, icon: Truck, color: colors.pink },
    { label: 'Pending', value: stats.pending, icon: Clock, color: colors.warning },
  ];

  /* ---------------- render ---------------- */
  return (
    <div style={{ minHeight: '100vh', background: colors.bgPrimary, padding: '40px 20px', position: 'relative' }}>
      <style>{css}</style>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 20% 30%, ${colors.primary}10 0%, transparent 50%), radial-gradient(circle at 80% 70%, ${colors.primaryLight}10 0%, transparent 50%)`,
          pointerEvents: 'none',
        }}
      />

      {toast.show && (
        <div className="oh-toast" style={{ background: toastColor }}>
          {toast.type === 'error' || toast.type === 'warning' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          {toast.message}
        </div>
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '28px',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '2.4rem',
                fontWeight: 800,
                margin: '0 0 10px',
                background: `linear-gradient(135deg, ${colors.textPrimary}, ${colors.primary})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Order History
            </h1>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <span className="oh-badge" style={{ background: colors.white, color: colors.textSecondary, borderColor: colors.border }}>
                <ShoppingBag size={16} color={colors.primary} />
                {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
              </span>
              {stats.totalSpent > 0 && (
                <span className="oh-badge" style={{ background: colors.white, color: colors.textSecondary, borderColor: colors.border }}>
                  <IndianRupee size={16} color={colors.primary} />
                  Total Spent: {formatMoney(stats.totalSpent)}
                </span>
              )}
              <button
                className="oh-btn"
                style={{ borderColor: colors.border, color: colors.textSecondary, padding: '5px 14px' }}
                onClick={() => {
                  fetchOrders();
                  fetchUserReviews();
                }}
              >
                <RefreshCw size={15} className={loading ? 'oh-spin' : ''} /> Refresh
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            {statCards.map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                style={{
                  background: colors.white,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '16px',
                  padding: '12px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    background: colors.bgSecondary,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <Icon size={20} color={color} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: colors.textLight }}>{label}</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: colors.textPrimary }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div
            style={{
              background: `${colors.error}10`,
              border: `1px solid ${colors.error}`,
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '30px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <AlertCircle size={24} color={colors.error} />
            <span style={{ color: colors.error }}>{error}</span>
            <button className="oh-btn" style={{ marginLeft: 'auto', borderColor: colors.error, color: colors.error }} onClick={fetchOrders}>
              Retry
            </button>
          </div>
        )}

        {/* Filter tabs */}
        {orders.length > 0 && (
          <div className="oh-tabs">
            {tabs.map((t) => (
              <button key={t.id} className={`oh-tab ${filter === t.id ? 'active' : ''}`} onClick={() => setFilter(t.id)}>
                {t.label} <span className="oh-tab-count">{t.count}</span>
              </button>
            ))}
          </div>
        )}

        {!error && orders.length === 0 ? (
          <div
            style={{
              background: colors.white,
              border: `1px solid ${colors.border}`,
              borderRadius: '32px',
              padding: '60px 20px',
              maxWidth: '500px',
              margin: '40px auto',
              textAlign: 'center',
            }}
          >
            <Package size={80} color={colors.primary} />
            <h3 style={{ color: colors.textPrimary, fontSize: '1.8rem', margin: '20px 0 12px' }}>No Orders Yet</h3>
            <p style={{ color: colors.textSecondary, marginBottom: '30px' }}>
              Looks like you haven't placed any orders yet. Start shopping to see your orders here!
            </p>
            <Link to="/shop" className="oh-btn solid lg">
              <ShoppingBag size={18} /> Start Shopping
            </Link>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: colors.textSecondary }}>
            No orders in this tab.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredOrders.map((order, index) => {
              const statusKey = getStatusKey(order);
              const isDelivered = statusKey === 'delivered';
              const eligible = isReturnEligible(order);

              return (
                <div key={order._id} className="oh-card" style={{ animationDelay: `${index * 0.06}s` }}>
                  <div style={{ padding: '24px' }}>
                    {/* Header */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '20px',
                        flexWrap: 'wrap',
                        gap: '15px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div
                          style={{
                            width: '50px',
                            height: '50px',
                            background: colors.bgSecondary,
                            borderRadius: '15px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `1px solid ${colors.border}`,
                          }}
                        >
                          <Package size={24} color={colors.primary} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: colors.textPrimary, margin: '0 0 6px' }}>
                            Order #{order._id?.slice(-8).toUpperCase()}
                          </h3>
                          <StatusBadge statusKey={statusKey} />
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.primary }}>
                          {formatMoney(order.totalPrice)}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '5px',
                            color: colors.textLight,
                            fontSize: '0.88rem',
                          }}
                        >
                          <Calendar size={14} />
                          {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* Progress */}
                    <OrderStepper statusKey={statusKey} />

                    {/* All products (no "Show All") */}
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: colors.textSecondary, margin: '0 0 12px' }}>
                      Items ({order.orderItems?.length || 0})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {(order.orderItems || []).map((item, i) => {
                        const pid = getProductId(item);
                        return (
                          <OrderItemRow
                            key={i}
                            item={item}
                            review={userReviews[pid]}
                            returnStatus={getItemReturnStatus(order._id, pid)}
                            isDelivered={isDelivered}
                            returnEligible={eligible}
                            onReview={() => handleReviewClick(order, item)}
                            onReturn={() => handleReturnClick(order, item)}
                          />
                        );
                      })}
                    </div>

                    {/* Footer actions */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                        marginTop: '20px',
                        paddingTop: '20px',
                        borderTop: `1px solid ${colors.border}`,
                      }}
                    >
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                          className="oh-btn"
                          onClick={() => handleReorder(order)}
                          disabled={reorderingId === order._id}
                        >
                          {reorderingId === order._id ? (
                            <Loader size={15} className="oh-spin" />
                          ) : (
                            <RotateCcw size={15} />
                          )}
                          Reorder
                        </button>
                        <button className="oh-btn" onClick={() => handleNeedHelp(order)}>
                          <MessageCircle size={15} /> Need Help?
                        </button>
                      </div>

                      <button className="oh-btn solid lg" onClick={() => setDetailsOrderId(order._id)}>
                        View Details <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order details with full product details */}
      {detailsOrder && (
        <OrderDetailsModal
          order={detailsOrder}
          reviews={userReviews}
          reordering={reorderingId === detailsOrder._id}
          onClose={() => setDetailsOrderId(null)}
          onReorder={handleReorder}
          onHelp={handleNeedHelp}
        />
      )}

      {/* Review modal (saves review in backend) */}
      {showReviewModal && selectedProduct && selectedOrder && (
        <ProductReviewModal
          product={{ ...selectedProduct, _id: selectedProduct.productId || selectedProduct.product }}
          order={selectedOrder}
          onClose={closeActionModals}
          onSuccess={handleReviewSuccess}
          onError={(msg) => showToast(msg || 'Failed to submit review', 'error')}
        />
      )}

      {/* Return modal */}
      {showReturnModal && selectedProduct && selectedOrder && (
        <ReturnRequestModal
          product={selectedProduct}
          order={selectedOrder}
          onClose={closeActionModals}
          onSuccess={handleReturnSuccess}
          onError={(msg) => showToast(msg || 'Failed to submit return', 'error')}
        />
      )}
    </div>
  );
};

export default OrderHistory;
