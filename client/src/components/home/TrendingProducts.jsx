import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
// RATING HELPERS
// ============================================================

// Decimal rating (4.3) ke hisaab se stars bharta hai (floor nahi karta)
const StarRating = ({ rating = 0, size = 14 }) => {
    const pct = Math.min(100, Math.max(0, (rating / 5) * 100));

    const row = (color) => (
        <div style={{ display: 'flex', gap: '2px', whiteSpace: 'nowrap' }}>
            {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} size={size} color={color} fill={color} style={{ flexShrink: 0 }} />
            ))}
        </div>
    );

    return (
        <div style={{ position: 'relative', display: 'inline-block' }} aria-label={`${rating} out of 5`}>
            {row('#E5E7EB')}
            <div style={{ position: 'absolute', top: 0, left: 0, width: `${pct}%`, overflow: 'hidden' }}>
                {row('#D4AF37')}
            </div>
        </div>
    );
};

// Flipkart jaisa rating badge ka color
const ratingColor = (r) => (r >= 4 ? '#16A34A' : r >= 3 ? '#F59E0B' : '#EF4444');

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
        display: 'flex',
        flexDirection: 'column',
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
        height: '240px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '15px',
        overflow: 'hidden',
        borderRadius: '12px',
        background: '#FFFFFF',
        padding: '8px',
        boxSizing: 'border-box',
        cursor: 'pointer',
    },
    productImage: {
        width: '100%',
        height: '100%',
        objectFit: 'contain', // poori image dikhegi, kuch kata nahi
        transition: 'transform 0.3s ease',
    },
    placeholderImage: { fontSize: '4rem', color: '#D4AF37' },
    productName: {
        color: '#1F2937',
        fontSize: '1.1rem',
        fontWeight: '600',
        marginBottom: '10px',
        cursor: 'pointer',
    },
    ratingRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '10px',
        flexWrap: 'wrap',
        cursor: 'pointer',
    },
    ratingBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        padding: '2px 8px',
        borderRadius: '6px',
        color: '#FFFFFF',
        fontSize: '0.8rem',
        fontWeight: '700',
    },
    reviewCount: { color: '#6B7280', fontSize: '0.85rem' },
    sizeSection: { marginBottom: '14px' },
    sizeLabel: {
        fontSize: '0.8rem',
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: '6px',
        display: 'flex',
        justifyContent: 'space-between',
    },
    sizeList: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
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
        marginTop: 'auto',
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
    outBadge: { background: '#6B7280' },
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

