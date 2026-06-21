// src/pages/admin/ManageProducts.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Package,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader,
  AlertCircle,
  CheckCircle,
  X,
  Upload,
  Star,
  Zap,
  Clock,
  Save,
  Image as ImageIcon,
  DollarSign,
  Tag,
  Box,
  TrendingUp,
  Award
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const ManageProducts = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [deletingId, setDeletingId] = useState(null); // 🔥 NEW: Track deleting product

  // Form state
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    countInStock: '',
    brand: '',
    isDeal: false,
    dealPrice: '',
    dealEnds: '',
    isFeatured: false,
    isTrending: false,
    images: []
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

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
    deal: '#FF6B6B',
    featured: '#D4AF37',
    trending: '#FF8C42'
  };

  const categories = [
    'Electronics', 'Fashion', 'Home & Living', 'Beauty', 
    'Sports', 'Books', 'Toys', 'Gifts', 'Automotive', 'Health'
  ];

  useEffect(() => {
    fetchProducts();
  }, [currentPage, selectedCategory, selectedSection]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = '/products?';
      const params = new URLSearchParams();
      
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      
      if (selectedSection !== 'all') {
        params.append(selectedSection, 'true');
      }
      
      params.append('page', currentPage);
      params.append('limit', 10);
      
      const response = await api.get(`/products?${params.toString()}`);
      
      if (response.data.products) {
        setProducts(response.data.products);
        setFilteredProducts(response.data.products);
        setTotalPages(response.data.pages || 1);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setMessage({ type: 'error', text: 'Failed to fetch products' });
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FIXED: Enhanced delete function with better error handling
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    setDeletingId(productId);
    setMessage({ type: '', text: '' }); // Clear previous messages
    
    try {
      console.log('🗑️ Deleting product:', productId);
      
      const response = await api.delete(`/products/${productId}`);
      
      console.log('✅ Delete response:', response.data);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Product deleted successfully' });
        
        // Remove from local state immediately for better UX
        setProducts(prev => prev.filter(p => p._id !== productId));
        setFilteredProducts(prev => prev.filter(p => p._id !== productId));
        
        // Refresh products list to ensure sync with backend
        setTimeout(() => {
          fetchProducts();
        }, 500);
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Failed to delete product' });
      }
    } catch (error) {
      console.error('❌ Error deleting product:', error);
      
      // Better error message from backend response
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to delete product. Please try again.';
      
      setMessage({ type: 'error', text: errorMessage });
      
      // Refresh products list to ensure UI is in sync
      fetchProducts();
    } finally {
      setDeletingId(null);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 5) {
      setMessage({ type: 'error', text: 'Maximum 5 images allowed' });
      return;
    }

    const previews = files.map(file => URL.createObjectURL(file));
    setSelectedFiles(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...previews]);
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      const formData = new FormData();
      
      // Append all product data
      Object.keys(productForm).forEach(key => {
        if (key !== 'images') {
          if (typeof productForm[key] === 'boolean') {
            formData.append(key, productForm[key].toString());
          } else if (productForm[key]) {
            formData.append(key, productForm[key]);
          }
        }
      });
      
      // Append images
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });

      let response;
      if (selectedProduct) {
        response = await api.put(`/products/${selectedProduct._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setMessage({ type: 'success', text: 'Product updated successfully' });
      } else {
        response = await api.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setMessage({ type: 'success', text: 'Product added successfully' });
      }

      if (response.data.success) {
        setShowAddModal(false);
        setShowEditModal(false);
        resetForm();
        fetchProducts();
      }
    } catch (error) {
      console.error('Error saving product:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save product' });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setProductForm({
      name: '', description: '', price: '', category: '', countInStock: '', brand: '',
      isDeal: false, dealPrice: '', dealEnds: '', isFeatured: false, isTrending: false, images: []
    });
    setSelectedFiles([]);
    setImagePreviews([]);
    setSelectedProduct(null);
  };

  // 🔥 FIXED: SVG placeholder instead of external URL
  const getImageSrc = (product) => {
    if (product.image) {
      return product.image.startsWith('http') ? product.image : `${API_URL.replace('/api', '')}${product.image}`;
    }
    if (product.images && product.images.length > 0) {
      const img = product.images[0];
      return img.startsWith('http') ? img : `${API_URL.replace('/api', '')}${img}`;
    }
    // Return data URI for a simple placeholder
    return 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'50\' height=\'50\' viewBox=\'0 0 50 50\'%3E%3Crect width=\'50\' height=\'50\' fill=\'%23F5F0E8\'/%3E%3Ctext x=\'10\' y=\'30\' font-family=\'Arial\' font-size=\'12\' fill=\'%23D4AF37\'%3ENo img%3C/text%3E%3C/svg%3E';
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: colors.bgPrimary,
      padding: '30px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
      flexWrap: 'wrap',
      gap: '20px',
    },
    title: {
      fontSize: '2rem',
      fontWeight: '700',
      color: colors.textPrimary,
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
    },
    filtersBar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      flexWrap: 'wrap',
      gap: '15px',
      padding: '20px',
      background: colors.white,
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
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
      minWidth: '250px',
    },
    searchInput: {
      border: 'none',
      background: 'transparent',
      outline: 'none',
      fontSize: '0.95rem',
      width: '100%',
    },
    filterGroup: {
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap',
    },
    select: {
      padding: '8px 12px',
      borderRadius: '8px',
      border: `1px solid ${colors.border}`,
      background: colors.white,
      cursor: 'pointer',
      outline: 'none',
    },
    statsRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '15px',
      marginBottom: '20px',
    },
    statCard: {
      background: colors.white,
      padding: '15px',
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    statIcon: {
      width: '40px',
      height: '40px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    tableContainer: {
      background: colors.white,
      borderRadius: '16px',
      border: `1px solid ${colors.border}`,
      overflow: 'auto',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: '1000px',
    },
    th: {
      padding: '15px',
      textAlign: 'left',
      background: colors.bgSecondary,
      color: colors.textPrimary,
      fontWeight: '600',
      borderBottom: `2px solid ${colors.border}`,
    },
    td: {
      padding: '15px',
      borderBottom: `1px solid ${colors.border}`,
    },
    productImage: {
      width: '50px',
      height: '50px',
      borderRadius: '8px',
      objectFit: 'cover',
      background: colors.bgSecondary,
    },
    badge: {
      padding: '4px 8px',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
    },
    actionButtons: {
      display: 'flex',
      gap: '8px',
    },
    actionButton: {
      padding: '6px',
      background: colors.bgSecondary,
      border: `1px solid ${colors.border}`,
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      position: 'relative',
    },
    actionButtonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
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
      padding: '20px',
    },
    modalContent: {
      background: colors.white,
      borderRadius: '24px',
      padding: '30px',
      maxWidth: '800px',
      width: '100%',
      maxHeight: '90vh',
      overflowY: 'auto',
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
    },
    modalTitle: {
      fontSize: '1.5rem',
      fontWeight: '600',
      color: colors.textPrimary,
    },
    closeButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '5px',
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '20px',
    },
    fullWidth: {
      gridColumn: 'span 2',
    },
    formGroup: {
      marginBottom: '15px',
    },
    label: {
      display: 'block',
      marginBottom: '5px',
      color: colors.textSecondary,
      fontWeight: '500',
    },
    input: {
      width: '100%',
      padding: '10px',
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      fontSize: '0.95rem',
    },
    checkboxGroup: {
      padding: '15px',
      background: colors.bgSecondary,
      borderRadius: '8px',
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '10px',
      cursor: 'pointer',
    },
    imageUploadArea: {
      border: `2px dashed ${colors.primary}`,
      borderRadius: '12px',
      padding: '20px',
      textAlign: 'center',
      cursor: 'pointer',
      marginBottom: '15px',
    },
    imagePreviewGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
      gap: '10px',
      marginTop: '10px',
    },
    imagePreview: {
      position: 'relative',
      paddingTop: '100%',
      borderRadius: '8px',
      overflow: 'hidden',
    },
    previewImg: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    removeImageBtn: {
      position: 'absolute',
      top: '2px',
      right: '2px',
      width: '20px',
      height: '20px',
      background: colors.error,
      color: colors.white,
      border: 'none',
      borderRadius: '50%',
      cursor: 'pointer',
    },
    submitButton: {
      width: '100%',
      padding: '12px',
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
      color: colors.white,
      border: 'none',
      borderRadius: '8px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      marginTop: '20px',
    },
    messageBox: {
      padding: '12px 20px',
      borderRadius: '8px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    successMessage: {
      background: `${colors.success}10`,
      border: `1px solid ${colors.success}`,
      color: colors.success,
    },
    errorMessage: {
      background: `${colors.error}10`,
      border: `1px solid ${colors.error}`,
      color: colors.error,
    },
    pagination: {
      display: 'flex',
      justifyContent: 'center',
      gap: '10px',
      marginTop: '20px',
    },
    pageButton: {
      padding: '8px 12px',
      border: `1px solid ${colors.border}`,
      background: colors.white,
      borderRadius: '8px',
      cursor: 'pointer',
    },
    activePage: {
      background: colors.primary,
      color: colors.white,
      borderColor: colors.primary,
    },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Manage Products</h1>
        <button 
          style={styles.addButton}
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
        >
          <Plus size={20} />
          Add New Product
        </button>
      </div>

      {/* Messages */}
      {message.text && (
        <div style={{
          ...styles.messageBox,
          ...(message.type === 'success' ? styles.successMessage : styles.errorMessage)
        }}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Stats Row */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: `${colors.primary}15` }}>
            <Package size={20} color={colors.primary} />
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>{products.length}</div>
            <div style={{ fontSize: '0.8rem', color: colors.textLight }}>Total Products</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: `${colors.deal}15` }}>
            <Clock size={20} color={colors.deal} />
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>
              {products.filter(p => p.isDeal).length}
            </div>
            <div style={{ fontSize: '0.8rem', color: colors.textLight }}>Deals</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: `${colors.featured}15` }}>
            <Star size={20} color={colors.featured} />
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>
              {products.filter(p => p.isFeatured).length}
            </div>
            <div style={{ fontSize: '0.8rem', color: colors.textLight }}>Featured</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: `${colors.trending}15` }}>
            <Zap size={20} color={colors.trending} />
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>
              {products.filter(p => p.isTrending).length}
            </div>
            <div style={{ fontSize: '0.8rem', color: colors.textLight }}>Trending</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filtersBar}>
        <div style={styles.searchBox}>
          <Search size={18} color={colors.textLight} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterGroup}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={styles.select}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            style={styles.select}
          >
            <option value="all">All Sections</option>
            <option value="isDeal">Deals</option>
            <option value="isFeatured">Featured</option>
            <option value="isTrending">Trending</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Image</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Price</th>
              <th style={styles.th}>Stock</th>
              <th style={styles.th}>Sections</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                  <Loader size={40} style={{ animation: 'spin 1s linear infinite' }} />
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: colors.textLight }}>
                  No products found
                </td>
              </tr>
            ) : (
              filteredProducts.map(product => (
                <tr key={product._id}>
                  <td style={styles.td}>
                    <img
                      src={getImageSrc(product)}
                      alt={product.name}
                      style={styles.productImage}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'50\' height=\'50\' viewBox=\'0 0 50 50\'%3E%3Crect width=\'50\' height=\'50\' fill=\'%23F5F0E8\'/%3E%3Ctext x=\'10\' y=\'30\' font-family=\'Arial\' font-size=\'12\' fill=\'%23D4AF37\'%3ENo img%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </td>
                  <td style={styles.td}>
                    <div style={{ fontWeight: '500' }}>{product.name}</div>
                    <div style={{ fontSize: '0.8rem', color: colors.textLight }}>{product.brand}</div>
                  </td>
                  <td style={styles.td}>{product.category}</td>
                  <td style={styles.td}>
                    <strong style={{ color: colors.primary }}>₹{product.price}</strong>
                    {product.isDeal && product.dealPrice && (
                      <div style={{ fontSize: '0.8rem', color: colors.deal }}>
                        Deal: ₹{product.dealPrice}
                      </div>
                    )}
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      background: product.countInStock > 10 ? `${colors.success}15` :
                                 product.countInStock > 0 ? `${colors.warning}15` : `${colors.error}15`,
                      color: product.countInStock > 10 ? colors.success :
                             product.countInStock > 0 ? colors.warning : colors.error
                    }}>
                      {product.countInStock}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      {product.isDeal && (
                        <span style={{ ...styles.badge, background: `${colors.deal}15`, color: colors.deal }}>
                          <Clock size={12} /> Deal
                        </span>
                      )}
                      {product.isFeatured && (
                        <span style={{ ...styles.badge, background: `${colors.featured}15`, color: colors.featured }}>
                          <Star size={12} /> Featured
                        </span>
                      )}
                      {product.isTrending && (
                        <span style={{ ...styles.badge, background: `${colors.trending}15`, color: colors.trending }}>
                          <Zap size={12} /> Trending
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actionButtons}>
                      <button
                        style={styles.actionButton}
                        onClick={() => navigate(`/product/${product._id}`)}
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        style={styles.actionButton}
                        onClick={() => {
                          setSelectedProduct(product);
                          setProductForm({
                            name: product.name,
                            description: product.description,
                            price: product.price,
                            category: product.category,
                            countInStock: product.countInStock,
                            brand: product.brand || '',
                            isDeal: product.isDeal || false,
                            dealPrice: product.dealPrice || '',
                            dealEnds: product.dealEnds || '',
                            isFeatured: product.isFeatured || false,
                            isTrending: product.isTrending || false,
                          });
                          setShowEditModal(true);
                        }}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        style={{
                          ...styles.actionButton,
                          color: colors.error,
                          ...(deletingId === product._id ? styles.actionButtonDisabled : {})
                        }}
                        onClick={() => handleDeleteProduct(product._id)}
                        disabled={deletingId === product._id}
                        title="Delete"
                      >
                        {deletingId === product._id ? (
                          <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            style={styles.pageButton}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
          </button>
          
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              style={{
                ...styles.pageButton,
                ...(currentPage === i + 1 ? styles.activePage : {})
              }}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          
          <button
            style={styles.pageButton}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {(showAddModal || showEditModal) && (
        <div style={styles.modal} onClick={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          resetForm();
        }}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {showAddModal ? 'Add New Product' : 'Edit Product'}
              </h2>
              <button
                style={styles.closeButton}
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={styles.formGrid}>
                {/* Left Column */}
                <div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Product Name *</label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                      style={styles.input}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Price (₹) *</label>
                    <input
                      type="number"
                      value={productForm.price}
                      onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                      style={styles.input}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Category *</label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                      style={styles.input}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Brand</label>
                    <input
                      type="text"
                      value={productForm.brand}
                      onChange={(e) => setProductForm({...productForm, brand: e.target.value})}
                      style={styles.input}
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Description *</label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                      style={{ ...styles.input, minHeight: '100px' }}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Stock Quantity *</label>
                    <input
                      type="number"
                      value={productForm.countInStock}
                      onChange={(e) => setProductForm({...productForm, countInStock: e.target.value})}
                      style={styles.input}
                      min="0"
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Product Sections</label>
                    <div style={styles.checkboxGroup}>
                      <label style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={productForm.isDeal}
                          onChange={(e) => setProductForm({...productForm, isDeal: e.target.checked})}
                        />
                        <Clock size={16} color={colors.deal} />
                        Limited Time Deal
                      </label>

                      {productForm.isDeal && (
                        <div style={{ marginLeft: '20px', marginTop: '10px' }}>
                          <input
                            type="number"
                            placeholder="Deal Price"
                            value={productForm.dealPrice}
                            onChange={(e) => setProductForm({...productForm, dealPrice: e.target.value})}
                            style={{ ...styles.input, marginBottom: '10px' }}
                          />
                          <input
                            type="datetime-local"
                            value={productForm.dealEnds}
                            onChange={(e) => setProductForm({...productForm, dealEnds: e.target.value})}
                            style={styles.input}
                          />
                        </div>
                      )}

                      <label style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={productForm.isFeatured}
                          onChange={(e) => setProductForm({...productForm, isFeatured: e.target.checked})}
                        />
                        <Star size={16} color={colors.featured} />
                        Featured Product
                      </label>

                      <label style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={productForm.isTrending}
                          onChange={(e) => setProductForm({...productForm, isTrending: e.target.checked})}
                        />
                        <Zap size={16} color={colors.trending} />
                        Trending Product
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Product Images</label>
                <div
                  style={styles.imageUploadArea}
                  onClick={() => document.getElementById('imageInput').click()}
                >
                  <Upload size={30} color={colors.primary} />
                  <p style={{ marginTop: '10px', color: colors.textLight }}>
                    Click to upload images (max 5)
                  </p>
                </div>
                <input
                  id="imageInput"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />

                {imagePreviews.length > 0 && (
                  <div style={styles.imagePreviewGrid}>
                    {imagePreviews.map((preview, index) => (
                      <div key={index} style={styles.imagePreview}>
                        <img src={preview} alt={`Preview ${index}`} style={styles.previewImg} />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          style={styles.removeImageBtn}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                style={styles.submitButton}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  showAddModal ? 'Add Product' : 'Update Product'
                )}
              </button>
            </form>
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

export default ManageProducts;