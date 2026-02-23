/**
 * Custom API Error class for consistent error handling
 */
class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.success = false;
    }
}

/**
 * Wrap async route handlers to catch errors automatically
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Standard success response
 */
const successResponse = (res, statusCode, message, data = {}) => {
    return res.status(statusCode).json({
        success: true,
        message,
        ...data,
    });
};

module.exports = { ApiError, asyncHandler, successResponse };
