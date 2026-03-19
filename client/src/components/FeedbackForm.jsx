import React, { useState } from 'react';
import { Send, Star, MessageSquare, User, Mail } from 'lucide-react';
import axios from 'axios';

const FeedbackForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rating: 0,
    feedback: '',
    category: 'general'
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const API_URL = 'http://localhost:5000/api';

  const categories = [
    { value: 'general', label: 'General Feedback' },
    { value: 'product', label: 'Product Suggestion' },
    { value: 'service', label: 'Customer Service' },
    { value: 'website', label: 'Website Experience' },
    { value: 'delivery', label: 'Delivery Experience' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.rating === 0) {
      setError('Please rate your experience');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/feedback`,
        formData,
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );

      if (response.data.success) {
        setSuccess(true);
        setFormData({
          name: '',
          email: '',
          rating: 0,
          feedback: '',
          category: 'general'
        });
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const styles = {
    container: {
      maxWidth: '600px',
      margin: '0 auto',
      padding: '30px',
      background: '#FFFFFF',
      borderRadius: '20px',
      border: '1px solid #E5E7EB'
    },
    title: {
      fontSize: '1.8rem',
      fontWeight: '700',
      color: '#1F2937',
      marginBottom: '10px',
      textAlign: 'center'
    },
    subtitle: {
      color: '#6B7280',
      textAlign: 'center',
      marginBottom: '30px'
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '600',
      color: '#1F2937'
    },
    input: {
      width: '100%',
      padding: '12px',
      border: '1px solid #E5E7EB',
      borderRadius: '8px',
      fontSize: '1rem',
      transition: 'all 0.3s ease'
    },
    textarea: {
      width: '100%',
      padding: '12px',
      border: '1px solid #E5E7EB',
      borderRadius: '8px',
      fontSize: '1rem',
      minHeight: '120px',
      resize: 'vertical'
    },
    select: {
      width: '100%',
      padding: '12px',
      border: '1px solid #E5E7EB',
      borderRadius: '8px',
      fontSize: '1rem',
      background: '#FFFFFF'
    },
    stars: {
      display: 'flex',
      gap: '5px',
      marginBottom: '10px'
    },
    star: {
      cursor: 'pointer',
      transition: 'transform 0.2s ease'
    },
    button: {
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
      transition: 'all 0.3s ease'
    },
    successMessage: {
      background: '#D1FAE5',
      color: '#065F46',
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '20px',
      textAlign: 'center'
    },
    errorMessage: {
      background: '#FEE2E2',
      color: '#DC2626',
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '20px',
      textAlign: 'center'
    }
  };

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.successMessage}>
          <h3 style={{ margin: '0 0 10px' }}>Thank You! 🎉</h3>
          <p>Your feedback has been submitted successfully. We appreciate your input!</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Share Your Feedback</h2>
      <p style={styles.subtitle}>Help us improve your shopping experience</p>

      {error && (
        <div style={styles.errorMessage}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Name */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            <User size={16} style={{ marginRight: '5px' }} /> Your Name
          </label>
          <input
            type="text"
            style={styles.input}
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="Enter your name"
          />
        </div>

        {/* Email */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            <Mail size={16} style={{ marginRight: '5px' }} /> Email Address
          </label>
          <input
            type="email"
            style={styles.input}
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            placeholder="Enter your email"
          />
        </div>

        {/* Category */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            <MessageSquare size={16} style={{ marginRight: '5px' }} /> Feedback Category
          </label>
          <select
            style={styles.select}
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Rating */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            <Star size={16} style={{ marginRight: '5px' }} /> Rate Your Experience *
          </label>
          <div style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={32}
                style={styles.star}
                color={(hoverRating || formData.rating) >= star ? '#D4AF37' : '#E5E7EB'}
                fill={(hoverRating || formData.rating) >= star ? '#D4AF37' : 'none'}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setFormData({...formData, rating: star})}
              />
            ))}
          </div>
        </div>

        {/* Feedback */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            <MessageSquare size={16} style={{ marginRight: '5px' }} /> Your Feedback *
          </label>
          <textarea
            style={styles.textarea}
            value={formData.feedback}
            onChange={(e) => setFormData({...formData, feedback: e.target.value})}
            placeholder="Please share your thoughts, suggestions, or concerns..."
            required
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          style={styles.button}
          disabled={submitting}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          {submitting ? 'Submitting...' : 'Submit Feedback'}
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default FeedbackForm;