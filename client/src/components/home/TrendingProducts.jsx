import React, { useState, useEffect } from 'react';
import { Heart, ShoppingBag, Star, Loader } from 'lucide-react';

// ⚠️ Ye file src/components/home/ mein hai, isliye api.js tak do level upar jaana padta hai.
// (src/components/home -> src/components -> src -> src/api/api.js)
import api, { SERVER_URL } from '../../api/api';

// Context imports pehle jaise hi rakhe hain (purani file mein bhi yahi paths the aur build hota tha).
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

// ============================================================
// IMAGE URL HELPER
// Cloudinary / Unsplash (http...) URL ko jaisa hai waisa use karta hai,
// purane /uploads/... paths ke aage server URL lagata hai.
// ============================================================
const toUrl = (p) => {
    if (!p || typeof p !== 'string') return '';
    if (p.startsWith('http')) return p;
    return `${SERVER_URL}/${p.replace(/^\/+/, '')}`;
};

const getImageUrl = (product) => {
    const first = product.images?.[0];
    const fromImages = typeof first === 'object' ? first?.url : first;
    return toUrl(product.image || fromImages);
};

// ============================================================
// STYLES (component ke bahar, taaki har render par dobara na bane)
// ============================================================
const styles = {
    section: { padding: '60px 0', background: '#FFFFFF' },
    container: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px' },
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
    },
    wishlist: {
        position: 'absolute',
        top: '15px',
        right: '15px',
        width: '40px',
        height: '40px',
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
    placeholderImage: { fontSize: '4rem', color: '#D4AF37' },
    productName: {
        color: '#1F2937',
        fontSize: '1.1rem',
        fontWeight: '600',
        marginBottom: '10px',
    },
    rating: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' },
    stars: { display: 'flex', gap: '2px' },
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
    },
    addToCartDisabled: { background: '#ccc', cursor: 'not-allowed' },
    badge: {
        position: 'absolute',
        top: '15px',
        left: '15px',
        padding: '4px 12px',
        color: '#FFFFFF',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: '600',
        zIndex: 2,
    },
    dealBadge: { background: '#EF4444' },
    loadingOverlay: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
    },
    errorMessage: { textAlign: 'center', color: '#EF4444', padding: '40px' },
    emptyState: {
        textAlign: 'center',
        color: '#6B7280',
        padding: '60px',
        background: '#F9F9F9',
        borderRadius: '12px',
    },
};

const spinKeyframes = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;

