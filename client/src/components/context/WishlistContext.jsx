// src/context/WishlistContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const WishlistContext = createContext();

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};

export const WishlistProvider = ({ children }) => {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [wishlistCount, setWishlistCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const API_URL = 'http://localhost:5000/api';

    // Fetch wishlist from backend
    const fetchWishlist = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setWishlistItems([]);
            setWishlistCount(0);
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/wishlist`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('Wishlist API Response:', response.data);

            // Extract items from response
            let items = [];
            
            if (response.data.success && Array.isArray(response.data.items)) {
                items = response.data.items.map(item => {
                    const product = item.product || item;
                    return {
                        _id: product._id,
                        name: product.name || 'Product',
                        price: product.price || 0,
                        image: product.image || (product.images && product.images[0]),
                        brand: product.brand || '',
                        category: product.category || '',
                        description: product.description || ''
                    };
                });
            } else if (Array.isArray(response.data)) {
                items = response.data.map(product => ({
                    _id: product._id,
                    name: product.name || 'Product',
                    price: product.price || 0,
                    image: product.image || (product.images && product.images[0]),
                    brand: product.brand || '',
                    category: product.category || ''
                }));
            }

            setWishlistItems(items);
            setWishlistCount(items.length);
            
        } catch (error) {
            console.error('Error fetching wishlist:', error);
            setError(error.message);
            setWishlistItems([]);
            setWishlistCount(0);
        } finally {
            setLoading(false);
        }
    }, [API_URL]);

    // Load wishlist on mount if authenticated
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchWishlist();
        }
    }, [fetchWishlist]);

    // 🔥 FIXED: Add to wishlist with better error handling
    const addToWishlist = async (product) => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('Please login to add items to wishlist');
            return { success: false, error: 'Not authenticated' };
        }

        // Validate product has ID
        if (!product || !product._id) {
            console.error('❌ Invalid product:', product);
            setError('Invalid product data');
            return { success: false, error: 'Invalid product' };
        }

        setLoading(true);
        setError(null);
        
        try {
            console.log('🛍️ Adding to wishlist - Product ID:', product._id);
            
            const response = await axios.post(`${API_URL}/wishlist/add`, {
                productId: product._id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('✅ Wishlist add response:', response.data);

            if (response.data.success) {
                await fetchWishlist(); // Refresh wishlist
                return { success: true };
            } else {
                throw new Error(response.data.message || 'Failed to add to wishlist');
            }
        } catch (error) {
            console.error('❌ Add to wishlist error:', error);
            
            // Extract error message
            const errorMessage = error.response?.data?.message || 
                                error.message || 
                                'Failed to add to wishlist';
            
            setError(errorMessage);
            
            // Show alert for user feedback
            alert(errorMessage);
            
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    // 🔥 FIXED: Remove from wishlist with better error handling
    const removeFromWishlist = async (productId) => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('Please login to remove items from wishlist');
            return { success: false, error: 'Not authenticated' };
        }

        if (!productId) {
            setError('Invalid product ID');
            return { success: false, error: 'Invalid product' };
        }

        setLoading(true);
        
        try {
            console.log('🗑️ Removing from wishlist - Product ID:', productId);
            
            const response = await axios.delete(`${API_URL}/wishlist/${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('✅ Wishlist remove response:', response.data);

            if (response.data.success) {
                await fetchWishlist(); // Refresh wishlist
                return { success: true };
            } else {
                throw new Error(response.data.message || 'Failed to remove from wishlist');
            }
        } catch (error) {
            console.error('❌ Remove from wishlist error:', error);
            
            const errorMessage = error.response?.data?.message || 
                                error.message || 
                                'Failed to remove from wishlist';
            
            setError(errorMessage);
            alert(errorMessage);
            
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    // Check if product is in wishlist
    const isInWishlist = (productId) => {
        if (!productId) return false;
        return wishlistItems.some(item => item._id === productId);
    };

    const value = {
        wishlistItems,
        wishlistCount,
        loading,
        error,
        fetchWishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist
    };

    return (
        <WishlistContext.Provider value={value}>
            {children}
        </WishlistContext.Provider>
    );
};