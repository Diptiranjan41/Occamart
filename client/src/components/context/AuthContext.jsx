// src/components/context/AuthContext.jsx
import React, {
    createContext,
    useState,
    useEffect,
    useContext,
    useCallback,
    useMemo
} from 'react';
import axios from 'axios';

// API base URL
const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
});

// Add request interceptor to attach token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('pendingVerification');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Create context
const AuthContext = createContext(null);

// Custom hook to use auth context
const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

// Pull a user object out of the different response shapes the backend may return
const extractUser = (data) => {
    if (!data) return null;
    if (data.user) return data.user;
    if (data._id || data.id) return data;
    if (data.success && data.data) return data.data.user || data.data;
    return null;
};

// AuthProvider component
const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch user data from backend using the stored token
    const fetchUserData = useCallback(async () => {
        try {
            const response = await api.get('/auth/me');
            const userData = extractUser(response.data);

            if (userData) {
                // Ensure role is set
                if (!userData.role) {
                    userData.role = userData.email && userData.email.includes('admin') ? 'admin' : 'user';
                }
                setUser(userData);
                return userData;
            }

            console.warn('⚠️ [AuthContext] Unexpected /auth/me response format:', response.data);
            return null;
        } catch (err) {
            console.error('❌ [AuthContext] Error fetching user data:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });

            // If token is invalid, clear it
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                setToken(null);
                setUser(null);
            }
            return null;
        }
    }, []);

    // Initialize auth on mount
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const storedToken = localStorage.getItem('token');

                if (storedToken && storedToken !== 'undefined' && storedToken !== 'null') {
                    setToken(storedToken);
                    await fetchUserData();
                }
            } catch (err) {
                console.error('❌ [AuthContext] Error initializing auth:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, [fetchUserData]);

    const login = useCallback(async (credentials) => {
        try {
            setError(null);

            const response = await api.post('/auth/login', {
                email: credentials.email,
                password: credentials.password,
                loginType: credentials.loginType || 'user'
            });

            // Handle different response structures
            let newToken = null;
            let userData = null;

            if (response.data.token && response.data.user) {
                newToken = response.data.token;
                userData = response.data.user;
            } else if (response.data.data && response.data.data.token) {
                newToken = response.data.data.token;
                userData = response.data.data.user || response.data.data;
            } else if (response.data.token) {
                newToken = response.data.token;
                userData = response.data.user || response.data;
            }

            if (!newToken) {
                throw new Error('No token received from server');
            }

            // Ensure role is set
            if (userData && !userData.role) {
                userData.role = credentials.loginType === 'admin' ? 'admin' : 'user';
            }

            // Store ONLY the token in localStorage
            localStorage.setItem('token', newToken);

            setToken(newToken);
            setUser(userData);

            return { success: true, user: userData };
        } catch (err) {
            console.error('❌ [AuthContext] Login error:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });

            // Email verification required
            if (err.response?.data?.needsVerification) {
                return {
                    success: false,
                    needsVerification: true,
                    email: err.response.data.email,
                    message: err.response.data.message || 'Please verify your email first'
                };
            }

            const errorMessage = err.response?.data?.message || err.message || 'Login failed';
            setError(errorMessage);

            return { success: false, message: errorMessage };
        }
    }, []);

    const register = useCallback(async (userData) => {
        try {
            setError(null);

            const response = await api.post('/auth/register', {
                name: userData.name,
                email: userData.email,
                password: userData.password,
                role: userData.role || 'user'
            });

            let newToken = null;
            let newUser = null;

            // Case 1: Standard response with token
            if (response.data.token) {
                newToken = response.data.token;
                newUser = response.data.user || response.data;
            }
            // Case 2: Nested data response
            else if (response.data.data?.token) {
                newToken = response.data.data.token;
                newUser = response.data.data.user || response.data.data;
            }
            // Case 3: Success with message (email verification flow)
            else if (response.data.success && response.data.message) {
                localStorage.setItem('pendingVerification', JSON.stringify({
                    email: userData.email,
                    message: response.data.message
                }));

                return {
                    success: true,
                    requiresVerification: true,
                    message: response.data.message,
                    email: userData.email
                };
            }

            // If we have a token, auto-login the user
            if (newToken) {
                if (newUser && !newUser.role) {
                    newUser.role = userData.role || 'user';
                }

                localStorage.setItem('token', newToken);
                setToken(newToken);
                setUser(newUser);

                return { success: true, user: newUser, token: newToken };
            }

            // Fallback
            return {
                success: true,
                message: response.data.message || 'Registration successful'
            };
        } catch (err) {
            console.error('❌ [AuthContext] Register error:', err.response?.data || err.message);

            const errorMessage = err.response?.data?.message || err.message || 'Registration failed';
            setError(errorMessage);

            return { success: false, message: errorMessage };
        }
    }, []);

    // Resend verification email
    const resendVerification = useCallback(async (email) => {
        try {
            setError(null);
            const response = await api.post('/auth/resend-verification', { email });
            return {
                success: true,
                message: response.data.message || 'Verification email sent'
            };
        } catch (err) {
            console.error('❌ [AuthContext] Resend verification error:', err.response?.data || err.message);
            return {
                success: false,
                message: err.response?.data?.message || 'Failed to resend verification email'
            };
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('pendingVerification');
        setToken(null);
        setUser(null);
        setError(null);
    }, []);

    // Stable reference (only changes when the role changes), so effects that
    // depend on isAdmin don't re-run on every render
    const isAdmin = useCallback(() => user?.role === 'admin', [user?.role]);

    const isVerified = useCallback(() => user?.isVerified === true, [user?.isVerified]);

    // ✅ NEW: update the logged-in user locally (used by Profile after saving).
    // Accepts a full or partial user object and merges it into the current user.
    const updateUser = useCallback((updatedFields) => {
        if (!updatedFields) return;
        setUser((prev) => {
            const merged = { ...(prev || {}), ...updatedFields };
            // Never lose the role if the response omitted it
            if (!merged.role) merged.role = prev?.role || 'user';
            return merged;
        });
    }, []);

    // Re-fetch user data from the backend
    const refreshUserData = useCallback(async () => {
        if (localStorage.getItem('token')) {
            return await fetchUserData();
        }
        return null;
    }, [fetchUserData]);

    const value = useMemo(() => ({
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        isAdmin,
        isVerified,
        updateUser,
        refreshUserData,
        resendVerification,
        isAuthenticated: !!token && !!user
    }), [
        user, token, loading, error,
        login, register, logout, isAdmin, isVerified,
        updateUser, refreshUserData, resendVerification
    ]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// ✅ EXPORTS
export { useAuth, AuthProvider };
export default AuthContext;
