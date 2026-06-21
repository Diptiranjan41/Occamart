import React, { useState } from 'react';
import { MessageCircle, X, Send, Star, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api'; // ✅ Base URL

const QuickFeedback = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Colors
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

  // Handle submit
  const handleSubmit = async () => {
    // Validation
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      console.log('📤 Submitting quick feedback:', { rating, feedback });

      const response = await axios.post(`${API_URL}/feedback/quick`, {
        rating,
        feedback: feedback.trim() || 'Quick rating feedback',
        page: window.location.pathname
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Feedback submitted:', response.data);
      
      // Show success
      setSubmitted(true);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setRating(0);
        setHoverRating(0);
        setFeedback('');
        setError('');
      }, 3000);

    } catch (error) {
      console.error('❌ Error submitting feedback:', error);
      
      // Handle different error types
      if (error.code === 'ERR_NETWORK') {
        setError('Network error. Please check your connection.');
      } else if (error.response) {
        // Server responded with error
        setError(error.response.data?.message || `Server error: ${error.response.status}`);
      } else if (error.request) {
        // Request made but no response
        setError('No response from server. Please try again.');
      } else {
        // Something else
        setError(error.message || 'Failed to submit feedback');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle close
  const handleClose = () => {
    setIsOpen(false);
    setRating(0);
    setHoverRating(0);
    setFeedback('');
    setError('');
    setSubmitted(false);
  };

  const styles = {
    floatingButton: {
      position: 'fixed',
      bottom: '30px',
      right: '30px',
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
      transition: 'transform 0.3s ease, box-shadow 0.3s ease'
    },
    modal: {
      position: 'fixed',
      bottom: '100px',
      right: '30px',
      width: '350px',
      background: colors.white,
      borderRadius: '16px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      padding: '25px',
      zIndex: 1000,
      animation: 'slideIn 0.3s ease-out'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    },
    title: {
      margin: 0,
      color: colors.textPrimary,
      fontSize: '1.2rem',
      fontWeight: '600'
    },
    closeBtn: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '5px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background 0.3s ease'
    },
    ratingContainer: {
      textAlign: 'center',
      marginBottom: '15px'
    },
    ratingLabel: {
      color: colors.textSecondary,
      fontSize: '0.9rem',
      marginBottom: '10px'
    },
    stars: {
      display: 'flex',
      gap: '8px',
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
      minHeight: '80px',
      marginBottom: '15px',
      resize: 'vertical',
      fontFamily: 'inherit'
    },
    errorBox: {
      background: `${colors.error}15`,
      color: colors.error,
      padding: '10px',
      borderRadius: '8px',
      marginBottom: '15px',
      fontSize: '0.9rem',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    button: {
      width: '100%',
      padding: '12px',
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
      color: colors.textPrimary,
      border: 'none',
      borderRadius: '8px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.3s ease',
      opacity: submitting ? 0.7 : 1
    },
    successContainer: {
      textAlign: 'center',
      padding: '20px'
    },
    successIcon: {
      color: colors.success,
      marginBottom: '15px'
    },
    successMessage: {
      color: colors.success,
      fontSize: '1.1rem',
      fontWeight: '600',
      marginBottom: '10px'
    },
    successSubtext: {
      color: colors.textLight,
      fontSize: '0.9rem'
    }
  };

  // Add animation styles
  const animationStyle = document.createElement('style');
  animationStyle.textContent = `
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
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(animationStyle);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={styles.floatingButton}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(212, 175, 55, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(212, 175, 55, 0.3)';
        }}
      >
        <MessageCircle size={24} color="#1F2937" />
      </button>

      {/* Feedback Modal */}
      {isOpen && (
        <div style={styles.modal}>
          <div style={styles.header}>
            <h3 style={styles.title}>Quick Feedback</h3>
            <button
              onClick={handleClose}
              style={styles.closeBtn}
              onMouseEnter={(e) => e.currentTarget.style.background = colors.bgLight}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              <X size={20} color={colors.textLight} />
            </button>
          </div>

          {submitted ? (
            // Success State
            <div style={styles.successContainer}>
              <CheckCircle size={50} style={styles.successIcon} />
              <div style={styles.successMessage}>Thank You! 🎉</div>
              <div style={styles.successSubtext}>
                Your feedback helps us improve.
              </div>
            </div>
          ) : (
            // Form State
            <>
              {/* Rating Section */}
              <div style={styles.ratingContainer}>
                <div style={styles.ratingLabel}>Rate your experience</div>
                <div style={styles.stars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={32}
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

              {/* Feedback Input */}
              <textarea
                placeholder="Tell us what you think (optional)"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                style={styles.textarea}
                disabled={submitting}
              />

              {/* Error Message */}
              {error && (
                <div style={styles.errorBox}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={styles.button}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 5px 15px rgba(212, 175, 55, 0.4)';
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
                      border: '2px solid #1F2937', 
                      borderTop: '2px solid transparent', 
                      borderRadius: '50%', 
                      animation: 'spin 1s linear infinite' 
                    }} />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Feedback
                    <Send size={16} />
                  </>
                )}
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default QuickFeedback;