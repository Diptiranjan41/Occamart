// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

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
    (error) => {
        return Promise.reject(error);
    }
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

// AuthProvider component
const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch user data from backend using token
    const fetchUserData = async (authToken) => {
        try {
            console.log('📡 [AuthContext] Fetching user data with token:', authToken?.substring(0, 10) + '...');
            
            const response = await api.get('/auth/me');
            
            console.log('✅ [AuthContext] User data response:', response.data);
            
            // Handle different response structures
            if (response.data) {
                let userData = null;
                
                if (response.data.user) {
                    // Response has user property
                    userData = response.data.user;
                } else if (response.data._id || response.data.id) {
                    // Response is directly the user object
                    userData = response.data;
                } else if (response.data.success && response.data.data) {
                    // Response has success and data properties
                    userData = response.data.data;
                }
                
                if (userData) {
                    // ✅ IMPORTANT: Ensure role is properly set
                    console.log('✅ [AuthContext] User role from backend:', userData.role);
                    
                    // If role is not set, try to determine from email
                    if (!userData.role) {
                        console.warn('⚠️ [AuthContext] No role found in user data');
                        
                        // Try to determine role from email
                        if (userData.email && userData.email.includes('admin')) {
                            userData.role = 'admin';
                            console.log('✅ [AuthContext] Role set to admin based on email');
                        } else {
                            userData.role = 'user';
                            console.log('✅ [AuthContext] Role set to user as default');
                        }
                    }
                    
                    setUser(userData);
                    console.log('✅ [AuthContext] Final user object:', { 
                        name: userData.name, 
                        email: userData.email, 
                        role: userData.role,
                        isVerified: userData.isVerified 
                    });
                    return userData;
                }
            }
            
            console.warn('⚠️ [AuthContext] Unexpected response format:', response.data);
            return null;
        } catch (error) {
            console.error('❌ [AuthContext] Error fetching user data:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            
            // If token is invalid, clear it
            if (error.response?.status === 401) {
                console.log('🔴 [AuthContext] Token invalid, clearing...');
                localStorage.removeItem('token');
                setToken(null);
                setUser(null);
            }
            return null;
        }
    };

    // Initialize auth on mount
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const storedToken = localStorage.getItem('token');

                console.log('📦 [AuthContext] Loading token from localStorage:', storedToken ? 'Token exists' : 'No token');

                if (storedToken && storedToken !== 'undefined' && storedToken !== 'null') {
                    setToken(storedToken);
                    // Fetch user data from backend
                    await fetchUserData(storedToken);
                } else {
                    console.log('ℹ️ [AuthContext] No valid token found');
                }
            } catch (error) {
                console.error('❌ [AuthContext] Error loading from localStorage:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const login = async (credentials) => {
        try {
            setError(null);
            console.log('🔐 [AuthContext] Login called with:', { 
                email: credentials.email, 
                loginType: credentials.loginType 
            });
            
            const response = await api.post('/auth/login', {
                email: credentials.email,
                password: credentials.password,
                loginType: credentials.loginType || 'user'
            });

            console.log('✅ [AuthContext] Login successful, response:', response.data);

            // Handle different response structures
            let token = null;
            let userData = null;
            
            if (response.data.token && response.data.user) {
                // Standard response
                token = response.data.token;
                userData = response.data.user;
            } else if (response.data.data && response.data.data.token) {
                // Nested data response
                token = response.data.data.token;
                userData = response.data.data.user || response.data.data;
            } else if (response.data.token) {
                // Only token, user might be separate
                token = response.data.token;
                userData = response.data.user || response.data;
            }

            if (!token) {
                throw new Error('No token received from server');
            }

            // ✅ Ensure role is properly set
            if (userData) {
                if (!userData.role) {
                    // If role not in response, set based on loginType
                    userData.role = credentials.loginType === 'admin' ? 'admin' : 'user';
                    console.log('✅ [AuthContext] Role set from loginType:', userData.role);
                }
                
                console.log('✅ [AuthContext] User role after login:', userData.role);
            }

            // Store ONLY token in localStorage
            localStorage.setItem('token', token);
            
            // Set user from backend response
            setToken(token);
            setUser(userData);

            console.log('✅ [AuthContext] Login state updated:', { 
                token: token?.substring(0, 10) + '...', 
                user: { name: userData?.name, email: userData?.email, role: userData?.role }
            });

            return { success: true, user: userData };
        } catch (error) {
            console.error('❌ [AuthContext] Login error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            
            // Check if error is due to email verification
            if (error.response?.data?.needsVerification) {
                return {
                    success: false,
                    needsVerification: true,
                    email: error.response.data.email,
                    message: error.response.data.message || 'Please verify your email first'
                };
            }
            
            const errorMessage = error.response?.data?.message || error.message || 'Login failed';
            setError(errorMessage);
            
            return {
                success: false,
                message: errorMessage
            };
        }
    };

    // ===== FIXED REGISTER FUNCTION =====
    const register = async (userData) => {
        try {
            setError(null);
            console.log('📝 [AuthContext] Register called with:', { 
                name: userData.name, 
                email: userData.email,
                role: userData.role 
            });
            
            const response = await api.post('/auth/register', {
                name: userData.name,
                email: userData.email,
                password: userData.password,
                role: userData.role || 'user'
            });

            console.log('✅ [AuthContext] Register response:', response.data);

            // Handle different response structures
            let token = null;
            let newUser = null;
            
            // Case 1: Standard response with token
            if (response.data.token) {
                token = response.data.token;
                newUser = response.data.user || response.data;
            }
            // Case 2: Nested data response
            else if (response.data.data?.token) {
                token = response.data.data.token;
                newUser = response.data.data.user || response.data.data;
            }
            // Case 3: Success with message (email verification flow)
            else if (response.data.success && response.data.message) {
                console.log('ℹ️ [AuthContext] Registration successful - email verification required');
                
                // Store email for verification page
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

            // If we have token, auto-login the user
            if (token) {
                // Ensure role is properly set
                if (newUser && !newUser.role) {
                    newUser.role = userData.role || 'user';
                    console.log('✅ [AuthContext] Role set from registration:', newUser.role);
                }

                // Store token and user
                localStorage.setItem('token', token);
                setToken(token);
                setUser(newUser);

                console.log('✅ [AuthContext] Auto-login successful:', { 
                    name: newUser?.name, 
                    email: newUser?.email,
                    role: newUser?.role 
                });

                return { 
                    success: true, 
                    user: newUser,
                    token: token 
                };
            }
            
            // Fallback - shouldn't reach here
            return { 
                success: true, 
                message: response.data.message || 'Registration successful' 
            };

        } catch (error) {
            console.error('❌ [AuthContext] Register error:', error.response?.data || error.message);
            
            const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
            setError(errorMessage);
            
            return {
                success: false,
                message: errorMessage
            };
        }
    };

    // Resend verification email
    const resendVerification = async (email) => {
        try {
            setError(null);
            console.log('📧 [AuthContext] Resending verification email to:', email);
            
            const response = await api.post('/auth/resend-verification', { email });
            
            console.log('✅ [AuthContext] Resend verification response:', response.data);
            
            return {
                success: true,
                message: response.data.message || 'Verification email sent'
            };
        } catch (error) {
            console.error('❌ [AuthContext] Resend verification error:', error.response?.data || error.message);
            
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to resend verification email'
            };
        }
    };

    const logout = () => {
        console.log('🚪 [AuthContext] Logging out...');
        // Clear all auth data
        localStorage.removeItem('token');
        localStorage.removeItem('pendingVerification');
        setToken(null);
        setUser(null);
        setError(null);
    };

    const isAdmin = () => {
        const adminStatus = user?.role === 'admin';
        console.log('👑 [AuthContext] isAdmin check:', { role: user?.role, isAdmin: adminStatus });
        return adminStatus;
    };

    // Check if user is verified
    const isVerified = () => {
        return user?.isVerified === true;
    };

    // Function to refresh user data (can be called after profile update)
    const refreshUserData = async () => {
        if (token) {
            console.log('🔄 [AuthContext] Refreshing user data...');
            return await fetchUserData(token);
        }
        return null;
    };

    const value = {
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        isAdmin,
        isVerified,
        refreshUserData,
        resendVerification,
        isAuthenticated: !!token && !!user
    };

    console.log('📊 [AuthContext] Current state:', { 
        isAuthenticated: !!token && !!user, 
        user: user ? { 
            name: user.name, 
            role: user.role, 
            email: user.email,
            isVerified: user.isVerified 
        } : null,
        isAdmin: user ? user.role === 'admin' : false,
        loading,
        hasError: !!error 
    });

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// ✅ EXPORTS
export { useAuth, AuthProvider };
export default AuthContext;