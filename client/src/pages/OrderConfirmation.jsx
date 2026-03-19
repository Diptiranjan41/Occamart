// src/pages/Payment.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Wallet, 
  Landmark, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle,
  Shield,
  Lock
} from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const Payment = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [cart, setCart] = useState([]);
    const [address, setAddress] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('razorpay');
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);
    
    const navigate = useNavigate();

    const colors = {
        primary: '#D4AF37',
        primaryDark: '#B8962E',
        bgPrimary: '#FAF7F2',
        bgSecondary: '#F5F0E8',
        textPrimary: '#1F2937',
        textSecondary: '#4B5563',
        textLight: '#6B7280',
        border: '#E0D9CD',
        success: '#10B981',
        white: '#FFFFFF',
        error: '#EF4444',
    };

    const styles = {
        container: {
            minHeight: '100vh',
            background: colors.bgPrimary,
            padding: '40px 20px',
        },
        wrapper: {
            maxWidth: '1200px',
            margin: '0 auto',
        },
        header: {
            marginBottom: '40px',
            textAlign: 'center',
        },
        title: {
            fontSize: '2.5rem',
            color: colors.textPrimary,
            marginBottom: '10px',
            fontWeight: '600',
        },
        progressContainer: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '30px',
        },
        progressStep: {
            display: 'flex',
            alignItems: 'center',
        },
        progressCircle: (active, completed) => ({
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: completed ? colors.success : (active ? colors.primary : colors.border),
            color: completed || active ? colors.white : colors.textSecondary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600',
            fontSize: '16px',
        }),
        progressLine: (completed) => ({
            width: '80px',
            height: '2px',
            background: completed ? colors.success : colors.border,
            margin: '0 10px',
        }),
        progressLabel: {
            marginLeft: '8px',
            fontSize: '14px',
            fontWeight: '500',
        },
        mainGrid: {
            display: 'grid',
            gridTemplateColumns: '1fr 350px',
            gap: '30px',
        },
        paymentSection: {
            background: colors.white,
            borderRadius: '24px',
            padding: '30px',
            border: `1px solid ${colors.border}`,
        },
        sectionTitle: {
            fontSize: '1.3rem',
            fontWeight: '600',
            color: colors.textPrimary,
            marginBottom: '25px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
        },
        paymentOption: (selected) => ({
            border: `2px solid ${selected ? colors.primary : colors.border}`,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '15px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            background: selected ? `${colors.primary}10` : colors.white,
        }),
        radioContainer: {
            display: 'flex',
            alignItems: 'flex-start',
            gap: '15px',
        },
        radio: (selected) => ({
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            border: `2px solid ${selected ? colors.primary : colors.border}`,
            background: selected ? colors.primary : 'transparent',
            marginTop: '2px',
            cursor: 'pointer',
        }),
        paymentIcon: {
            color: colors.primary,
        },
        paymentTitle: {
            fontSize: '1.1rem',
            fontWeight: '600',
            color: colors.textPrimary,
            marginBottom: '5px',
        },
        paymentDesc: {
            fontSize: '0.9rem',
            color: colors.textSecondary,
        },
        badge: {
            background: colors.bgSecondary,
            padding: '4px 8px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            color: colors.textSecondary,
        },
        addressCard: {
            background: colors.bgSecondary,
            borderRadius: '16px',
            padding: '20px',
            marginTop: '20px',
        },
        summaryCard: {
            background: colors.white,
            borderRadius: '24px',
            padding: '25px',
            border: `1px solid ${colors.border}`,
            position: 'sticky',
            top: '20px',
        },
        itemRow: {
            display: 'flex',
            justifyContent: 'space-between',
            padding: '12px 0',
            borderBottom: `1px solid ${colors.border}`,
        },
        priceRow: {
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 0',
            color: colors.textSecondary,
        },
        totalRow: {
            display: 'flex',
            justifyContent: 'space-between',
            padding: '15px 0',
            borderTop: `2px solid ${colors.border}`,
            fontSize: '1.2rem',
            fontWeight: '700',
            color: colors.primary,
        },
        button: {
            width: '100%',
            padding: '15px',
            border: 'none',
            borderRadius: '12px',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            marginTop: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
        },
        primaryButton: {
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
            color: colors.white,
        },
        secondaryButton: {
            background: 'transparent',
            border: `2px solid ${colors.primary}`,
            color: colors.textPrimary,
        },
        errorAlert: {
            background: `${colors.error}10`,
            border: `1px solid ${colors.error}`,
            borderRadius: '12px',
            padding: '15px',
            color: colors.error,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
        },
        editLink: {
            color: colors.primary,
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: '500',
            cursor: 'pointer',
        },
    };

    useEffect(() => {
        // Check if address exists
        const savedAddress = sessionStorage.getItem('shippingAddress');
        if (!savedAddress) {
            navigate('/checkout/address');
            return;
        }

        // Load cart
        const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
        if (savedCart.length === 0) {
            navigate('/cart');
            return;
        }

        setAddress(JSON.parse(savedAddress));
        setCart(savedCart);
        
        // Load Razorpay script
        loadRazorpayScript();
    }, [navigate]);

    const loadRazorpayScript = () => {
        if (window.Razorpay) {
            setRazorpayLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => setRazorpayLoaded(true);
        script.onerror = () => {
            setError('Failed to load payment gateway. Please refresh the page.');
        };
        document.body.appendChild(script);
    };

    // Calculate totals
    const itemsPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxPrice = Number((0.18 * itemsPrice).toFixed(2));
    const shippingPrice = itemsPrice > 500 ? 0 : 40;
    const totalPrice = itemsPrice + taxPrice + shippingPrice;

    const handlePaymentMethodChange = (method) => {
        setPaymentMethod(method);
        setError('');
    };

    const createOrder = async () => {
        try {
            setLoading(true);
            setError('');

            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            // Prepare order items
            const orderItems = cart.map(item => {
                const productId = item._id || item.productId || item.id;
                if (!productId) {
                    throw new Error(`Product ID missing for ${item.name}`);
                }
                return {
                    name: item.name,
                    qty: item.quantity,
                    price: item.price,
                    product: productId,
                    image: item.image || ''
                };
            });

            const orderPayload = {
                orderItems: orderItems,
                shippingAddress: {
                    fullName: address.fullName,
                    address: `${address.addressLine1} ${address.addressLine2 || ''}`.trim(),
                    city: address.city,
                    postalCode: address.postalCode,
                    country: address.country,
                    phone: address.phone,
                    state: address.state
                },
                paymentMethod: paymentMethod === 'razorpay' ? 'Razorpay' : 'Cash on Delivery',
                itemsPrice: Number(itemsPrice.toFixed(2)),
                taxPrice: Number(taxPrice.toFixed(2)),
                shippingPrice: Number(shippingPrice.toFixed(2)),
                totalPrice: Number(totalPrice.toFixed(2))
            };

            console.log('Creating order:', orderPayload);

            // Create order in backend
            const response = await axios.post(`${API_URL}/orders`, orderPayload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data) {
                if (paymentMethod === 'cod') {
                    // COD Order - Direct success
                    localStorage.setItem('cart', JSON.stringify([]));
                    sessionStorage.removeItem('shippingAddress');
                    window.dispatchEvent(new Event('cartUpdated'));
                    
                    navigate('/checkout/confirmation', { 
                        state: { 
                            orderId: response.data._id,
                            paymentMethod: 'cod',
                            totalPrice: totalPrice,
                            orderNumber: response.data.orderNumber || response.data._id.slice(-8).toUpperCase()
                        }
                    });
                } else {
                    // Razorpay Payment
                    await initiateRazorpayPayment(response.data);
                }
            }
        } catch (error) {
            console.error('Order creation error:', error);
            setError(error.response?.data?.message || 'Failed to create order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const initiateRazorpayPayment = async (orderData) => {
        try {
            setPaymentProcessing(true);

            if (!razorpayLoaded) {
                throw new Error('Payment gateway not loaded. Please refresh the page.');
            }

            const token = localStorage.getItem('token');

            // Create Razorpay order
            const razorpayResponse = await axios.post(`${API_URL}/payment/create-razorpay-order`, {
                amount: totalPrice,
                currency: 'INR',
                orderId: orderData._id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const razorpayOrder = razorpayResponse.data;

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || process.env.REACT_APP_RAZORPAY_KEY_ID,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: 'Occa Mart',
                description: `Order #${orderData._id.slice(-8)}`,
                order_id: razorpayOrder.id,
                handler: function(response) {
                    verifyPayment(response, orderData._id);
                },
                prefill: {
                    name: address.fullName,
                    contact: address.phone,
                    email: address.email || ''
                },
                notes: {
                    address: address.addressLine1,
                    orderId: orderData._id
                },
                theme: {
                    color: colors.primary
                },
                modal: {
                    ondismiss: function() {
                        setPaymentProcessing(false);
                        setError('Payment cancelled by user');
                    }
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
            
        } catch (error) {
            console.error('Razorpay initiation error:', error);
            setError('Failed to initiate payment. Please try again.');
            setPaymentProcessing(false);
        }
    };

    const verifyPayment = async (paymentResponse, orderId) => {
        try {
            const token = localStorage.getItem('token');

            const verification = await axios.post(`${API_URL}/payment/verify-razorpay-payment`, {
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                orderId: orderId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (verification.data.success) {
                // Clear cart and address
                localStorage.setItem('cart', JSON.stringify([]));
                sessionStorage.removeItem('shippingAddress');
                window.dispatchEvent(new Event('cartUpdated'));
                
                // Navigate to confirmation
                navigate('/checkout/confirmation', { 
                    state: { 
                        orderId: orderId,
                        paymentId: paymentResponse.razorpay_payment_id,
                        paymentMethod: 'razorpay',
                        totalPrice: totalPrice,
                        orderNumber: orderId.slice(-8).toUpperCase()
                    }
                });
            } else {
                setError('Payment verification failed');
                setPaymentProcessing(false);
            }
        } catch (error) {
            console.error('Verification error:', error);
            setError('Payment verification failed. Please contact support.');
            setPaymentProcessing(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.wrapper}>
                {/* Header */}
                <div style={styles.header}>
                    <h1 style={styles.title}>Complete Payment</h1>
                    
                    {/* Progress Steps */}
                    <div style={styles.progressContainer}>
                        <div style={styles.progressStep}>
                            <div style={styles.progressCircle(true, true)}>✓</div>
                            <span style={{...styles.progressLabel, color: colors.success}}>Address</span>
                        </div>
                        <div style={styles.progressLine(true)} />
                        <div style={styles.progressStep}>
                            <div style={styles.progressCircle(true, false)}>2</div>
                            <span style={{...styles.progressLabel, color: colors.primary}}>Payment</span>
                        </div>
                        <div style={styles.progressLine(false)} />
                        <div style={styles.progressStep}>
                            <div style={styles.progressCircle(false, false)}>3</div>
                            <span style={styles.progressLabel}>Confirmation</span>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div style={styles.mainGrid}>
                    {/* Payment Methods Section */}
                    <div>
                        <div style={styles.paymentSection}>
                            <h2 style={styles.sectionTitle}>
                                <CreditCard size={24} color={colors.primary} />
                                Select Payment Method
                            </h2>

                            {error && (
                                <div style={styles.errorAlert}>
                                    <AlertCircle size={20} />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Razorpay Option */}
                            <div 
                                style={styles.paymentOption(paymentMethod === 'razorpay')}
                                onClick={() => handlePaymentMethodChange('razorpay')}
                            >
                                <div style={styles.radioContainer}>
                                    <div style={styles.radio(paymentMethod === 'razorpay')} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                            <CreditCard size={24} color={colors.primary} />
                                            <span style={styles.paymentTitle}>Pay with Razorpay</span>
                                        </div>
                                        <p style={styles.paymentDesc}>
                                            Pay securely via UPI, Credit/Debit Card, Net Banking, or Wallet
                                        </p>
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                            <span style={styles.badge}>
                                                <Shield size={12} style={{ marginRight: '4px' }} />
                                                Secure
                                            </span>
                                            <span style={styles.badge}>
                                                <Lock size={12} style={{ marginRight: '4px' }} />
                                                Encrypted
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* COD Option */}
                            <div 
                                style={styles.paymentOption(paymentMethod === 'cod')}
                                onClick={() => handlePaymentMethodChange('cod')}
                            >
                                <div style={styles.radioContainer}>
                                    <div style={styles.radio(paymentMethod === 'cod')} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                            <Landmark size={24} color={colors.primary} />
                                            <span style={styles.paymentTitle}>Cash on Delivery</span>
                                        </div>
                                        <p style={styles.paymentDesc}>
                                            Pay with cash when your order is delivered
                                        </p>
                                        {totalPrice > 1000 && (
                                            <p style={{ color: colors.primary, fontSize: '0.85rem', marginTop: '5px' }}>
                                                Note: Orders above ₹1000 may require prepayment
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Address Summary */}
                            {address && (
                                <div style={styles.addressCard}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: colors.textPrimary }}>
                                            Shipping Address
                                        </h3>
                                        <span 
                                            style={styles.editLink}
                                            onClick={() => navigate('/checkout/address')}
                                        >
                                            Edit
                                        </span>
                                    </div>
                                    <p style={{ color: colors.textSecondary, fontSize: '0.9rem' }}>
                                        {address.fullName}<br />
                                        {address.addressLine1}<br />
                                        {address.addressLine2 && <>{address.addressLine2}<br /></>}
                                        {address.city}, {address.state} - {address.postalCode}<br />
                                        Phone: {address.phone}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div>
                        <div style={styles.summaryCard}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '20px' }}>
                                Order Summary
                            </h2>
                            
                            {/* Cart Items */}
                            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
                                {cart.map((item, index) => (
                                    <div key={index} style={styles.itemRow}>
                                        <div>
                                            <span style={{ fontWeight: '500' }}>{item.name}</span>
                                            <span style={{ color: colors.textLight, marginLeft: '8px' }}>x{item.quantity}</span>
                                        </div>
                                        <span style={{ color: colors.primary }}>
                                            ₹{(item.price * item.quantity).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Price Breakdown */}
                            <div>
                                <div style={styles.priceRow}>
                                    <span>Items Total:</span>
                                    <span>₹{itemsPrice.toFixed(2)}</span>
                                </div>
                                <div style={styles.priceRow}>
                                    <span>Tax (18% GST):</span>
                                    <span>₹{taxPrice.toFixed(2)}</span>
                                </div>
                                <div style={styles.priceRow}>
                                    <span>Shipping:</span>
                                    <span style={{ color: shippingPrice === 0 ? colors.success : colors.textSecondary }}>
                                        {shippingPrice === 0 ? 'FREE' : `₹${shippingPrice.toFixed(2)}`}
                                    </span>
                                </div>
                            </div>

                            <div style={styles.totalRow}>
                                <span>Total Amount:</span>
                                <span>₹{totalPrice.toFixed(2)}</span>
                            </div>

                            <button
                                style={{
                                    ...styles.button,
                                    ...styles.primaryButton,
                                    opacity: (loading || paymentProcessing) ? 0.7 : 1,
                                    cursor: (loading || paymentProcessing) ? 'not-allowed' : 'pointer'
                                }}
                                onClick={createOrder}
                                disabled={loading || paymentProcessing}
                            >
                                {loading || paymentProcessing ? (
                                    <>
                                        <div style={{
                                            width: '20px',
                                            height: '20px',
                                            border: '2px solid rgba(255,255,255,0.3)',
                                            borderTop: '2px solid white',
                                            borderRadius: '50%',
                                            animation: 'spin 1s linear infinite'
                                        }} />
                                        {paymentProcessing ? 'Processing Payment...' : 'Creating Order...'}
                                    </>
                                ) : (
                                    <>
                                        Pay ₹{totalPrice.toFixed(2)}
                                        <ArrowRight size={20} />
                                    </>
                                )}
                            </button>

                            <p style={{ textAlign: 'center', color: colors.textLight, fontSize: '0.8rem', marginTop: '15px' }}>
                                By placing your order, you agree to our Terms of Service and Privacy Policy
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                button:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(212, 175, 55, 0.3);
                }
                div[style*="cursor: pointer"]:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.05);
                }
            `}</style>
        </div>
    );
};

export default Payment;