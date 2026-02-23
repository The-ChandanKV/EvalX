const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ApiError } = require('../utils/helpers');

/**
 * Protect routes - Verify JWT token
 */
const protect = async (req, res, next) => {
    try {
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(new ApiError(401, 'Not authorized. No token provided.'));
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from token
        const user = await User.findById(decoded.id);

        if (!user) {
            return next(
                new ApiError(401, 'Not authorized. User no longer exists.')
            );
        }

        if (!user.isActive) {
            return next(
                new ApiError(401, 'Your account has been deactivated. Contact admin.')
            );
        }

        req.user = user;
        next();
    } catch (error) {
        return next(new ApiError(401, 'Not authorized. Invalid token.'));
    }
};

/**
 * Role-based authorization middleware
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new ApiError(
                    403,
                    `Role '${req.user.role}' is not authorized to access this resource`
                )
            );
        }
        next();
    };
};

module.exports = { protect, authorize };
