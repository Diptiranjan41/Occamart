// src/api/api.js
import axios from 'axios';

// ============================================================
// 🔥 SMART API BASE URL - Auto-detects environment
// ============================================================

// Get the current environment
const isProduction = import.meta.env?.MODE === 'production' || 
                     import.meta.env?.PROD === true;

// Get backend URL from environment or auto-detect
const getBaseURL = () => {
    // 1. Check environment variable first
    if (import.meta.env?.VITE_API_URL) {
        console.log('📡 Using API from VITE_API_URL:', import.meta.env.VITE_API_URL);
        return import.meta.env.VITE_API_URL;
    }
    
    // 2. Check if we're in production (Render)
    if (isProduction) {
        console.log('📡 Production mode - using Render backend');
        return 'https://occamart.onrender.com/api';
    }
    
    // 3. Development - auto-detect localhost
    // ✅ FIXED: Changed from 3000 to 5000
    const port = 5000; // Your backend port
    const hostname = window.location.hostname;
    
    // Check if running on specific IP
    const localIPs = [
        '192.168.137.1',
        '192.168.56.1',
        '20.3.3.22',
        '192.168.96.167'
    ];
    
    if (localIPs.includes(hostname)) {
        console.log(`📡 Development mode - using IP: ${hostname}:${port}`);
        return `http://${hostname}:${port}/api`;
    }
    
    // Default localhost
    console.log(`📡 Development mode - using localhost:${port}`);
    return `http://localhost:${port}/api`;
};

const API_BASE_URL = getBaseURL();

console.log('🔗 API Base URL:', API_BASE_URL);

// ============================================================
// CREATE AXIOS INSTANCE WITH DYNAMIC BASE URL
// ============================================================

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    timeout: 30000, // 30 seconds
    withCredentials: true // Important for cookies/sessions
});

// ============================================================
// REQUEST INTERCEPTOR - Add token and log requests
// ============================================================

api.interceptors.request.use(
    (config) => {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Log request (only in development)
        if (!isProduction) {
            console.log(`🚀 ${config.method?.toUpperCase() || 'REQUEST'} ${config.url}`, 
                config.data ? { data: config.data } : '');
        }
        
        return config;
    },
    (error) => {
        console.error('❌ Request Interceptor Error:', error);
        return Promise.reject(error);
    }
);

// ============================================================
// RESPONSE INTERCEPTOR - Handle errors globally
// ============================================================

api.interceptors.response.use(
    (response) => {
        if (!isProduction) {
            console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        // Handle network errors
        if (!error.response) {
            console.error('❌ Network Error:', error.message);
            console.error('📡 Target URL:', error.config?.baseURL + error.config?.url);
            
            // Check if it's a timeout
            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                return Promise.reject({
                    success: false,
                    message: 'The server is taking too long to respond. Please try again.',
                    isTimeout: true,
                    code: 'ECONNABORTED'
                });
            }
            
            return Promise.reject({
                success: false,
                message: 'Network error. Please check your connection.',
                originalError: error
            });
        }

        // Handle 401 Unauthorized - token expired
        if (error.response?.status === 401) {
            console.log('🔐 Session expired. Redirecting to login...');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Only redirect if not already on login page
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        
        // Handle 403 Forbidden
        if (error.response?.status === 403) {
            console.log('🚫 Access denied. Insufficient permissions.');
        }
        
        // Handle 404 Not Found
        if (error.response?.status === 404) {
            console.log('🔍 Resource not found:', error.config?.url);
        }
        
        // Handle 500 Server Error
        if (error.response?.status >= 500) {
            console.error('💥 Server Error:', error.response?.data);
        }

        // Log error details
        console.error(`❌ ${error.config?.method?.toUpperCase() || 'REQUEST'} ${error.config?.url} - Error:`, 
            error.response?.data || error.message);
        
        return Promise.reject(error);
    }
);

// ============================================================
// API FUNCTIONS
// ============================================================

// ==================== AUTH API ====================
export const authAPI = {
    register: (userData) => api.post('/auth/register', userData),
    login: (credentials) => api.post('/auth/login', credentials),
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    },
    getProfile: () => api.get('/auth/me'),
    updateProfile: (userData) => api.put('/users/profile', userData),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
    verifyEmail: (token) => api.get(`/auth/verify/${token}`)
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
    getProductsByCategory: (category) => api.get(`/products/category/${category}`),
    getCategoryCounts: () => api.get('/products/category-counts')
};

