import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Clock, MessageSquare } from 'lucide-react';
import axios from 'axios';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const colors = {
    bgPrimary: '#FAF7F2',
    primary: '#D4AF37',
    textPrimary: '#1F2937',
    textSecondary: '#4B5563',
    white: '#FFFFFF',
    border: '#E5E7EB',
    success: '#10B981',
    error: '#EF4444'
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: colors.bgPrimary,
      padding: '40px 20px'
    },
    wrapper: {
      maxWidth: '1200px',
      margin: '0 auto'
    },
    header: {
      textAlign: 'center',
      marginBottom: '50px'
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: '15px'
    },
    subtitle: {
      fontSize: '1.1rem',
      color: colors.textSecondary,
      maxWidth: '600px',
      margin: '0 auto'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '30px',
      marginBottom: '50px'
    },
    infoCard: {
      background: colors.white,
      padding: '30px',
      borderRadius: '16px',
      border: `1px solid ${colors.border}`,
      textAlign: 'center'
    },
    icon: {
      width: '60px',
      height: '60px',
      background: `${colors.primary}15`,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 20px',
      color: colors.primary
    },
    infoTitle: {
      fontSize: '1.2rem',
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: '10px'
    },
    infoText: {
      color: colors.textSecondary,
      lineHeight: '1.6'
    },
    formContainer: {
      background: colors.white,
      padding: '40px',
      borderRadius: '20px',
      border: `1px solid ${colors.border}`,
      maxWidth: '800px',
      margin: '0 auto'
    },
    formTitle: {
      fontSize: '1.8rem',
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: '30px',
      textAlign: 'center'
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '500',
      color: colors.textPrimary
    },
    input: {
      width: '100%',
      padding: '12px',
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      fontSize: '1rem'
    },
    textarea: {
      width: '100%',
      padding: '12px',
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      fontSize: '1rem',
      minHeight: '150px',
      resize: 'vertical'
    },
    button: {
      width: '100%',
      padding: '14px',
      background: `linear-gradient(135deg, ${colors.primary} 0%, #B8962E 100%)`,
      color: colors.white,
      border: 'none',
      borderRadius: '8px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    },
    successMsg: {
      background: colors.success,
      color: colors.white,
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '20px',
      textAlign: 'center'
    },
    errorMsg: {
      background: colors.error,
      color: colors.white,
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '20px',
      textAlign: 'center'
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <h1 style={styles.title}>Contact Us</h1>
          <p style={styles.subtitle}>
            Get in touch with our team. We're here to help!
          </p>
        </div>

        <div style={styles.grid}>
          <div style={styles.infoCard}>
            <div style={styles.icon}>
              <MapPin size={28} />
            </div>
            <h3 style={styles.infoTitle}>Visit Us</h3>
            <p style={styles.infoText}>
              Unit-3, Bhubaneswar<br />
              Odisha, India - 751001
            </p>
          </div>

          <div style={styles.infoCard}>
            <div style={styles.icon}>
              <Phone size={28} />
            </div>
            <h3 style={styles.infoTitle}>Call Us</h3>
            <p style={styles.infoText}>
              +91 78478 74670<br />
              Mon-Sat, 10AM - 8PM
            </p>
          </div>

          <div style={styles.infoCard}>
            <div style={styles.icon}>
              <Mail size={28} />
            </div>
            <h3 style={styles.infoTitle}>Email Us</h3>
            <p style={styles.infoText}>
              support@occamart.com<br />
              We reply within 24hrs
            </p>
          </div>

          <div style={styles.infoCard}>
            <div style={styles.icon}>
              <Clock size={28} />
            </div>
            <h3 style={styles.infoTitle}>Business Hours</h3>
            <p style={styles.infoText}>
              Monday - Saturday: 10AM - 8PM<br />
              Sunday: Closed
            </p>
          </div>
        </div>

        <div style={styles.formContainer}>
          <h2 style={styles.formTitle}>Send us a Message</h2>
          
          {success && (
            <div style={styles.successMsg}>
              Message sent successfully! We'll get back to you soon.
            </div>
          )}
          
          {error && (
            <div style={styles.errorMsg}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Your Name *</label>
              <input
                type="text"
                style={styles.input}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email Address *</label>
              <input
                type="email"
                style={styles.input}
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Subject *</label>
              <input
                type="text"
                style={styles.input}
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Message *</label>
              <textarea
                style={styles.textarea}
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                required
              />
            </div>

            <button
              type="submit"
              style={styles.button}
              disabled={submitting}
            >
              {submitting ? 'Sending...' : 'Send Message'}
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;