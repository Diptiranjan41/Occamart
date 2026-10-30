import React, { useState, useEffect, useMemo } from 'react';
import { Star, Quote, AlertCircle, MessageSquare } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const SERVER_URL = 'http://localhost:5000';
const INITIAL_VISIBLE = 6;

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
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
  error: '#EF4444',
};

/* ---------------- helpers ---------------- */
const toImageUrl = (src) => {
  if (!src) return '';
  const value = typeof src === 'string' ? src : src.url || '';
  if (!value) return '';
  return value.startsWith('http') || value.startsWith('data:') ? value : `${SERVER_URL}${value}`;
};

// The user's own profile image (supports the common field names)
const getProfileImage = (user) =>
  toImageUrl(
    user?.avatar ||
      user?.profileImage ||
      user?.profilePicture ||
      user?.profilePic ||
      user?.image ||
      user?.photo ||
      user?.picture
  );

const getInitials = (name) =>
  String(name || 'C')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || 'C';

const StarRow = ({ rating, size = 16 }) => (
  <span style={{ display: 'inline-flex', gap: '3px' }}>
    {[1, 2, 3, 4, 5].map((i) => {
      const filled = i <= Math.round(rating);
      return (
        <Star
          key={i}
          size={size}
          color={filled ? colors.primary : colors.border}
          fill={filled ? colors.primary : 'none'}
        />
      );
    })}
  </span>
);

const Avatar = ({ src, name }) => {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        className="rv-avatar"
        onError={() => setFailed(true)}
        loading="lazy"
      />
    );
  }
  return <div className="rv-avatar rv-avatar-fallback">{getInitials(name)}</div>;
};

