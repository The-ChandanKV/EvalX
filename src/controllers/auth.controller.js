const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ApiError, asyncHandler, successResponse } = require('../utils/helpers');

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
    const { name, email, password, role, department, enrollmentNo } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ApiError(400, 'User with this email already exists');
    }

    // Create user
    const user = await User.create({
        name,
        email,
        password,
        role: role || 'student',
        department,
        enrollmentNo,
    });

    // Generate token
    const token = generateToken(user._id);

    successResponse(res, 201, 'User registered successfully', {
        user,
        token,
    });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        throw new ApiError(401, 'Invalid email or password');
    }

    if (!user.isActive) {
        throw new ApiError(
            401,
            'Your account has been deactivated. Contact admin.'
        );
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new ApiError(401, 'Invalid email or password');
    }

    // Generate token
    const token = generateToken(user._id);

    successResponse(res, 200, 'Login successful', {
        user,
        token,
    });
});

/**
 * @desc    Get current logged-in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    successResponse(res, 200, 'User profile fetched', {
        user,
    });
});

/**
 * @desc    Get all users (admin only)
 * @route   GET /api/auth/users
 * @access  Private/Admin
 */
const getAllUsers = asyncHandler(async (req, res) => {
    const { role, page = 1, limit = 20 } = req.query;

    const query = {};
    if (role) query.role = role;

    const users = await User.find(query)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    successResponse(res, 200, 'Users fetched successfully', {
        users,
        pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
        },
    });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
    const { name, department, enrollmentNo } = req.body;

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { name, department, enrollmentNo },
        { new: true, runValidators: true }
    );

    successResponse(res, 200, 'Profile updated successfully', { user });
});

module.exports = {
    register,
    login,
    getMe,
    getAllUsers,
    updateProfile,
};
