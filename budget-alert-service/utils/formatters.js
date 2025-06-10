/**
 * Utility functions for data formatting and validation
 */

/**
 * Check if a string is a valid UUID
 */
export function isValidUUID(str) {
    if (!str || typeof str !== 'string') return false;
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

/**
 * Check if a string is a valid email
 */
export function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Sanitize input string
 */
export function sanitizeInput(input) {
    if (!input || typeof input !== 'string') return '';
    
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML/script tags
        .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
}

/**
 * Format currency amount
 */
export function formatCurrency(amount, currency = 'USD') {
    const numAmount = parseFloat(amount) || 0;
    
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase(),
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numAmount);
    } catch (error) {
        // Fallback formatting if currency is invalid
        return `${currency} ${numAmount.toFixed(2)}`;
    }
}

/**
 * Format date
 */
export function formatDate(date, format = 'short') {
    if (!date) return '';
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    
    try {
        switch (format) {
            case 'short':
                return dateObj.toLocaleDateString();
            case 'long':
                return dateObj.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            case 'datetime':
                return dateObj.toLocaleString();
            default:
                return dateObj.toLocaleDateString();
        }
    } catch (error) {
        return dateObj.toString();
    }
}

/**
 * Format percentage
 */
export function formatPercentage(value, decimals = 1) {
    const numValue = parseFloat(value) || 0;
    return `${numValue.toFixed(decimals)}%`;
}

/**
 * Validate and sanitize amount
 */
export function sanitizeAmount(amount) {
    const numAmount = parseFloat(amount);
    return isNaN(numAmount) ? 0 : Math.max(0, numAmount);
}

/**
 * Generate a short ID for references
 */
export function generateShortId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text, maxLength = 50) {
    if (!text || typeof text !== 'string') return '';
    
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength - 3) + '...';
}

/**
 * Deep clone an object
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(deepClone);
    
    const cloned = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            cloned[key] = deepClone(obj[key]);
        }
    }
    return cloned;
}
