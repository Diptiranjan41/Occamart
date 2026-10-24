// src/api/api.js
import axios from 'axios';

// ============================================================
// BASE URL (production NEVER falls back to localhost)
// ============================================================
const PROD_API = 'https://occamart.onrender.com/api';
const isProduction = import.meta.env?.PROD === true;

const stripSlash = (url) => String(url).trim().replace(/\/+$/, '');

const getBaseURL = () => {
    // 1. Env variable (Vercel: VITE_API_URL)
    const envUrl = import.meta.env?.VITE_API_URL;
    if (envUrl && envUrl.trim()) return stripSlash(envUrl);

    // 2. Any deployed site (not localhost / LAN IP) -> Render backend
    const host = window.location.hostname;
    const isLocal =
        host === 'localhost' ||
        host === '127.0.0.1' ||
        /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);

    if (isProduction || !isLocal) return PROD_API;

    // 3. Local development only
    return `http://${host}:5000/api`;
};

export const API_BASE_URL = getBaseURL();
// Server root without /api (use for /uploads image paths)
export const SERVER_URL = API_BASE_URL.replace(/\/api$/, '');

if (!isProduction) console.log('🔗 API Base URL:', API_BASE_URL);

// ============================================================
// AXIOS INSTANCE
// ============================================================
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
    },
    timeout: 60000, // Render free tier cold start can take 30-60s
    withCredentials: true
});

// ============================================================
// REQUEST INTERCEPTOR
// ============================================================
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;

        // Let the browser set the multipart boundary for FormData
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        if (!isProduction) {
            console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // No response: network error, timeout, CORS
        if (!error.response) {
            console.error('❌ Network Error:', error.message, '→', error.config?.baseURL + error.config?.url);

            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                return Promise.reject({
                    success: false,
                    message: 'Server is waking up. Please try again in a few seconds.',
                    isTimeout: true,
                    originalError: error
                });
            }
            return Promise.reject({
                success: false,
                message: 'Network error. Please check your connection.',
                originalError: error
            });
        }

        const status = error.response.status;
        const url = error.config?.url || '';
        const isAuthCall = /\/auth\/(login|register|forgot-password|reset-password)/.test(url);

        // 401: session expired (but not for wrong-password on login/register)
        if (status === 401 && !isAuthCall) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }

        if (status >= 500) console.error('💥 Server Error:', error.response.data);

        return Promise.reject(error);
    }
);

// ============================================================
// AUTH API
// ============================================================
export const authAPI = {
    register: (userData) => api.post('/auth/register', userData),
    login: (credentials) => api.post('/auth/login', credentials),
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    },
    // Backend route is /auth/profile (was /auth/me)
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (userData) => api.put('/users/profile', userData),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
    verifyEmail: (token) => api.get(`/auth/verify/${token}`)
};

// ============================================================
// PRODUCT API
// ============================================================
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

// ============================================================
// ORDER API
// ============================================================
export const orderAPI = {
    createOrder: (orderData) => api.post('/orders', orderData),
    getMyOrders: () => api.get('/orders/myorders'),
    getAllOrders: (params) => api.get('/orders', { params }),
    getOrderById: (id) => api.get(`/orders/${id}`),
    updateOrderToPaid: (id, paymentResult) => api.put(`/orders/${id}/pay`, paymentResult),
    updateOrderStatus: (id, statusData) => api.put(`/orders/${id}/status`, statusData),
    updateOrderToDelivered: (id) => api.put(`/orders/${id}/deliver`),
    cancelOrder: (id) => api.put(`/orders/${id}/cancel`),
    getOrderAnalytics: (params) => api.get('/orders/analytics', { params }),
    getOrderStats: () => api.get('/orders/stats'),
    getRecentOrders: () => api.get('/orders/recent'),
    bulkUpdateOrders: (data) => api.put('/orders/bulk', data),
    deleteOrder: (id) => api.delete(`/orders/${id}`)
};

// ============================================================
// PAYMENT API
// ============================================================
export const paymentAPI = {
    initializeRazorpayPayment: (orderData) => api.post('/payments/initialize', orderData),
    verifyRazorpayPayment: (paymentData) => api.post('/payments/verify', paymentData),
    getRazorpayKey: () => api.get('/payments/key'),
    createRazorpayOrder: (data) => api.post('/payments/create-razorpay-order', data),
    verifyRazorpayPaymentFrontend: (data) => api.post('/payments/verify-razorpay-payment', data),
    processRefund: (paymentId, refundData) => api.post(`/payments/${paymentId}/refund`, refundData)
};

// ============================================================
// RETURN API
// ============================================================
export const returnAPI = {
    getReturnReasons: () => api.get('/returns/reasons'),
    getReturnPolicy: () => api.get('/returns/policy'),
    getReturnableItems: (orderId) => api.get(`/returns/order/${orderId}/returnable-items`),
    uploadReturnImages: (orderId, formData) => api.post(`/returns/order/${orderId}/images`, formData),
    requestReturn: (orderId, returnData) => api.post(`/returns/order/${orderId}/request`, returnData),
    getReturnDetails: (orderId) => api.get(`/returns/order/${orderId}/details`),
    cancelReturn: (orderId, cancelData) => api.post(`/returns/order/${orderId}/cancel`, cancelData),
    trackReturn: (returnId) => api.get(`/returns/track/${returnId}`),
    getAllReturns: (filters = {}) => api.get('/returns', { params: filters }),
    updateReturnStatus: (returnId, statusData) => api.put(`/returns/${returnId}/status`, statusData),
    processReturnRefund: (returnId, refundData) => api.post(`/returns/${returnId}/refund`, refundData),
    scheduleReturnPickup: (returnId, pickupData) => api.post(`/returns/${returnId}/pickup`, pickupData)
};

// ============================================================
// CART / WISHLIST / REVIEW
// ============================================================
export const cartAPI = {
    getCart: () => api.get('/cart'),
    addToCart: (itemData) => api.post('/cart/add', itemData),
    updateCartItem: (itemId, quantity) => api.put(`/cart/item/${itemId}`, { quantity }),
    removeFromCart: (itemId) => api.delete(`/cart/item/${itemId}`),
    clearCart: () => api.delete('/cart/clear'),
    applyCoupon: (couponCode) => api.post('/cart/apply-coupon', { couponCode }),
    removeCoupon: () => api.delete('/cart/remove-coupon')
};

export const wishlistAPI = {
    getWishlist: () => api.get('/wishlist'),
    addToWishlist: (productId) => api.post('/wishlist/add', { productId }),
    removeFromWishlist: (productId) => api.delete(`/wishlist/${productId}`),
    isInWishlist: (productId) => api.get(`/wishlist/check/${productId}`)
};

export const reviewAPI = {
    getProductReviews: (productId) => api.get(`/reviews/product/${productId}`),
    createReview: (reviewData) => api.post('/reviews', reviewData),
    updateReview: (reviewId, reviewData) => api.put(`/reviews/${reviewId}`, reviewData),
    deleteReview: (reviewId) => api.delete(`/reviews/${reviewId}`),
    getUserReviews: () => api.get('/reviews/user'),
    canReview: (productId) => api.get(`/reviews/can-review/${productId}`)
};

// ============================================================
// USER / ADMIN
// ============================================================
export const userAPI = {
    getAllUsers: (params) => api.get('/users', { params }),
    getUserById: (id) => api.get(`/users/${id}`),
    updateUser: (id, userData) => api.put(`/users/${id}`, userData),
    deleteUser: (id) => api.delete(`/users/${id}`),
    updateUserRole: (id, role) => api.put(`/users/${id}/role`, { role })
};

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

// ============================================================
// NOTIFICATION / HERO / NEWSLETTER / FEEDBACK
// ============================================================
export const notificationAPI = {
    getNotifications: () => api.get('/notifications'),
    markAsRead: (id) => api.put(`/notifications/${id}/read`),
    markAllAsRead: () => api.put('/notifications/read-all'),
    deleteNotification: (id) => api.delete(`/notifications/${id}`),
    getUnreadCount: () => api.get('/notifications/unread-count')
};

export const heroAPI = {
    getBanners: () => api.get('/hero-banner'),
    getActiveBanners: () => api.get('/hero-banner/active'),
    createBanner: (data) => api.post('/hero-banner', data),
    updateBanner: (id, data) => api.put(`/hero-banner/${id}`, data),
    deleteBanner: (id) => api.delete(`/hero-banner/${id}`)
};

export const newsletterAPI = {
    subscribe: (email) => api.post('/newsletter/subscribe', { email }),
    unsubscribe: (email) => api.post('/newsletter/unsubscribe', { email }),
    sendNewsletter: (data) => api.post('/newsletter/send', data),
    getSubscribers: () => api.get('/newsletter/subscribers')
};

export const feedbackAPI = {
    submitFeedback: (data) => api.post('/feedback', data),
    getAllFeedback: (params) => api.get('/feedback', { params }),
    getFeedbackStats: () => api.get('/feedback/stats'),
    deleteFeedback: (id) => api.delete(`/feedback/${id}`)
};

// ============================================================
// HELPERS
// ============================================================
const safeParse = (value, fallback) => {
    try {
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
};

export const getCurrentUser = () => safeParse(localStorage.getItem('user'), null);
export const isAdmin = () => getCurrentUser()?.role === 'admin';
export const getToken = () => localStorage.getItem('token');
export const isAuthenticated = () => !!localStorage.getItem('token');

export const handleApiError = (error) => {
    if (error?.response) {
        return {
            success: false,
            message: error.response.data?.message || 'Something went wrong',
            status: error.response.status,
            data: error.response.data
        };
    }
    if (error?.isTimeout || error?.originalError || error?.request) {
        return {
            success: false,
            message: error.message || 'No response from server. Please check your connection.',
            isNetworkError: true
        };
    }
    return { success: false, message: error?.message || 'An unexpected error occurred' };
};

export default api;