// Size chip ka style (selected / available / out of stock)
const sizeChipStyle = (selected, inStock) => ({
    minWidth: '38px',
    padding: '5px 10px',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: inStock ? 'pointer' : 'not-allowed',
    border: `1.5px solid ${selected ? '#D4AF37' : '#E5E7EB'}`,
    background: selected ? '#D4AF37' : '#FFFFFF',
    color: selected ? '#FFFFFF' : inStock ? '#1F2937' : '#9CA3AF',
    opacity: inStock ? 1 : 0.55,
    textDecoration: inStock ? 'none' : 'line-through',
    transition: 'all 0.2s ease',
});

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
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [addingToCart, setAddingToCart] = useState({});
    const [addingToWishlist, setAddingToWishlist] = useState({});
    const [imageErrors, setImageErrors] = useState({});
    const [selectedSizes, setSelectedSizes] = useState({}); // { productId: 'M' }
    const [sizeErrors, setSizeErrors] = useState({}); // { productId: true }
    const [toast, setToast] = useState(null); // { type, text, action? }

    const showToast = (type, text, action = null) => setToast({ type, text, action });

    // Toast 5 second baad apne aap hat jaata hai
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 5000);
        return () => clearTimeout(t);
    }, [toast]);

    const { isAuthenticated } = useAuth();
    const cartCtx = useCart();
    const { addToCart: addToCartContext } = cartCtx;
    // Cart context me jo bhi "backend se cart dobara load karne wala" function ho, wo use hoga
    const syncCart = cartCtx.fetchCart || cartCtx.refreshCart || cartCtx.loadCart || cartCtx.getCart;
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

    // ---------- Size select ----------
    const handleSelectSize = (productId, size) => {
        setSelectedSizes((prev) => ({
            ...prev,
            // same size dobara click karne par unselect
            [productId]: prev[productId] === size ? undefined : size,
        }));
        setSizeErrors((prev) => ({ ...prev, [productId]: false }));
    };

    // ---------- Add to cart ----------
    const handleAddToCart = async (product) => {
        if (!isAuthenticated) {
            showToast('error', 'Please login to add items to cart', {
                label: 'Login',
                onClick: () => navigate('/login'),
            });
            return;
        }

        const hasSizes = product.sizes?.length > 0;
        const size = selectedSizes[product._id];

        // Sizes wale product me size select karna zaroori hai
        if (hasSizes && !size) {
            setSizeErrors((prev) => ({ ...prev, [product._id]: true }));
            return;
        }

        try {
            setAddingToCart((prev) => ({ ...prev, [product._id]: true }));

            const response = await api.post('/cart/add', {
                productId: product._id,
                quantity: 1,
                ...(size ? { size } : {}),
            });

            if (response.data.success) {
                // Cart ko backend se refresh karo taaki cart page me product turant dikhe.
                // Agar context me refresh function nahi hai to local add use hoga.
                let synced = false;
                if (typeof syncCart === 'function') {
                    try {
                        await syncCart();
                        synced = true;
                    } catch (e) {
                        console.warn('Cart sync failed, local add use ho raha hai:', e);
                    }
                }
                if (!synced && typeof addToCartContext === 'function') {
                    addToCartContext({ ...product, quantity: 1, ...(size ? { size } : {}) });
                }

                showToast(
                    'success',
                    `${product.name}${size ? ` (Size: ${size})` : ''} added to cart`,
                    { label: 'View Cart', onClick: () => navigate('/cart') }
                );
            }
        } catch (err) {
            console.error('Error adding to cart:', err);
            showToast('error', err.response?.data?.message || err.message || 'Failed to add to cart');
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
                        onClick={() => navigate('/products?isTrending=true')}
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
                        const busy = !!addingToCart[product._id];

                        // ----- Rating / reviews -----
                        const rating = Number(product.rating) || 0;
                        const numReviews = Number(product.numReviews) || 0;
                        const hasReviews = numReviews > 0 && rating > 0;

                        // ----- Sizes / stock -----
                        const sizes = product.sizes || [];
                        const hasSizes = sizes.length > 0;
                        const selectedSize = selectedSizes[product._id];
                        const selectedEntry = sizes.find((s) => s.size === selectedSize);
                        const outOfStock = (product.countInStock || 0) <= 0;
                        const sizeError = !!sizeErrors[product._id];
                        const disabled = busy || outOfStock;

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
                                {outOfStock ? (
                                    <div style={{ ...styles.badge, ...styles.outBadge }}>
                                        Out of Stock
                                    </div>
                                ) : (
                                    product.isDeal && (
                                        <div style={{ ...styles.badge, ...styles.dealBadge }}>
                                            🔥 Deal
                                        </div>
                                    )
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
                                <div
                                    style={styles.imageContainer}
                                    onClick={() => navigate(`/product/${product._id}`)}
                                >
                                    {showImage ? (
                                        <img
                                            src={imageUrl}
                                            alt={product.name}
                                            style={{
                                                ...styles.productImage,
                                                opacity: outOfStock ? 0.6 : 1,
                                            }}
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

                                {/* Name */}
                                <div
                                    style={styles.productName}
                                    onClick={() => navigate(`/product/${product._id}`)}
                                >
                                    {product.name}
                                </div>

                                {/* Rating + reviews */}
                                <div
                                    style={styles.ratingRow}
                                    onClick={() => navigate(`/product/${product._id}#reviews`)}
                                    title="Reviews dekhein"
                                >
                                    {hasReviews ? (
                                        <>
                                            <span
                                                style={{
                                                    ...styles.ratingBadge,
                                                    background: ratingColor(rating),
                                                }}
                                            >
                                                {rating.toFixed(1)}
                                                <Star size={11} color="#FFFFFF" fill="#FFFFFF" />
                                            </span>
                                            <StarRating rating={rating} size={14} />
                                            <span style={styles.reviewCount}>
                                                ({numReviews.toLocaleString('en-IN')}{' '}
                                                {numReviews === 1 ? 'review' : 'reviews'})
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <StarRating rating={0} size={14} />
                                            <span style={styles.reviewCount}>No reviews yet</span>
                                        </>
                                    )}
                                </div>

                                {/* Sizes */}
                                {hasSizes && (
                                    <div style={styles.sizeSection}>
                                        <div style={styles.sizeLabel}>
                                            <span>Select Size</span>
                                            {selectedEntry && selectedEntry.stock > 0 && selectedEntry.stock <= 5 && (
                                                <span style={{ color: '#EF4444' }}>
                                                    Only {selectedEntry.stock} left!
                                                </span>
                                            )}
                                        </div>
                                        <div style={styles.sizeList}>
                                            {sizes.map((s) => {
                                                const inStock = s.stock > 0;
                                                return (
                                                    <button
                                                        key={s.size}
                                                        type="button"
                                                        disabled={!inStock}
                                                        title={inStock ? `${s.stock} available` : 'Out of stock'}
                                                        style={sizeChipStyle(selectedSize === s.size, inStock)}
                                                        onClick={() => handleSelectSize(product._id, s.size)}
                                                    >
                                                        {s.size}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {sizeError && (
                                            <div style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '6px' }}>
                                                Please select a size
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Price */}
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

                                {/* Add to cart */}
                                <button
                                    style={{
                                        ...styles.addToCart,
                                        ...(disabled ? styles.addToCartDisabled : {}),
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!disabled) e.currentTarget.style.background = '#B8962E';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!disabled) e.currentTarget.style.background = '#D4AF37';
                                    }}
                                    onClick={() => handleAddToCart(product)}
                                    disabled={disabled}
                                >
                                    {busy ? (
                                        <>
                                            <Loader
                                                size={16}
                                                style={{ animation: 'spin 1s linear infinite' }}
                                            />
                                            Adding...
                                        </>
                                    ) : outOfStock ? (
                                        'Out of Stock'
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

            {/* Toast (alert ki jagah) */}
            {toast && (
                <div
                    role="status"
                    style={{
                        position: 'fixed',
                        bottom: '24px',
                        right: '24px',
                        zIndex: 3000,
                        background: '#1F2937',
                        color: '#FFFFFF',
                        padding: '14px 18px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                        maxWidth: '90vw',
                        borderLeft: `4px solid ${toast.type === 'error' ? '#EF4444' : '#16A34A'}`,
                    }}
                >
                    <span style={{ fontSize: '0.9rem' }}>
                        {toast.type === 'error' ? '⚠️' : '✅'} {toast.text}
                    </span>
                    {toast.action && (
                        <button
                            onClick={() => {
                                toast.action.onClick();
                                setToast(null);
                            }}
                            style={{
                                background: '#D4AF37',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {toast.action.label}
                        </button>
                    )}
                    <button
                        onClick={() => setToast(null)}
                        aria-label="Close"
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#9CA3AF',
                            cursor: 'pointer',
                            fontSize: '1rem',
                        }}
                    >
                        ✕
                    </button>
                </div>
            )}

            <style>{spinKeyframes}</style>
        </section>
    );
};

export default TrendingProducts;
