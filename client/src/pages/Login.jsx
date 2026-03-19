import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/context/AuthContext';
import { LogIn, Shield, User, UserPlus, Mail, Lock, Sparkles, ArrowRight, CheckCircle, AlertCircle, Send, Key } from 'lucide-react';
import axios from 'axios';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loginType, setLoginType] = useState('user'); // 'user' or 'admin'
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const [showResend, setShowResend] = useState(false);
    const [verificationEmail, setVerificationEmail] = useState('');
    const [resendLoading, setResendLoading] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    // API base URL
    const API_URL = 'http://localhost:5000/api';

    // Beige and Gold color scheme
    const colors = {
        bgPrimary: '#FAF7F2',
        bgSecondary: '#F5F0E8',
        bgGlass: 'rgba(250, 247, 242, 0.85)',
        bgGlassDark: 'rgba(245, 240, 232, 0.95)',
        primary: '#D4AF37',
        primaryDark: '#B8962E',
        primaryLight: '#E5C97A',
        textPrimary: '#1F2937',
        textSecondary: '#4B5563',
        textLight: '#6B7280',
        border: '#E0D9CD',
        success: '#10B981',
        successGlow: 'rgba(16, 185, 129, 0.3)',
        warning: '#F59E0B',
        warningGlow: 'rgba(245, 158, 11, 0.3)',
        error: '#EF4444',
        errorGlow: 'rgba(239, 68, 68, 0.3)',
        info: '#3B82F6',
        infoGlow: 'rgba(59, 130, 246, 0.3)',
        white: '#FFFFFF',
        black: '#000000',
    };

    // Add CSS animations on mount
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes float {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-5px); }
                100% { transform: translateY(0px); }
            }
            
            @keyframes glow {
                0% { box-shadow: 0 0 5px ${colors.primary}; }
                50% { box-shadow: 0 0 20px ${colors.primary}; }
                100% { box-shadow: 0 0 5px ${colors.primary}; }
            }
            
            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes rotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            .login-card {
                animation: slideIn 0.6s ease-out;
                transition: all 0.3s ease;
                background: ${colors.white};
                border: 1px solid ${colors.border};
                border-radius: 24px;
                box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1);
            }
            
            .login-card:hover {
                transform: translateY(-5px);
                border-color: ${colors.primary};
                box-shadow: 0 30px 50px -15px ${colors.primary}40;
            }
            
            .login-type-btn {
                transition: all 0.3s ease;
                border-radius: 12px;
                padding: 12px;
                font-weight: 600;
                cursor: pointer;
            }
            
            .login-type-btn:hover {
                transform: translateY(-2px);
            }
            
            .login-type-btn.active {
                background: ${colors.primary};
                color: ${colors.white};
                box-shadow: 0 4px 12px ${colors.primary};
            }
            
            .admin-login-type-btn.active {
                background: ${colors.warning};
                color: ${colors.white};
                box-shadow: 0 4px 12px ${colors.warning};
            }
            
            .input-field {
                transition: all 0.3s ease;
                border: 1px solid ${colors.border};
                border-radius: 12px;
                padding: 14px 16px;
                width: 100%;
                font-size: 1rem;
            }
            
            .input-field:focus {
                border-color: ${colors.primary};
                box-shadow: 0 0 0 4px ${colors.primary}20;
                outline: none;
            }
            
            .input-field:hover {
                border-color: ${colors.primary};
            }
            
            .submit-btn {
                transition: all 0.3s ease;
                border-radius: 12px;
                padding: 16px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
            }
            
            .submit-btn:hover:not(:disabled) {
                transform: translateY(-3px);
                box-shadow: 0 8px 20px -5px ${colors.primary};
            }
            
            .resend-btn {
                transition: all 0.3s ease;
                border-radius: 8px;
                padding: 8px 16px;
                font-size: 0.9rem;
                cursor: pointer;
            }
            
            .resend-btn:hover:not(:disabled) {
                background: ${colors.primary} !important;
                color: ${colors.white} !important;
                transform: translateY(-2px);
            }
            
            .link-hover {
                transition: all 0.3s ease;
                position: relative;
            }
            
            .link-hover::after {
                content: '';
                position: absolute;
                bottom: -2px;
                left: 0;
                width: 0;
                height: 2px;
                background: ${colors.primary};
                transition: width 0.3s ease;
            }
            
            .link-hover:hover::after {
                width: 100%;
            }
            
            .forgot-link {
                transition: all 0.3s ease;
                color: ${colors.textSecondary};
                text-decoration: none;
                font-size: 0.9rem;
                display: inline-flex;
                align-items: center;
                gap: 4px;
            }
            
            .forgot-link:hover {
                color: ${colors.primary};
                transform: translateX(-2px);
            }
            
            .error-message {
                animation: slideIn 0.3s ease-out;
                background: ${colors.error}10;
                border: 1px solid ${colors.error};
                border-radius: 12px;
                padding: 12px 16px;
            }
            
            .success-message {
                animation: slideIn 0.3s ease-out;
                background: ${colors.success}10;
                border: 1px solid ${colors.success};
                border-radius: 12px;
                padding: 12px 16px;
            }
            
            .warning-message {
                animation: slideIn 0.3s ease-out;
                background: ${colors.warning}10;
                border: 1px solid ${colors.warning};
                border-radius: 12px;
                padding: 12px 16px;
            }
            
            .icon-sparkle {
                animation: pulse 2s ease-in-out infinite;
            }
            
            .floating-element {
                animation: float 3s ease-in-out infinite;
            }
            
            .gold-gradient {
                background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%);
            }
            
            .glass-card {
                background: ${colors.bgGlass};
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 1px solid ${colors.border};
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Clear error when typing
        if (error) setError('');
    };

    const handleLoginTypeChange = (type) => {
        setLoginType(type);
        setError('');
        setShowResend(false);
        setResendSuccess(false);
        setFormData({
            email: '',
            password: ''
        });
    };

    // Handle resend verification email
    const handleResendVerification = async () => {
        setResendLoading(true);
        try {
            const response = await axios.post(`${API_URL}/auth/resend-verification`, {
                email: verificationEmail
            });
            
            if (response.data.success) {
                setResendSuccess(true);
                setTimeout(() => setResendSuccess(false), 5000);
            } else {
                setError('Failed to resend verification email');
            }
        } catch (err) {
            console.error('Resend error:', err);
            setError(err.response?.data?.message || 'Failed to resend verification email');
        } finally {
            setResendLoading(false);
        }
    };

    // Handle manual verification link
    const handleManualVerify = () => {
        window.open(`${API_URL}/manual-verify/${verificationEmail}`, '_blank');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setShowResend(false);

        const loginData = {
            ...formData,
            loginType
        };

        const result = await login(loginData);

        if (result.success) {
            setShowSuccess(true);
            
            setTimeout(() => {
                setShowSuccess(false);
                if (loginType === 'admin') {
                    navigate('/admin');
                } else {
                    navigate('/');
                }
            }, 1000);
        } else {
            setError(result.message);
            
            // Check if it's a verification error
            if (result.needsVerification || result.message.includes('verify')) {
                setShowResend(true);
                setVerificationEmail(formData.email);
            }
        }

        setLoading(false);
    };

    const styles = {
        container: {
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: colors.bgPrimary,
            position: 'relative',
            overflow: 'hidden',
            padding: '20px',
        },
        backgroundGradient1: {
            position: 'absolute',
            top: '-100px',
            left: '-100px',
            width: '400px',
            height: '400px',
            background: `radial-gradient(circle, ${colors.primary}20, transparent 70%)`,
            borderRadius: '50%',
            filter: 'blur(50px)',
            animation: 'float 8s ease-in-out infinite',
        },
        backgroundGradient2: {
            position: 'absolute',
            bottom: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            background: `radial-gradient(circle, ${colors.primaryLight}20, transparent 70%)`,
            borderRadius: '50%',
            filter: 'blur(50px)',
            animation: 'float 10s ease-in-out infinite reverse',
        },
        card: {
            width: '100%',
            maxWidth: '480px',
            background: colors.white,
            borderRadius: '32px',
            border: `1px solid ${colors.border}`,
            boxShadow: `0 20px 40px -10px rgba(0,0,0,0.1)`,
            padding: '40px',
            position: 'relative',
            zIndex: 10,
        },
        header: {
            textAlign: 'center',
            marginBottom: '32px',
        },
        iconContainer: {
            width: '80px',
            height: '80px',
            margin: '0 auto 20px',
            background: colors.bgSecondary,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px solid ${loginType === 'admin' ? colors.warning : colors.primary}`,
            boxShadow: `0 0 20px ${loginType === 'admin' ? colors.warning : colors.primary}`,
        },
        title: {
            fontSize: '2rem',
            fontWeight: '800',
            color: colors.textPrimary,
            marginBottom: '8px',
        },
        subtitle: {
            color: colors.textSecondary,
            fontSize: '0.95rem',
        },
        loginTypeContainer: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            marginBottom: '24px',
            background: colors.bgSecondary,
            padding: '4px',
            borderRadius: '16px',
        },
        loginTypeBtn: {
            padding: '12px',
            borderRadius: '12px',
            border: 'none',
            background: 'transparent',
            color: colors.textSecondary,
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
        },
        activeUserBtn: {
            background: colors.primary,
            color: colors.white,
            boxShadow: `0 4px 12px ${colors.primary}`,
        },
        activeAdminBtn: {
            background: colors.warning,
            color: colors.white,
            boxShadow: `0 4px 12px ${colors.warning}`,
        },
        errorAlert: {
            background: `${colors.error}10`,
            border: `1px solid ${colors.error}`,
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
        },
        errorHeader: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: colors.error,
            fontSize: '0.95rem',
        },
        verificationActions: {
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
        },
        resendBtn: {
            flex: 1,
            padding: '10px',
            background: colors.white,
            border: `1px solid ${colors.primary}`,
            borderRadius: '8px',
            color: colors.primary,
            fontSize: '0.9rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.3s ease',
        },
        manualVerifyBtn: {
            flex: 1,
            padding: '10px',
            background: colors.primary,
            border: 'none',
            borderRadius: '8px',
            color: colors.white,
            fontSize: '0.9rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.3s ease',
        },
        successAlert: {
            background: `${colors.success}10`,
            border: `1px solid ${colors.success}`,
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: colors.success,
            fontSize: '0.95rem',
        },
        warningAlert: {
            background: `${colors.warning}10`,
            border: `1px solid ${colors.warning}`,
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: colors.warning,
            fontSize: '0.95rem',
        },
        form: {
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
        },
        inputGroup: {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
        },
        label: {
            color: colors.textSecondary,
            fontSize: '0.9rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
        },
        input: {
            padding: '14px 16px',
            background: colors.white,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            color: colors.textPrimary,
            fontSize: '1rem',
            transition: 'all 0.3s ease',
            width: '100%',
        },
        forgotPasswordContainer: {
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: '4px',
        },
        forgotPasswordLink: {
            color: colors.textSecondary,
            textDecoration: 'none',
            fontSize: '0.85rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.3s ease',
        },
        submitBtn: {
            padding: '16px',
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
            border: 'none',
            borderRadius: '12px',
            color: colors.white,
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: `0 4px 12px ${colors.primary}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
        },
        footer: {
            marginTop: '24px',
            textAlign: 'center',
        },
        linkContainer: {
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginBottom: '20px',
        },
        link: {
            color: colors.textSecondary,
            textDecoration: 'none',
            fontSize: '0.95rem',
            transition: 'all 0.3s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
        },
        divider: {
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${colors.border}, transparent)`,
            margin: '20px 0',
        },
        switchLink: {
            color: colors.textSecondary,
            textDecoration: 'none',
            fontSize: '0.9rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.3s ease',
        },
        infoBox: {
            marginTop: '24px',
            padding: '16px',
            background: colors.bgSecondary,
            borderRadius: '12px',
            border: `1px solid ${colors.warning}`,
        },
        infoTitle: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
            color: colors.warning,
            fontSize: '1rem',
            fontWeight: '600',
        },
        infoList: {
            listStyle: 'none',
            padding: 0,
            margin: 0,
        },
        infoItem: {
            color: colors.textSecondary,
            fontSize: '0.9rem',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
        },
        code: {
            background: colors.bgGlass,
            padding: '2px 6px',
            borderRadius: '4px',
            color: colors.warning,
            fontSize: '0.85rem',
        },
    };

    return (
        <div style={styles.container}>
            {/* Background gradients */}
            <div style={styles.backgroundGradient1}></div>
            <div style={styles.backgroundGradient2}></div>

            <div style={styles.card} className="login-card">
                <div style={styles.header}>
                    <div style={styles.iconContainer} className="floating-element">
                        {loginType === 'admin' ? (
                            <Shield size={40} color={colors.warning} />
                        ) : (
                            <User size={40} color={colors.primary} />
                        )}
                    </div>
                    <h1 style={styles.title}>
                        {loginType === 'admin' ? 'Admin Sign In' : 'User Sign In'}
                    </h1>
                    <p style={styles.subtitle}>
                        {loginType === 'admin' 
                            ? 'Access the admin dashboard' 
                            : 'Welcome back to OccaMart'}
                    </p>
                </div>

                {/* Login Type Selector */}
                <div style={styles.loginTypeContainer}>
                    <button
                        style={{
                            ...styles.loginTypeBtn,
                            ...(loginType === 'user' ? styles.activeUserBtn : {})
                        }}
                        className={`login-type-btn ${loginType === 'user' ? 'active' : ''}`}
                        onClick={() => handleLoginTypeChange('user')}
                    >
                        <User size={18} />
                        User
                    </button>
                    <button
                        style={{
                            ...styles.loginTypeBtn,
                            ...(loginType === 'admin' ? styles.activeAdminBtn : {})
                        }}
                        className={`login-type-btn ${loginType === 'admin' ? 'active' : ''}`}
                        onClick={() => handleLoginTypeChange('admin')}
                    >
                        <Shield size={18} />
                        Admin
                    </button>
                </div>

                {/* Error Message with Verification Options */}
                {error && (
                    <div style={styles.errorAlert} className="error-message">
                        <div style={styles.errorHeader}>
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                        
                        {showResend && (
                            <div style={styles.verificationActions}>
                                <button
                                    style={styles.resendBtn}
                                    onClick={handleResendVerification}
                                    disabled={resendLoading}
                                    className="resend-btn"
                                >
                                    {resendLoading ? (
                                        <div style={{ 
                                            width: '16px', 
                                            height: '16px', 
                                            border: '2px solid #D4AF37', 
                                            borderTopColor: 'transparent', 
                                            borderRadius: '50%', 
                                            animation: 'rotate 1s linear infinite' 
                                        }} />
                                    ) : (
                                        <>
                                            <Send size={14} />
                                            Resend Email
                                        </>
                                    )}
                                </button>
                                <button
                                    style={styles.manualVerifyBtn}
                                    onClick={handleManualVerify}
                                    className="resend-btn"
                                >
                                    <CheckCircle size={14} />
                                    Manual Verify
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Resend Success Message */}
                {resendSuccess && (
                    <div style={styles.successAlert} className="success-message">
                        <CheckCircle size={18} />
                        <span>Verification email sent! Check your inbox.</span>
                    </div>
                )}

                {/* Login Success Message */}
                {showSuccess && (
                    <div style={styles.successAlert} className="success-message">
                        <CheckCircle size={18} />
                        <span>Login successful! Redirecting...</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>
                            <Mail size={16} color={loginType === 'admin' ? colors.warning : colors.primary} />
                            {loginType === 'admin' ? 'Admin Email' : 'Email'}
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                            placeholder={loginType === 'admin' ? 'admin@example.com' : 'user@example.com'}
                            required
                            style={styles.input}
                            className="input-field"
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>
                            <Lock size={16} color={loginType === 'admin' ? colors.warning : colors.primary} />
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            onFocus={() => setFocusedField('password')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="Enter your password"
                            required
                            style={styles.input}
                            className="input-field"
                        />
                        
                        {/* Forgot Password Link - Added here */}
                        <div style={styles.forgotPasswordContainer}>
                            <Link 
                                to="/forgot-password" 
                                style={styles.forgotPasswordLink}
                                className="forgot-link"
                            >
                                <Key size={14} />
                                Forgot Password?
                            </Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={styles.submitBtn}
                        className="submit-btn"
                    >
                        {loading ? (
                            <>
                                <div style={{ 
                                    width: '18px', 
                                    height: '18px', 
                                    border: '2px solid white', 
                                    borderTop: '2px solid transparent', 
                                    borderRadius: '50%',
                                    animation: 'rotate 1s linear infinite'
                                }} />
                                Signing in...
                            </>
                        ) : (
                            <>
                                Sign In
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div style={styles.footer}>
                    <div style={styles.linkContainer}>
                        {/* Registration Links */}
                        <div>
                            {loginType === 'user' ? (
                                <Link 
                                    to="/register" 
                                    style={styles.link}
                                    className="link-hover"
                                >
                                    <UserPlus size={14} />
                                    Don't have an account? <strong>Register as User</strong>
                                </Link>
                            ) : (
                                <Link 
                                    to="/admin/register" 
                                    style={{...styles.link, color: colors.warning}}
                                    className="link-hover"
                                >
                                    <Shield size={14} />
                                    Need admin account? <strong>Register as Admin</strong>
                                </Link>
                            )}
                        </div>

                        {/* Alternative Registration Option */}
                        <div>
                            {loginType === 'user' ? (
                                <Link 
                                    to="/admin/register" 
                                    style={styles.switchLink}
                                    className="link-hover"
                                >
                                    <Shield size={14} />
                                    Register as Admin instead
                                </Link>
                            ) : (
                                <Link 
                                    to="/register" 
                                    style={styles.switchLink}
                                    className="link-hover"
                                >
                                    <User size={14} />
                                    Register as User instead
                                </Link>
                            )}
                        </div>
                    </div>

                    <div style={styles.divider}></div>

                    {/* Switch Login Type */}
                    <div>
                        <a 
                            href="#" 
                            onClick={(e) => {
                                e.preventDefault();
                                handleLoginTypeChange(loginType === 'admin' ? 'user' : 'admin');
                            }}
                            style={{
                                ...styles.switchLink,
                                color: loginType === 'admin' ? colors.warning : colors.primary,
                                fontWeight: '600',
                            }}
                            className="link-hover"
                        >
                            <LogIn size={14} />
                            Switch to {loginType === 'admin' ? 'User' : 'Admin'} Login
                        </a>
                    </div>
                </div>

                {/* Admin Registration Info Box */}
                {loginType === 'admin' && (
                    <div style={styles.infoBox} className="glass-card">
                        <div style={styles.infoTitle}>
                            <Sparkles size={18} className="icon-sparkle" />
                            <span>Admin Registration Info</span>
                        </div>
                        <ul style={styles.infoList}>
                            <li style={styles.infoItem}>
                                <span style={styles.code}>@admin.com</span>
                                Email must end with admin domain
                            </li>
                            <li style={styles.infoItem}>
                                <span style={styles.code}>@occac</span>
                                Password must contain this sequence
                            </li>
                            <li style={styles.infoItem}>
                                <Shield size={14} color={colors.warning} />
                                Secret key required for verification
                            </li>
                            <li style={styles.infoItem}>
                                <Link 
                                    to="/admin/register" 
                                    style={{
                                        color: colors.warning,
                                        fontWeight: '600',
                                        textDecoration: 'none',
                                    }}
                                    className="link-hover"
                                >
                                    Click here to register as Admin
                                </Link>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;