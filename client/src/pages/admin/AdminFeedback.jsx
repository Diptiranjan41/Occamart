import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  MessageSquare,
  Star,
  Eye,
  Trash2,
  RefreshCw,
  ArrowLeft,
  Loader,
  AlertCircle,
  Search,
  CheckCircle,
  XCircle,
  Filter,
  Clock,
  User,
  Mail
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

const AdminFeedback = () => {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    read: 0,
    replied: 0,
    averageRating: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

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
    warning: '#F59E0B',
    info: '#3B82F6',
    purple: '#8B5CF6',
    pink: '#EC4899'
  };

  useEffect(() => {
    fetchFeedback();
    fetchStats();
  }, []);

  useEffect(() => {
    let filtered = [...feedback];
    
    if (searchTerm) {
      filtered = filtered.filter(f => 
        f.feedback?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(f => f.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(f => f.category === categoryFilter);
    }
    
    setFiltered(filtered);
  }, [searchTerm, statusFilter, categoryFilter, feedback]);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const response = await api.get('/feedback');
      setFeedback(response.data.data || []);
      setFiltered(response.data.data || []);
    } catch (err) {
      setError('Failed to fetch feedback');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/feedback/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/feedback/${id}/status`, { status });
      fetchFeedback();
      fetchStats();
    } catch (err) {
      setError('Failed to update status');
    }
  };

  const deleteFeedback = async (id) => {
    if (!window.confirm('Delete this feedback?')) return;
    try {
      await api.delete(`/feedback/${id}`);
      fetchFeedback();
      fetchStats();
    } catch (err) {
      setError('Failed to delete feedback');
    }
  };

  const getCategoryBadge = (category) => {
    const badges = {
      quick: { color: colors.purple, label: '⚡ Quick' },
      general: { color: colors.info, label: '📝 General' },
      product: { color: colors.success, label: '📦 Product' },
      service: { color: colors.warning, label: '🤝 Service' },
      website: { color: colors.pink, label: '💻 Website' },
      delivery: { color: colors.primary, label: '🚚 Delivery' },
      other: { color: colors.textLight, label: '🔄 Other' }
    };
    return badges[category] || badges.general;
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
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    },
    statCard: {
      background: colors.white,
      padding: '20px',
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
      display: 'flex',
      alignItems: 'center',
      gap: '15px'
    },
    statIcon: {
      width: '50px',
      height: '50px',
      background: `${colors.primary}15`,
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: colors.primary
    },
    statInfo: {
      flex: 1
    },
    statValue: {
      fontSize: '1.8rem',
      fontWeight: '700',
      color: colors.textPrimary
    },
    statLabel: {
      color: colors.textLight,
      fontSize: '0.9rem'
    },
    filters: {
      display: 'flex',
      gap: '15px',
      marginBottom: '20px',
      padding: '20px',
      background: colors.white,
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
      flexWrap: 'wrap'
    },
    searchBox: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '8px 15px',
      background: colors.bgPrimary,
      borderRadius: '8px',
      border: `1px solid ${colors.border}`,
      flex: 1,
      minWidth: '250px'
    },
    searchInput: {
      border: 'none',
      background: 'transparent',
      outline: 'none',
      width: '100%'
    },
    select: {
      padding: '8px 15px',
      borderRadius: '8px',
      border: `1px solid ${colors.border}`,
      background: colors.white,
      minWidth: '120px'
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
      borderBottom: `2px solid ${colors.border}`,
      fontWeight: '600'
    },
    td: {
      padding: '15px',
      borderBottom: `1px solid ${colors.border}`
    },
    statusBadge: {
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '0.8rem',
      fontWeight: '600',
      display: 'inline-block'
    },
    rating: {
      display: 'flex',
      gap: '2px'
    },
    quickBadge: {
      background: `${colors.purple}15`,
      color: colors.purple,
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '0.7rem',
      fontWeight: '600',
      marginLeft: '5px'
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
        <h1 style={styles.title}>Feedback Management</h1>
      </div>

      {error && (
        <div style={{ color: colors.error, marginBottom: '20px' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <MessageSquare size={24} />
          </div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>{stats.total}</div>
            <div style={styles.statLabel}>Total Feedback</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: `${colors.warning}15`, color: colors.warning }}>
            <Clock size={24} />
          </div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>{stats.new}</div>
            <div style={styles.statLabel}>New</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: `${colors.info}15`, color: colors.info }}>
            <Eye size={24} />
          </div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>{stats.read}</div>
            <div style={styles.statLabel}>Read</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: `${colors.success}15`, color: colors.success }}>
            <CheckCircle size={24} />
          </div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>{stats.replied}</div>
            <div style={styles.statLabel}>Replied</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: `${colors.primary}15`, color: colors.primary }}>
            <Star size={24} />
          </div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>{stats.averageRating}</div>
            <div style={styles.statLabel}>Avg Rating</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <div style={styles.searchBox}>
          <Search size={18} color={colors.textLight} />
          <input
            style={styles.searchInput}
            placeholder="Search feedback..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          style={styles.select}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
        </select>
        <select
          style={styles.select}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="quick">⚡ Quick</option>
          <option value="general">📝 General</option>
          <option value="product">📦 Product</option>
          <option value="service">🤝 Service</option>
          <option value="website">💻 Website</option>
          <option value="delivery">🚚 Delivery</option>
        </select>
        <button style={styles.select} onClick={() => {
          fetchFeedback();
          fetchStats();
        }}>
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Feedback Table */}
      <div style={styles.table}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={styles.th}>Rating</th>
              <th style={styles.th}>Feedback</th>
              <th style={styles.th}>User</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Page</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const category = getCategoryBadge(item.category);
              return (
                <tr key={item._id}>
                  <td style={styles.td}>
                    <div style={styles.rating}>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          color={i < item.rating ? colors.primary : colors.border}
                          fill={i < item.rating ? colors.primary : 'none'}
                        />
                      ))}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={{ maxWidth: '300px' }}>
                      {item.feedback}
                      {item.category === 'quick' && (
                        <span style={styles.quickBadge}>⚡ Quick</span>
                      )}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div>
                      <strong>{item.name || 'Anonymous'}</strong>
                      {item.email && <div><small>{item.email}</small></div>}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      background: `${category.color}15`,
                      color: category.color
                    }}>
                      {category.label}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <small>{item.page || 'N/A'}</small>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      background: item.status === 'new' ? colors.warning + '20' :
                                 item.status === 'read' ? colors.info + '20' :
                                 colors.success + '20',
                      color: item.status === 'new' ? colors.warning :
                             item.status === 'read' ? colors.info :
                             colors.success
                    }}>
                      {item.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <small>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </small>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        onClick={() => updateStatus(item._id, 'read')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        title="Mark as read"
                      >
                        <Eye size={16} color={colors.info} />
                      </button>
                      <button
                        onClick={() => updateStatus(item._id, 'replied')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        title="Mark as replied"
                      >
                        <CheckCircle size={16} color={colors.success} />
                      </button>
                      <button
                        onClick={() => deleteFeedback(item._id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        title="Delete"
                      >
                        <Trash2 size={16} color={colors.error} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminFeedback;