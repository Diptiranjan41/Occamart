// src/components/ProtectedRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { isAuthenticated, isAdmin, user, loading } = useAuth();
    const location = useLocation();
    const [decision, setDecision] = useState(null);

    useEffect(() => {
        // Don't make decisions while loading
        if (loading) return;

        console.log('========== 🔒 PROTECTED ROUTE DECISION ==========');
        console.log('📍 Path:', location.pathname);
        console.log('👤 User:', user);
        console.log('👑 User role:', user?.role);
        console.log('🔑 isAuthenticated:', isAuthenticated);
        console.log('🛡️ isAdmin() result:', isAdmin());
        console.log('⚙️ adminOnly:', adminOnly);
        console.log('⏳ loading:', loading);
        console.log('================================================');

        // Case 1: Not authenticated
        if (!isAuthenticated) {
            console.log('❌ DECISION: Not authenticated → Login page');
            setDecision('login');
            return;
        }

        // Case 2: Admin route but user is not admin
        if (adminOnly && !isAdmin()) {
            console.log('❌ DECISION: Not admin → Home page');
            setDecision('home');
            return;
        }

        // Case 3: All good - grant access
        console.log('✅ DECISION: Access GRANTED');
        setDecision('grant');
    }, [isAuthenticated, isAdmin, user, loading, location.pathname, adminOnly]);

    // Show loading spinner while checking
    if (loading || decision === null) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                background: 'hsl(222, 47%, 4%)'
            }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    border: '4px solid hsla(217, 91%, 60%, 0.2)',
                    borderTop: '4px solid hsl(217, 91%, 60%)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
            </div>
        );
    }

    // Redirect based on decision
    if (decision === 'login') {
        console.log('🔄 Redirecting to /login');
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (decision === 'home') {
        console.log('🔄 Redirecting to /');
        return <Navigate to="/" replace />;
    }

    // decision === 'grant' - render children
    console.log('🎉 Rendering protected content');
    return children;
};

// Add keyframe animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

export default ProtectedRoute;