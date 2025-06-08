/**
 * Format currency amount with proper symbol and decimal places
 */
export function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
    try {
        const numAmount = parseFloat(amount) || 0;
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numAmount);
    } catch (error) {
        // Fallback formatting
        return `${currency} ${parseFloat(amount || 0).toFixed(2)}`;
    }
}

/**
 * Format date in a readable format
 */
export function formatDate(date, format = 'MMM DD, YYYY') {
    try {
        if (!date) return '';
        
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return '';

        const options = {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        };

        if (format.includes('time') || format.includes('h')) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }

        return dateObj.toLocaleDateString('en-US', options);
    } catch (error) {
        return date.toString();
    }
}

/**
 * Format percentage with proper decimal places
 */
export function formatPercentage(value, decimals = 1) {
    const num = parseFloat(value) || 0;
    return `${num.toFixed(decimals)}%`;
}

/**
 * Parse and validate currency amount
 */
export function parseCurrencyAmount(amount) {
    if (typeof amount === 'number') {
        return amount;
    }
    
    if (typeof amount === 'string') {
        // Remove currency symbols and spaces
        const cleaned = amount.replace(/[$€£¥₹,\s]/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    }
    
    return 0;
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Sanitize user input for database queries
 */
export function sanitizeInput(input) {
    if (typeof input !== 'string') {
        return input;
    }
    
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .slice(0, 1000); // Limit length
}

/**
 * Generate a random reference ID
 */
export function generateReferenceId(prefix = 'REF') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}-${timestamp}-${random}`.toUpperCase();
}

/**
 * Calculate days between two dates
 */
export function daysBetween(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000;
    const firstDate = new Date(date1);
    const secondDate = new Date(date2);
    
    return Math.round(Math.abs((firstDate - secondDate) / oneDay));
}

/**
 * Get period start and end dates based on period type
 */
export function getPeriodDates(periodType, referenceDate = new Date()) {
    const date = new Date(referenceDate);
    let startDate, endDate;

    switch (periodType.toLowerCase()) {
        case 'daily':
            startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 1);
            endDate.setMilliseconds(-1); // End of day
            break;

        case 'weekly':
            const dayOfWeek = date.getDay();
            startDate = new Date(date);
            startDate.setDate(date.getDate() - dayOfWeek);
            startDate.setHours(0, 0, 0, 0);
            
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
            break;

        case 'monthly':
            startDate = new Date(date.getFullYear(), date.getMonth(), 1);
            endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);
            break;

        case 'yearly':
            startDate = new Date(date.getFullYear(), 0, 1);
            endDate = new Date(date.getFullYear(), 11, 31);
            endDate.setHours(23, 59, 59, 999);
            break;

        default:
            throw new Error(`Unsupported period type: ${periodType}`);
    }

    return {
        startDate: startDate.toISOString().split('T')[0], // YYYY-MM-DD format
        endDate: endDate.toISOString().split('T')[0]
    };
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse(jsonString, fallback = null) {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        return fallback;
    }
}

/**
 * Debounce function to limit rapid function calls
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
