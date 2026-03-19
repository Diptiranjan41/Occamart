import React, { useState, useEffect } from 'react';
import { Star, Quote, Loader, AlertCircle } from 'lucide-react';
import axios from 'axios';

// API setup
const API_URL = 'http://localhost:5000/api';
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Add token to requests if needed
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  // Colors
  const colors = {
    bgPrimary: '#FAF7F2',
    bgSecondary: '#F5F0E8',
    primary: '#D4AF37',
    primaryDark: '#B8962E',
    primaryLight: '#E5C97A',
    textPrimary: '#1F2937',
    textSecondary: '#4B5563',
    textLight: '#6B7280',
    border: '#E5E7EB',
    white: '#FFFFFF',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6'
  };

  // Fetch reviews from backend
  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      // Fetch all reviews
      const response = await api.get('/reviews');
      
      console.log('📦 Reviews API Response:', response.data);

      let reviewsData = [];
      let avgRating = 0;
      let total = 0;

      if (response.data.success) {
        reviewsData = response.data.data || [];
        avgRating = response.data.averageRating || 0;
        total = response.data.total || reviewsData.length;
      } else if (Array.isArray(response.data)) {
        reviewsData = response.data;
        total = reviewsData.length;
        // Calculate average rating
        if (total > 0) {
          const sum = reviewsData.reduce((acc, review) => acc + (review.rating || 0), 0);
          avgRating = (sum / total).toFixed(1);
        }
      } else if (response.data.reviews) {
        reviewsData = response.data.reviews;
        total = response.data.total || reviewsData.length;
        avgRating = response.data.averageRating || 0;
      }

      // Format reviews with default avatars if needed
      const formattedReviews = reviewsData.map((review, index) => ({
        id: review._id || index,
        name: review.user?.name || review.name || 'Anonymous Customer',
        role: review.user?.role || review.role || 'Verified Buyer',
        rating: review.rating || 5,
        comment: review.comment || review.review || review.text || '',
        avatar: getAvatarForName(review.user?.name || review.name || ''),
        date: review.createdAt ? new Date(review.createdAt).toLocaleDateString() : null,
        verified: review.verified || review.isVerified || false
      }));

      setReviews(formattedReviews);
      setAverageRating(avgRating);
      setTotalReviews(total);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching reviews:', err);
      setError('Failed to load reviews. Please try again.');
      
      // Fallback to static data if API fails
      setReviews(getFallbackReviews());
    } finally {
      setLoading(false);
    }
  };

  // Generate avatar based on name
  const getAvatarForName = (name) => {
    const avatars = ['👩', '👨', '👩‍🦱', '👨‍🦰', '🧑', '👵', '👴', '👧', '👦'];
    if (!name) return avatars[Math.floor(Math.random() * avatars.length)];
    
    // Use first character to determine avatar
    const charCode = name.charCodeAt(0) || 0;
    return avatars[charCode % avatars.length];
  };

  // Fallback reviews for when API fails
  const getFallbackReviews = () => {
    return [
      {
        id: 1,
        name: 'Priya Sharma',
        role: 'Fashion Enthusiast',
        rating: 5,
        comment: 'Absolutely love the quality! The products exceeded my expectations. Fast delivery and excellent customer service.',
        avatar: '👩',
        verified: true
      },
      {
        id: 2,
        name: 'Rahul Verma',
        role: 'Tech Reviewer',
        rating: 5,
        comment: 'Best online shopping experience! Great collection of electronics at competitive prices. Will definitely shop again.',
        avatar: '👨',
        verified: true
      },
      {
        id: 3,
        name: 'Anita Desai',
        role: 'Home Decor Expert',
        rating: 4,
        comment: 'Beautiful products and amazing quality. The customer support team was very helpful with my queries.',
        avatar: '👩‍🦱',
        verified: false
      },
    ];
  };

  // Submit a new review
  const submitReview = async (reviewData) => {
    try {
      const response = await api.post('/reviews', reviewData);
      if (response.data.success) {
        // Refresh reviews after successful submission
        fetchReviews();
        return { success: true, message: 'Review submitted successfully!' };
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      return { 
        success: false, 
        message: err.response?.data?.message || 'Failed to submit review' 
      };
    }
  };

  const styles = {
    section: {
      padding: '60px 20px',
      background: colors.bgPrimary,
      position: 'relative',
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
    },
    header: {
      textAlign: 'center',
      marginBottom: '40px',
    },
    subtitle: {
      color: colors.primary,
      fontSize: '1rem',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '2px',
      marginBottom: '10px',
    },
    title: {
      fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
      fontWeight: '700',
      color: colors.textPrimary,
      margin: '0 0 15px',
    },
    description: {
      color: colors.textSecondary,
      fontSize: '1.1rem',
      maxWidth: '600px',
      margin: '0 auto',
    },
    statsBar: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '30px',
      marginBottom: '40px',
      flexWrap: 'wrap',
    },
    statItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      background: colors.white,
      padding: '10px 20px',
      borderRadius: '50px',
      border: `1px solid ${colors.border}`,
    },
    statValue: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: colors.primary,
    },
    statLabel: {
      color: colors.textLight,
      fontSize: '0.9rem',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '25px',
    },
    card: {
      background: colors.white,
      borderRadius: '20px',
      padding: '30px',
      border: `1px solid ${colors.border}`,
      transition: 'all 0.3s ease',
      position: 'relative',
    },
    quoteIcon: {
      position: 'absolute',
      top: '20px',
      right: '20px',
      color: colors.primary,
      opacity: 0.2,
    },
    profile: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      marginBottom: '20px',
    },
    avatar: {
      fontSize: '3rem',
      background: colors.bgSecondary,
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    info: {
      flex: 1,
    },
    name: {
      color: colors.textPrimary,
      fontSize: '1.1rem',
      fontWeight: '600',
      marginBottom: '4px',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
    },
    verifiedBadge: {
      background: colors.success,
      color: colors.white,
      fontSize: '0.6rem',
      padding: '2px 6px',
      borderRadius: '4px',
      marginLeft: '5px',
    },
    role: {
      color: colors.textSecondary,
      fontSize: '0.9rem',
    },
    date: {
      color: colors.textLight,
      fontSize: '0.8rem',
      marginTop: '2px',
    },
    rating: {
      display: 'flex',
      gap: '3px',
      marginBottom: '15px',
    },
    comment: {
      color: colors.textSecondary,
      lineHeight: '1.6',
      fontSize: '0.95rem',
      fontStyle: 'italic',
    },
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px',
      gap: '20px',
    },
    loader: {
      width: '50px',
      height: '50px',
      border: `3px solid ${colors.bgSecondary}`,
      borderTop: `3px solid ${colors.primary}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    errorContainer: {
      textAlign: 'center',
      padding: '40px',
      background: colors.white,
      borderRadius: '16px',
      border: `1px solid ${colors.error}`,
      maxWidth: '500px',
      margin: '0 auto',
    },
    retryButton: {
      marginTop: '20px',
      padding: '10px 30px',
      background: colors.primary,
      color: colors.white,
      border: 'none',
      borderRadius: '8px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
    },
  };

  if (loading) {
    return (
      <section style={styles.section}>
        <div style={styles.container}>
          <div style={styles.loadingContainer}>
            <div style={styles.loader}></div>
            <p style={{ color: colors.textSecondary }}>Loading customer reviews...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error && reviews.length === 0) {
    return (
      <section style={styles.section}>
        <div style={styles.container}>
          <div style={styles.errorContainer}>
            <AlertCircle size={40} color={colors.error} />
            <h3 style={{ margin: '15px 0', color: colors.textPrimary }}>Oops! Something went wrong</h3>
            <p style={{ color: colors.textSecondary }}>{error}</p>
            <button style={styles.retryButton} onClick={fetchReviews}>
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={styles.section}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.subtitle}>TESTIMONIALS</div>
          <h2 style={styles.title}>What Our Customers Say</h2>
          <p style={styles.description}>
            Real feedback from {totalReviews} happy customers
          </p>
        </div>

        {/* Stats Bar */}
        {totalReviews > 0 && (
          <div style={styles.statsBar}>
            <div style={styles.statItem}>
              <Star size={20} color={colors.primary} fill={colors.primary} />
              <span style={styles.statValue}>{averageRating}</span>
              <span style={styles.statLabel}>Average Rating</span>
            </div>
            <div style={styles.statItem}>
              <Quote size={20} color={colors.primary} />
              <span style={styles.statValue}>{totalReviews}</span>
              <span style={styles.statLabel}>Total Reviews</span>
            </div>
          </div>
        )}

        <div style={styles.grid}>
          {reviews.map((review) => (
            <div
              key={review.id}
              style={styles.card}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-10px)';
                e.currentTarget.style.boxShadow = `0 20px 30px ${colors.primary}20`;
                e.currentTarget.style.borderColor = colors.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = colors.border;
              }}
            >
              <Quote size={40} style={styles.quoteIcon} />
              
              <div style={styles.profile}>
                <div style={styles.avatar}>{review.avatar}</div>
                <div style={styles.info}>
                  <div style={styles.name}>
                    {review.name}
                    {review.verified && (
                      <span style={styles.verifiedBadge}>✓ Verified</span>
                    )}
                  </div>
                  <div style={styles.role}>{review.role}</div>
                  {review.date && <div style={styles.date}>{review.date}</div>}
                </div>
              </div>

              <div style={styles.rating}>
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    color={i < review.rating ? colors.primary : colors.border}
                    fill={i < review.rating ? colors.primary : 'none'}
                  />
                ))}
              </div>

              <p style={styles.comment}>"{review.comment}"</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
};

export default Reviews;