// src/pages/admin/ManageProducts.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Package, Search, Plus, Edit, Trash2, Eye, ChevronLeft, ChevronRight,
  Loader, AlertCircle, CheckCircle, X, Upload, Star, Zap, Clock, Ruler
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';
const SERVER_URL = API_URL.replace('/api', '');

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---------- Size presets (category ke hisaab se) ----------
const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const SHOE_SIZES = ['5', '6', '7', '8', '9', '10', '11', '12'];

const getPresetSizes = (category) => {
  if (category === 'Fashion') return CLOTHING_SIZES;
  if (category === 'Sports') return [...CLOTHING_SIZES, ...SHOE_SIZES];
  return []; // baaki categories me sirf custom size
};

const emptyForm = {
  name: '', description: '', price: '', category: '', countInStock: '', brand: '',
  isDeal: false, dealPrice: '', dealEnds: '',
  isFeatured: false, isTrending: false,
  rating: '', numReviews: '',
  sizes: [] // [{ size: 'M', stock: 10 }]
};

const toLocalInput = (d) => {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date)) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Crect width='50' height='50' fill='%23F5F0E8'/%3E%3Ctext x='10' y='30' font-family='Arial' font-size='12' fill='%23D4AF37'%3ENo img%3C/text%3E%3C/svg%3E";

const toSrc = (img) => (img?.startsWith('http') ? img : `${SERVER_URL}${img}`);

