import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/context/AuthContext';
import { UserPlus, Sparkles, Shield, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const { register } = useAuth();
    const navigate = useNavigate();

    // Beige and Gold Color Scheme
    const colors = {
        bgPrimary: '#FAF7F2',      // Soft beige background
        bgSecondary: '#F5F0E8',     // Deeper beige
        bgGlass: 'rgba(250, 247, 242, 0.7)',  // Glass beige
        bgGlassLight: 'rgba(245, 240, 232, 0.6)', // Lighter glass beige
        primary: '#D4AF37',          // Rich gold
        primaryDark: '#B8962E',       // Darker gold
        primaryLight: '#F5E7C8',      // Light gold
        primaryGlow: 'rgba(212, 175, 55, 0.3)', // Gold glow
        textPrimary: '#1F2937',       // Dark gray for text
        textSecondary: '#4B5563',      // Medium gray
        accent: '#D4AF37',             // Gold accent
        border: 'rgba(212, 175, 55, 0.2)', // Gold border
        success: '#10B981',            // Green for success
        successGlow: 'rgba(16, 185, 129, 0.3)',
        error: '#EF4444',              // Red for error
        errorGlow: 'rgba(239, 68, 68, 0.3)',
        white: '#FFFFFF',
    };

    // Add CSS animations
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes float {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
                100% { transform: translateY(0px); }
            }
            
            @keyframes glow {
                0% { box-shadow: 0 0 5px ${colors.primary}; }
                50% { box-shadow: 0 0 20px ${colors.primary}; }
                100% { box-shadow: 0 0 5px ${colors.primary}; }
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
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            
            @keyframes shimmer {
                0% { transform: translateX(-100%) rotate(45deg); opacity: 0; }
                20% { opacity: 0.5; }
                40% { transform: translateX(100%) rotate(45deg); opacity: 0; }
                100% { transform: translateX(100%) rotate(45deg); opacity: 0; }
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .glass-card {
                background: ${colors.bgGlass} !important;
                backdrop-filter: blur(12px) !important;
                -webkit-backdrop-filter: blur(12px) !important;
                border: 1px solid ${colors.border} !important;
                box-shadow: 0 8px 32px ${colors.primaryGlow} !important;
                transition: all 0.3s ease;
            }
            
            .glass-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 15px 40px ${colors.primaryGlow}, 0 0 0 2px ${colors.primary} !important;
                border-color: ${colors.primary} !important;
            }
            
            .glow-text {
                text-shadow: 0 0 10px ${colors.primary};
            }
            
            .glow-border {
                border: 1px solid ${colors.primary};
                box-shadow: 0 0 15px ${colors.primaryGlow};
            }
            
            .input-wrapper {
                position: relative;
                margin-bottom: 20px;
                width: 100%;
            }
            
            .input-icon {
                position: absolute;
                left: 16px;
                top: 50%;
                transform: translateY(-50%);
                color: ${colors.textSecondary};
                transition: all 0.3s ease;
                z-index: 2;
                pointer-events: none;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .input-field {
                background: ${colors.bgGlassLight} !important;
                border: 2px solid ${colors.border} !important;
                color: ${colors.textPrimary} !important;
                backdrop-filter: blur(8px) !important;
                -webkit-backdrop-filter: blur(8px) !important;
                transition: all 0.3s ease !important;
                border-radius: 12px !important;
                padding: 14px 16px 14px 48px !important;
                font-size: 1rem !important;
                width: 100% !important;
                box-sizing: border-box !important;
                height: 52px !important;
                line-height: normal !important;
            }
            
            .input-field:focus {
                border-color: ${colors.primary} !important;
                box-shadow: 0 0 20px ${colors.primaryGlow} !important;
                outline: none !important;
                transform: translateY(-2px);
            }
            
            .input-field:hover {
                border-color: ${colors.primary} !important;
            }
            
            .input-field:focus + .input-icon,
            .input-field:hover + .input-icon {
                color: ${colors.primary} !important;
                filter: drop-shadow(0 0 8px ${colors.primary});
            }
            
            .submit-button {
                background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%) !important;
                border: none !important;
                padding: 14px 32px !important;
                border-radius: 12px !important;
                font-size: 1.1rem !important;
                font-weight: 600 !important;
                cursor: pointer !important;
                transition: all 0.3s ease !important;
                box-shadow: 0 4px 15px ${colors.primaryGlow} !important;
                border: 1px solid ${colors.border} !important;
                backdrop-filter: blur(4px) !important;
                -webkit-backdrop-filter: blur(4px) !important;
                position: relative !important;
                overflow: hidden !important;
                color: ${colors.white} !important;
                width: 100%;
                height: 52px;
            }
            
            .submit-button:hover:not(:disabled) {
                transform: translateY(-3px) !important;
                box-shadow: 0 10px 25px ${colors.primaryGlow}, 0 0 0 2px ${colors.primary} !important;
            }
            
            .submit-button::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.3), transparent);
                transform: rotate(45deg);
                animation: shimmer 3s infinite;
                opacity: 0;
            }
            
            .submit-button:hover::before {
                opacity: 1;
            }
            
            .submit-button:disabled {
                opacity: 0.7;
                cursor: not-allowed;
            }
            
            .icon-float {
                animation: float 6s ease-in-out infinite;
            }
            
            .card-animate {
                animation: slideIn 0.6s ease-out;
            }
            
            .alert {
                background: ${colors.bgGlassLight} !important;
                backdrop-filter: blur(8px) !important;
                -webkit-backdrop-filter: blur(8px) !important;
                border-radius: 12px !important;
                padding: 12px 16px !important;
                animation: pulse 0.5s ease-in-out !important;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .error-alert {
                border: 1px solid ${colors.error} !important;
                color: ${colors.error} !important;
                box-shadow: 0 0 20px ${colors.errorGlow} !important;
            }
            
            .success-alert {
                border: 1px solid ${colors.success} !important;
                color: ${colors.success} !important;
                box-shadow: 0 0 20px ${colors.successGlow} !important;
            }
            
            .link-hover {
                color: ${colors.primary} !important;
                text-decoration: none !important;
                transition: all 0.3s ease !important;
                position: relative;
                font-weight: 600;
            }
            
            .link-hover:hover {
                color: ${colors.primaryDark} !important;
                text-shadow: 0 0 10px ${colors.primary};
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
                box-shadow: 0 0 10px ${colors.primary};
            }
            
            .link-hover:hover::after {
                width: 100%;
            }
            
            .spinner {
                animation: spin 1s linear infinite;
            }
            
            @media (max-width: 768px) {
                .glass-card {
                    margin: 10px;
                }
                
                .input-field {
                    padding: 12px 14px 12px 44px !important;
                    font-size: 0.95rem !important;
                    height: 48px !important;
                }
                
                .submit-button {
                    padding: 12px 24px !important;
                    font-size: 1rem !important;
                    height: 48px;
                }
            }
            
            @media (max-width: 480px) {
                .glass-card {
                    margin: 5px;
                }
                
                .input-field {
                    padding: 10px 12px 10px 40px !important;
                    height: 44px !important;
                }
                
                .submit-button {
                    padding: 10px 20px !important;
                    height: 44px;
                }
                
                .input-icon {
                    left: 12px;
                }
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
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (!formData.name.trim()) {
            setError('Name is required');
            return;
        }

        if (!formData.email.trim()) {
            setError('Email is required');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return;
        }

        if (!formData.password) {
            setError('Password is required');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const result = await register({
                name: formData.name,
                email: formData.email,
                password: formData.password
            });

            console.log('Registration result:', result);

            if (result.success) {
                if (result.requiresVerification) {
                    // Email verification required
                    setSuccess(result.message || 'Registration successful! Please check your email to verify your account.');
                    
                    // Clear form
                    setFormData({
                        name: '',
                        email: '',
                        password: '',
                        confirmPassword: ''
                    });

                    // Redirect to verification page after 3 seconds
                    setTimeout(() => {
                        navigate('/verify-email', { 
                            state: { 
                                email: result.email || formData.email,
                                message: result.message 
                            } 
                        });
                    }, 3000);
                } else {
                    // Auto-login successful
                    setSuccess('Registration successful! Redirecting to home...');
                    setTimeout(() => {
                        navigate('/');
                    }, 2000);
                }
            } else {
                setError(result.message || 'Registration failed. Please try again.');
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getIconColor = (fieldName) => {
        return focusedField === fieldName ? colors.primary : colors.textSecondary;
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: colors.bgPrimary,
            position: 'relative',
            overflow: 'hidden',
            padding: '40px 20px',
            display: 'flex',
            alignItems: 'center',
        }}>
            {/* Animated background gradients */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `radial-gradient(circle at 20% 30%, ${colors.primary} 0%, transparent 50%)`,
                opacity: 0.1,
                animation: 'pulse 4s ease-in-out infinite',
            }}></div>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `radial-gradient(circle at 80% 70%, ${colors.primaryLight} 0%, transparent 50%)`,
                opacity: 0.1,
                animation: 'pulse 4s ease-in-out infinite 2s',
            }}></div>

            <div className="container" style={{ position: 'relative', zIndex: 2 }}>
                <div className="row justify-content-center">
                    <div className="col-md-6 col-lg-5">
                        <div className="glass-card card-animate" style={{
                            borderRadius: '24px',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                padding: '40px 30px',
                            }}>
                                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                                    <div className="icon-float" style={{
                                        width: '80px',
                                        height: '80px',
                                        margin: '0 auto 20px',
                                        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: `1px solid ${colors.border}`,
                                        boxShadow: `0 0 30px ${colors.primary}`,
                                    }}>
                                        <UserPlus size={40} color={colors.white} />
                                    </div>
                                    <h3 style={{
                                        color: colors.textPrimary,
                                        fontSize: '2rem',
                                        fontWeight: '700',
                                        marginBottom: '10px',
                                        textShadow: `0 0 10px ${colors.primary}`,
                                    }} className="glow-text">
                                        Create Account
                                    </h3>
                                    <p style={{
                                        color: colors.textSecondary,
                                        fontSize: '1rem',
                                    }}>
                                        Join OccaMart today
                                    </p>
                                </div>

                                {error && (
                                    <div className="alert error-alert">
                                        <AlertCircle size={20} />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {success && (
                                    <div className="alert success-alert">
                                        <CheckCircle size={20} />
                                        <span>{success}</span>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="input-wrapper">
                                        <div className="input-icon">
                                            <User
                                                size={20}
                                                color={getIconColor('name')}
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            className="input-field"
                                            id="name"
                                            name="name"
                                            placeholder="Full Name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            onFocus={() => setFocusedField('name')}
                                            onBlur={() => setFocusedField(null)}
                                            required
                                        />
                                    </div>

                                    <div className="input-wrapper">
                                        <div className="input-icon">
                                            <Mail
                                                size={20}
                                                color={getIconColor('email')}
                                            />
                                        </div>
                                        <input
                                            type="email"
                                            className="input-field"
                                            id="email"
                                            name="email"
                                            placeholder="Email Address"
                                            value={formData.email}
                                            onChange={handleChange}
                                            onFocus={() => setFocusedField('email')}
                                            onBlur={() => setFocusedField(null)}
                                            required
                                        />
                                    </div>

                                    <div className="input-wrapper">
                                        <div className="input-icon">
                                            <Lock
                                                size={20}
                                                color={getIconColor('password')}
                                            />
                                        </div>
                                        <input
                                            type="password"
                                            className="input-field"
                                            id="password"
                                            name="password"
                                            placeholder="Password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            onFocus={() => setFocusedField('password')}
                                            onBlur={() => setFocusedField(null)}
                                            required
                                        />
                                    </div>

                                    <div className="input-wrapper">
                                        <div className="input-icon">
                                            <Lock
                                                size={20}
                                                color={getIconColor('confirmPassword')}
                                            />
                                        </div>
                                        <input
                                            type="password"
                                            className="input-field"
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            placeholder="Confirm Password"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            onFocus={() => setFocusedField('confirmPassword')}
                                            onBlur={() => setFocusedField(null)}
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="submit-button"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                                <span className="spinner-border spinner-border-sm spinner" role="status" aria-hidden="true"></span>
                                                Creating account...
                                            </span>
                                        ) : (
                                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                                <Sparkles size={20} />
                                                Register
                                            </span>
                                        )}
                                    </button>
                                </form>

                                <div style={{ textAlign: 'center', marginTop: '25px' }}>
                                    <p style={{ color: colors.textSecondary, fontSize: '0.95rem' }}>
                                        Already have an account?{' '}
                                        <Link
                                            to="/login"
                                            className="link-hover"
                                        >
                                            Sign in here
                                        </Link>
                                    </p>
                                </div>

                                <div style={{
                                    marginTop: '30px',
                                    paddingTop: '20px',
                                    borderTop: `1px solid ${colors.border}`,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    gap: '15px',
                                    alignItems: 'center',
                                }}>
                                    <Shield size={16} color={colors.primary} />
                                    <span style={{ color: colors.textSecondary, fontSize: '0.85rem' }}>
                                        Your information is secure with us
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Decorative elements */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '15px',
                            marginTop: '30px',
                            flexWrap: 'wrap',
                        }}>
                            {['Secure', 'Fast', 'Reliable'].map((text, index) => (
                                <div
                                    key={index}
                                    style={{
                                        padding: '8px 16px',
                                        background: colors.bgGlass,
                                        borderRadius: '50px',
                                        border: `1px solid ${colors.border}`,
                                        backdropFilter: 'blur(8px)',
                                        color: colors.textSecondary,
                                        fontSize: '0.9rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        animation: `float ${6 + index}s ease-in-out infinite`,
                                    }}
                                >
                                    <Sparkles size={14} color={colors.primary} />
                                    {text}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;