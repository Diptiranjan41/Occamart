import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Star,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  ArrowLeft,
  Loader,
  AlertCircle,
  Search,
  Filter,
  User,
  Calendar,
  MessageSquare
} from 'lucide-react';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const AdminReviews = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');

  const colors = {
    bgPrimary: '#FAF7F2',
    bgSecondary: '#F5F0E8',
    primary: '#D4AF37',
    textPrimary: '#1F2937',
    textLight: '#6B7280',
    border: '#E5E7EB',
    white: '#FFFFFF',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B'
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    let filtered = [...reviews];
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (ratingFilter !== 'all') {
      filtered = filtered.filter(r => r.rating === parseInt(ratingFilter));
    }
    setFilteredReviews(filtered);
  }, [searchTerm, ratingFilter, reviews]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reviews');
      setReviews(response.data.data || []);
      setFilteredReviews(response.data.data || []);
    } catch (err) {
      setError('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const deleteReview = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await api.delete(`/reviews/${id}`);
      fetchReviews();
    } catch (err) {
      setError('Failed to delete review');
    }
  };

  const styles = {
    container: {
      padding: '30px',
      background: colors.bgPrimary,
      minHeight: '100vh'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      marginBottom: '30px'
    },
    backButton: {
      background: colors.white,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      padding: '10px',
      cursor: 'pointer'
    },
    title: {
      fontSize: '2rem',
      fontWeight: '700',
      color: colors.textPrimary,
      margin: 0
    },
    searchBox: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '8px 15px',
      background: colors.white,
      borderRadius: '8px',
      border: `1px solid ${colors.border}`,
      marginBottom: '20px'
    },
    searchInput: {
      border: 'none',
      background: 'transparent',
      outline: 'none',
      width: '100%'
    },
    table: {
      background: colors.white,
      borderRadius: '16px',
      border: `1px solid ${colors.border}`,
      overflow: 'auto'
    },
    th: {
      padding: '15px',
      textAlign: 'left',
      background: colors.bgSecondary,
      borderBottom: `2px solid ${colors.border}`
    },
    td: {
      padding: '15px',
      borderBottom: `1px solid ${colors.border}`
    },
    rating: {
      display: 'flex',
      gap: '2px'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Loader size={40} color={colors.primary} />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate('/admin')}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={styles.title}>Manage Reviews</h1>
      </div>

      {error && (
        <div style={{ color: colors.error, marginBottom: '20px' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div style={styles.searchBox}>
        <Search size={18} color={colors.textLight} />
        <input
          style={styles.searchInput}
          placeholder="Search reviews..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          style={{ border: 'none', outline: 'none' }}
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
        >
          <option value="all">All Ratings</option>
          <option value="5">5 Star</option>
          <option value="4">4 Star</option>
          <option value="3">3 Star</option>
          <option value="2">2 Star</option>
          <option value="1">1 Star</option>
        </select>
        <button onClick={fetchReviews} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <RefreshCw size={18} />
        </button>
      </div>

      <div style={styles.table}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={styles.th}>Product</th>
              <th style={styles.th}>User</th>
              <th style={styles.th}>Rating</th>
              <th style={styles.th}>Review</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReviews.map((review) => (
              <tr key={review._id}>
                <td style={styles.td}>{review.product?.name || 'N/A'}</td>
                <td style={styles.td}>{review.user?.name || review.name || 'Anonymous'}</td>
                <td style={styles.td}>
                  <div style={styles.rating}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        color={i < review.rating ? colors.primary : colors.border}
                        fill={i < review.rating ? colors.primary : 'none'}
                      />
                    ))}
                  </div>
                </td>
                <td style={styles.td}>{review.comment}</td>
                <td style={styles.td}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </td>
                <td style={styles.td}>
                  <button
                    onClick={() => deleteReview(review._id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.error }}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminReviews; // ✅ Default export