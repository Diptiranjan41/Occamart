import React, { useState } from 'react';
import { Star, Send, X } from 'lucide-react';
import axios from 'axios';

const ProductReview = ({ productId, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const API_URL = 'http://localhost:5000/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    if (!comment.trim()) {
      setError('Please write a review');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/reviews`,
        {
          product: productId,
          rating,
          comment
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        onSuccess?.();
        onClose?.();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        padding: '30px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0, color: '#1F2937' }}>Write a Review</h2>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}>
            <X size={24} />
          </button>
        </div>

        {error && (
          <div style={{
            background: '#FEE2E2',
            color: '#DC2626',
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Rating Stars */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '10px',
              fontWeight: '600',
              color: '#1F2937'
            }}>
              Your Rating *
            </label>
            <div style={{ display: 'flex', gap: '5px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={32}
                  style={{ cursor: 'pointer' }}
                  color={(hoverRating || rating) >= star ? '#D4AF37' : '#E5E7EB'}
                  fill={(hoverRating || rating) >= star ? '#D4AF37' : 'none'}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
          </div>

          {/* Review Comment */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '10px',
              fontWeight: '600',
              color: '#1F2937'
            }}>
              Your Review *
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this product..."
              rows="5"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '1rem',
                resize: 'vertical'
              }}
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #D4AF37 0%, #B8962E 100%)',
              color: '#1F2937',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: submitting ? 0.7 : 1
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProductReview;