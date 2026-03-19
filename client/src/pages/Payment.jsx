// src/pages/Payment.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Wallet, Landmark, AlertCircle, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { orderAPI } from '../api/api';

const Payment = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [cart, setCart] = useState([]);
    const [address, setAddress] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('razorpay');
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    
    const navigate = useNavigate();

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
    }, [navigate]);

    // Calculate totals
    const itemsPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxPrice = Number((0.18 * itemsPrice).toFixed(2));
    const shippingPrice = itemsPrice > 500 ? 0 : 40;
    const totalPrice = itemsPrice + taxPrice + shippingPrice;

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePaymentMethodChange = (method) => {
        setPaymentMethod(method);
        setError('');
    };

    const createOrder = async () => {
        try {
            setLoading(true);
            setError('');

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
            const response = await orderAPI.createOrder(orderPayload);
            
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
                            totalPrice: totalPrice
                        }
                    });
                } else {
                    // Razorpay Payment
                    await initiateRazorpayPayment(response.data);
                }
            }
        } catch (error) {
            console.error('Order creation error:', error);
            setError(error.response?.data?.message || 'Failed to create order');
        } finally {
            setLoading(false);
        }
    };

    const initiateRazorpayPayment = async (orderData) => {
        try {
            setPaymentProcessing(true);
            
            // Load Razorpay script if not already loaded
            if (!window.Razorpay) {
                const loaded = await loadRazorpayScript();
                if (!loaded) {
                    throw new Error('Failed to load Razorpay SDK');
                }
            }

            // Create Razorpay order
            const razorpayOrderResponse = await orderAPI.createRazorpayOrder({
                amount: totalPrice,
                currency: 'INR',
                orderId: orderData._id
            });

            const razorpayOrder = razorpayOrderResponse.data;

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || process.env.REACT_APP_RAZORPAY_KEY_ID,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: 'Occa Mart',
                description: `Order #${orderData._id}`,
                order_id: razorpayOrder.id,
                handler: function(response) {
                    verifyPayment(response, orderData._id);
                },
                prefill: {
                    name: address.fullName,
                    contact: address.phone
                },
                notes: {
                    address: address.addressLine1
                },
                theme: {
                    color: '#7C3AED'
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
            const verification = await orderAPI.verifyRazorpayPayment({
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                orderId: orderId
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
                        totalPrice: totalPrice
                    }
                });
            } else {
                setError('Payment verification failed');
                setPaymentProcessing(false);
            }
        } catch (error) {
            console.error('Verification error:', error);
            setError('Payment verification failed');
            setPaymentProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header with Progress */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Complete Payment</h1>
                    
                    <div className="flex items-center justify-center mt-6">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold">
                                ✓
                            </div>
                            <span className="ml-2 text-green-600 font-medium">Address</span>
                        </div>
                        <div className="w-16 h-0.5 bg-green-600 mx-2"></div>
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-semibold">
                                2
                            </div>
                            <span className="ml-2 font-medium text-purple-600">Payment</span>
                        </div>
                        <div className="w-16 h-0.5 bg-gray-300 mx-2"></div>
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-semibold">
                                3
                            </div>
                            <span className="ml-2 text-gray-500">Confirmation</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Payment Methods Section */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-800">
                                    Select Payment Method
                                </h2>
                            </div>

                            <div className="p-6">
                                {error && (
                                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
                                        <AlertCircle className="mr-2 flex-shrink-0" size={20} />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {/* Razorpay Option */}
                                <div 
                                    className={`border-2 rounded-lg p-4 mb-4 cursor-pointer transition-all ${
                                        paymentMethod === 'razorpay' 
                                            ? 'border-purple-600 bg-purple-50' 
                                            : 'border-gray-200 hover:border-purple-300'
                                    }`}
                                    onClick={() => handlePaymentMethodChange('razorpay')}
                                >
                                    <div className="flex items-start">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="razorpay"
                                            checked={paymentMethod === 'razorpay'}
                                            onChange={() => handlePaymentMethodChange('razorpay')}
                                            className="mt-1 mr-3"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center">
                                                <CreditCard className="text-purple-600 mr-2" size={24} />
                                                <span className="font-semibold text-gray-800">Pay with Razorpay</span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1 ml-8">
                                                Pay via UPI, Credit/Debit Card, Net Banking, or Wallet
                                            </p>
                                            <div className="flex items-center gap-2 mt-2 ml-8">
                                                <img 
                                                    src="https://razorpay.com/assets/razorpay-glyph.svg" 
                                                    alt="Razorpay" 
                                                    className="h-6"
                                                    onError={(e) => e.target.style.display = 'none'}
                                                />
                                                <span className="text-xs text-gray-500">Secure & Encrypted</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* COD Option */}
                                <div 
                                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                        paymentMethod === 'cod' 
                                            ? 'border-purple-600 bg-purple-50' 
                                            : 'border-gray-200 hover:border-purple-300'
                                    }`}
                                    onClick={() => handlePaymentMethodChange('cod')}
                                >
                                    <div className="flex items-start">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="cod"
                                            checked={paymentMethod === 'cod'}
                                            onChange={() => handlePaymentMethodChange('cod')}
                                            className="mt-1 mr-3"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center">
                                                <Landmark className="text-purple-600 mr-2" size={24} />
                                                <span className="font-semibold text-gray-800">Cash on Delivery</span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1 ml-8">
                                                Pay with cash when your order is delivered
                                            </p>
                                            {totalPrice > 1000 && (
                                                <p className="text-xs text-amber-600 mt-1 ml-8">
                                                    Note: Orders above ₹1000 may require prepayment
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Address Summary */}
                                {address && (
                                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                        <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                                            <ArrowLeft className="mr-1" size={16} />
                                            Shipping Address
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {address.fullName}<br />
                                            {address.addressLine1}<br />
                                            {address.addressLine2 && <>{address.addressLine2}<br /></>}
                                            {address.city}, {address.state} - {address.postalCode}<br />
                                            Phone: {address.phone}
                                        </p>
                                        <button
                                            onClick={() => navigate('/checkout/address')}
                                            className="text-sm text-purple-600 hover:text-purple-700 mt-2"
                                        >
                                            Edit Address
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-lg sticky top-4">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-800">Order Summary</h2>
                            </div>
                            
                            <div className="p-6">
                                {/* Cart Items */}
                                <div className="max-h-60 overflow-y-auto mb-4">
                                    {cart.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-800">{item.name}</p>
                                                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                            </div>
                                            <span className="text-sm font-medium text-gray-800">
                                                ₹{(item.price * item.quantity).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Price Breakdown */}
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Items Total:</span>
                                        <span className="font-medium">₹{itemsPrice.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tax (18% GST):</span>
                                        <span className="font-medium">₹{taxPrice.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Shipping:</span>
                                        <span className={`font-medium ${shippingPrice === 0 ? 'text-green-600' : ''}`}>
                                            {shippingPrice === 0 ? 'Free' : `₹${shippingPrice.toFixed(2)}`}
                                        </span>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 mt-4 pt-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-base font-semibold text-gray-800">Total Amount:</span>
                                        <span className="text-xl font-bold text-purple-600">₹{totalPrice.toFixed(2)}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={createOrder}
                                    disabled={loading || paymentProcessing}
                                    className="w-full mt-6 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-purple-300 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {loading || paymentProcessing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                            {paymentProcessing ? 'Processing Payment...' : 'Creating Order...'}
                                        </>
                                    ) : (
                                        <>
                                            Pay ₹{totalPrice.toFixed(2)}
                                            <ArrowRight className="ml-2" size={20} />
                                        </>
                                    )}
                                </button>

                                <p className="text-xs text-gray-500 text-center mt-4">
                                    By placing your order, you agree to our Terms of Service and Privacy Policy
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Payment;