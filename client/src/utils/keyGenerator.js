// src/utils/keyGenerator.js
export const generateProductKey = (product, componentName) => {
  const productId = product._id || product.id || 'unknown';
  // Add timestamp + random + performance.now() for absolute uniqueness
  return `${componentName}-${productId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${performance.now()}`;
};

export const generateStarKey = (productId, index, componentName) => {
  return `star-${componentName}-${productId}-${index}-${Date.now()}-${performance.now()}`;
};