// src/pages/Checkout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '../api/api';
import { CheckCircle, AlertCircle, ShoppingBag, MapPin, CreditCard } from 'lucide-react';

const Checkout = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [cart, setCart] = useState([]);
    const [shippingAddress, setShippingAddress] = useState({
        fullName: '',
        address: '',
        city: '',
        postalCode: '',
        country: 'India',
        phone: ''
    });
    const [paymentMethod, setPaymentMethod] = useState('PayPal');
    const navigate = useNavigate();

    useEffect(() => {
        try {
            const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
            
            // Check if cart items have product IDs
            const validCart = savedCart.map(item => ({
                ...item,
                // Ensure product ID exists
                _id: item._id || item.productId || item.id,
                productId: item.productId || item._id || item.id
            }));
            
            console.log('🛒 Cart items with IDs:', validCart);
            setCart(validCart);
            
            if (validCart.length === 0) {
                navigate('/cart');
            }
        } catch (error) {
            console.error('Error loading cart:', error);
            navigate('/cart');
        }
    }, [navigate]);

    // 🔥 NEW: Redirect to address page if no address data
    useEffect(() => {
        // Check if address data exists in session storage or context
        const savedAddress = sessionStorage.getItem('shippingAddress');
        if (!savedAddress) {
            // If no address, redirect to address collection page
            navigate('/checkout/address');
        } else {
            try {
                const addressData = JSON.parse(savedAddress);
                setShippingAddress(addressData);
            } catch (error) {
                console.error('Error parsing address:', error);
            }
        }
    }, [navigate]);

    // Calculate totals
    const itemsPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxPrice = Number((0.18 * itemsPrice).toFixed(2));
    const shippingPrice = itemsPrice > 500 ? 0 : 40;
    const totalPrice = itemsPrice + taxPrice + shippingPrice;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setShippingAddress(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCheckout = async () => {
        try {
            setLoading(true);
            setError('');

            // Validate shipping address
            if (!shippingAddress.fullName || !shippingAddress.address || !shippingAddress.city || 
                !shippingAddress.postalCode || !shippingAddress.phone) {
                setError('Please fill all shipping address fields');
                setLoading(false);
                return;
            }

            const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');

            if (cartItems.length === 0) {
                navigate('/cart');
                return;
            }

            // ✅ FIXED: Prepare order data with proper product IDs
            const orderItems = cartItems.map(item => {
                // Get product ID from various possible fields
                const productId = item._id || item.productId || item.id;
                
                if (!productId) {
                    throw new Error(`Product ID missing for ${item.name}. Please add product to cart again.`);
                }
                
                return {
                    name: item.name,
                    qty: item.quantity, // Backend expects 'qty'
                    price: item.price,
                    product: productId, // ✅ Critical: Product ID must be here
                    image: item.image || ''
                };
            });

            const orderData = {
                orderItems: orderItems,
                shippingAddress: {
                    address: shippingAddress.address,
                    city: shippingAddress.city,
                    postalCode: shippingAddress.postalCode,
                    country: shippingAddress.country
                },
                paymentMethod: paymentMethod,
                itemsPrice: Number(itemsPrice.toFixed(2)),
                taxPrice: Number(taxPrice.toFixed(2)),
                shippingPrice: Number(shippingPrice.toFixed(2)),
                totalPrice: Number(totalPrice.toFixed(2))
            };

            console.log('📦 Sending order data:', JSON.stringify(orderData, null, 2));

            const response = await orderAPI.createOrder(orderData);

            console.log('✅ Order response:', response.data);

            if (response.data) {
                // Clear cart
                localStorage.setItem('cart', JSON.stringify([]));
                setCart([]);
                
                // Clear saved address
                sessionStorage.removeItem('shippingAddress');
                
                // Dispatch cart update event
                window.dispatchEvent(new Event('cartUpdated'));
                
                setSuccess(true);
                
                // Redirect to orders page after 2 seconds
                setTimeout(() => {
                    navigate('/orders');
                }, 2000);
            }
        } catch (error) {
            console.error('❌ Checkout error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            
            setError(
                error.response?.data?.message ||
                error.message ||
                'Failed to create order. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5 mb-5">
            <div className="row">
                <div className="col-md-8">
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-body p-4">
                            <h3 className="mb-4">
                                <ShoppingBag className="me-2" size={28} />
                                Checkout
                            </h3>

                            {error && (
                                <div className="alert alert-danger d-flex align-items-center">
                                    <AlertCircle className="me-2" size={20} />
                                    <span>{error}</span>
                                </div>
                            )}

                            {success && (
                                <div className="alert alert-success d-flex align-items-center">
                                    <CheckCircle className="me-2" size={24} />
                                    <span>Order placed successfully! Redirecting to orders...</span>
                                </div>
                            )}

                            {/* Shipping Address Form */}
                            <div className="mb-4">
                                <h5 className="mb-3">
                                    <MapPin className="me-2" size={20} />
                                    Shipping Address
                                </h5>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">Full Name *</label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            className="form-control"
                                            value={shippingAddress.fullName}
                                            onChange={handleInputChange}
                                            required
                                            disabled={loading || success}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Phone Number *</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            className="form-control"
                                            value={shippingAddress.phone}
                                            onChange={handleInputChange}
                                            required
                                            disabled={loading || success}
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Address *</label>
                                        <input
                                            type="text"
                                            name="address"
                                            className="form-control"
                                            value={shippingAddress.address}
                                            onChange={handleInputChange}
                                            required
                                            disabled={loading || success}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">City *</label>
                                        <input
                                            type="text"
                                            name="city"
                                            className="form-control"
                                            value={shippingAddress.city}
                                            onChange={handleInputChange}
                                            required
                                            disabled={loading || success}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Postal Code *</label>
                                        <input
                                            type="text"
                                            name="postalCode"
                                            className="form-control"
                                            value={shippingAddress.postalCode}
                                            onChange={handleInputChange}
                                            required
                                            disabled={loading || success}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Country</label>
                                        <input
                                            type="text"
                                            name="country"
                                            className="form-control"
                                            value={shippingAddress.country}
                                            onChange={handleInputChange}
                                            disabled={loading || success}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="mb-4">
                                <h5 className="mb-3">
                                    <CreditCard className="me-2" size={20} />
                                    Payment Method
                                </h5>
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="paymentMethod"
                                        id="paypal"
                                        value="PayPal"
                                        checked={paymentMethod === 'PayPal'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        disabled={loading || success}
                                    />
                                    <label className="form-check-label" htmlFor="paypal">
                                        PayPal / Credit Card
                                    </label>
                                </div>
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="paymentMethod"
                                        id="cod"
                                        value="Cash on Delivery"
                                        checked={paymentMethod === 'Cash on Delivery'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        disabled={loading || success}
                                    />
                                    <label className="form-check-label" htmlFor="cod">
                                        Cash on Delivery
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    {/* Order Summary */}
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-4">
                            <h5 className="mb-3">Order Summary</h5>
                            
                            <div className="mb-3">
                                {cart.map((item, index) => (
                                    <div 
                                        key={item._id || item.productId || index} 
                                        className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom"
                                    >
                                        <div className="small">
                                            <span className="fw-bold">{item.name}</span>
                                            <span className="text-muted"> x {item.quantity}</span>
                                            {(!item._id && !item.productId) && (
                                                <span className="badge bg-warning ms-2">ID Missing</span>
                                            )}
                                        </div>
                                        <span className="small fw-bold">
                                            ₹{(item.price * item.quantity).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <hr />

                            <div className="mb-2 d-flex justify-content-between">
                                <span>Items Total:</span>
                                <span>₹{itemsPrice.toFixed(2)}</span>
                            </div>
                            <div className="mb-2 d-flex justify-content-between">
                                <span>Tax (18% GST):</span>
                                <span>₹{taxPrice.toFixed(2)}</span>
                            </div>
                            <div className="mb-2 d-flex justify-content-between">
                                <span>Shipping:</span>
                                <span className={shippingPrice === 0 ? 'text-success' : ''}>
                                    {shippingPrice === 0 ? 'Free' : `₹${shippingPrice.toFixed(2)}`}
                                </span>
                            </div>
                            
                            <hr />
                            
                            <div className="d-flex justify-content-between fw-bold mb-4">
                                <span>Total Amount:</span>
                                <span className="text-primary fs-5">₹{totalPrice.toFixed(2)}</span>
                            </div>

                            <button
                                className="btn btn-primary btn-lg w-100"
                                onClick={handleCheckout}
                                disabled={loading || success}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" />
                                        Processing...
                                    </>
                                ) : success ? (
                                    <>
                                        <CheckCircle className="me-2" size={20} />
                                        Order Placed!
                                    </>
                                ) : (
                                    'Place Order'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;