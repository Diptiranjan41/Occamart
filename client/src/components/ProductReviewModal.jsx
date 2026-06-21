import React, { useState } from 'react';
import { Star, X, Send, CheckCircle, AlertCircle } from 'lucide-react'; // 🔥 FIXED: Added AlertCircle import
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const ProductReviewModal = ({ product, order, onClose, onSuccess }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const colors = {
        primary: '#D4AF37',
        primaryDark: '#B8962E',
        textPrimary: '#1F2937',
        textSecondary: '#4B5563',
        textLight: '#6B7280',
        border: '#E5E7EB',
        white: '#FFFFFF',
        success: '#10B981',
        error: '#EF4444',
        bgLight: '#F9F9F9'
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (rating === 0) {
            setError('Please select a rating');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            
            // 🔥 Prepare review data
            const reviewData = {
                product: product.product?._id || product.product,
                rating,
                comment,
                orderId: order?._id
            };

            console.log('📝 Submitting review:', reviewData);

            const response = await axios.post(
                `${API_URL}/reviews`,
                reviewData,
                {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ Review submitted:', response.data);

            if (response.data.success) {
                // 🔥 Call onSuccess with product ID - backend will track reviews
                onSuccess(product.product?._id || product.product);
                onClose();
            }
        } catch (err) {
            console.error('❌ Error submitting review:', err);
            
            // 🔥 Better error handling
            if (err.response) {
                // Server responded with error
                setError(err.response.data?.message || `Server error: ${err.response.status}`);
                console.error('Server response:', err.response.data);
            } else if (err.request) {
                // Request made but no response
                setError('No response from server. Please check your connection.');
            } else {
                // Something else
                setError(err.message || 'Failed to submit review');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const styles = {
        modalOverlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
        },
        modalContent: {
            background: colors.white,
            borderRadius: '24px',
            padding: '30px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            animation: 'slideIn 0.3s ease-out'
        },
        closeBtn: {
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: colors.textLight,
            padding: '5px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.3s ease'
        },
        title: {
            fontSize: '1.5rem',
            fontWeight: '700',
            color: colors.textPrimary,
            marginBottom: '10px'
        },
        productInfo: {
            background: colors.bgLight,
            padding: '15px',
            borderRadius: '12px',
            marginBottom: '20px',
            border: `1px solid ${colors.border}`
        },
        productName: {
            fontSize: '1.1rem',
            fontWeight: '600',
            color: colors.textPrimary,
            marginBottom: '5px'
        },
        productPrice: {
            color: colors.primary,
            fontWeight: '600',
            fontSize: '1.1rem'
        },
        ratingContainer: {
            textAlign: 'center',
            marginBottom: '20px'
        },
        ratingLabel: {
            color: colors.textSecondary,
            fontSize: '0.95rem',
            marginBottom: '10px'
        },
        stars: {
            display: 'flex',
            gap: '10px',
            justifyContent: 'center',
            marginBottom: '10px'
        },
        star: {
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
        },
        textarea: {
            width: '100%',
            padding: '12px',
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            fontSize: '0.95rem',
            minHeight: '120px',
            marginBottom: '20px',
            resize: 'vertical',
            fontFamily: 'inherit'
        },
        errorBox: {
            background: `${colors.error}15`,
            color: colors.error,
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '15px',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: `1px solid ${colors.error}30`
        },
        button: {
            width: '100%',
            padding: '14px',
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
            color: colors.white,
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.3s ease',
            opacity: submitting ? 0.7 : 1
        }
    };

    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                <button 
                    style={styles.closeBtn} 
                    onClick={onClose}
                    onMouseEnter={(e) => e.currentTarget.style.background = colors.bgLight}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                    <X size={20} />
                </button>

                <h2 style={styles.title}>Write a Review</h2>

                <div style={styles.productInfo}>
                    <div style={styles.productName}>{product.name}</div>
                    <div style={styles.productPrice}>₹{product.price}</div>
                </div>

                {error && (
                    <div style={styles.errorBox}>
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={styles.ratingContainer}>
                        <div style={styles.ratingLabel}>Rate this product</div>
                        <div style={styles.stars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    size={36}
                                    style={styles.star}
                                    color={(hoverRating || rating) >= star ? colors.primary : colors.border}
                                    fill={(hoverRating || rating) >= star ? colors.primary : 'none'}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => {
                                        setRating(star);
                                        setError('');
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <textarea
                        placeholder="Share your experience with this product..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        style={styles.textarea}
                        required
                    />

                    <button
                        type="submit"
                        style={styles.button}
                        disabled={submitting}
                        onMouseEnter={(e) => {
                            if (!submitting) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = `0 10px 25px ${colors.primary}60`;
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!submitting) {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }
                        }}
                    >
                        {submitting ? (
                            <>
                                <div style={{ 
                                    width: '18px', 
                                    height: '18px', 
                                    border: '2px solid white', 
                                    borderTop: '2px solid transparent', 
                                    borderRadius: '50%', 
                                    animation: 'spin 1s linear infinite' 
                                }} />
                                Submitting...
                            </>
                        ) : (
                            <>
                                Submit Review
                                <Send size={18} />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProductReviewModal;