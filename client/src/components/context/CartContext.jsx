// src/context/CartContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [cartCount, setCartCount] = useState(0);
    const [cartTotal, setCartTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const API_URL = 'http://localhost:5000/api';

    // Update cart totals
    const updateCartTotals = useCallback((items) => {
        const count = items.reduce((total, item) => total + (item.quantity || 1), 0);
        const totalPrice = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
        
        setCartCount(count);
        setCartTotal(totalPrice);
    }, []);

    // Fetch cart from backend
    const fetchCart = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setCartItems([]);
            setCartCount(0);
            setCartTotal(0);
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/cart`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('🛒 Cart API Response:', response.data);

            // Extract items from response
            let items = [];
            if (response.data.success && Array.isArray(response.data.items)) {
                items = response.data.items;
            } else if (Array.isArray(response.data)) {
                items = response.data;
            } else if (response.data.cart && Array.isArray(response.data.cart.items)) {
                items = response.data.cart.items;
            }

            // Transform items to consistent format
            const cartItems = items.map(item => {
                const product = item.product || item;
                return {
                    _id: product._id,
                    name: product.name || 'Product',
                    price: product.price || 0,
                    image: product.image || (product.images && product.images[0]),
                    quantity: item.quantity || 1,
                    brand: product.brand || '',
                    category: product.category || '',
                    originalPrice: product.originalPrice
                };
            });

            setCartItems(cartItems);
            updateCartTotals(cartItems);
            
        } catch (error) {
            console.error('❌ Error fetching cart:', error);
            setError(error.message);
            setCartItems([]);
            setCartCount(0);
            setCartTotal(0);
        } finally {
            setLoading(false);
        }
    }, [updateCartTotals, API_URL]);

    // Load cart on mount if authenticated
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchCart();
        }
    }, [fetchCart]);

    // 🔥 FIXED: Add to cart - accepts either product object or productId
    const addToCart = async (productOrId, quantity = 1) => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('Please login to add items to cart');
            return { success: false, error: 'Not authenticated' };
        }

        setLoading(true);
        setError(null);

        try {
            // Determine if we received product object or just ID
            const productId = typeof productOrId === 'object' ? productOrId._id : productOrId;
            
            console.log('🛒 Adding to cart:', { productId, quantity });

            // Check if product already in cart
            const existingItem = cartItems.find(item => item._id === productId);
            
            let response;
            
            if (existingItem) {
                // If exists, update quantity
                response = await axios.put(`${API_URL}/cart/update`, {
                    productId,
                    quantity: existingItem.quantity + quantity
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('📦 Updating existing cart item:', response.data);
            } else {
                // If new, add to cart
                response = await axios.post(`${API_URL}/cart/add`, {
                    productId,
                    quantity
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('📦 Adding new item to cart:', response.data);
            }

            if (response.data.success) {
                await fetchCart(); // Refresh cart from backend
                return { success: true };
            } else {
                throw new Error(response.data.message || 'Failed to add to cart');
            }
        } catch (error) {
            console.error('❌ Add to cart error:', error);
            setError(error.response?.data?.message || error.message);
            return { success: false, error: error.response?.data?.message || error.message };
        } finally {
            setLoading(false);
        }
    };

    // Remove from cart
    const removeFromCart = async (productId) => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('Please login to remove items from cart');
            return { success: false };
        }

        setLoading(true);
        
        try {
            const response = await axios.delete(`${API_URL}/cart/${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                await fetchCart();
                return { success: true };
            }
        } catch (error) {
            console.error('❌ Remove from cart error:', error);
            setError(error.response?.data?.message || error.message);
            return { success: false };
        } finally {
            setLoading(false);
        }
    };

    // Update quantity
    const updateQuantity = async (productId, newQuantity) => {
        if (newQuantity < 1) return removeFromCart(productId);

        const token = localStorage.getItem('token');
        if (!token) {
            setError('Please login to update cart');
            return { success: false };
        }

        setLoading(true);
        
        try {
            const response = await axios.put(`${API_URL}/cart/update`, {
                productId,
                quantity: newQuantity
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                await fetchCart();
                return { success: true };
            }
        } catch (error) {
            console.error('❌ Update quantity error:', error);
            setError(error.response?.data?.message || error.message);
            return { success: false };
        } finally {
            setLoading(false);
        }
    };

    // Clear cart
    const clearCart = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setLoading(true);
        
        try {
            const response = await axios.delete(`${API_URL}/cart/clear`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setCartItems([]);
                setCartCount(0);
                setCartTotal(0);
            }
        } catch (error) {
            console.error('❌ Clear cart error:', error);
            setError(error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    // Check if item is in cart
    const isInCart = (productId) => {
        return cartItems.some(item => item._id === productId);
    };

    // Get item quantity
    const getItemQuantity = (productId) => {
        const item = cartItems.find(item => item._id === productId);
        return item ? item.quantity : 0;
    };

    const value = {
        cartItems,
        cartCount,
        cartTotal,
        loading,
        error,
        fetchCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isInCart,
        getItemQuantity
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};