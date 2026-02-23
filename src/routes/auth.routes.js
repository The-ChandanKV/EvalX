const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getMe,
    getAllUsers,
    updateProfile,
} = require('../controllers/auth.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const {
    registerValidation,
    loginValidation,
} = require('../middleware/validators');

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Admin routes
router.get('/users', protect, authorize('admin'), getAllUsers);

module.exports = router;
