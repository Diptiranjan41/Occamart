// src/utils/returnUtils.js

// Helper function to compress images before upload
export const compressImage = (file, maxWidth = 1024, maxHeight = 1024, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Calculate new dimensions
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to blob
                canvas.toBlob((blob) => {
                    const compressedFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    resolve(compressedFile);
                }, 'image/jpeg', quality);
            };
            
            img.onerror = (error) => {
                reject(error);
            };
        };
        
        reader.onerror = (error) => {
            reject(error);
        };
    });
};

// Helper function to validate return request
export const validateReturnRequest = (order, selectedItems, returnReason) => {
    const errors = [];
    
    if (!order) {
        errors.push('Order not found');
        return errors;
    }
    
    // Check if order is delivered
    if (order.status !== 'delivered') {
        errors.push('Can only return delivered orders');
    }
    
    // Check return window (7 days)
    const deliveredDate = new Date(order.deliveredAt);
    const now = new Date();
    const daysSinceDelivery = Math.floor((now - deliveredDate) / (1000 * 60 * 60 * 24));
    
    if (daysSinceDelivery > 7) {
        errors.push('Return window has expired (7 days from delivery)');
    }
    
    // Check if already returned
    if (order.returnStatus) {
        errors.push('Return already requested for this order');
    }
    
    // Check if items selected
    if (!selectedItems || selectedItems.length === 0) {
        errors.push('Please select at least one item to return');
    }
    
    // Check return reason
    if (!returnReason) {
        errors.push('Please select a return reason');
    }
    
    return errors;
};

// Helper function to format return status
export const formatReturnStatus = (status) => {
    const statusMap = {
        'return-requested': { text: 'Request Pending', color: '#F59E0B', icon: '⏳' },
        'return-approved': { text: 'Approved', color: '#10B981', icon: '✅' },
        'return-rejected': { text: 'Rejected', color: '#EF4444', icon: '❌' },
        'return-picked-up': { text: 'Picked Up', color: '#3B82F6', icon: '📦' },
        'return-received': { text: 'Received', color: '#8B5CF6', icon: '📥' },
        'return-processed': { text: 'Processed', color: '#10B981', icon: '⚙️' },
        'return-refunded': { text: 'Refunded', color: '#10B981', icon: '💰' },
        'return-completed': { text: 'Completed', color: '#10B981', icon: '✅' },
        'return-cancelled': { text: 'Cancelled', color: '#6B7280', icon: '🚫' }
    };
    
    return statusMap[status] || { text: 'Unknown', color: '#6B7280', icon: '❓' };
};

// Helper function to calculate refund amount
export const calculateRefundAmount = (order, returnItems) => {
    let refundAmount = 0;
    
    returnItems.forEach(returnItem => {
        const orderItem = order.orderItems.find(item => 
            item.productId === returnItem.productId || item._id === returnItem.productId
        );
        
        if (orderItem) {
            refundAmount += orderItem.price * returnItem.quantity;
        }
    });
    
    return refundAmount;
};

// Helper function to get return reasons
export const getReturnReasons = () => {
    return [
        { id: 'damaged', label: 'Damaged product', description: 'Product arrived damaged or broken' },
        { id: 'wrong_item', label: 'Wrong item delivered', description: 'Received different item than ordered' },
        { id: 'not_as_described', label: 'Item not as described', description: 'Product does not match description' },
        { id: 'size_issue', label: 'Size/fit issue', description: 'Wrong size or doesn\'t fit' },
        { id: 'quality_issue', label: 'Quality issue', description: 'Poor quality or defective' },
        { id: 'missing_parts', label: 'Missing parts', description: 'Accessories or parts missing' },
        { id: 'defective', label: 'Defective product', description: 'Product not working properly' },
        { id: 'changed_mind', label: 'Changed mind', description: 'No longer needed or wanted' },
        { id: 'better_price', label: 'Found better price', description: 'Found cheaper elsewhere' },
        { id: 'other', label: 'Other', description: 'Other reason' }
    ];
};