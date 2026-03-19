import React, { useState, useEffect, useId } from 'react';
import { Heart, ShoppingBag, Star, Loader } from 'lucide-react';
import axios from 'axios';

import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

// API setup
const API_URL = 'http://localhost:5000';
const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const TrendingProducts = () => {
    // Generate stable instance ID
    const instanceId = useId ? useId() : `trending-${Math.random().toString(36).substr(2, 9)}`;
    
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [addingToCart, setAddingToCart] = useState({});
    const [addingToWishlist, setAddingToWishlist] = useState({});
    const [imageErrors, setImageErrors] = useState({});
    const [renderKey, setRenderKey] = useState(0); // 🔥 Force re-render
    
    const { isAuthenticated } = useAuth();
    const { addToCart: addToCartContext } = useCart();
    const { addToWishlist: addToWishlistContext, removeFromWishlist, isInWishlist } = useWishlist();

    // Fetch products from backend
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const response = await api.get('/products?trending=true&limit=8');
                
                let productsData = [];
                if (response.data.products) {
                    productsData = response.data.products;
                } else if (Array.isArray(response.data)) {
                    productsData = response.data;
                } else if (response.data.data) {
                    productsData = response.data.data;
                }
                
                // Only filter products with trending flag
                const trendingOnly = productsData.filter(product => 
                    product.isTrending === true || 
                    product.trending === true
                );
                
                // Remove duplicates
                const uniqueProducts = [];
                const seenIds = new Set();
                
                trendingOnly.forEach(product => {
                    if (!seenIds.has(product._id)) {
                        seenIds.add(product._id);
                        uniqueProducts.push({
                            ...product,
                            _renderKey: `${instanceId}-${product._id}-${uniqueProducts.length}-${Date.now()}`
                        });
                    }
                });
                
                setProducts(uniqueProducts);
                setRenderKey(prev => prev + 1); // 🔥 Force re-render with new keys
                setError(null);
            } catch (err) {
                console.error('Error fetching products:', err);
                setError('Failed to load products');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [instanceId]);

    // Get image URL
    const getImageUrl = (product) => {
        if (product.image) {
            return `${API_URL}${product.image}`;
        }
        
        if (product.images && product.images.length > 0) {
            const img = product.images[0];
            if (typeof img === 'object' && img.url) {
                return img.url.startsWith('http') ? img.url : `${API_URL}${img.url}`;
            } else if (typeof img === 'string') {
                return img.startsWith('http') ? img : `${API_URL}${img}`;
            }
        }
        
        return 'https://via.placeholder.com/300x300?text=No+Image';
    };

    // Add to cart function
    const handleAddToCart = async (product) => {
        if (!isAuthenticated) {
            alert('Please login to add items to cart');
            return;
        }

        try {
            setAddingToCart(prev => ({ ...prev, [product._id]: true }));

            const response = await api.post('/cart/add', {
                productId: product._id,
                quantity: 1
            });

            if (response.data.success) {
                addToCartContext({
                    ...product,
                    quantity: 1
                });
                
                alert('✅ Product added to cart successfully!');
            }
        } catch (err) {
            console.error('Error adding to cart:', err);
            alert(err.response?.data?.message || 'Failed to add to cart');
        } finally {
            setAddingToCart(prev => ({ ...prev, [product._id]: false }));
        }
    };

    // Add to wishlist function
    const handleWishlistToggle = async (product) => {
        if (!isAuthenticated) {
            alert('Please login to add items to wishlist');
            return;
        }

        const isInWishlistCurrently = isInWishlist(product._id);

        try {
            setAddingToWishlist(prev => ({ ...prev, [product._id]: true }));

            if (isInWishlistCurrently) {
                const response = await api.delete(`/wishlist/${product._id}`);
                if (response.data.success) {
                    removeFromWishlist(product._id);
                }
            } else {
                const response = await api.post('/wishlist/add', {
                    productId: product._id
                });
                if (response.data.success) {
                    addToWishlistContext(product);
                }
            }
        } catch (err) {
            console.error('Error toggling wishlist:', err);
            alert(err.response?.data?.message || 'Failed to update wishlist');
        } finally {
            setAddingToWishlist(prev => ({ ...prev, [product._id]: false }));
        }
    };

    const handleImageError = (productId) => {
        setImageErrors(prev => ({ ...prev, [productId]: true }));
    };

    // Styles
    const styles = {
        section: {
            padding: '60px 0',
            background: '#FFFFFF',
        },
        container: {
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 20px',
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
            fontSize: 'clamp(1.8rem, 4vw, 2.2rem)',
            fontWeight: '700',
            color: '#1F2937',
        },
        viewAll: {
            padding: '10px 20px',
            background: 'transparent',
            border: '2px solid #D4AF37',
            color: '#D4AF37',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '30px',
        },
        card: {
            background: '#F9F9F9',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid #E5E7EB',
            transition: 'all 0.3s ease',
            position: 'relative',
            cursor: 'pointer',
        },
        wishlist: {
            position: 'absolute',
            top: '15px',
            right: '15px',
            width: '40px',
            height: '40px',
            background: '#FFFFFF',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: '1px solid #E5E7EB',
            transition: 'all 0.3s ease',
            zIndex: 2,
        },
        imageContainer: {
            height: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '15px',
            overflow: 'hidden',
            borderRadius: '12px',
            background: '#EDE8D0',
        },
        productImage: {
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s ease',
        },
        placeholderImage: {
            fontSize: '4rem',
            color: '#D4AF37',
        },
        productName: {
            color: '#1F2937',
            fontSize: '1.1rem',
            fontWeight: '600',
            marginBottom: '10px',
        },
        rating: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '10px',
        },
        stars: {
            display: 'flex',
            gap: '2px',
        },
        price: {
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#D4AF37',
            marginBottom: '15px',
        },
        addToCart: {
            width: '100%',
            padding: '12px',
            background: '#D4AF37',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
        },
        addToCartDisabled: {
            background: '#ccc',
            cursor: 'not-allowed',
        },
        badge: {
            position: 'absolute',
            top: '15px',
            left: '15px',
            padding: '4px 12px',
            background: '#D4AF37',
            color: '#FFFFFF',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: '600',
            zIndex: 2,
        },
        dealBadge: {
            background: '#EF4444',
        },
        loadingOverlay: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
        },
        errorMessage: {
            textAlign: 'center',
            color: '#EF4444',
            padding: '40px',
        },
        emptyState: {
            textAlign: 'center',
            color: '#6B7280',
            padding: '60px',
            background: '#F9F9F9',
            borderRadius: '12px',
        },
    };

    if (loading) {
        return (
            <section style={styles.section}>
                <div style={styles.container}>
                    <div style={styles.loadingOverlay}>
                        <Loader size={40} color="#D4AF37" style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section style={styles.section}>
                <div style={styles.container}>
                    <div style={styles.errorMessage}>
                        <p>{error}</p>
                        <button 
                            onClick={() => window.location.reload()}
                            style={styles.viewAll}
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    if (products.length === 0) {
        return (
            <section style={styles.section}>
                <div style={styles.container}>
                    <div style={styles.emptyState}>
                        <ShoppingBag size={48} color="#D4AF37" />
                        <h3>No Products Found</h3>
                        <p>Check back later for new arrivals!</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section key={`trending-section-${renderKey}`} style={styles.section}>
            <div style={styles.container}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Trending Products</h2>
                    <button 
                        style={styles.viewAll}
                        onMouseEnter={(e) => {
                            e.target.style.background = '#D4AF37';
                            e.target.style.color = '#FFFFFF';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'transparent';
                            e.target.style.color = '#D4AF37';
                        }}
                    >
                        View All →
                    </button>
                </div>
                
                <div style={styles.grid}>
                    {products.map((product, index) => {
                        // 🔥 ULTIMATE FIX: Generate truly unique key for each render
                        const uniqueProductKey = `trending-${product._id}-${index}-${renderKey}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                        
                        return (
                            <div 
                                key={uniqueProductKey}
                                data-product-id={product._id}
                                data-component="trending"
                                style={styles.card}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                {/* Badges */}
                                {product.isDeal && (
                                    <div style={{...styles.badge, ...styles.dealBadge}}>
                                        🔥 Deal
                                    </div>
                                )}
                                
                                {/* Wishlist Button */}
                                <div 
                                    style={{
                                        ...styles.wishlist,
                                        backgroundColor: isInWishlist(product._id) ? '#D4AF37' : '#FFFFFF',
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleWishlistToggle(product);
                                    }}
                                >
                                    {addingToWishlist[product._id] ? (
                                        <Loader size={16} color="#FFFFFF" style={{ animation: 'spin 1s linear infinite' }} />
                                    ) : (
                                        <Heart 
                                            size={16} 
                                            color={isInWishlist(product._id) ? '#FFFFFF' : '#4B5563'}
                                            fill={isInWishlist(product._id) ? '#FFFFFF' : 'none'}
                                        />
                                    )}
                                </div>

                                {/* Product Image */}
                                <div style={styles.imageContainer}>
                                    {!imageErrors[product._id] ? (
                                        <img 
                                            src={getImageUrl(product)}
                                            alt={product.name}
                                            style={styles.productImage}
                                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                            onError={() => handleImageError(product._id)}
                                        />
                                    ) : (
                                        <div style={styles.placeholderImage}>
                                            📦
                                        </div>
                                    )}
                                </div>

                                {/* Product Details */}
                                <div style={styles.productName}>{product.name}</div>
                                
                                {/* Rating - 🔥 FIXED: Unique star keys */}
                                <div style={styles.rating}>
                                    <div style={styles.stars}>
                                        {[...Array(5)].map((_, i) => (
                                            <Star 
                                                key={`trending-star-${product._id}-${i}-${renderKey}-${Date.now()}`}
                                                size={14} 
                                                color={i < Math.floor(product.rating || 0) ? '#D4AF37' : '#E5E7EB'}
                                                fill={i < Math.floor(product.rating || 0) ? '#D4AF37' : 'none'}
                                            />
                                        ))}
                                    </div>
                                    <span style={{ color: '#6B7280', fontSize: '0.85rem' }}>
                                        ({product.numReviews || 0})
                                    </span>
                                </div>

                                {/* Price */}
                                <div style={styles.price}>
                                    {product.isDeal && product.dealPrice ? (
                                        <>
                                            <span style={{ 
                                                textDecoration: 'line-through', 
                                                color: '#6B7280', 
                                                fontSize: '1rem',
                                                marginRight: '8px'
                                            }}>
                                                ₹{product.price}
                                            </span>
                                            <span>₹{product.dealPrice}</span>
                                        </>
                                    ) : (
                                        `₹${product.price}`
                                    )}
                                </div>

                                {/* Add to Cart Button */}
                                <button 
                                    style={{
                                        ...styles.addToCart,
                                        ...(addingToCart[product._id] ? styles.addToCartDisabled : {})
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!addingToCart[product._id]) {
                                            e.target.style.background = '#B8962E';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!addingToCart[product._id]) {
                                            e.target.style.background = '#D4AF37';
                                        }
                                    }}
                                    onClick={() => handleAddToCart(product)}
                                    disabled={addingToCart[product._id]}
                                >
                                    {addingToCart[product._id] ? (
                                        <>
                                            <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingBag size={16} /> Add to Cart
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </section>
    );
};

export default TrendingProducts;