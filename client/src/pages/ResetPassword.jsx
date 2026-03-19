import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [tokenValid, setTokenValid] = useState(true);
    
    const navigate = useNavigate();
    const { token } = useParams();

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
            
            @keyframes rotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            .reset-card {
                animation: slideIn 0.6s ease-out;
                transition: all 0.3s ease;
                background: ${colors.cardBg};
                border: 1px solid ${colors.border};
                border-radius: 24px;
                box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1);
            }
            
            .reset-card:hover {
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
            
            .password-strength {
                height: 4px;
                border-radius: 2px;
                margin-top: 8px;
                transition: all 0.3s ease;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // Password strength check
    const getPasswordStrength = () => {
        if (!password) return 0;
        let strength = 0;
        if (password.length >= 8) strength += 25;
        if (password.match(/[a-z]/)) strength += 25;
        if (password.match(/[A-Z]/)) strength += 25;
        if (password.match(/[0-9]/)) strength += 25;
        return strength;
    };

    const getStrengthColor = () => {
        const strength = getPasswordStrength();
        if (strength <= 25) return colors.error;
        if (strength <= 50) return '#F59E0B';
        if (strength <= 75) return '#3B82F6';
        return colors.success;
    };

    const getStrengthText = () => {
        const strength = getPasswordStrength();
        if (strength <= 25) return 'Weak';
        if (strength <= 50) return 'Fair';
        if (strength <= 75) return 'Good';
        return 'Strong';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(
                `http://localhost:5000/api/auth/reset-password/${token}`,
                { password }
            );

            if (response.data.success) {
                setSuccess(true);
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setError(response.data.message || 'Failed to reset password');
            }
        } catch (err) {
            if (err.response?.status === 400) {
                setTokenValid(false);
                setError(err.response?.data?.message || 'Invalid or expired reset link');
            } else {
                setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
            }
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
            gap: '20px',
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
        inputWrapper: {
            position: 'relative',
        },
        input: {
            padding: '14px 16px',
            paddingRight: '45px',
            background: colors.white,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            color: colors.textPrimary,
            fontSize: '1rem',
            transition: 'all 0.3s ease',
            width: '100%',
        },
        eyeIcon: {
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            cursor: 'pointer',
            color: colors.textPrimary,
            opacity: 0.6,
        },
        strengthContainer: {
            marginTop: '8px',
        },
        strengthBar: {
            height: '4px',
            background: colors.border,
            borderRadius: '2px',
            overflow: 'hidden',
        },
        strengthFill: {
            height: '100%',
            width: `${getPasswordStrength()}%`,
            background: getStrengthColor(),
            transition: 'all 0.3s ease',
        },
        strengthText: {
            fontSize: '0.85rem',
            color: getStrengthColor(),
            marginTop: '4px',
            textAlign: 'right',
        },
        successCard: {
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
        },
        errorCard: {
            textAlign: 'center',
        },
        errorIcon: {
            width: '60px',
            height: '60px',
            margin: '0 auto 16px',
            background: colors.error,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        errorTitle: {
            color: colors.textPrimary,
            fontSize: '1.25rem',
            fontWeight: '700',
            marginBottom: '12px',
        },
        errorText: {
            color: colors.textPrimary,
            fontSize: '0.95rem',
            marginBottom: '24px',
            opacity: 0.8,
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

                <div style={styles.card} className="reset-card">
                    <div style={styles.successCard}>
                        <div style={styles.successIcon} className="floating-element">
                            <CheckCircle size={30} color="white" />
                        </div>
                        
                        <h2 style={styles.successTitle}>Password Reset Successful!</h2>
                        
                        <p style={styles.successText}>
                            Your password has been reset successfully. You'll be redirected to the login page in 3 seconds.
                        </p>
                        
                        <Link to="/login" style={styles.backLink}>
                            <ArrowLeft size={16} />
                            Go to Login Now
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!tokenValid) {
        return (
            <div style={styles.container}>
                <div style={styles.backgroundGradient1}></div>
                <div style={styles.backgroundGradient2}></div>

                <div style={styles.card} className="reset-card">
                    <div style={styles.errorCard}>
                        <div style={styles.errorIcon}>
                            <AlertCircle size={30} color="white" />
                        </div>
                        
                        <h2 style={styles.errorTitle}>Invalid or Expired Link</h2>
                        
                        <p style={styles.errorText}>
                            This password reset link is invalid or has expired. Please request a new password reset link.
                        </p>
                        
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <Link 
                                to="/forgot-password" 
                                style={{
                                    ...styles.submitBtn,
                                    textDecoration: 'none',
                                    padding: '12px 24px',
                                }}
                            >
                                New Reset Link
                            </Link>
                            <Link 
                                to="/login" 
                                style={{
                                    ...styles.backLink,
                                    padding: '12px 24px',
                                    border: `1px solid ${colors.primary}`,
                                    borderRadius: '12px',
                                }}
                            >
                                Back to Login
                            </Link>
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

            <div style={styles.card} className="reset-card">
                <div style={styles.header}>
                    <div style={styles.iconContainer} className="floating-element">
                        <Lock size={40} color={colors.primary} />
                    </div>
                    <h1 style={styles.title}>Set New Password</h1>
                    <p style={styles.subtitle}>
                        Enter your new password below
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
                            <Lock size={16} color={colors.primary} />
                            New Password
                        </label>
                        <div style={styles.inputWrapper}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                                placeholder="Enter new password"
                                required
                                style={{
                                    ...styles.input,
                                    borderColor: focusedField === 'password' ? colors.primary : colors.border,
                                }}
                                className="input-field"
                            />
                            <div
                                style={styles.eyeIcon}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </div>
                        </div>
                        
                        {password && (
                            <div style={styles.strengthContainer}>
                                <div style={styles.strengthBar}>
                                    <div style={styles.strengthFill} />
                                </div>
                                <div style={styles.strengthText}>
                                    Password Strength: {getStrengthText()}
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>
                            <Lock size={16} color={colors.primary} />
                            Confirm Password
                        </label>
                        <div style={styles.inputWrapper}>
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                onFocus={() => setFocusedField('confirm')}
                                onBlur={() => setFocusedField(null)}
                                placeholder="Confirm new password"
                                required
                                style={{
                                    ...styles.input,
                                    borderColor: focusedField === 'confirm' ? colors.primary : colors.border,
                                }}
                                className="input-field"
                            />
                            <div
                                style={styles.eyeIcon}
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </div>
                        </div>
                        
                        {confirmPassword && password !== confirmPassword && (
                            <div style={{ color: colors.error, fontSize: '0.85rem', marginTop: '4px' }}>
                                Passwords do not match
                            </div>
                        )}
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
                                Resetting...
                            </>
                        ) : (
                            <>
                                Reset Password
                                <CheckCircle size={18} />
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

export default ResetPassword;