// ==================== ORDER API ====================
export const orderAPI = {
    // ✅ Create a new order
    createOrder: (orderData) => api.post('/orders', orderData),
    
    // ✅ Get current user's orders
    getMyOrders: () => api.get('/orders/myorders'),
    
    // ✅ Get all orders - ADMIN ONLY
    getAllOrders: (params) => api.get('/orders', { params }),
    
    // ✅ Get single order by ID
    getOrderById: (id) => {
        console.log(`📦 Fetching order: ${id}`);
        console.log(`🔗 URL: ${api.defaults.baseURL}/orders/${id}`);
        return api.get(`/orders/${id}`);
    },
    
    // ✅ Update order payment status
    updateOrderToPaid: (id, paymentResult) => api.put(`/orders/${id}/pay`, paymentResult),
    
    // ✅ Update order status - ADMIN ONLY
    updateOrderStatus: (id, statusData) => api.put(`/orders/${id}/status`, statusData),
    
    // ✅ Update order to delivered - ADMIN ONLY
    updateOrderToDelivered: (id) => api.put(`/orders/${id}/deliver`),
    
    // ✅ Cancel order
    cancelOrder: (id) => api.put(`/orders/${id}/cancel`),
    
    // ✅ Get order analytics - ADMIN ONLY
    getOrderAnalytics: (params) => api.get('/orders/analytics', { params }),
    
    // ✅ Get order stats - ADMIN ONLY
    getOrderStats: () => api.get('/orders/stats'),
    
    // ✅ Get recent orders - ADMIN ONLY
    getRecentOrders: () => api.get('/orders/recent'),
    
    // ✅ Bulk update orders - ADMIN ONLY
    bulkUpdateOrders: (data) => api.put('/orders/bulk', data),
    
    // ✅ Delete order - ADMIN ONLY
    deleteOrder: (id) => api.delete(`/orders/${id}`)
};

// ==================== PAYMENT API ====================
export const paymentAPI = {
    // ✅ Initialize Razorpay payment
    initializeRazorpayPayment: (orderData) => 
        api.post('/payments/initialize', orderData),
    
    // ✅ Verify Razorpay payment
    verifyRazorpayPayment: (paymentData) => 
        api.post('/payments/verify', paymentData),
    
    // ✅ Get Razorpay key
    getRazorpayKey: () => api.get('/payments/key'),
    
    // ✅ Create Razorpay order (from frontend)
    createRazorpayOrder: (data) => 
        api.post('/payments/create-razorpay-order', data),
    
    // ✅ Verify Razorpay payment (from frontend)
    verifyRazorpayPaymentFrontend: (data) => 
        api.post('/payments/verify-razorpay-payment', data),
    
    // ✅ Process refund - ADMIN ONLY
    processRefund: (paymentId, refundData) => 
        api.post(`/payments/${paymentId}/refund`, refundData)
};

// ==================== RETURN API ====================
export const returnAPI = {
    // Public routes
    getReturnReasons: () => api.get('/returns/reasons'),
    getReturnPolicy: () => api.get('/returns/policy'),

    // User routes (require authentication)
    getReturnableItems: (orderId) => 
        api.get(`/returns/order/${orderId}/returnable-items`),
    
    uploadReturnImages: (orderId, formData) => 
        api.post(`/returns/order/${orderId}/images`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),
    
    requestReturn: (orderId, returnData) => 
        api.post(`/returns/order/${orderId}/request`, returnData),
    
    getReturnDetails: (orderId) => 
        api.get(`/returns/order/${orderId}/details`),
    
    cancelReturn: (orderId, cancelData) => 
        api.post(`/returns/order/${orderId}/cancel`, cancelData),
    
    trackReturn: (returnId) => 
        api.get(`/returns/track/${returnId}`),

    // Admin routes
    getAllReturns: (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        return api.get(`/returns?${params}`);
    },
    
    updateReturnStatus: (returnId, statusData) => 
        api.put(`/returns/${returnId}/status`, statusData),
    
    processReturnRefund: (returnId, refundData) => 
        api.post(`/returns/${returnId}/refund`, refundData),
    
    scheduleReturnPickup: (returnId, pickupData) => 
        api.post(`/returns/${returnId}/pickup`, pickupData)
};

// ==================== CART API ====================
export const cartAPI = {
    getCart: () => api.get('/cart'),
    addToCart: (itemData) => api.post('/cart/add', itemData),
    updateCartItem: (itemId, quantity) => 
        api.put(`/cart/item/${itemId}`, { quantity }),
    removeFromCart: (itemId) => 
        api.delete(`/cart/item/${itemId}`),
    clearCart: () => api.delete('/cart/clear'),
    applyCoupon: (couponCode) => 
        api.post('/cart/apply-coupon', { couponCode }),
    removeCoupon: () => api.delete('/cart/remove-coupon')
};

