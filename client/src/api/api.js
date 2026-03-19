// src/api/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 10000 // 10 second timeout
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log(`🚀 ${config.method?.toUpperCase() || 'REQUEST'} ${config.baseURL}${config.url}`, 
            config.data ? { data: config.data } : '');
        return config;
    },
    (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - Status:`, response.status);
        return response;
    },
    (error) => {
        // Handle network errors
        if (!error.response) {
            console.error('❌ Network Error:', error.message);
            return Promise.reject({
                success: false,
                message: 'Network error. Please check your connection.'
            });
        }

        console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url} - Error:`, 
            error.response?.data || error.message);
        
        // Handle 401 Unauthorized - token expired or invalid
        if (error.response?.status === 401) {
            console.log('🔐 Session expired. Redirecting to login...');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Don't redirect if already on login page
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        
        // Handle 403 Forbidden - permission denied
        if (error.response?.status === 403) {
            console.log('🚫 Access denied. You don\'t have permission for this action.');
        }
        
        return Promise.reject(error);
    }
);

// ==================== AUTH API ====================
export const authAPI = {
    register: (userData) => api.post('/auth/register', userData),
    login: (credentials) => api.post('/auth/login', credentials),
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    },
    getProfile: () => api.get('/users/profile'),
    updateProfile: (userData) => api.put('/users/profile', userData)
};

// ==================== PRODUCT API ====================
export const productAPI = {
    getAllProducts: (params) => api.get('/products', { params }),
    getProductById: (id) => api.get(`/products/${id}`),
    createProduct: (productData) => api.post('/products', productData),
    updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
    deleteProduct: (id) => api.delete(`/products/${id}`),
    getFeaturedProducts: () => api.get('/products/featured'),
    searchProducts: (query) => api.get('/products/search', { params: { q: query } }),
    getProductsByCategory: (category) => api.get(`/products/category/${category}`)
};

// ==================== ORDER API ====================
export const orderAPI = {
    // Create a new order
    createOrder: (orderData) => api.post('/orders', orderData),
    
    // Get current user's orders
    getMyOrders: () => api.get('/orders/myorders'),
    
    // Get all orders (admin only)
    getAllOrders: (params) => api.get('/orders', { params }),
    
    // Get single order by ID
    getOrderById: (id) => api.get(`/orders/${id}`),
    
    // Update order payment status
    updateOrderToPaid: (id, paymentResult) => api.put(`/orders/${id}/pay`, paymentResult),
    
    // Update order status (admin only)
    updateOrderStatus: (id, statusData) => api.put(`/orders/${id}/status`, statusData),
    
    // Update order to delivered (admin only)
    updateOrderToDelivered: (id) => api.put(`/orders/${id}/deliver`),
    
    // Cancel order
    cancelOrder: (id) => api.put(`/orders/${id}/cancel`),
    
    // ========== NEW RAZORPAY PAYMENT METHODS ==========
    
    // Create Razorpay order
    createRazorpayOrder: (data) => api.post('/payment/create-razorpay-order', data),
    
    // Verify Razorpay payment
    verifyRazorpayPayment: (data) => api.post('/payment/verify-razorpay-payment', data),
    
    // Get payment details by order ID
    getPaymentDetails: (orderId) => api.get(`/payment/order/${orderId}`),
    
    // Process refund
    processRefund: (paymentId, refundData) => api.post(`/payment/${paymentId}/refund`, refundData)
};

// ==================== RETURN API ====================
export const returnAPI = {
    // Public routes
    getReturnReasons: () => api.get('/returns/reasons'),
    getReturnPolicy: () => api.get('/returns/policy'),

    // User routes (require authentication)
    
    // Get returnable items for a specific order
    getReturnableItems: (orderId) => 
        api.get(`/returns/order/${orderId}/returnable-items`),
    
    // Upload images for return (multipart/form-data)
    uploadReturnImages: (orderId, formData) => 
        api.post(`/returns/order/${orderId}/images`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),
    
    // Submit a return request
    requestReturn: (orderId, returnData) => 
        api.post(`/returns/order/${orderId}/request`, returnData),
    
    // Get return details for an order
    getReturnDetails: (orderId) => 
        api.get(`/returns/order/${orderId}/details`),
    
    // Cancel a return request
    cancelReturn: (orderId, cancelData) => 
        api.post(`/returns/order/${orderId}/cancel`, cancelData),
    
    // Track a return by ID
    trackReturn: (returnId) => 
        api.get(`/returns/track/${returnId}`),

    // Admin routes (require admin privileges)
    
    // Get all returns with filters
    getAllReturns: (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        return api.get(`/returns?${params}`);
    },
    
    // Update return status (approve/reject)
    updateReturnStatus: (returnId, statusData) => 
        api.put(`/returns/${returnId}/status`, statusData),
    
    // Process refund for return
    processReturnRefund: (returnId, refundData) => 
        api.post(`/returns/${returnId}/refund`, refundData),
    
    // Schedule pickup for return
    scheduleReturnPickup: (returnId, pickupData) => 
        api.post(`/returns/${returnId}/pickup`, pickupData)
};

// ==================== REVIEW API ====================
export const reviewAPI = {
    // Get reviews for a product
    getProductReviews: (productId) => 
        api.get(`/reviews/product/${productId}`),
    
    // Create a review (requires auth)
    createReview: (reviewData) => 
        api.post('/reviews', reviewData),
    
    // Update a review
    updateReview: (reviewId, reviewData) => 
        api.put(`/reviews/${reviewId}`, reviewData),
    
    // Delete a review
    deleteReview: (reviewId) => 
        api.delete(`/reviews/${reviewId}`),
    
    // Get user's reviews
    getUserReviews: () => 
        api.get('/reviews/user'),
    
    // Check if user can review a product
    canReview: (productId) => 
        api.get(`/reviews/can-review/${productId}`)
};

