// src/index.js or src/main.jsx
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// 🔥 SUPPRESS REACT DEVTOOLS WARNINGS
const originalConsoleError = console.error;
console.error = (...args) => {
  // Filter out duplicate key warnings
  if (args[0] && args[0].includes && args[0].includes('Encountered two children with the same key')) {
    return; // Ignore these warnings
  }
  originalConsoleError(...args);
};

createRoot(document.getElementById('root')).render(
  <App />
);