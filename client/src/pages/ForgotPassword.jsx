import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import axios from 'axios';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    // Color scheme
    const colors = {
        primary: '#D4AF37',      // Gold
        primaryDark: '#B8962E',   // Button Hover Gold
        background: '#EDE8D0',     // Background (Beige)
        cardBg: '#F9F9F9',         // Card Background
        textPrimary: '#1F2937',    // Text Dark Gray
        border: '#E5E7EB',         // Border Light Gray
        success: '#10B981',
        error: '#EF4444',
        white: '#FFFFFF',
    };

    // Add CSS animations
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes float {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-5px); }
                100% { transform: translateY(0px); }
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
            
            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
            
            .forgot-card {
                animation: slideIn 0.6s ease-out;
                transition: all 0.3s ease;
                background: ${colors.cardBg};
                border: 1px solid ${colors.border};
                border-radius: 24px;
                box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1);
            }
            
            .forgot-card:hover {
                transform: translateY(-5px);
                border-color: ${colors.primary};
                box-shadow: 0 30px 50px -15px ${colors.primary}40;
            }
            
            .input-field {
                transition: all 0.3s ease;
                border: 1px solid ${colors.border};
                border-radius: 12px;
                padding: 14px 16px;
                width: 100%;
                font-size: 1rem;
                background: ${colors.white};
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
                background: ${colors.primary};
                color: ${colors.textPrimary};
                border: none;
            }
            
            .submit-btn:hover:not(:disabled) {
                background: ${colors.primaryDark};
                transform: translateY(-3px);
                box-shadow: 0 8px 20px -5px ${colors.primary};
            }
            
            .submit-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
            
            .back-link {
                transition: all 0.3s ease;
                color: ${colors.textPrimary};
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }
            
            .back-link:hover {
                color: ${colors.primary};
                transform: translateX(-5px);
            }
            
            .floating-element {
                animation: float 3s ease-in-out infinite;
            }
            
            .success-message {
                animation: slideIn 0.3s ease-out;
                background: ${colors.success}10;
                border: 1px solid ${colors.success};
                border-radius: 12px;
                padding: 16px;
            }
            
            .error-message {
                animation: slideIn 0.3s ease-out;
                background: ${colors.error}10;
                border: 1px solid ${colors.error};
                border-radius: 12px;
                padding: 16px;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:5000/api/auth/forgot-password', {
                email
            });

            if (response.data.success) {
                setSuccess(true);
            } else {
                setError(response.data.message || 'Something went wrong');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const styles = {
        container: {
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: colors.background,
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
            background: `radial-gradient(circle, ${colors.primary}15, transparent 70%)`,
            borderRadius: '50%',
            filter: 'blur(50px)',
            animation: 'float 10s ease-in-out infinite reverse',
        },
        card: {
            width: '100%',
            maxWidth: '480px',
            background: colors.cardBg,
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
            background: colors.background,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px solid ${colors.primary}`,
            boxShadow: `0 0 20px ${colors.primary}`,
        },
        title: {
            fontSize: '2rem',
            fontWeight: '800',
            color: colors.textPrimary,
            marginBottom: '8px',
        },
        subtitle: {
            color: colors.textPrimary,
            fontSize: '0.95rem',
            opacity: 0.8,
        },
        form: {
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
        },
        inputGroup: {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
        },
        label: {
            color: colors.textPrimary,
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
        successCard: {
            background: `${colors.success}10`,
            border: `1px solid ${colors.success}`,
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center',
        },
        successIcon: {
            width: '60px',
            height: '60px',
            margin: '0 auto 16px',
            background: colors.success,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        successTitle: {
            color: colors.textPrimary,
            fontSize: '1.25rem',
            fontWeight: '700',
            marginBottom: '12px',
        },
        successText: {
            color: colors.textPrimary,
            fontSize: '0.95rem',
            marginBottom: '20px',
            opacity: 0.8,
            lineHeight: '1.6',
        },
        emailHighlight: {
            background: colors.background,
            padding: '8px 16px',
            borderRadius: '8px',
            color: colors.primary,
            fontWeight: '600',
            marginBottom: '16px',
        },
        backToLogin: {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            color: colors.primary,
            textDecoration: 'none',
            fontSize: '0.95rem',
            fontWeight: '500',
            padding: '12px 24px',
            border: `1px solid ${colors.primary}`,
            borderRadius: '12px',
            transition: 'all 0.3s ease',
        },
        footer: {
            marginTop: '24px',
            textAlign: 'center',
        },
    };

    if (success) {
        return (
            <div style={styles.container}>
                <div style={styles.backgroundGradient1}></div>
                <div style={styles.backgroundGradient2}></div>

                <div style={styles.card} className="forgot-card">
                    <div style={styles.successCard}>
                        <div style={styles.successIcon} className="floating-element">
                            <Send size={30} color="white" />
                        </div>
                        
                        <h2 style={styles.successTitle}>Check Your Email</h2>
                        
                        <p style={styles.successText}>
                            We've sent a password reset link to:
                        </p>
                        
                        <div style={styles.emailHighlight}>
                            {email}
                        </div>
                        
                        <p style={styles.successText}>
                            Click the link in the email to reset your password. 
                            The link will expire in 1 hour for security reasons.
                        </p>
                        
                        <div style={{ marginTop: '24px' }}>
                            <Link to="/login" style={styles.backToLogin}>
                                <ArrowLeft size={16} />
                                Back to Login
                            </Link>
                        </div>
                        
                        <div style={{ marginTop: '20px' }}>
                            <p style={{ color: colors.textPrimary, opacity: 0.6, fontSize: '0.85rem' }}>
                                Didn't receive the email? Check your spam folder or{' '}
                                <button
                                    onClick={() => setSuccess(false)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: colors.primary,
                                        textDecoration: 'underline',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    try again
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.backgroundGradient1}></div>
            <div style={styles.backgroundGradient2}></div>

            <div style={styles.card} className="forgot-card">
                <div style={styles.header}>
                    <div style={styles.iconContainer} className="floating-element">
                        <Lock size={40} color={colors.primary} />
                    </div>
                    <h1 style={styles.title}>Forgot Password?</h1>
                    <p style={styles.subtitle}>
                        Enter your email address and we'll send you a link to reset your password
                    </p>
                </div>

                {error && (
                    <div style={styles.errorMessage} className="error-message">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <AlertCircle size={18} color={colors.error} />
                            <span style={{ color: colors.error }}>{error}</span>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>
                            <Mail size={16} color={colors.primary} />
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="Enter your email"
                            required
                            style={{
                                ...styles.input,
                                borderColor: focusedField === 'email' ? colors.primary : colors.border,
                            }}
                            className="input-field"
                        />
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
                                    border: '2px solid #1F2937', 
                                    borderTop: '2px solid transparent', 
                                    borderRadius: '50%',
                                    animation: 'rotate 1s linear infinite'
                                }} />
                                Sending...
                            </>
                        ) : (
                            <>
                                Send Reset Link
                                <Send size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div style={styles.footer}>
                    <Link to="/login" className="back-link" style={styles.backLink}>
                        <ArrowLeft size={16} />
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;