// ==================== USER API ====================
export const userAPI = {
    // Get all users (admin only)
    getAllUsers: (params) => api.get('/users', { params }),
    
    // Get user by ID
    getUserById: (id) => api.get(`/users/${id}`),
    
    // Update user
    updateUser: (id, userData) => api.put(`/users/${id}`, userData),
    
    // Delete user (admin only)
    deleteUser: (id) => api.delete(`/users/${id}`),
    
    // Update user role (admin only)
    updateUserRole: (id, role) => api.put(`/users/${id}/role`, { role })
};

// ==================== CART API ====================
export const cartAPI = {
    // Get cart
    getCart: () => api.get('/cart'),
    
    // Add item to cart
    addToCart: (itemData) => api.post('/cart/add', itemData),
    
    // Update cart item quantity
    updateCartItem: (itemId, quantity) => 
        api.put(`/cart/item/${itemId}`, { quantity }),
    
    // Remove from cart
    removeFromCart: (itemId) => 
        api.delete(`/cart/item/${itemId}`),
    
    // Clear cart
    clearCart: () => api.delete('/cart/clear'),
    
    // Apply coupon
    applyCoupon: (couponCode) => 
        api.post('/cart/apply-coupon', { couponCode }),
    
    // Remove coupon
    removeCoupon: () => api.delete('/cart/remove-coupon')
};

// ==================== WISHLIST API ====================
export const wishlistAPI = {
    // Get wishlist
    getWishlist: () => api.get('/wishlist'),
    
    // Add to wishlist
    addToWishlist: (productId) => 
        api.post('/wishlist/add', { productId }),
    
    // Remove from wishlist
    removeFromWishlist: (productId) => 
        api.delete(`/wishlist/${productId}`),
    
    // Check if in wishlist
    isInWishlist: (productId) => 
        api.get(`/wishlist/check/${productId}`)
};

// ==================== PAYMENT API ====================
export const paymentAPI = {
    // Create payment intent (for Stripe)
    createPaymentIntent: (orderData) => 
        api.post('/payments/create-intent', orderData),
    
    // Confirm payment
    confirmPayment: (paymentIntentId) => 
        api.post('/payments/confirm', { paymentIntentId }),
    
    // Get payment methods
    getPaymentMethods: () => api.get('/payments/methods'),
    
    // Process refund (admin only)
    processRefund: (paymentId, refundData) => 
        api.post(`/payments/${paymentId}/refund`, refundData),
    
    // ========== NEW RAZORPAY METHODS ==========
    
    // Initialize Razorpay payment
    initializeRazorpayPayment: (orderData) => 
        api.post('/payments/razorpay/initialize', orderData),
    
    // Verify Razorpay payment
    verifyRazorpayPayment: (paymentData) => 
        api.post('/payments/razorpay/verify', paymentData),
    
    // Get Razorpay key
    getRazorpayKey: () => api.get('/payments/razorpay/key')
};

// ==================== SHIPPING API ====================
export const shippingAPI = {
    // Calculate shipping
    calculateShipping: (address, items) => 
        api.post('/shipping/calculate', { address, items }),
    
    // Get shipping methods
    getShippingMethods: (address) => 
        api.post('/shipping/methods', { address }),
    
    // Track shipment
    trackShipment: (trackingNumber) => 
        api.get(`/shipping/track/${trackingNumber}`)
};

// ==================== ADMIN API ====================
export const adminAPI = {
    // Dashboard stats
    getDashboardStats: () => api.get('/admin/stats'),
    
    // Sales report
    getSalesReport: (params) => api.get('/admin/reports/sales', { params }),
    
    // Inventory report
    getInventoryReport: () => api.get('/admin/reports/inventory'),
    
    // User activity
    getUserActivity: (params) => api.get('/admin/analytics/users', { params }),
    
    // Manage categories
    getCategories: () => api.get('/admin/categories'),
    createCategory: (categoryData) => api.post('/admin/categories', categoryData),
    updateCategory: (id, categoryData) => api.put(`/admin/categories/${id}`, categoryData),
    deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
    
    // Manage coupons
    getCoupons: () => api.get('/admin/coupons'),
    createCoupon: (couponData) => api.post('/admin/coupons', couponData),
    updateCoupon: (id, couponData) => api.put(`/admin/coupons/${id}`, couponData),
    deleteCoupon: (id) => api.delete(`/admin/coupons/${id}`)
};

// ==================== HELPER FUNCTIONS ====================

// Helper function to check if user is admin
export const isAdmin = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.role === 'admin';
};

// Helper function to get auth token
export const getToken = () => {
    return localStorage.getItem('token');
};

// Helper function to get current user
export const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
    return !!localStorage.getItem('token');
};

// Helper function to handle API errors
export const handleApiError = (error) => {
    if (error.response) {
        // Server responded with error
        return {
            success: false,
            message: error.response.data?.message || 'Something went wrong',
            status: error.response.status
        };
    } else if (error.request) {
        // Request made but no response
        return {
            success: false,
            message: 'No response from server. Please check your connection.'
        };
    } else {
        // Something else happened
        return {
            success: false,
            message: error.message || 'An unexpected error occurred'
        };
    }
};

export default api;