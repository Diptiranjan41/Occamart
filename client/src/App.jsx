import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// ===== CONTEXT PROVIDERS =====
import { AuthProvider } from './components/context/AuthContext';
import { CartProvider } from './components/context/CartContext';
import { WishlistProvider } from './components/context/WishlistContext';

// ===== PROTECTED ROUTE =====
import ProtectedRoute from './components/ProtectedRoute';

// ===== COMMON COMPONENTS =====
import Header from './components/Header';
import Footer from './components/home/Footer';
import QuickFeedback from './components/QuickFeedback'; // Floating feedback button

// ===== PUBLIC PAGES =====
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminRegister from './pages/AdminRegister';
import Cart from './pages/Cart';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// ===== USER PAGES (PROTECTED) =====
import Profile from './pages/profile';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import AddressInfo from './pages/AddressInfo';
// 🔥 FIXED: Single import with correct case (Payment.jsx - capital P)
import Payment from './pages/Payment';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderHistory from './pages/OrderHistory';
import OrderDetails from './pages/OrderDetails';

// ===== REVIEW & FEEDBACK PAGES =====
import AllReviews from './pages/AllReviews';
import ProductReview from './components/ProductReview';
import ProductReviewModal from './components/ProductReviewModal'; // Review modal
import Feedback from './pages/Feedback';
import FeedbackForm from './components/FeedbackForm';

// ===== ADMIN PAGES =====
import AdminDashboard from './pages/AdminDashboard';
import ManageProducts from './pages/admin/ManageProducts';
import ManageOrders from './pages/admin/ManageOrders';
import ManageUsers from './pages/admin/ManageUsers';
import Analytics from './pages/admin/Analytics';
import Settings from './pages/admin/Settings';
import AdminNewsletter from './pages/admin/AdminNewsletter';
import AdminFeedback from './pages/admin/AdminFeedback';
import AdminReviews from './pages/admin/AdminReviews';
import AdminHeroBanner from './pages/admin/AdminHeroBanner'; 
import Deliveries from './pages/admin/Deliveries';
import Notifications from './pages/admin/Notifications';

// ===== STATIC PAGES =====
import About from './pages/About';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Shipping from './pages/Shipping';
import Returns from './pages/Returns';

import './App.css';

// Separate component to use useLocation hook
const AppContent = () => {
  const location = useLocation();
  
  // Sirf home page par footer dikhao
  const showFooter = location.pathname === '/';
  
  // 🔥 FIXED: Check both payment routes
  const isPaymentPage = location.pathname.includes('/payment') || 
                        location.pathname.includes('/checkout/payment');
  
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      
      {/* Floating Quick Feedback Button - shows on all pages but not on payment page */}
      {!isPaymentPage && <QuickFeedback />}
      
      <main className="flex-grow-1">
        <Routes>
          {/* ===== PUBLIC ROUTES ===== */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/register" element={<AdminRegister />} />
          <Route path="/cart" element={<Cart />} />
          
          {/* Password Reset Routes */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* ===== STATIC PAGES ===== */}
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/returns" element={<Returns />} />

          {/* ===== REVIEW & FEEDBACK PUBLIC ROUTES ===== */}
          <Route path="/reviews" element={<AllReviews />} />
          <Route path="/reviews/product/:id" element={<ProductReview />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/feedback/form" element={<FeedbackForm />} />

          {/* ===== 🔥 FIXED PAYMENT ROUTES ===== */}
          
          {/* Public payment route - No authentication required */}
          <Route path="/payment" element={<Payment />} />
          
          {/* 🔥 FIXED: Protected payment route - CORRECT PATH */}
          <Route
            path="/checkout/payment"
            element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            }
          />

          {/* ===== PROTECTED USER ROUTES ===== */}
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            }
          />

          <Route
            path="/checkout/address"
            element={
              <ProtectedRoute>
                <AddressInfo />
              </ProtectedRoute>
            }
          />

          <Route
            path="/order-confirmation"
            element={
              <ProtectedRoute>
                <OrderConfirmation />
              </ProtectedRoute>
            }
          />

          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrderHistory />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/order/:id"
            element={
              <ProtectedRoute>
                <OrderDetails />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* ===== ADMIN ROUTES ===== */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute requireAdmin={true}>
                <ManageProducts />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute requireAdmin={true}>
                <ManageOrders />
              </ProtectedRoute>
            }
          />
          
          {/* ADMIN NOTIFICATIONS - Protected Route */}
          <Route
            path="/admin/notifications"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Notifications />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requireAdmin={true}>
                <ManageUsers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Analytics />
              </ProtectedRoute>
            }
          />
          
          {/* Deliveries route */}
          <Route
            path="/admin/deliveries"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Deliveries />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Settings />
              </ProtectedRoute>
            }
          />
          
          {/* Admin Hero Banner Management */}
          <Route
            path="/admin/hero-banner"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminHeroBanner />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/newsletter"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminNewsletter />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/feedback"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminFeedback />
              </ProtectedRoute>
            }
          />

          {/* Admin Reviews Management */}
          <Route
            path="/admin/reviews"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminReviews />
              </ProtectedRoute>
            }
          />
          
          {/* Admin sub-routes */}
          <Route
            path="/admin/products/new"
            element={
              <ProtectedRoute requireAdmin={true}>
                <ManageProducts initialView="new" />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/products/edit/:id"
            element={
              <ProtectedRoute requireAdmin={true}>
                <ManageProducts initialView="edit" />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/orders/:id"
            element={
              <ProtectedRoute requireAdmin={true}>
                <ManageOrders initialView="details" />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/users/:id"
            element={
              <ProtectedRoute requireAdmin={true}>
                <ManageUsers initialView="details" />
              </ProtectedRoute>
            }
          />
          
          {/* Catch all route for 404 */}
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      
      {/* Conditionally show Footer only on home page */}
      {showFooter && <Footer />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <Router>
            <AppContent />
          </Router>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;