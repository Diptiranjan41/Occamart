// src/pages/Unauthorized.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'hsl(222, 47%, 4%)',
            color: 'white'
        }}>
            <div style={{ textAlign: 'center' }}>
                <h1>403 - Unauthorized</h1>
                <p>You don't have permission to access this page.</p>
                <Link to="/" style={{ color: 'hsl(217, 91%, 60%)' }}>Go Home</Link>
            </div>
        </div>
    );
};

export default Unauthorized;