import { isValidUUID, isValidEmail, sanitizeInput } from './formatters.js';

/**
 * Validate budget creation data
 */
export function validateBudgetData(data) {
    const errors = [];

    // Required fields
    if (!data.user_id) {
        errors.push('user_id is required');
    } else if (!isValidUUID(data.user_id)) {
        errors.push('user_id must be a valid UUID');
    }

    if (!data.budget_name) {
        errors.push('budget_name is required');
    } else if (typeof data.budget_name !== 'string' || data.budget_name.trim().length === 0) {
        errors.push('budget_name must be a non-empty string');
    } else if (data.budget_name.length > 100) {
        errors.push('budget_name must be 100 characters or less');
    }

    if (data.budget_amount === undefined || data.budget_amount === null) {
        errors.push('budget_amount is required');
    } else if (isNaN(data.budget_amount) || parseFloat(data.budget_amount) <= 0) {
        errors.push('budget_amount must be a positive number');
    }

    if (!data.start_date) {
        errors.push('start_date is required');
    } else if (isNaN(Date.parse(data.start_date))) {
        errors.push('start_date must be a valid date');
    }

    if (!data.end_date) {
        errors.push('end_date is required');
    } else if (isNaN(Date.parse(data.end_date))) {
        errors.push('end_date must be a valid date');
    }

    // Date validation
    if (data.start_date && data.end_date) {
        const startDate = new Date(data.start_date);
        const endDate = new Date(data.end_date);
        
        if (endDate <= startDate) {
            errors.push('end_date must be after start_date');
        }
    }

    // Optional fields validation
    if (data.category_id && !isValidUUID(data.category_id)) {
        errors.push('category_id must be a valid UUID if provided');
    }

    if (data.period_type && !['daily', 'weekly', 'monthly', 'yearly'].includes(data.period_type)) {
        errors.push('period_type must be one of: daily, weekly, monthly, yearly');
    }

    if (data.currency && (typeof data.currency !== 'string' || data.currency.length !== 3)) {
        errors.push('currency must be a 3-character ISO currency code');
    }

    if (data.alert_threshold_percentage !== undefined) {
        const threshold = parseInt(data.alert_threshold_percentage);
        if (isNaN(threshold) || threshold < 1 || threshold > 100) {
            errors.push('alert_threshold_percentage must be between 1 and 100');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        sanitizedData: errors.length === 0 ? sanitizeBudgetData(data) : null
    };
}

/**
 * Validate transaction data
 */
export function validateTransactionData(data) {
    const errors = [];

    // Required fields
    if (!data.user_id) {
        errors.push('user_id is required');
    } else if (!isValidUUID(data.user_id)) {
        errors.push('user_id must be a valid UUID');
    }

    if (data.amount === undefined || data.amount === null) {
        errors.push('amount is required');
    } else if (isNaN(data.amount)) {
        errors.push('amount must be a valid number');
    }

    // Optional fields validation
    if (data.category_id && !isValidUUID(data.category_id)) {
        errors.push('category_id must be a valid UUID if provided');
    }

    if (data.transaction_date && isNaN(Date.parse(data.transaction_date))) {
        errors.push('transaction_date must be a valid date if provided');
    }

    if (data.transaction_type && !['income', 'expense'].includes(data.transaction_type)) {
        errors.push('transaction_type must be either "income" or "expense"');
    }

    if (data.currency && (typeof data.currency !== 'string' || data.currency.length !== 3)) {
        errors.push('currency must be a 3-character ISO currency code');
    }

    return {
        isValid: errors.length === 0,
        errors,
        sanitizedData: errors.length === 0 ? sanitizeTransactionData(data) : null
    };
}

/**
 * Validate alert data
 */
export function validateAlertData(data) {
    const errors = [];

    if (!data.user_id) {
        errors.push('user_id is required');
    } else if (!isValidUUID(data.user_id)) {
        errors.push('user_id must be a valid UUID');
    }

    if (!data.budget_id) {
        errors.push('budget_id is required');
    } else if (!isValidUUID(data.budget_id)) {
        errors.push('budget_id must be a valid UUID');
    }

    if (!data.alert_type) {
        errors.push('alert_type is required');
    } else if (!['warning', 'exceeded', 'critical'].includes(data.alert_type)) {
        errors.push('alert_type must be one of: warning, exceeded, critical');
    }

    if (data.current_spent !== undefined && isNaN(data.current_spent)) {
        errors.push('current_spent must be a valid number');
    }

    if (data.budget_amount !== undefined && isNaN(data.budget_amount)) {
        errors.push('budget_amount must be a valid number');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate pagination parameters
 */
export function validatePagination(query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;

    // Ensure reasonable limits
    const maxLimit = 100;
    const sanitizedLimit = Math.min(Math.max(limit, 1), maxLimit);
    const sanitizedPage = Math.max(page, 1);

    return {
        page: sanitizedPage,
        limit: sanitizedLimit,
        offset: (sanitizedPage - 1) * sanitizedLimit
    };
}

/**
 * Validate email configuration
 */
export function validateEmailConfig() {
    const errors = [];

    if (!process.env.EMAIL_HOST) {
        errors.push('EMAIL_HOST environment variable is required');
    }

    if (!process.env.EMAIL_USER) {
        errors.push('EMAIL_USER environment variable is required');
    } else if (!isValidEmail(process.env.EMAIL_USER)) {
        errors.push('EMAIL_USER must be a valid email address');
    }

    if (!process.env.EMAIL_PASSWORD) {
        errors.push('EMAIL_PASSWORD environment variable is required');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Sanitize budget data
 */
function sanitizeBudgetData(data) {
    return {
        user_id: data.user_id,
        category_id: data.category_id || null,
        budget_name: sanitizeInput(data.budget_name).slice(0, 100),
        budget_amount: parseFloat(data.budget_amount),
        period_type: data.period_type || 'monthly',
        start_date: data.start_date,
        end_date: data.end_date,
        currency: (data.currency || 'USD').toUpperCase(),
        alert_threshold_percentage: parseInt(data.alert_threshold_percentage) || 80
    };
}

/**
 * Sanitize transaction data
 */
function sanitizeTransactionData(data) {
    return {
        user_id: data.user_id,
        category_id: data.category_id || null,
        amount: parseFloat(data.amount),
        transaction_date: data.transaction_date || new Date().toISOString(),
        transaction_type: data.transaction_type || 'expense',
        description: sanitizeInput(data.description || '').slice(0, 255),
        currency: (data.currency || 'USD').toUpperCase()
    };
}

/**
 * Validate budget update data (partial validation)
 */
export function validateBudgetUpdateData(data) {
    const errors = [];
    const allowedFields = [
        'budget_name', 'budget_amount', 'period_type', 
        'start_date', 'end_date', 'currency', 'alert_threshold_percentage'
    ];

    // Check if at least one field is provided
    const providedFields = Object.keys(data).filter(key => allowedFields.includes(key));
    if (providedFields.length === 0) {
        errors.push('At least one field must be provided for update');
    }

    // Validate individual fields if provided
    if (data.budget_name !== undefined) {
        if (typeof data.budget_name !== 'string' || data.budget_name.trim().length === 0) {
            errors.push('budget_name must be a non-empty string');
        } else if (data.budget_name.length > 100) {
            errors.push('budget_name must be 100 characters or less');
        }
    }

    if (data.budget_amount !== undefined) {
        if (isNaN(data.budget_amount) || parseFloat(data.budget_amount) <= 0) {
            errors.push('budget_amount must be a positive number');
        }
    }

    if (data.period_type !== undefined) {
        if (!['daily', 'weekly', 'monthly', 'yearly'].includes(data.period_type)) {
            errors.push('period_type must be one of: daily, weekly, monthly, yearly');
        }
    }

    if (data.start_date !== undefined && isNaN(Date.parse(data.start_date))) {
        errors.push('start_date must be a valid date');
    }

    if (data.end_date !== undefined && isNaN(Date.parse(data.end_date))) {
        errors.push('end_date must be a valid date');
    }

    if (data.currency !== undefined) {
        if (typeof data.currency !== 'string' || data.currency.length !== 3) {
            errors.push('currency must be a 3-character ISO currency code');
        }
    }

    if (data.alert_threshold_percentage !== undefined) {
        const threshold = parseInt(data.alert_threshold_percentage);
        if (isNaN(threshold) || threshold < 1 || threshold > 100) {
            errors.push('alert_threshold_percentage must be between 1 and 100');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}