// ==================== WISHLIST API ====================
export const wishlistAPI = {
    getWishlist: () => api.get('/wishlist'),
    addToWishlist: (productId) => 
        api.post('/wishlist/add', { productId }),
    removeFromWishlist: (productId) => 
        api.delete(`/wishlist/${productId}`),
    isInWishlist: (productId) => 
        api.get(`/wishlist/check/${productId}`)
};

// ==================== REVIEW API ====================
export const reviewAPI = {
    getProductReviews: (productId) => 
        api.get(`/reviews/product/${productId}`),
    
    createReview: (reviewData) => 
        api.post('/reviews', reviewData),
    
    updateReview: (reviewId, reviewData) => 
        api.put(`/reviews/${reviewId}`, reviewData),
    
    deleteReview: (reviewId) => 
        api.delete(`/reviews/${reviewId}`),
    
    getUserReviews: () => 
        api.get('/reviews/user'),
    
    canReview: (productId) => 
        api.get(`/reviews/can-review/${productId}`)
};

// ==================== USER API ====================
export const userAPI = {
    getAllUsers: (params) => api.get('/users', { params }),
    getUserById: (id) => api.get(`/users/${id}`),
    updateUser: (id, userData) => api.put(`/users/${id}`, userData),
    deleteUser: (id) => api.delete(`/users/${id}`),
    updateUserRole: (id, role) => api.put(`/users/${id}/role`, { role })
};

// ==================== ADMIN API ====================
export const adminAPI = {
    getDashboardStats: () => api.get('/admin/stats'),
    getSalesReport: (params) => api.get('/admin/reports/sales', { params }),
    getInventoryReport: () => api.get('/admin/reports/inventory'),
    getUserActivity: (params) => api.get('/admin/analytics/users', { params }),
    getCategories: () => api.get('/admin/categories'),
    createCategory: (categoryData) => api.post('/admin/categories', categoryData),
    updateCategory: (id, categoryData) => api.put(`/admin/categories/${id}`, categoryData),
    deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
    getCoupons: () => api.get('/admin/coupons'),
    createCoupon: (couponData) => api.post('/admin/coupons', couponData),
    updateCoupon: (id, couponData) => api.put(`/admin/coupons/${id}`, couponData),
    deleteCoupon: (id) => api.delete(`/admin/coupons/${id}`)
};

// ==================== NOTIFICATION API ====================
export const notificationAPI = {
    getNotifications: () => api.get('/notifications'),
    markAsRead: (id) => api.put(`/notifications/${id}/read`),
    markAllAsRead: () => api.put('/notifications/read-all'),
    deleteNotification: (id) => api.delete(`/notifications/${id}`),
    getUnreadCount: () => api.get('/notifications/unread-count')
};

// ==================== HERO BANNER API ====================
export const heroAPI = {
    getBanners: () => api.get('/hero-banner'),
    getActiveBanners: () => api.get('/hero-banner/active'),
    createBanner: (data) => api.post('/hero-banner', data),
    updateBanner: (id, data) => api.put(`/hero-banner/${id}`, data),
    deleteBanner: (id) => api.delete(`/hero-banner/${id}`)
};

// ==================== NEWSLETTER API ====================
export const newsletterAPI = {
    subscribe: (email) => api.post('/newsletter/subscribe', { email }),
    unsubscribe: (email) => api.post('/newsletter/unsubscribe', { email }),
    sendNewsletter: (data) => api.post('/newsletter/send', data),
    getSubscribers: () => api.get('/newsletter/subscribers')
};

// ==================== FEEDBACK API ====================
export const feedbackAPI = {
    submitFeedback: (data) => api.post('/feedback', data),
    getAllFeedback: (params) => api.get('/feedback', { params }),
    getFeedbackStats: () => api.get('/feedback/stats'),
    deleteFeedback: (id) => api.delete(`/feedback/${id}`)
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export const isAdmin = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.role === 'admin';
};

export const getToken = () => {
    return localStorage.getItem('token');
};

export const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

export const isAuthenticated = () => {
    return !!localStorage.getItem('token');
};

export const handleApiError = (error) => {
    if (error.response) {
        return {
            success: false,
            message: error.response.data?.message || 'Something went wrong',
            status: error.response.status,
            data: error.response.data
        };
    } else if (error.request) {
        return {
            success: false,
            message: 'No response from server. Please check your connection.',
            isNetworkError: true
        };
    } else {
        return {
            success: false,
            message: error.message || 'An unexpected error occurred'
        };
    }
};

export default api;