const getImageSrc = (product) => {
  if (product.image) return toSrc(product.image);
  if (product.images?.length > 0) return toSrc(product.images[0]);
  return PLACEHOLDER;
};

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
  const [deletingId, setDeletingId] = useState(null);

  const [productForm, setProductForm] = useState(emptyForm);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [customSize, setCustomSize] = useState('');

  const colors = {
    bgPrimary: '#FAF7F2', bgSecondary: '#F5F0E8', primary: '#D4AF37', primaryDark: '#B8962E',
    textPrimary: '#1F2937', textSecondary: '#4B5563', textLight: '#6B7280', border: '#E5E7EB',
    white: '#FFFFFF', success: '#10B981', error: '#EF4444', warning: '#F59E0B',
    deal: '#FF6B6B', featured: '#D4AF37', trending: '#FF8C42'
  };

  const categories = [
    'Electronics', 'Fashion', 'Home & Living', 'Beauty',
    'Sports', 'Books', 'Toys', 'Gifts', 'Automotive', 'Health'
  ];

  // ---------- Fetch ----------
  useEffect(() => { fetchProducts(); /* eslint-disable-next-line */ }, [currentPage, selectedCategory, selectedSection]);

  useEffect(() => { setCurrentPage(1); }, [selectedCategory, selectedSection]);

  useEffect(() => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      setFilteredProducts(products.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      ));
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);

  // message auto hide
  useEffect(() => {
    if (!message.text) return;
    const t = setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    return () => clearTimeout(t);
  }, [message]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedSection !== 'all') params.append(selectedSection, 'true');
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

  // ---------- Delete ----------
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
    setDeletingId(productId);
    setMessage({ type: '', text: '' });
    try {
      const response = await api.delete(`/products/${productId}`);
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Product deleted successfully' });
        setProducts(prev => prev.filter(p => p._id !== productId));
        setFilteredProducts(prev => prev.filter(p => p._id !== productId));
        setTimeout(fetchProducts, 500);
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Failed to delete product' });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || error.response?.data?.error || 'Failed to delete product. Please try again.'
      });
      fetchProducts();
    } finally {
      setDeletingId(null);
    }
  };

  // ---------- Images ----------
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length + existingImages.length > 5) {
      setMessage({ type: 'error', text: 'Maximum 5 images allowed' });
      return;
    }
    const previews = files.map(file => URL.createObjectURL(file));
    setSelectedFiles(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...previews]);
    e.target.value = '';
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  // ---------- Sizes ----------
  const hasSizes = productForm.sizes.length > 0;
  const totalSizeStock = productForm.sizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);

  const toggleSize = (size) => {
    setProductForm(prev => {
      const exists = prev.sizes.some(s => s.size === size);
      return {
        ...prev,
        sizes: exists
          ? prev.sizes.filter(s => s.size !== size)
          : [...prev.sizes, { size, stock: '' }]
      };
    });
  };

  const updateSizeStock = (size, stock) => {
    setProductForm(prev => ({
      ...prev,
      sizes: prev.sizes.map(s => (s.size === size ? { ...s, stock } : s))
    }));
  };

  const addCustomSize = () => {
    const val = customSize.trim().toUpperCase();
    if (!val) return;
    if (productForm.sizes.some(s => s.size === val)) {
      setMessage({ type: 'error', text: `Size ${val} already added` });
      return;
    }
    setProductForm(prev => ({ ...prev, sizes: [...prev.sizes, { size: val, stock: '' }] }));
    setCustomSize('');
  };

  // ---------- Submit ----------
  const closeModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (hasSizes && productForm.sizes.some(s => s.stock === '' || Number(s.stock) < 0)) {
      setMessage({ type: 'error', text: 'Har selected size ka stock daalo' });
      return;
    }
    const rating = Number(productForm.rating || 0);
    if (rating < 0 || rating > 5) {
      setMessage({ type: 'error', text: 'Rating 0 se 5 ke beech honi chahiye' });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      const { sizes, images, ...rest } = productForm;

      Object.entries(rest).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          formData.append(key, value.toString());
        } else if (value !== '' && value !== null && value !== undefined) {
          formData.append(key, value); // 0 bhi jayega
        }
      });

      // sizes ke saath stock auto-sum
      const cleanSizes = sizes.map(s => ({ size: s.size, stock: Number(s.stock) || 0 }));
      formData.append('sizes', JSON.stringify(cleanSizes));
      if (hasSizes) formData.set('countInStock', String(totalSizeStock));

      // edit me jo purani images rakhni hain
      if (selectedProduct) {
        formData.append('existingImages', JSON.stringify(existingImages));
      }

      selectedFiles.forEach(file => formData.append('images', file));

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      const response = selectedProduct
        ? await api.put(`/products/${selectedProduct._id}`, formData, config)
        : await api.post('/products', formData, config);

      if (response.data.success) {
        setMessage({ type: 'success', text: selectedProduct ? 'Product updated successfully' : 'Product added successfully' });
        closeModal();
        fetchProducts();
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Failed to save product' });
      }
    } catch (error) {
      console.error('Error saving product:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save product' });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    imagePreviews.forEach(p => URL.revokeObjectURL(p));
    setProductForm(emptyForm);
    setSelectedFiles([]);
    setImagePreviews([]);
    setExistingImages([]);
    setSelectedProduct(null);
    setCustomSize('');
  };

  const openEdit = (product) => {
    resetForm();
    setSelectedProduct(product);
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price ?? '',
      category: product.category || '',
      countInStock: product.countInStock ?? '',
      brand: product.brand || '',
      isDeal: !!product.isDeal,
      dealPrice: product.dealPrice ?? '',
      dealEnds: toLocalInput(product.dealEnds),
      isFeatured: !!product.isFeatured,
      isTrending: !!product.isTrending,
      rating: product.rating ?? '',
      numReviews: product.numReviews ?? '',
      sizes: (product.sizes || []).map(s => ({ size: s.size, stock: s.stock }))
    });
    const imgs = product.images?.length ? product.images : product.image ? [product.image] : [];
    setExistingImages(imgs);
    setShowEditModal(true);
  };

  // ---------- Star display ----------
  const renderStars = (rating = 0) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={13}
          color={colors.featured}
          fill={rating >= i ? colors.featured : rating >= i - 0.5 ? `${colors.featured}80` : 'none'}
        />
      ))}
    </div>
  );

  // ---------- Styles ----------
  const styles = {
    container: { minHeight: '100vh', background: colors.bgPrimary, padding: '30px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' },
    title: { fontSize: '2rem', fontWeight: '700', color: colors.textPrimary },
    addButton: {
      padding: '12px 24px', background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
      color: colors.white, border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '600',
      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
    },
    filtersBar: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px',
      flexWrap: 'wrap', gap: '15px', padding: '20px', background: colors.white, borderRadius: '12px',
      border: `1px solid ${colors.border}`
    },
    searchBox: {
      display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 15px', background: colors.bgPrimary,
      borderRadius: '8px', border: `1px solid ${colors.border}`, flex: 1, minWidth: '250px'
    },
    searchInput: { border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem', width: '100%' },
    filterGroup: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
    select: { padding: '8px 12px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.white, cursor: 'pointer', outline: 'none' },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px' },
    statCard: { background: colors.white, padding: '15px', borderRadius: '12px', border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: '12px' },
    statIcon: { width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    tableContainer: { background: colors.white, borderRadius: '16px', border: `1px solid ${colors.border}`, overflow: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '1200px' },
    th: { padding: '15px', textAlign: 'left', background: colors.bgSecondary, color: colors.textPrimary, fontWeight: '600', borderBottom: `2px solid ${colors.border}` },
    td: { padding: '15px', borderBottom: `1px solid ${colors.border}`, verticalAlign: 'middle' },
    productImage: { width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover', background: colors.bgSecondary },
    badge: { padding: '4px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' },
    sizeChip: {
      padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600',
      border: `1px solid ${colors.border}`, background: colors.bgSecondary, color: colors.textPrimary
    },
    actionButtons: { display: 'flex', gap: '8px' },
    actionButton: { padding: '6px', background: colors.bgSecondary, border: `1px solid ${colors.border}`, borderRadius: '6px', cursor: 'pointer' },
    actionButtonDisabled: { opacity: 0.5, cursor: 'not-allowed' },
    modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
    modalContent: { background: colors.white, borderRadius: '24px', padding: '30px', maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    modalTitle: { fontSize: '1.5rem', fontWeight: '600', color: colors.textPrimary },
    closeButton: { background: 'none', border: 'none', cursor: 'pointer', padding: '5px' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' },
    formGroup: { marginBottom: '15px' },
    label: { display: 'block', marginBottom: '5px', color: colors.textSecondary, fontWeight: '500' },
    input: { width: '100%', padding: '10px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box' },
    checkboxGroup: { padding: '15px', background: colors.bgSecondary, borderRadius: '8px' },
    checkboxLabel: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', cursor: 'pointer' },
    sizeBox: { padding: '15px', background: colors.bgSecondary, borderRadius: '12px', marginBottom: '15px' },
    sizeToggle: (active) => ({
      padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem',
      border: `1.5px solid ${active ? colors.primary : colors.border}`,
      background: active ? colors.primary : colors.white,
      color: active ? colors.white : colors.textPrimary
    }),
    sizeStockRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', marginTop: '12px' },
    imageUploadArea: { border: `2px dashed ${colors.primary}`, borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer', marginBottom: '15px' },
    imagePreviewGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '10px', marginTop: '10px' },
    imagePreview: { position: 'relative', paddingTop: '100%', borderRadius: '8px', overflow: 'hidden' },
    previewImg: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' },
    removeImageBtn: { position: 'absolute', top: '2px', right: '2px', width: '20px', height: '20px', background: colors.error, color: colors.white, border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 },
    submitButton: {
      width: '100%', padding: '12px', background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
      color: colors.white, border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600',
      cursor: 'pointer', marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center'
    },
    messageBox: { padding: '12px 20px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' },
    successMessage: { background: `${colors.success}10`, border: `1px solid ${colors.success}`, color: colors.success },
    errorMessage: { background: `${colors.error}10`, border: `1px solid ${colors.error}`, color: colors.error },
    pagination: { display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' },
    pageButton: { padding: '8px 12px', border: `1px solid ${colors.border}`, background: colors.white, borderRadius: '8px', cursor: 'pointer' },
    activePage: { background: colors.primary, color: colors.white, borderColor: colors.primary }
  };

  const presetSizes = getPresetSizes(productForm.category);
  const allImagesCount = existingImages.length + imagePreviews.length;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Manage Products</h1>
        <button style={styles.addButton} onClick={() => { resetForm(); setShowAddModal(true); }}>
          <Plus size={20} /> Add New Product
        </button>
      </div>

      {/* Messages */}
      {message.text && (
        <div style={{ ...styles.messageBox, ...(message.type === 'success' ? styles.successMessage : styles.errorMessage) }}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Stats */}
      <div style={styles.statsRow}>
        {[
          { label: 'Total Products', value: products.length, color: colors.primary, icon: <Package size={20} color={colors.primary} /> },
          { label: 'Deals', value: products.filter(p => p.isDeal).length, color: colors.deal, icon: <Clock size={20} color={colors.deal} /> },
          { label: 'Featured', value: products.filter(p => p.isFeatured).length, color: colors.featured, icon: <Star size={20} color={colors.featured} /> },
          { label: 'Trending', value: products.filter(p => p.isTrending).length, color: colors.trending, icon: <Zap size={20} color={colors.trending} /> }
        ].map(s => (
          <div key={s.label} style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: `${s.color}15` }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: colors.textLight }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={styles.filtersBar}>
        <div style={styles.searchBox}>
          <Search size={18} color={colors.textLight} />
          <input
            type="text" placeholder="Search products..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput}
          />
        </div>
        <div style={styles.filterGroup}>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={styles.select}>
            <option value="all">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} style={styles.select}>
            <option value="all">All Sections</option>
            <option value="isDeal">Deals</option>
            <option value="isFeatured">Featured</option>
            <option value="isTrending">Trending</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Image</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Price</th>
              <th style={styles.th}>Rating</th>
              <th style={styles.th}>Sizes</th>
              <th style={styles.th}>Stock</th>
              <th style={styles.th}>Sections</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>
                <Loader size={40} style={{ animation: 'spin 1s linear infinite' }} />
              </td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: colors.textLight }}>No products found</td></tr>
            ) : (
              filteredProducts.map(product => (
                <tr key={product._id}>
                  <td style={styles.td}>
                    <img
                      src={getImageSrc(product)} alt={product.name} style={styles.productImage}
                      onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER; }}
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
                      <div style={{ fontSize: '0.8rem', color: colors.deal }}>Deal: ₹{product.dealPrice}</div>
                    )}
                  </td>
                  <td style={styles.td}>
                    {renderStars(product.rating || 0)}
                    <div style={{ fontSize: '0.75rem', color: colors.textLight, marginTop: 2 }}>
                      {(product.rating || 0).toFixed(1)} ({product.numReviews || 0})
                    </div>
                  </td>
                  <td style={styles.td}>
                    {product.sizes?.length > 0 ? (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 160 }}>
                        {product.sizes.map(s => (
                          <span
                            key={s.size}
                            title={`${s.stock} in stock`}
                            style={{ ...styles.sizeChip, opacity: s.stock > 0 ? 1 : 0.4, textDecoration: s.stock > 0 ? 'none' : 'line-through' }}
                          >
                            {s.size}
                          </span>
                        ))}
                      </div>
                    ) : <span style={{ color: colors.textLight }}>—</span>}
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      background: product.countInStock > 10 ? `${colors.success}15` : product.countInStock > 0 ? `${colors.warning}15` : `${colors.error}15`,
                      color: product.countInStock > 10 ? colors.success : product.countInStock > 0 ? colors.warning : colors.error
                    }}>
                      {product.countInStock}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      {product.isDeal && <span style={{ ...styles.badge, background: `${colors.deal}15`, color: colors.deal }}><Clock size={12} /> Deal</span>}
                      {product.isFeatured && <span style={{ ...styles.badge, background: `${colors.featured}15`, color: colors.featured }}><Star size={12} /> Featured</span>}
                      {product.isTrending && <span style={{ ...styles.badge, background: `${colors.trending}15`, color: colors.trending }}><Zap size={12} /> Trending</span>}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actionButtons}>
                      <button style={styles.actionButton} onClick={() => navigate(`/product/${product._id}`)} title="View"><Eye size={16} /></button>
                      <button style={styles.actionButton} onClick={() => openEdit(product)} title="Edit"><Edit size={16} /></button>
                      <button
                        style={{ ...styles.actionButton, color: colors.error, ...(deletingId === product._id ? styles.actionButtonDisabled : {}) }}
                        onClick={() => handleDeleteProduct(product._id)}
                        disabled={deletingId === product._id}
                        title="Delete"
                      >
                        {deletingId === product._id
                          ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                          : <Trash2 size={16} />}
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
          <button style={styles.pageButton} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
            <ChevronLeft size={16} />
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              style={{ ...styles.pageButton, ...(currentPage === i + 1 ? styles.activePage : {}) }}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button style={styles.pageButton} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Add / Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div style={styles.modal} onClick={closeModal}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{showAddModal ? 'Add New Product' : 'Edit Product'}</h2>
              <button style={styles.closeButton} onClick={closeModal}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={styles.formGrid}>
                {/* Left */}
                <div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Product Name *</label>
                    <input type="text" value={productForm.name} style={styles.input} required
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Price (₹) *</label>
                    <input type="number" value={productForm.price} style={styles.input} min="0" step="0.01" required
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Category *</label>
                    <select
                      value={productForm.category} style={styles.input} required
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Brand</label>
                    <input type="text" value={productForm.brand} style={styles.input}
                      onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })} />
                  </div>

                  {/* Rating */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Rating (0-5)</label>
                      <input type="number" value={productForm.rating} style={styles.input} min="0" max="5" step="0.1" placeholder="4.5"
                        onChange={(e) => setProductForm({ ...productForm, rating: e.target.value })} />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>No. of Reviews</label>
                      <input type="number" value={productForm.numReviews} style={styles.input} min="0" placeholder="120"
                        onChange={(e) => setProductForm({ ...productForm, numReviews: e.target.value })} />
                    </div>
                  </div>
                  {productForm.rating !== '' && <div style={{ marginTop: -8, marginBottom: 10 }}>{renderStars(Number(productForm.rating))}</div>}
                </div>

                {/* Right */}
                <div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Description *</label>
                    <textarea value={productForm.description} style={{ ...styles.input, minHeight: '100px' }} required
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      Stock Quantity * {hasSizes && <span style={{ color: colors.textLight, fontWeight: 400 }}>(sizes se auto)</span>}
                    </label>
                    <input
                      type="number"
                      value={hasSizes ? totalSizeStock : productForm.countInStock}
                      style={{ ...styles.input, background: hasSizes ? colors.bgSecondary : colors.white }}
                      min="0" required disabled={hasSizes}
                      onChange={(e) => setProductForm({ ...productForm, countInStock: e.target.value })}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Product Sections</label>
                    <div style={styles.checkboxGroup}>
                      <label style={styles.checkboxLabel}>
                        <input type="checkbox" checked={productForm.isDeal}
                          onChange={(e) => setProductForm({ ...productForm, isDeal: e.target.checked })} />
                        <Clock size={16} color={colors.deal} /> Limited Time Deal
                      </label>

                      {productForm.isDeal && (
                        <div style={{ marginLeft: '20px', marginTop: '10px' }}>
                          <input type="number" placeholder="Deal Price" value={productForm.dealPrice}
                            onChange={(e) => setProductForm({ ...productForm, dealPrice: e.target.value })}
                            style={{ ...styles.input, marginBottom: '10px' }} />
                          <input type="datetime-local" value={productForm.dealEnds} style={styles.input}
                            onChange={(e) => setProductForm({ ...productForm, dealEnds: e.target.value })} />
                        </div>
                      )}

                      <label style={styles.checkboxLabel}>
                        <input type="checkbox" checked={productForm.isFeatured}
                          onChange={(e) => setProductForm({ ...productForm, isFeatured: e.target.checked })} />
                        <Star size={16} color={colors.featured} /> Featured Product
                      </label>

                      <label style={styles.checkboxLabel}>
                        <input type="checkbox" checked={productForm.isTrending}
                          onChange={(e) => setProductForm({ ...productForm, isTrending: e.target.checked })} />
                        <Zap size={16} color={colors.trending} /> Trending Product
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sizes */}
              <div style={styles.sizeBox}>
                <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Ruler size={16} color={colors.primary} /> Available Sizes
                  <span style={{ color: colors.textLight, fontWeight: 400, fontSize: '0.8rem' }}>(optional — T-shirt, shoes etc.)</span>
                </label>

                {presetSizes.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {presetSizes.map(size => (
                      <button
                        type="button" key={size}
                        style={styles.sizeToggle(productForm.sizes.some(s => s.size === size))}
                        onClick={() => toggleSize(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: colors.textLight, margin: '0 0 8px' }}>
                    {productForm.category
                      ? 'Is category ke liye custom size add karo (e.g. 500ml, 1kg, 42mm)'
                      : 'Pehle category select karo, ya neeche custom size add karo'}
                  </p>
                )}

                {/* Custom size */}
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <input
                    type="text" placeholder="Custom size (e.g. 28, Free Size)" value={customSize}
                    style={{ ...styles.input, flex: 1 }}
                    onChange={(e) => setCustomSize(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSize(); } }}
                  />
                  <button type="button" onClick={addCustomSize}
                    style={{ ...styles.sizeToggle(true), padding: '8px 16px' }}>
                    Add
                  </button>
                </div>

                {/* Stock per size */}
                {hasSizes && (
                  <>
                    <div style={styles.sizeStockRow}>
                      {productForm.sizes.map(s => (
                        <div key={s.size} style={{ background: colors.white, padding: 8, borderRadius: 8, border: `1px solid ${colors.border}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <strong>{s.size}</strong>
                            <button type="button" onClick={() => toggleSize(s.size)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                              <X size={14} color={colors.error} />
                            </button>
                          </div>
                          <input
                            type="number" min="0" placeholder="Stock" value={s.stock}
                            style={{ ...styles.input, padding: 6 }}
                            onChange={(e) => updateSizeStock(s.size, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: colors.textSecondary, marginTop: 10, marginBottom: 0 }}>
                      Total stock: <strong>{totalSizeStock}</strong>
                    </p>
                  </>
                )}
              </div>

              {/* Images */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Product Images</label>
                <div style={styles.imageUploadArea} onClick={() => document.getElementById('imageInput').click()}>
                  <Upload size={30} color={colors.primary} />
                  <p style={{ marginTop: '10px', color: colors.textLight }}>
                    Click to upload images (max 5) — {allImagesCount}/5 selected
                  </p>
                </div>
                <input id="imageInput" type="file" multiple accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />

                {allImagesCount > 0 && (
                  <div style={styles.imagePreviewGrid}>
                    {existingImages.map((img, index) => (
                      <div key={`old-${index}`} style={styles.imagePreview}>
                        <img src={toSrc(img)} alt={`Existing ${index}`} style={styles.previewImg}
                          onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER; }} />
                        <button type="button" onClick={() => removeExistingImage(index)} style={styles.removeImageBtn}><X size={12} /></button>
                      </div>
                    ))}
                    {imagePreviews.map((preview, index) => (
                      <div key={`new-${index}`} style={styles.imagePreview}>
                        <img src={preview} alt={`Preview ${index}`} style={styles.previewImg} />
                        <button type="button" onClick={() => removeImage(index)} style={styles.removeImageBtn}><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" style={styles.submitButton} disabled={uploading}>
                {uploading
                  ? <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  : showAddModal ? 'Add Product' : 'Update Product'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ManageProducts;