// ============================================================
// COMPONENT
// ============================================================
const TrendingProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [addingToCart, setAddingToCart] = useState({});
    const [addingToWishlist, setAddingToWishlist] = useState({});
    const [imageErrors, setImageErrors] = useState({});

    const { isAuthenticated } = useAuth();
    const { addToCart: addToCartContext } = useCart();
    const {
        addToWishlist: addToWishlistContext,
        removeFromWishlist,
        isInWishlist,
    } = useWishlist();

    // ---------- Fetch trending products ----------
    useEffect(() => {
        let cancelled = false;

        const fetchProducts = async () => {
            try {
                setLoading(true);

                // isTrending (naya) + trending (purana) dono bheje jaate hain
                const response = await api.get('/products', {
                    params: { isTrending: true, trending: true, limit: 8 },
                });

                const body = response.data;
                const list = Array.isArray(body)
                    ? body
                    : body.products || body.data || [];

                // Safety filter + duplicates hatao
                const seen = new Set();
                const unique = list.filter((p) => {
                    const isTrend = p.isTrending === true || p.trending === true;
                    if (!isTrend || seen.has(p._id)) return false;
                    seen.add(p._id);
                    return true;
                });

                if (!cancelled) {
                    setProducts(unique);
                    setError(null);
                }
            } catch (err) {
                console.error('Error fetching trending products:', err);
                if (!cancelled) setError(err?.message || 'Failed to load products');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchProducts();
        return () => {
            cancelled = true;
        };
    }, []);

    // ---------- Add to cart ----------
    const handleAddToCart = async (product) => {
        if (!isAuthenticated) {
            alert('Please login to add items to cart');
            return;
        }

        try {
            setAddingToCart((prev) => ({ ...prev, [product._id]: true }));

            const response = await api.post('/cart/add', {
                productId: product._id,
                quantity: 1,
            });

            if (response.data.success) {
                addToCartContext({ ...product, quantity: 1 });
                alert('✅ Product added to cart successfully!');
            }
        } catch (err) {
            console.error('Error adding to cart:', err);
            alert(err.response?.data?.message || err.message || 'Failed to add to cart');
        } finally {
            setAddingToCart((prev) => ({ ...prev, [product._id]: false }));
        }
    };

    // ---------- Wishlist ----------
    const handleWishlistToggle = async (product) => {
        if (!isAuthenticated) {
            alert('Please login to add items to wishlist');
            return;
        }

        const inWishlist = isInWishlist(product._id);

        try {
            setAddingToWishlist((prev) => ({ ...prev, [product._id]: true }));

            if (inWishlist) {
                const response = await api.delete(`/wishlist/${product._id}`);
                if (response.data.success) removeFromWishlist(product._id);
            } else {
                const response = await api.post('/wishlist/add', {
                    productId: product._id,
                });
                if (response.data.success) addToWishlistContext(product);
            }
        } catch (err) {
            console.error('Error toggling wishlist:', err);
            alert(err.response?.data?.message || err.message || 'Failed to update wishlist');
        } finally {
            setAddingToWishlist((prev) => ({ ...prev, [product._id]: false }));
        }
    };

    const handleImageError = (productId, url) => {
        console.warn('❌ Image failed to load:', url);
        setImageErrors((prev) => ({ ...prev, [productId]: true }));
    };

    // ---------- States ----------
    if (loading) {
        return (
            <section style={styles.section}>
                <div style={styles.container}>
                    <div style={styles.loadingOverlay}>
                        <Loader
                            size={40}
                            color="#D4AF37"
                            style={{ animation: 'spin 1s linear infinite' }}
                        />
                    </div>
                </div>
                <style>{spinKeyframes}</style>
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

    // ---------- Render ----------
    return (
        <section style={styles.section}>
            <div style={styles.container}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Trending Products</h2>
                    <button
                        style={styles.viewAll}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#D4AF37';
                            e.currentTarget.style.color = '#FFFFFF';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = '#D4AF37';
                        }}
                    >
                        View All →
                    </button>
                </div>

                <div style={styles.grid}>
                    {products.map((product) => {
                        const inWishlist = isInWishlist(product._id);
                        const imageUrl = getImageUrl(product);
                        const showImage = imageUrl && !imageErrors[product._id];
                        const rating = Math.floor(product.rating || 0);
                        const busy = !!addingToCart[product._id];

                        return (
                            <div
                                key={product._id}
                                style={styles.card}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                    e.currentTarget.style.boxShadow =
                                        '0 10px 25px rgba(0,0,0,0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                {product.isDeal && (
                                    <div style={{ ...styles.badge, ...styles.dealBadge }}>
                                        🔥 Deal
                                    </div>
                                )}

                                {/* Wishlist */}
                                <div
                                    style={{
                                        ...styles.wishlist,
                                        background: inWishlist ? '#D4AF37' : '#FFFFFF',
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleWishlistToggle(product);
                                    }}
                                >
                                    {addingToWishlist[product._id] ? (
                                        <Loader
                                            size={16}
                                            color="#4B5563"
                                            style={{ animation: 'spin 1s linear infinite' }}
                                        />
                                    ) : (
                                        <Heart
                                            size={16}
                                            color={inWishlist ? '#FFFFFF' : '#4B5563'}
                                            fill={inWishlist ? '#FFFFFF' : 'none'}
                                        />
                                    )}
                                </div>

                                {/* Image */}
                                <div style={styles.imageContainer}>
                                    {showImage ? (
                                        <img
                                            src={imageUrl}
                                            alt={product.name}
                                            style={styles.productImage}
                                            loading="lazy"
                                            onMouseEnter={(e) =>
                                                (e.currentTarget.style.transform = 'scale(1.05)')
                                            }
                                            onMouseLeave={(e) =>
                                                (e.currentTarget.style.transform = 'scale(1)')
                                            }
                                            onError={() =>
                                                handleImageError(product._id, imageUrl)
                                            }
                                        />
                                    ) : (
                                        <div style={styles.placeholderImage}>📦</div>
                                    )}
                                </div>

                                {/* Details */}
                                <div style={styles.productName}>{product.name}</div>

                                <div style={styles.rating}>
                                    <div style={styles.stars}>
                                        {[0, 1, 2, 3, 4].map((i) => (
                                            <Star
                                                key={i}
                                                size={14}
                                                color={i < rating ? '#D4AF37' : '#E5E7EB'}
                                                fill={i < rating ? '#D4AF37' : 'none'}
                                            />
                                        ))}
                                    </div>
                                    <span style={{ color: '#6B7280', fontSize: '0.85rem' }}>
                                        ({product.numReviews || 0})
                                    </span>
                                </div>

                                <div style={styles.price}>
                                    {product.isDeal && product.dealPrice ? (
                                        <>
                                            <span
                                                style={{
                                                    textDecoration: 'line-through',
                                                    color: '#6B7280',
                                                    fontSize: '1rem',
                                                    marginRight: '8px',
                                                }}
                                            >
                                                ₹{product.price}
                                            </span>
                                            <span>₹{product.dealPrice}</span>
                                        </>
                                    ) : (
                                        `₹${product.price}`
                                    )}
                                </div>

                                <button
                                    style={{
                                        ...styles.addToCart,
                                        ...(busy ? styles.addToCartDisabled : {}),
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!busy) e.currentTarget.style.background = '#B8962E';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!busy) e.currentTarget.style.background = '#D4AF37';
                                    }}
                                    onClick={() => handleAddToCart(product)}
                                    disabled={busy}
                                >
                                    {busy ? (
                                        <>
                                            <Loader
                                                size={16}
                                                style={{ animation: 'spin 1s linear infinite' }}
                                            />
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

            <style>{spinKeyframes}</style>
        </section>
    );
};

export default TrendingProducts;
