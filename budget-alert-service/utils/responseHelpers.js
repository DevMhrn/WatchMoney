/**
 * Standard API response formatter
 */
export function successResponse(data, message = 'Success', statusCode = 200) {
    return {
        success: true,
        statusCode,
        message,
        data,
        timestamp: new Date().toISOString()
    };
}

/**
 * Error response formatter
 */
export function errorResponse(message = 'Internal Server Error', statusCode = 500, errors = null) {
    return {
        success: false,
        statusCode,
        message,
        errors,
        timestamp: new Date().toISOString()
    };
}

/**
 * Validation error response
 */
export function validationErrorResponse(errors, message = 'Validation failed') {
    return errorResponse(message, 400, errors);
}

/**
 * Not found response
 */
export function notFoundResponse(resource = 'Resource') {
    return errorResponse(`${resource} not found`, 404);
}

/**
 * Unauthorized response
 */
export function unauthorizedResponse(message = 'Unauthorized access') {
    return errorResponse(message, 401);
}

/**
 * Forbidden response
 */
export function forbiddenResponse(message = 'Access forbidden') {
    return errorResponse(message, 403);
}

/**
 * Paginated response formatter
 */
export function paginatedResponse(data, pagination, message = 'Success') {
    return successResponse({
        items: data,
        pagination: {
            page: pagination.page || 1,
            limit: pagination.limit || 10,
            total: pagination.total || 0,
            totalPages: Math.ceil((pagination.total || 0) / (pagination.limit || 10)),
            hasNext: ((pagination.page || 1) * (pagination.limit || 10)) < (pagination.total || 0),
            hasPrevious: (pagination.page || 1) > 1
        }
    }, message);
}

/**
 * Rate limit exceeded response
 */
export function rateLimitResponse(message = 'Rate limit exceeded') {
    return errorResponse(message, 429);
}

/**
 * Service unavailable response
 */
export function serviceUnavailableResponse(message = 'Service temporarily unavailable') {
    return errorResponse(message, 503);
}
