import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Image,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  MoveUp,
  MoveDown,
  Save,
  X,
  Upload,
  Link as LinkIcon,
  Tag,
  Star,
  Zap,
  Clock,
  Sparkles
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

const AdminHeroBanner = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    badge: '',
    highlight: '',
    category: '',
    buttonText: 'Shop Now',
    buttonLink: '/shop',
    image: '',
    active: true
  });
  
  // Image upload
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

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
    info: '#3B82F6',
    purple: '#8B5CF6',
    indigo: '#6366F1',
    pink: '#EC4899'
  };

  // Function to generate fallback image URL
  const getFallbackImage = (id, width = 80, height = 60) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent('No+Image')}&background=${colors.primary.replace('#', '')}&color=fff&size=${Math.min(width, height)}`;
  };

  // Function to get full image URL
  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return '';
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // If it's a relative path starting with /uploads, prepend the server URL
    if (imagePath.startsWith('/uploads')) {
      return `http://localhost:5000${imagePath}`;
    }
    
    // If it's just a filename, assume it's in uploads
    return `http://localhost:5000/uploads/${imagePath}`;
  };

  // Fetch banners on mount
  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      console.log('📥 Fetching banners...');
      const response = await api.get('/hero-banner');
      console.log('📥 Response:', response.data);
      
      if (response.data.success) {
        setBanners(response.data.data);
      } else {
        setBanners([]);
      }
      setError('');
    } catch (err) {
      console.error('❌ Error fetching banners:', err);
      setError(err.response?.data?.message || 'Failed to fetch banners');
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('📸 Selected file:', file.name, 'Type:', file.type, 'Size:', file.size);
      
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('📸 Image preview created');
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      badge: '',
      highlight: '',
      category: '',
      buttonText: 'Shop Now',
      buttonLink: '/shop',
      image: '',
      active: true
    });
    setImageFile(null);
    setImagePreview('');
    setEditingBanner(null);
  };

  const handleEdit = (banner) => {
    console.log('✏️ Editing banner:', banner);
    setEditingBanner(banner);
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      badge: banner.badge || '',
      highlight: banner.highlight || '',
      category: banner.category || '',
      buttonText: banner.buttonText || 'Shop Now',
      buttonLink: banner.buttonLink || '/shop',
      image: banner.image || '',
      active: banner.active !== false
    });
    
    // Set image preview with full URL
    if (banner.image) {
      setImagePreview(getFullImageUrl(banner.image));
    } else {
      setImagePreview('');
    }
    
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('📝 Form data:', formData);
    console.log('📸 Image file:', imageFile);
    
    // Validate form
    if (!formData.title) {
      setError('Title is required');
      return;
    }

    // For new banners, image is required
    if (!editingBanner && !formData.image && !imageFile) {
      setError('Image is required for new banners');
      return;
    }

    setUploadingImage(true);
    setError('');

    try {
      let imageUrl = formData.image;

      // Upload image if new file selected
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append('image', imageFile);
        
        console.log('📤 Uploading image...');
        const uploadResponse = await api.post('/hero-banner/upload', imageFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        console.log('📥 Upload response:', uploadResponse.data);
        
        if (uploadResponse.data.success) {
          imageUrl = uploadResponse.data.url;
          console.log('✅ Image uploaded, URL:', imageUrl);
        } else {
          throw new Error('Image upload failed');
        }
      }

      const bannerData = {
        ...formData,
        image: imageUrl
      };

      console.log('📤 Submitting banner:', bannerData);

      let response;
      if (editingBanner) {
        // Use _id for MongoDB
        const bannerId = editingBanner._id || editingBanner.id;
        response = await api.put(`/hero-banner/${bannerId}`, bannerData);
        setSuccess('Banner updated successfully!');
      } else {
        response = await api.post('/hero-banner', bannerData);
        setSuccess('Banner created successfully!');
      }

      console.log('📥 Server response:', response.data);

      if (response.data.success) {
        await fetchBanners();
        setShowModal(false);
        resetForm();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('❌ Error saving banner:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save banner');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDelete = async (bannerId) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) {
      return;
    }

    try {
      const response = await api.delete(`/hero-banner/${bannerId}`);
      if (response.data.success) {
        setSuccess('Banner deleted successfully');
        await fetchBanners();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('❌ Error deleting banner:', err);
      setError(err.response?.data?.message || 'Failed to delete banner');
    }
  };

  const handleToggleActive = async (banner) => {
    try {
      const bannerId = banner._id || banner.id;
      const response = await api.patch(`/hero-banner/${bannerId}/toggle`, {
        active: !banner.active
      });
      
      if (response.data.success) {
        setSuccess(`Banner ${!banner.active ? 'activated' : 'deactivated'} successfully`);
        await fetchBanners();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('❌ Error toggling banner:', err);
      setError(err.response?.data?.message || 'Failed to toggle banner status');
    }
  };

  const handleMoveUp = async (index) => {
    if (index === 0) return;
    
    const newBanners = [...banners];
    [newBanners[index - 1], newBanners[index]] = [newBanners[index], newBanners[index - 1]];
    
    try {
      await api.post('/hero-banner/reorder', {
        order: newBanners.map(b => b._id || b.id)
      });
      setBanners(newBanners);
      setSuccess('Banner order updated');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('❌ Error reordering banners:', err);
      setError('Failed to reorder banners');
    }
  };

  const handleMoveDown = async (index) => {
    if (index === banners.length - 1) return;
    
    const newBanners = [...banners];
    [newBanners[index], newBanners[index + 1]] = [newBanners[index + 1], newBanners[index]];
    
    try {
      await api.post('/hero-banner/reorder', {
        order: newBanners.map(b => b._id || b.id)
      });
      setBanners(newBanners);
      setSuccess('Banner order updated');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('❌ Error reordering banners:', err);
      setError('Failed to reorder banners');
    }
  };

  const handleImageError = (e, banner) => {
    console.error('❌ Image failed to load:', e.target.src);
    console.log('Banner data:', banner);
    
    // Try different URL formats
    if (banner.image) {
      // Try with different URL formats
      const possibleUrls = [
        `http://localhost:5000${banner.image}`,
        `http://localhost:5000/uploads/${banner.image}`,
        `http://localhost:5000/${banner.image}`,
        banner.image.startsWith('/') ? `http://localhost:5000${banner.image}` : `http://localhost:5000/uploads/${banner.image}`
      ];
      
      console.log('Trying alternative URLs:', possibleUrls);
      
      // Try the next URL format
      const currentUrl = e.target.src;
      const nextUrlIndex = possibleUrls.findIndex(url => url === currentUrl) + 1;
      
      if (nextUrlIndex < possibleUrls.length) {
        e.target.src = possibleUrls[nextUrlIndex];
        return;
      }
    }
    
    // If all attempts fail, use fallback
    e.target.src = getFallbackImage(banner._id || banner.id);
    e.onerror = null; // Prevent infinite loop
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
      marginBottom: '30px',
      flexWrap: 'wrap',
      gap: '20px'
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
      justifyContent: 'center',
      transition: 'all 0.3s ease'
    },
    title: {
      fontSize: '2rem',
      fontWeight: '700',
      color: colors.textPrimary,
      margin: 0
    },
    subtitle: {
      color: colors.textLight,
      fontSize: '1rem',
      marginTop: '5px'
    },
    addButton: {
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
      gap: '8px',
      transition: 'all 0.3s ease'
    },
    statsBar: {
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
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
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
    tableContainer: {
      background: colors.white,
      borderRadius: '16px',
      border: `1px solid ${colors.border}`,
      overflow: 'auto',
      boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: '1000px'
    },
    th: {
      padding: '15px',
      textAlign: 'left',
      background: colors.bgSecondary,
      color: colors.textPrimary,
      fontWeight: '600',
      fontSize: '0.9rem',
      borderBottom: `2px solid ${colors.border}`
    },
    td: {
      padding: '15px',
      borderBottom: `1px solid ${colors.border}`,
      color: colors.textSecondary
    },
    bannerPreview: {
      width: '80px',
      height: '60px',
      borderRadius: '8px',
      overflow: 'hidden',
      border: `1px solid ${colors.border}`,
      background: colors.bgSecondary
    },
    bannerImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    },
    badge: {
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '0.75rem',
      fontWeight: '600',
      display: 'inline-block'
    },
    activeBadge: {
      background: `${colors.success}15`,
      color: colors.success
    },
    inactiveBadge: {
      background: `${colors.error}15`,
      color: colors.error
    },
    actionButtons: {
      display: 'flex',
      gap: '8px'
    },
    actionButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '6px',
      borderRadius: '6px',
      transition: 'all 0.3s ease',
      color: colors.textLight
    },
    editButton: {
      color: colors.info
    },
    deleteButton: {
      color: colors.error
    },
    toggleButton: {
      color: colors.warning
    },
    moveButton: {
      color: colors.primary
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
      maxWidth: '800px',
      width: '100%',
      maxHeight: '90vh',
      overflowY: 'auto'
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    },
    modalTitle: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: colors.textPrimary
    },
    closeButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '5px',
      color: colors.textLight
    },
    form: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '20px'
    },
    fullWidth: {
      gridColumn: 'span 2'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    label: {
      color: colors.textSecondary,
      fontSize: '0.9rem',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    input: {
      padding: '12px',
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      fontSize: '0.95rem',
      background: colors.bgPrimary,
      transition: 'all 0.3s ease'
    },
    textarea: {
      padding: '12px',
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      fontSize: '0.95rem',
      minHeight: '80px',
      background: colors.bgPrimary,
      resize: 'vertical'
    },
    select: {
      padding: '12px',
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      fontSize: '0.95rem',
      background: colors.bgPrimary
    },
    checkbox: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      cursor: 'pointer'
    },
    imageUploadArea: {
      border: `2px dashed ${colors.border}`,
      borderRadius: '12px',
      padding: '20px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      background: colors.bgSecondary
    },
    imagePreviewContainer: {
      marginTop: '15px',
      position: 'relative',
      borderRadius: '12px',
      overflow: 'hidden',
      maxHeight: '200px'
    },
    imagePreview: {
      width: '100%',
      height: 'auto',
      maxHeight: '200px',
      objectFit: 'contain'
    },
    removeImage: {
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: colors.error,
      color: colors.white,
      border: 'none',
      borderRadius: '50%',
      width: '30px',
      height: '30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer'
    },
    modalActions: {
      display: 'flex',
      gap: '15px',
      marginTop: '30px',
      gridColumn: 'span 2'
    },
    saveButton: {
      flex: 1,
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
      opacity: uploadingImage ? 0.7 : 1
    },
    cancelButton: {
      flex: 1,
      padding: '14px',
      background: colors.white,
      color: colors.textSecondary,
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh'
    },
    debugInfo: {
      fontSize: '0.7rem',
      color: colors.textLight,
      marginTop: '4px',
      wordBreak: 'break-all'
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Loader size={50} color={colors.primary} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const activeBanners = banners.filter(b => b.active).length;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button 
            style={styles.backButton}
            onClick={() => navigate('/admin')}
            onMouseEnter={(e) => e.currentTarget.style.background = colors.bgSecondary}
            onMouseLeave={(e) => e.currentTarget.style.background = colors.white}
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </button>
          <div>
            <h1 style={styles.title}>Hero Banner Management</h1>
            <p style={styles.subtitle}>Manage homepage banners and slides</p>
          </div>
        </div>
        <button 
          style={styles.addButton}
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <Plus size={18} />
          Add New Banner
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div style={{ ...styles.messageBox, ...styles.errorMessage }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ ...styles.messageBox, ...styles.successMessage }}>
          <CheckCircle size={20} />
          <span>{success}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div style={styles.statsBar}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: `${colors.indigo}15` }}>
            <Image size={24} color={colors.indigo} />
          </div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>{banners.length}</div>
            <div style={styles.statLabel}>Total Banners</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: `${colors.success}15` }}>
            <Eye size={24} color={colors.success} />
          </div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>{activeBanners}</div>
            <div style={styles.statLabel}>Active Banners</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: `${colors.error}15` }}>
            <EyeOff size={24} color={colors.error} />
          </div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>{banners.length - activeBanners}</div>
            <div style={styles.statLabel}>Inactive Banners</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: `${colors.primary}15` }}>
            <Zap size={24} color={colors.primary} />
          </div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>{banners.length}</div>
            <div style={styles.statLabel}>Auto-play Slides</div>
          </div>
        </div>
      </div>

      {/* Banners Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Preview</th>
              <th style={styles.th}>Title</th>
              <th style={styles.th}>Badge</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Button Text</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
              <th style={styles.th}>Order</th>
            </tr>
          </thead>
          <tbody>
            {banners.length > 0 ? (
              banners.map((banner, index) => {
                const imageUrl = getFullImageUrl(banner.image);
                console.log(`Banner ${index} image URL:`, imageUrl);
                
                return (
                  <tr key={banner._id || banner.id || index}>
                    <td style={styles.td}>
                      <div style={styles.bannerPreview}>
                        <img 
                          src={imageUrl}
                          alt={banner.title}
                          style={styles.bannerImage}
                          onError={(e) => handleImageError(e, banner)}
                          onLoad={() => console.log(`✅ Image loaded successfully: ${imageUrl}`)}
                        />
                      </div>
                      <div style={styles.debugInfo}>
                        {banner.image}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <strong>{banner.title}</strong>
                      <div style={{ fontSize: '0.8rem', color: colors.textLight, marginTop: '4px' }}>
                        {banner.subtitle}
                      </div>
                    </td>
                    <td style={styles.td}>
                      {banner.badge && (
                        <span style={{
                          background: colors.primary,
                          color: colors.white,
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.7rem'
                        }}>
                          {banner.badge}
                        </span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <Tag size={14} color={colors.textLight} style={{ marginRight: '4px' }} />
                      {banner.category || 'N/A'}
                    </td>
                    <td style={styles.td}>
                      {banner.buttonText}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        ...(banner.active ? styles.activeBadge : styles.inactiveBadge)
                      }}>
                        {banner.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionButtons}>
                        <button
                          style={{ ...styles.actionButton, ...styles.editButton }}
                          onClick={() => handleEdit(banner)}
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          style={{ ...styles.actionButton, ...styles.toggleButton }}
                          onClick={() => handleToggleActive(banner)}
                          title={banner.active ? 'Deactivate' : 'Activate'}
                        >
                          {banner.active ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          style={{ ...styles.actionButton, ...styles.deleteButton }}
                          onClick={() => handleDelete(banner._id || banner.id)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionButtons}>
                        <button
                          style={{ ...styles.actionButton, ...styles.moveButton }}
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          title="Move Up"
                        >
                          <MoveUp size={16} />
                        </button>
                        <button
                          style={{ ...styles.actionButton, ...styles.moveButton }}
                          onClick={() => handleMoveDown(index)}
                          disabled={index === banners.length - 1}
                          title="Move Down"
                        >
                          <MoveDown size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: colors.textLight }}>
                  No banners found. Click "Add New Banner" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={styles.modal} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editingBanner ? 'Edit Banner' : 'Add New Banner'}
              </h2>
              <button style={styles.closeButton} onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              {/* Title */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Star size={16} /> Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="e.g., Summer Collection 2024"
                  required
                />
              </div>

              {/* Subtitle */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Sparkles size={16} /> Subtitle
                </label>
                <input
                  type="text"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="e.g., Discover Your Perfect Style"
                />
              </div>

              {/* Badge */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Zap size={16} /> Badge
                </label>
                <input
                  type="text"
                  name="badge"
                  value={formData.badge}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="e.g., 🔥 HOT DEALS"
                />
              </div>

              {/* Highlight */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Tag size={16} /> Highlight
                </label>
                <input
                  type="text"
                  name="highlight"
                  value={formData.highlight}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="e.g., Up to 50% Off"
                />
              </div>

              {/* Category */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Image size={16} /> Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  style={styles.select}
                >
                  <option value="">Select Category</option>
                  <option value="fashion">Fashion</option>
                  <option value="electronics">Electronics</option>
                  <option value="watches">Watches</option>
                  <option value="sports">Sports</option>
                  <option value="beauty">Beauty</option>
                  <option value="home">Home & Living</option>
                </select>
              </div>

              {/* Button Text */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <LinkIcon size={16} /> Button Text
                </label>
                <input
                  type="text"
                  name="buttonText"
                  value={formData.buttonText}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="Shop Now"
                />
              </div>

              {/* Button Link */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <LinkIcon size={16} /> Button Link
                </label>
                <input
                  type="text"
                  name="buttonLink"
                  value={formData.buttonLink}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="/shop?category=electronics"
                />
              </div>

              {/* Active Status */}
              <div style={styles.formGroup}>
                <label style={styles.checkbox}>
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={handleInputChange}
                  />
                  <span>Active (visible on homepage)</span>
                </label>
              </div>

              {/* Image Upload */}
              <div style={{ ...styles.formGroup, ...styles.fullWidth }}>
                <label style={styles.label}>
                  <Upload size={16} /> Banner Image {!editingBanner && '*'}
                </label>
                
                {!imagePreview ? (
                  <div 
                    style={styles.imageUploadArea}
                    onClick={() => document.getElementById('banner-image').click()}
                  >
                    <Upload size={40} color={colors.primary} />
                    <p style={{ marginTop: '10px', color: colors.textLight }}>
                      Click to upload banner image
                    </p>
                    <p style={{ fontSize: '0.8rem', color: colors.textLight }}>
                      Recommended size: 1200x500px • Max 5MB
                    </p>
                    <input
                      type="file"
                      id="banner-image"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </div>
                ) : (
                  <div style={styles.imagePreviewContainer}>
                    <img 
                      src={imagePreview} 
                      alt="Banner preview"
                      style={styles.imagePreview}
                    />
                    <button
                      type="button"
                      style={styles.removeImage}
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                        setFormData(prev => ({ ...prev, image: '' }));
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  <X size={18} />
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.saveButton}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <>
                      <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      {editingBanner ? 'Update Banner' : 'Save Banner'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Animation keyframes */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default AdminHeroBanner;