/* ---------------- component ---------------- */
const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reviews', { params: { limit: 1000 } });
      const data = response.data;

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.reviews)
        ? data.reviews
        : [];

      const formatted = list
        .map((review, index) => {
          const user = review.user && typeof review.user === 'object' ? review.user : {};
          const name = user.name || review.name || 'Customer';
          return {
            id: review._id || index,
            name,
            image: getProfileImage(user) || toImageUrl(review.userImage),
            productName:
              review.product && typeof review.product === 'object' ? review.product.name : '',
            rating: Number(review.rating) || 0,
            title: review.title || '',
            comment: review.comment || review.review || review.text || '',
            createdAt: review.createdAt,
            verified: !!(review.verified || review.isVerified || review.verifiedPurchase),
          };
        })
        .filter((r) => r.rating > 0)
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      setReviews(formatted);
      setError(null);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // Real numbers, calculated from the reviews in the database
  const totalReviews = reviews.length;
  const averageRating = useMemo(() => {
    if (totalReviews === 0) return 0;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
  }, [reviews, totalReviews]);

  const visibleReviews = showAll ? reviews : reviews.slice(0, INITIAL_VISIBLE);

  const formatDate = (d) => {
    if (!d) return '';
    try {
      return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const css = `
    @keyframes rv-spin { to { transform: rotate(360deg); } }

    .rv-section { padding: 60px 20px; background: ${colors.bgPrimary}; }
    .rv-container { max-width: 1200px; margin: 0 auto; }

    .rv-header { text-align: center; margin-bottom: 40px; }
    .rv-subtitle { color: ${colors.primary}; font-size: 1rem; font-weight: 600; letter-spacing: 2px; margin-bottom: 10px; }
    .rv-title { font-size: clamp(1.8rem, 4vw, 2.5rem); font-weight: 700; color: ${colors.textPrimary}; margin: 0 0 24px; }

    /* rating shown like a heading line */
    .rv-headline {
      display: inline-flex; align-items: center; gap: 18px; flex-wrap: wrap; justify-content: center;
      padding: 14px 32px; background: ${colors.white};
      border: 1px solid ${colors.border}; border-radius: 60px;
    }
    .rv-score {
      font-size: clamp(2.4rem, 6vw, 3.4rem); font-weight: 800; line-height: 1;
      background: linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark});
      -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
    }
    .rv-score small { font-size: 1.1rem; font-weight: 600; color: ${colors.textLight}; -webkit-text-fill-color: ${colors.textLight}; }
    .rv-headline-meta { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
    .rv-headline-text { color: ${colors.textSecondary}; font-size: 1rem; }
    .rv-headline-text strong { color: ${colors.textPrimary}; }

    .rv-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 25px; }
    .rv-card {
      background: ${colors.white}; border-radius: 20px; padding: 28px;
      border: 1px solid ${colors.border}; position: relative;
      display: flex; flex-direction: column;
      transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
    }
    .rv-card:hover { transform: translateY(-8px); box-shadow: 0 20px 30px ${colors.primary}20; border-color: ${colors.primary}; }
    .rv-quote { position: absolute; top: 20px; right: 20px; color: ${colors.primary}; opacity: 0.2; }

    .rv-profile { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
    .rv-avatar {
      width: 60px; height: 60px; border-radius: 50%; object-fit: cover; flex-shrink: 0;
      border: 2px solid ${colors.primary}; background: ${colors.bgSecondary};
    }
    .rv-avatar-fallback {
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 1.3rem; color: ${colors.white};
      background: linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark});
    }
    .rv-name { color: ${colors.textPrimary}; font-size: 1.05rem; font-weight: 600; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .rv-verified { background: ${colors.success}; color: ${colors.white}; font-size: 0.62rem; padding: 2px 6px; border-radius: 4px; }
    .rv-meta { color: ${colors.textLight}; font-size: 0.82rem; margin-top: 2px; }
    .rv-product { color: ${colors.textSecondary}; font-size: 0.85rem; margin-top: 2px; }

    .rv-rating { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
    .rv-review-title { font-weight: 600; color: ${colors.textPrimary}; margin: 0 0 6px; font-size: 1rem; }
    .rv-comment { color: ${colors.textSecondary}; line-height: 1.6; font-size: 0.95rem; font-style: italic; margin: 0; word-break: break-word; }

    .rv-btn {
      padding: 12px 34px; background: transparent; color: ${colors.primary};
      border: 2px solid ${colors.primary}; border-radius: 30px; font-size: 1rem; font-weight: 600;
      cursor: pointer; font-family: inherit; transition: all 0.25s ease;
    }
    .rv-btn:hover { background: ${colors.primary}; color: ${colors.white}; }
    .rv-btn.solid { background: ${colors.primary}; color: ${colors.white}; }

    .rv-center { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 60px 20px; text-align: center; }
    .rv-loader { width: 50px; height: 50px; border: 3px solid ${colors.bgSecondary}; border-top: 3px solid ${colors.primary}; border-radius: 50%; animation: rv-spin 1s linear infinite; }
    .rv-box { background: ${colors.white}; border-radius: 16px; border: 1px solid ${colors.border}; max-width: 500px; margin: 0 auto; }
  `;

  if (loading) {
    return (
      <section className="rv-section">
        <style>{css}</style>
        <div className="rv-container rv-center">
          <div className="rv-loader" />
          <p style={{ color: colors.textSecondary }}>Loading customer reviews...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rv-section">
        <style>{css}</style>
        <div className="rv-container">
          <div className="rv-box rv-center" style={{ borderColor: colors.error }}>
            <AlertCircle size={40} color={colors.error} />
            <h3 style={{ margin: 0, color: colors.textPrimary }}>Oops! Something went wrong</h3>
            <p style={{ margin: 0, color: colors.textSecondary }}>{error}</p>
            <button className="rv-btn solid" onClick={fetchReviews}>
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rv-section">
      <style>{css}</style>
      <div className="rv-container">
        <div className="rv-header">
          <div className="rv-subtitle">TESTIMONIALS</div>
          <h2 className="rv-title">What Our Customers Say</h2>

          {totalReviews > 0 && (
            <div className="rv-headline">
              <span className="rv-score">
                {averageRating.toFixed(1)} <small>/ 5</small>
              </span>
              <div className="rv-headline-meta">
                <StarRow rating={averageRating} size={22} />
                <span className="rv-headline-text">
                  Based on <strong>{totalReviews}</strong> customer {totalReviews === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            </div>
          )}
        </div>

        {totalReviews === 0 ? (
          <div className="rv-box rv-center">
            <MessageSquare size={40} color={colors.primary} />
            <h3 style={{ margin: 0, color: colors.textPrimary }}>No reviews yet</h3>
            <p style={{ margin: 0, color: colors.textSecondary }}>
              Buy a product and be the first to share your experience.
            </p>
          </div>
        ) : (
          <>
            <div className="rv-grid">
              {visibleReviews.map((review) => (
                <div className="rv-card" key={review.id}>
                  <Quote size={40} className="rv-quote" />

                  <div className="rv-profile">
                    <Avatar src={review.image} name={review.name} />
                    <div style={{ minWidth: 0 }}>
                      <div className="rv-name">
                        {review.name}
                        {review.verified && <span className="rv-verified">✓ Verified</span>}
                      </div>
                      {review.productName && <div className="rv-product">on {review.productName}</div>}
                      {review.createdAt && <div className="rv-meta">{formatDate(review.createdAt)}</div>}
                    </div>
                  </div>

                  <div className="rv-rating">
                    <StarRow rating={review.rating} />
                    <span style={{ color: colors.textLight, fontSize: '0.85rem', fontWeight: 600 }}>
                      {review.rating.toFixed(1)}
                    </span>
                  </div>

                  {review.title && <h4 className="rv-review-title">{review.title}</h4>}
                  {review.comment && <p className="rv-comment">"{review.comment}"</p>}
                </div>
              ))}
            </div>

            {totalReviews > INITIAL_VISIBLE && (
              <div style={{ textAlign: 'center', marginTop: '36px' }}>
                <button className="rv-btn" onClick={() => setShowAll((v) => !v)}>
                  {showAll ? 'Show fewer reviews' : `View all ${totalReviews} reviews`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default Reviews;
