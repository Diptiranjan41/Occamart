import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Mail,
  Send,
  Users,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader,
  ArrowLeft,
  Eye,
  XCircle,
  Search,
  UserCheck,
  UserX,
  Code // 🔥 NEW: For HTML mode toggle
} from 'lucide-react';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const AdminNewsletter = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Newsletter stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    unsubscribed: 0
  });

  // Subscribers list
  const [subscribers, setSubscribers] = useState([]);
  const [filteredSubscribers, setFilteredSubscribers] = useState([]);
  
  // Compose email
  const [showCompose, setShowCompose] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  
  // 🔥 NEW: HTML mode toggle
  const [htmlMode, setHtmlMode] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSubscribers, setSelectedSubscribers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Preview
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Colors
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
    purple: '#8B5CF6'
  };

  // Fetch newsletter stats and subscribers
  useEffect(() => {
    fetchNewsletterData();
  }, []);

  // Filter subscribers
  useEffect(() => {
    let filtered = [...subscribers];
    
    if (searchTerm) {
      filtered = filtered.filter(sub => 
        sub.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => {
        if (statusFilter === 'active') {
          return sub.isActive === true;
        } else {
          return sub.isActive === false;
        }
      });
    }
    
    setFilteredSubscribers(filtered);
  }, [searchTerm, statusFilter, subscribers]);

  // Handle select all
  useEffect(() => {
    if (selectAll) {
      setSelectedSubscribers(filteredSubscribers.map(s => s._id));
    } else {
      setSelectedSubscribers([]);
    }
  }, [selectAll, filteredSubscribers]);

  // Fetch data correctly
  const fetchNewsletterData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const statsResponse = await api.get('/newsletter/stats');
      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }
      
      // Fetch all subscribers with proper data
      const subscribersResponse = await api.get('/newsletter/export');
      if (subscribersResponse.data.success) {
        const formattedSubscribers = subscribersResponse.data.data.map(sub => ({
          _id: sub._id || `temp-${Math.random()}`,
          email: sub.email || 'unknown@email.com',
          subscribedDate: sub.subscribedDate || new Date().toISOString().split('T')[0],
          subscribedTime: sub.subscribedTime || '00:00:00',
          isActive: sub.isActive !== undefined ? sub.isActive : true
        }));
        
        console.log('📋 Subscribers loaded:', formattedSubscribers);
        setSubscribers(formattedSubscribers);
        setFilteredSubscribers(formattedSubscribers);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching newsletter data:', err);
      setError('Failed to fetch newsletter data');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FIXED: Send newsletter with HTML content
  const handleSendNewsletter = async () => {
    if (!emailSubject.trim() || !emailContent.trim()) {
      setError('Please enter both subject and content');
      return;
    }

    if (selectedSubscribers.length === 0) {
      setError('Please select at least one subscriber');
      return;
    }

    setSendingEmail(true);
    setError(null);
    setSuccess(null);

    try {
      const selectedEmails = subscribers
        .filter(sub => selectedSubscribers.includes(sub._id))
        .map(sub => sub.email);

      // 🔥 FIXED: Wrap content in proper HTML template if not already HTML
      let finalContent = emailContent;
      
      if (!htmlMode) {
        // If plain text mode, convert to HTML with proper formatting
        finalContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: #EDE8D0;
                margin: 0;
                padding: 20px;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background: #FFFFFF;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                border: 1px solid #D4AF37;
              }
              .header {
                background: linear-gradient(135deg, #D4AF37 0%, #B8962E 100%);
                padding: 30px;
                text-align: center;
              }
              .header h1 {
                color: #1F2937;
                margin: 0;
                font-size: 28px;
              }
              .content {
                padding: 30px;
                color: #1F2937;
                line-height: 1.6;
              }
              .footer {
                background: #EDE8D0;
                padding: 20px;
                text-align: center;
                color: #6B7280;
                font-size: 12px;
              }
              .button {
                display: inline-block;
                background: #D4AF37;
                color: #1F2937;
                text-decoration: none;
                padding: 12px 30px;
                border-radius: 8px;
                font-weight: 600;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>${emailSubject}</h1>
              </div>
              <div class="content">
                ${emailContent.replace(/\n/g, '<br/>')}
              </div>
              <div class="footer">
                <p>© 2026 OccaMart. All rights reserved.</p>
                <p>You're receiving this because you're subscribed to our newsletter.</p>
                <p><a href="http://localhost:5173/unsubscribe" style="color: #D4AF37;">Unsubscribe</a></p>
              </div>
            </div>
          </body>
          </html>
        `;
      }

      const promises = selectedEmails.map(email => 
        api.post('/newsletter/broadcast', {
          email,
          subject: emailSubject,
          content: finalContent // 🔥 Send HTML content
        })
      );

      await Promise.all(promises);
      
      setSuccess(`Newsletter sent to ${selectedEmails.length} subscribers successfully!`);
      setEmailSubject('');
      setEmailContent('');
      setSelectedSubscribers([]);
      setSelectAll(false);
      setShowCompose(false);
      setHtmlMode(false);
      
      fetchNewsletterData();
    } catch (err) {
      console.error('Error sending newsletter:', err);
      setError('Failed to send newsletter. Please try again.');
    } finally {
      setSendingEmail(false);
    }
  };

  // Delete subscriber
  const handleDeleteSubscriber = async (subscriberId, subscriberEmail) => {
    console.log('🗑️ Delete attempt:', { subscriberId, subscriberEmail });
    
    if (!subscriberId || subscriberId.startsWith('temp-')) {
      setError('Invalid subscriber ID - please refresh the page');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${subscriberEmail}?`)) {
      return;
    }

    try {
      console.log('📤 Sending delete request for ID:', subscriberId);
      const response = await api.delete(`/newsletter/${subscriberId}`);
      
      console.log('✅ Delete response:', response.data);
      
      if (response.data.success) {
        setSuccess(`Subscriber ${subscriberEmail} deleted successfully`);
        fetchNewsletterData();
      } else {
        setError(response.data.message || 'Failed to delete subscriber');
      }
    } catch (err) {
      console.error('❌ Delete error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete subscriber';
      setError(errorMessage);
    }
  };

  // Toggle subscriber status
  const handleToggleStatus = async (subscriber) => {
    if (!subscriber._id || subscriber._id.startsWith('temp-')) {
      setError('Invalid subscriber ID - please refresh the page');
      return;
    }

    try {
      const response = await api.put(`/newsletter/${subscriber._id}`, {
        isActive: !subscriber.isActive
      });
      
      if (response.data.success) {
        setSuccess(`Subscriber ${subscriber.email} ${!subscriber.isActive ? 'activated' : 'deactivated'}`);
        fetchNewsletterData();
      }
    } catch (err) {
      console.error('Error toggling status:', err);
      setError('Failed to update subscriber status');
    }
  };

  // 🔥 FIXED: Preview with HTML rendering
  const handlePreview = () => {
    let previewContent = emailContent;
    
    if (!htmlMode) {
      previewContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
          <h2 style="color: #D4AF37;">${emailSubject}</h2>
          <div style="background: white; padding: 20px; border-radius: 8px;">
            ${emailContent.replace(/\n/g, '<br/>')}
          </div>
        </div>
      `;
    }
    
    setPreviewData({
      subject: emailSubject,
      content: previewContent
    });
    setShowPreview(true);
  };

  const handleExportCSV = () => {
    const headers = ['Email', 'Subscribed Date', 'Status'];
    const rows = subscribers.map(sub => [
      sub.email,
      sub.subscribedDate,
      sub.isActive ? 'Active' : 'Inactive'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // 🔥 NEW: Insert HTML template
  const insertHtmlTemplate = () => {
    const template = `
      <div style="background: #f9f9f9; padding: 20px; border-radius: 10px;">
        <h2 style="color: #D4AF37;">Special Offer Just for You!</h2>
        <p>Dear Subscriber,</p>
        <p>We're excited to announce our latest collection...</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://occamart.com/shop" 
             style="background: #D4AF37; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px;">
            Shop Now
          </a>
        </div>
        <p>Thank you for being part of our family!</p>
        <p>Best regards,<br>OccaMart Team</p>
      </div>
    `;
    setEmailContent(template);
    setHtmlMode(true);
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: colors.bgPrimary,
      padding: '30px'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px'
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px'
    },
    backButton: {
      background: colors.white,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      padding: '10px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    title: {
      fontSize: '2rem',
      fontWeight: '700',
      color: colors.textPrimary
    },
    subtitle: {
      color: colors.textLight,
      fontSize: '1rem',
      marginTop: '5px'
    },
    headerActions: {
      display: 'flex',
      gap: '15px'
    },
    actionButton: {
      padding: '12px 24px',
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
      color: colors.white,
      border: 'none',
      borderRadius: '12px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    exportButton: {
      padding: '12px 24px',
      background: colors.white,
      color: colors.textPrimary,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    },
    statCard: {
      background: colors.white,
      padding: '20px',
      borderRadius: '16px',
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
    filtersBar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      padding: '20px',
      background: colors.white,
      borderRadius: '12px',
      border: `1px solid ${colors.border}`
    },
    searchBox: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 15px',
      background: colors.bgPrimary,
      borderRadius: '8px',
      border: `1px solid ${colors.border}`,
      flex: 1,
      maxWidth: '300px'
    },
    searchInput: {
      border: 'none',
      background: 'transparent',
      outline: 'none',
      fontSize: '0.95rem',
      width: '100%'
    },
    filterGroup: {
      display: 'flex',
      gap: '10px'
    },
    select: {
      padding: '8px 12px',
      borderRadius: '8px',
      border: `1px solid ${colors.border}`,
      background: colors.white,
      fontSize: '0.9rem',
      cursor: 'pointer',
      outline: 'none'
    },
    composeSection: {
      background: colors.white,
      borderRadius: '16px',
      border: `1px solid ${colors.border}`,
      padding: '30px',
      marginBottom: '30px'
    },
    composeTitle: {
      fontSize: '1.3rem',
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    composeToolbar: {
      display: 'flex',
      gap: '10px',
      marginBottom: '15px',
      flexWrap: 'wrap'
    },
    toolButton: {
      padding: '8px 12px',
      background: colors.bgSecondary,
      border: `1px solid ${colors.border}`,
      borderRadius: '6px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      fontSize: '0.9rem'
    },
    activeTool: {
      background: colors.primary,
      color: colors.white,
      borderColor: colors.primaryDark
    },
    input: {
      width: '100%',
      padding: '12px',
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      fontSize: '1rem',
      marginBottom: '15px',
      background: colors.bgPrimary
    },
    textarea: {
      width: '100%',
      padding: '12px',
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      fontSize: '1rem',
      minHeight: '300px', // 🔥 Increased height for HTML
      marginBottom: '20px',
      background: colors.bgPrimary,
      fontFamily: htmlMode ? 'monospace' : 'inherit'
    },
    htmlIndicator: {
      fontSize: '0.8rem',
      color: colors.purple,
      marginBottom: '5px',
      display: 'flex',
      alignItems: 'center',
      gap: '5px'
    },
    composeActions: {
      display: 'flex',
      gap: '15px',
      justifyContent: 'flex-end',
      flexWrap: 'wrap'
    },
    previewButton: {
      padding: '12px 24px',
      background: colors.white,
      color: colors.textPrimary,
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      fontSize: '1rem',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    sendButton: {
      padding: '12px 24px',
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
      color: colors.white,
      border: 'none',
      borderRadius: '8px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    tableContainer: {
      background: colors.white,
      borderRadius: '16px',
      border: `1px solid ${colors.border}`,
      overflow: 'auto'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    th: {
      padding: '15px',
      textAlign: 'left',
      background: colors.bgSecondary,
      color: colors.textPrimary,
      fontWeight: '600',
      borderBottom: `2px solid ${colors.border}`
    },
    td: {
      padding: '15px',
      borderBottom: `1px solid ${colors.border}`,
      color: colors.textSecondary
    },
    statusBadge: {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px'
    },
    activeBadge: {
      background: `${colors.success}15`,
      color: colors.success
    },
    inactiveBadge: {
      background: `${colors.error}15`,
      color: colors.error
    },
    checkbox: {
      width: '18px',
      height: '18px',
      cursor: 'pointer'
    },
    actionButtons: {
      display: 'flex',
      gap: '8px'
    },
    actionIcon: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '5px',
      borderRadius: '4px'
    },
    deleteButton: {
      background: 'none',
      border: 'none',
      color: colors.error,
      cursor: 'pointer',
      padding: '5px'
    },
    messageBox: {
      padding: '15px 20px',
      borderRadius: '12px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    successMessage: {
      background: `${colors.success}10`,
      border: `1px solid ${colors.success}`,
      color: colors.success
    },
    errorMessage: {
      background: `${colors.error}10`,
      border: `1px solid ${colors.error}`,
      color: colors.error
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    },
    modalContent: {
      background: colors.white,
      borderRadius: '24px',
      padding: '30px',
      maxWidth: '600px',
      width: '100%',
      maxHeight: '80vh',
      overflowY: 'auto'
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    },
    modalTitle: {
      fontSize: '1.3rem',
      fontWeight: '600',
      color: colors.textPrimary
    },
    closeButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '5px'
    },
    previewContent: {
      padding: '20px',
      background: colors.bgPrimary,
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
      marginBottom: '20px'
    },
    previewSubject: {
      fontSize: '1.2rem',
      fontWeight: '600',
      color: colors.primary,
      marginBottom: '15px'
    },
    previewBody: {
      lineHeight: '1.6',
      color: colors.textPrimary,
      '& img': {
        maxWidth: '100%',
        height: 'auto'
      }
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh'
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Loader size={50} color={colors.primary} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.backButton} onClick={() => navigate('/admin')}>
            <ArrowLeft size={20} color={colors.textPrimary} />
          </button>
          <div>
            <h1 style={styles.title}>Newsletter Management</h1>
            <p style={styles.subtitle}>Total: {stats.total} • Active: {stats.active}</p>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.exportButton} onClick={handleExportCSV}>
            <Download size={18} /> Export
          </button>
          <button style={styles.actionButton} onClick={() => setShowCompose(!showCompose)}>
            <Mail size={18} /> {showCompose ? 'Hide' : 'Compose'}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div style={{ ...styles.messageBox, ...styles.errorMessage }}>
          <AlertCircle size={20} /> {error}
        </div>
      )}
      {success && (
        <div style={{ ...styles.messageBox, ...styles.successMessage }}>
          <CheckCircle size={20} /> {success}
        </div>
      )}

      {/* Compose Section */}
      {showCompose && (
        <div style={styles.composeSection}>
          <h3 style={styles.composeTitle}><Mail size={20} /> Compose Newsletter</h3>
          
          {/* 🔥 NEW: Toolbar */}
          <div style={styles.composeToolbar}>
            <button
              style={{
                ...styles.toolButton,
                ...(htmlMode ? styles.activeTool : {})
              }}
              onClick={() => setHtmlMode(!htmlMode)}
            >
              <Code size={16} /> HTML Mode
            </button>
            <button
              style={styles.toolButton}
              onClick={insertHtmlTemplate}
            >
              Insert Template
            </button>
          </div>

          {htmlMode && (
            <div style={styles.htmlIndicator}>
              <Code size={14} /> HTML Mode Active - You can write HTML directly
            </div>
          )}

          <input
            type="text"
            placeholder="Subject"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            style={styles.input}
          />
          
          <textarea
            placeholder={htmlMode ? "Write HTML content here..." : "Write your newsletter content here..."}
            value={emailContent}
            onChange={(e) => setEmailContent(e.target.value)}
            style={styles.textarea}
          />
          
          <div style={styles.composeActions}>
            <button style={styles.previewButton} onClick={handlePreview}>
              <Eye size={18} /> Preview
            </button>
            <button
              style={styles.sendButton}
              onClick={handleSendNewsletter}
              disabled={sendingEmail || selectedSubscribers.length === 0}
            >
              {sendingEmail ? <Loader size={18} /> : <Send size={18} />}
              Send to {selectedSubscribers.length}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={styles.filtersBar}>
        <div style={styles.searchBox}>
          <Search size={18} color={colors.textLight} />
          <input
            type="text"
            placeholder="Search email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.filterGroup}>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={styles.select}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button style={styles.exportButton} onClick={fetchNewsletterData}>
            <RefreshCw size={18} /> Refresh
          </button>
        </div>
      </div>

      {/* Subscribers Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th} width="40px">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => setSelectAll(e.target.checked)}
                  style={styles.checkbox}
                />
              </th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Subscribed</th>
              <th style={styles.th} width="100px">Status</th>
              <th style={styles.th} width="100px">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubscribers.map((sub) => (
              <tr key={sub._id}>
                <td style={styles.td}>
                  <input
                    type="checkbox"
                    checked={selectedSubscribers.includes(sub._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSubscribers([...selectedSubscribers, sub._id]);
                      } else {
                        setSelectedSubscribers(selectedSubscribers.filter(id => id !== sub._id));
                      }
                    }}
                    style={styles.checkbox}
                  />
                </td>
                <td style={styles.td}>{sub.email}</td>
                <td style={styles.td}>{sub.subscribedDate}</td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.statusBadge,
                    ...(sub.isActive ? styles.activeBadge : styles.inactiveBadge)
                  }}>
                    {sub.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {sub.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={styles.td}>
                  <div style={styles.actionButtons}>
                    <button
                      style={{
                        ...styles.actionIcon,
                        color: sub.isActive ? colors.warning : colors.success
                      }}
                      onClick={() => handleToggleStatus(sub)}
                      title={sub.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {sub.isActive ? <UserX size={18} /> : <UserCheck size={18} />}
                    </button>
                    <button
                      style={styles.deleteButton}
                      onClick={() => handleDeleteSubscriber(sub._id, sub.email)}
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Preview Modal */}
      {showPreview && previewData && (
        <div style={styles.modal} onClick={() => setShowPreview(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Preview</h3>
              <button style={styles.closeButton} onClick={() => setShowPreview(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <div style={styles.previewContent}>
              <div style={styles.previewSubject}>{previewData.subject}</div>
              <div 
                style={styles.previewBody}
                dangerouslySetInnerHTML={{ __html: previewData.content }}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminNewsletter;