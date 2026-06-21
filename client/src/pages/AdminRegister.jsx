import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/context/AuthContext';
import { Shield, UserPlus, Sparkles, Mail, Lock, User, Key, AlertCircle } from 'lucide-react';

const AdminRegister = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const { register } = useAuth();
    const navigate = useNavigate();

    // Glass morphism colors matching Home page
    const colors = {
        bgPrimary: 'hsla(222, 47%, 4%, 0.95)',
        bgSecondary: 'hsla(222, 47%, 8%, 0.9)',
        bgGlass: 'hsla(222, 47%, 4%, 0.7)',
        bgGlassLight: 'hsla(222, 47%, 15%, 0.6)',
        primary: 'hsl(38, 92%, 50%)', // Changed to warning color for admin
        primaryDark: 'hsl(38, 92%, 35%)',
        primaryGlow: 'hsla(38, 92%, 50%, 0.3)',
        textPrimary: 'hsl(0, 0%, 100%)',
        textSecondary: 'hsla(0, 0%, 100%, 0.8)',
        accent: 'hsl(38, 92%, 65%)',
        border: 'hsla(38, 92%, 50%, 0.15)',
        success: 'hsl(142, 76%, 36%)',
        successGlow: 'hsla(142, 76%, 36%, 0.3)',
        error: 'hsl(0, 84%, 60%)',
        errorGlow: 'hsla(0, 84%, 60%, 0.3)',
        warning: 'hsl(38, 92%, 50%)',
        warningGlow: 'hsla(38, 92%, 50%, 0.3)',
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
                box-shadow: 0 15px 40px ${colors.primary}, 0 0 0 2px ${colors.primary} !important;
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
                box-shadow: 0 4px 15px ${colors.primary} !important;
                border: 1px solid ${colors.border} !important;
                backdrop-filter: blur(4px) !important;
                -webkit-backdrop-filter: blur(4px) !important;
                position: relative !important;
                overflow: hidden !important;
                color: white !important;
                width: 100%;
                height: 52px;
            }
            
            .submit-button:hover:not(:disabled) {
                transform: translateY(-3px) !important;
                box-shadow: 0 10px 25px ${colors.primary}, 0 0 0 2px ${colors.primary} !important;
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
            
            .error-alert {
                background: ${colors.bgGlassLight} !important;
                border: 1px solid ${colors.error} !important;
                color: ${colors.textPrimary} !important;
                backdrop-filter: blur(8px) !important;
                -webkit-backdrop-filter: blur(8px) !important;
                border-radius: 12px !important;
                padding: 12px 16px !important;
                animation: pulse 0.5s ease-in-out !important;
                box-shadow: 0 0 20px ${colors.errorGlow} !important;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .info-alert {
                background: ${colors.bgGlassLight} !important;
                border: 1px solid ${colors.primary} !important;
                color: ${colors.textPrimary} !important;
                backdrop-filter: blur(8px) !important;
                -webkit-backdrop-filter: blur(8px) !important;
                border-radius: 12px !important;
                padding: 16px !important;
                margin-bottom: 20px;
                text-align: left;
                box-shadow: 0 0 15px ${colors.primaryGlow};
            }
            
            .info-alert strong {
                color: ${colors.primary};
                font-size: 1rem;
                margin-bottom: 8px;
                display: block;
            }
            
            .info-alert code {
                background: ${colors.bgPrimary};
                color: ${colors.primary};
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 0.9rem;
            }
            
            .info-alert p {
                margin: 5px 0;
                color: ${colors.textSecondary};
            }
            
            .link-hover {
                color: ${colors.primary} !important;
                text-decoration: none !important;
                transition: all 0.3s ease !important;
                position: relative;
                font-weight: 600;
            }
            
            .link-hover:hover {
                color: ${colors.accent} !important;
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
            
            .form-text {
                color: ${colors.textSecondary} !important;
                font-size: 0.85rem !important;
                margin-top: 5px !important;
                padding-left: 5px !important;
            }
            
            .form-text code {
                background: ${colors.bgPrimary};
                color: ${colors.primary};
                padding: 2px 4px;
                border-radius: 4px;
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

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        // ✅ Admin-specific validation
        if (!formData.email.endsWith('@admin.com')) {
            setError('Admin email must end with @admin.com');
            return;
        }

        if (!formData.password.includes('@occac')) {
            setError('Admin password must contain "@occac"');
            return;
        }

        setLoading(true);

        const result = await register({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: 'admin'
        });

        if (result.success) {
            navigate('/login');
        } else {
            setError(result.message);
        }

        setLoading(false);
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
                opacity: 0.15,
                animation: 'pulse 4s ease-in-out infinite',
            }}></div>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `radial-gradient(circle at 80% 70%, ${colors.accent} 0%, transparent 50%)`,
                opacity: 0.15,
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
                                        <Shield size={40} color={colors.textPrimary} />
                                    </div>
                                    <h3 style={{
                                        color: colors.textPrimary,
                                        fontSize: '2rem',
                                        fontWeight: '700',
                                        marginBottom: '10px',
                                        textShadow: `0 0 10px ${colors.primary}`,
                                    }} className="glow-text">
                                        Admin Registration
                                    </h3>
                                    <p style={{
                                        color: colors.textSecondary,
                                        fontSize: '1rem',
                                    }}>
                                        Create administrator account
                                    </p>
                                </div>

                                {/* Admin requirements info */}
                                <div className="info-alert">
                                    <strong>🔐 Admin Requirements</strong>
                                    <p><code>@admin.com</code> - Email must end with this</p>
                                    <p><code>@occac</code> - Password must contain this</p>
                                </div>

                                {error && (
                                    <div className="error-alert">
                                        <AlertCircle size={20} color={colors.error} />
                                        <span>{error}</span>
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
                                            placeholder="admin@admin.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                            onFocus={() => setFocusedField('email')}
                                            onBlur={() => setFocusedField(null)}
                                            required
                                        />
                                    </div>
                                    <div className="form-text">
                                        Must end with <code>@admin.com</code>
                                    </div>

                                    <div className="input-wrapper">
                                        <div className="input-icon">
                                            <Key
                                                size={20}
                                                color={getIconColor('password')}
                                            />
                                        </div>
                                        <input
                                            type="password"
                                            className="input-field"
                                            id="password"
                                            name="password"
                                            placeholder="Password@occac123"
                                            value={formData.password}
                                            onChange={handleChange}
                                            onFocus={() => setFocusedField('password')}
                                            onBlur={() => setFocusedField(null)}
                                            required
                                        />
                                    </div>
                                    <div className="form-text">
                                        Must contain <code>@occac</code> (Example: Admin@occac123)
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
                                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                Creating admin account...
                                            </span>
                                        ) : (
                                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                                <Shield size={20} />
                                                Register as Admin
                                            </span>
                                        )}
                                    </button>
                                </form>

                                <div style={{ textAlign: 'center', marginTop: '30px' }}>
                                    <div style={{
                                        borderTop: `1px solid ${colors.border}`,
                                        paddingTop: '20px',
                                    }}>
                                        <p style={{ color: colors.textSecondary, fontSize: '0.9rem', marginBottom: '10px' }}>
                                            Want to register as regular user?{' '}
                                            <Link
                                                to="/register"
                                                className="link-hover"
                                            >
                                                User Registration
                                            </Link>
                                        </p>
                                        <p style={{ color: colors.textSecondary, fontSize: '0.9rem', marginBottom: '0' }}>
                                            Already have an admin account?{' '}
                                            <Link
                                                to="/login"
                                                className="link-hover"
                                            >
                                                Sign in here
                                            </Link>
                                        </p>
                                    </div>
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
                            {['Admin Access', 'Secure', 'Protected'].map((text, index) => (
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
                                    <Shield size={14} color={colors.primary} />
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

export default AdminRegister;