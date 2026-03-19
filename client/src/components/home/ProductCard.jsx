import React, { useState } from 'react';
import { ShoppingCart, Heart, Loader } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { generateProductKey } from '../utils/keyGenerator';

const ProductCard = ({ product, onAddToCart, showWishlist = true }) => {
    const [addingToCart, setAddingToCart] = useState(false);
    const [addingToWishlist, setAddingToWishlist] = useState(false);
    const [imageError, setImageError] = useState(false);
    
    const { isAuthenticated } = useAuth();
    const { addToCart, isInCart, getItemQuantity } = useCart();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

    const handleAddToCart = async () => {
        if (!isAuthenticated) {
            alert('Please login to add items to cart');
            return;
        }

        setAddingToCart(true);
        
        try {
            const result = await addToCart(product, 1);
            
            if (result.success) {
                if (onAddToCart) onAddToCart(product);
            } else {
                alert(result.error || 'Failed to add to cart');
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('Failed to add to cart');
        } finally {
            setAddingToCart(false);
        }
    };

    // 🔥 FIXED: Better wishlist toggle with error handling
    const handleWishlistToggle = async () => {
        if (!isAuthenticated) {
            alert('Please login to add items to wishlist');
            return;
        }

        // 🔥 Validate product has ID
        if (!product || !product._id) {
            console.error('❌ Invalid product:', product);
            alert('Invalid product data');
            return;
        }

        setAddingToWishlist(true);
        
        try {
            const isCurrentlyInWishlist = isInWishlist(product._id);
            
            if (isCurrentlyInWishlist) {
                console.log('Removing from wishlist:', product._id);
                const result = await removeFromWishlist(product._id);
                if (!result.success) {
                    alert(result.error || 'Failed to remove from wishlist');
                }
            } else {
                console.log('Adding to wishlist:', product._id);
                const result = await addToWishlist(product);
                if (!result.success) {
                    alert(result.error || 'Failed to add to wishlist');
                }
            }
        } catch (error) {
            console.error('Error toggling wishlist:', error);
            alert('Failed to update wishlist. Please try again.');
        } finally {
            setAddingToWishlist(false);
        }
    };

    // 🔥 FIXED: Better image URL handling with fallback
    const getImageUrl = () => {
        if (imageError) {
            return 'https://via.placeholder.com/300x300?text=No+Image';
        }
        
        // Try multiple image sources
        const imageSource = product.image || (product.images && product.images[0]);
        
        if (imageSource) {
            // If it's already a full URL
            if (typeof imageSource === 'string' && imageSource.startsWith('http')) {
                return imageSource;
            }
            // If it's a relative path, add base URL
            if (typeof imageSource === 'string') {
                return `http://localhost:5000${imageSource}`;
            }
            // If it's an object with url property
            if (typeof imageSource === 'object' && imageSource.url) {
                return imageSource.url.startsWith('http') 
                    ? imageSource.url 
                    : `http://localhost:5000${imageSource.url}`;
            }
        }
        
        return 'https://via.placeholder.com/300x300?text=No+Image';
    };

    const cartQuantity = getItemQuantity(product?._id);
    const isInWishlistBool = isInWishlist(product?._id);

    // 🔥 Guard clause - if no product, don't render
    if (!product) {
        return null;
    }

    return (
        <div 
            className="card h-100 shadow-sm border-0 product-card position-relative"
            data-product-id={product._id}
            data-component="product-card"
        >
            {/* Wishlist Button */}
            {showWishlist && (
                <button
                    className="btn position-absolute top-0 end-0 m-2 p-2 rounded-circle bg-white border"
                    style={{ 
                        zIndex: 2,
                        backgroundColor: isInWishlistBool ? '#D4AF37' : 'white',
                        borderColor: isInWishlistBool ? '#D4AF37' : '#dee2e6'
                    }}
                    onClick={handleWishlistToggle}
                    disabled={addingToWishlist}
                >
                    {addingToWishlist ? (
                        <Loader size={16} className="spinner" color="#D4AF37" />
                    ) : (
                        <Heart
                            size={16}
                            color={isInWishlistBool ? 'white' : '#6c757d'}
                            fill={isInWishlistBool ? 'white' : 'none'}
                        />
                    )}
                </button>
            )}

            {/* Product Image */}
            <div className="position-relative" style={{ height: '200px', overflow: 'hidden' }}>
                <img
                    src={getImageUrl()}
                    className="card-img-top"
                    alt={product.name}
                    style={{ 
                        height: '100%', 
                        width: '100%', 
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
                    }}
                    onError={() => setImageError(true)}
                />
                
                {/* Discount Badge */}
                {product.discount > 0 && (
                    <span className="position-absolute top-0 start-0 m-2 badge bg-danger">
                        -{product.discount}%
                    </span>
                )}
            </div>

            <div className="card-body d-flex flex-column">
                <h5 className="card-title">{product.name}</h5>
                
                {/* Brand & Category */}
                <div className="small text-muted mb-2">
                    {product.brand && <span>{product.brand}</span>}
                    {product.brand && product.category && <span> • </span>}
                    {product.category && <span>{product.category}</span>}
                </div>
                
                <p className="card-text text-muted small flex-grow-1">
                    {product.description?.substring(0, 80)}...
                </p>
                
                <div className="d-flex justify-content-between align-items-center mt-2">
                    <div>
                        <h5 className="text-primary mb-0">₹{product.price}</h5>
                        {product.originalPrice && (
                            <small className="text-muted text-decoration-line-through ms-1">
                                ₹{product.originalPrice}
                            </small>
                        )}
                    </div>
                    
                    {/* Cart Quantity Badge */}
                    {cartQuantity > 0 && (
                        <span className="badge bg-warning text-dark me-2">
                            In Cart: {cartQuantity}
                        </span>
                    )}
                    
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={handleAddToCart}
                        disabled={addingToCart || product.countInStock === 0}
                    >
                        {addingToCart ? (
                            <>
                                <Loader size={14} className="spinner me-1" />
                                Adding...
                            </>
                        ) : (
                            <>
                                <ShoppingCart size={14} className="me-1" />
                                {cartQuantity > 0 ? 'Add More' : 'Add to Cart'}
                            </>
                        )}
                    </button>
                </div>
                
                {/* Stock Status */}
                {product.countInStock === 0 && (
                    <span className="badge bg-danger mt-2">Out of Stock</span>
                )}

                {product.countInStock < 5 && product.countInStock > 0 && (
                    <span className="badge bg-warning text-dark mt-2">
                        Only {product.countInStock} left!
                    </span>
                )}
            </div>

            <style jsx>{`
                .spinner {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .product-card {
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .product-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
                }
                .product-card:hover img {
                    transform: scale(1.05);
                }
            `}</style>
        </div>
    );
};

export default ProductCard;