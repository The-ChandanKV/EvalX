const { body, param } = require('express-validator');
const { validationResult } = require('express-validator');

/**
 * Middleware to check validation results
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map((e) => ({
                field: e.path,
                message: e.msg,
            })),
        });
    }
    next();
};

/**
 * Registration validation rules
 */
const registerValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    body('role')
        .optional()
        .isIn(['admin', 'faculty', 'student'])
        .withMessage('Role must be admin, faculty, or student'),
    body('department').optional().trim(),
    body('enrollmentNo').optional().trim(),
    validate,
];

/**
 * Login validation rules
 */
const loginValidation = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
];

/**
 * Exam creation validation rules
 */
const examValidation = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Exam title is required')
        .isLength({ max: 200 })
        .withMessage('Title cannot exceed 200 characters'),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('duration')
        .isInt({ min: 1, max: 480 })
        .withMessage('Duration must be between 1 and 480 minutes'),
    body('totalMarks')
        .isInt({ min: 1 })
        .withMessage('Total marks must be at least 1'),
    body('passingMarks')
        .isInt({ min: 0 })
        .withMessage('Passing marks cannot be negative'),
    body('startTime')
        .notEmpty()
        .withMessage('Start time is required')
        .isISO8601()
        .withMessage('Start time must be a valid date'),
    body('endTime')
        .notEmpty()
        .withMessage('End time is required')
        .isISO8601()
        .withMessage('End time must be a valid date'),
    body('maxAttempts')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Max attempts must be at least 1'),
    body('negativeMarking.enabled').optional().isBoolean(),
    body('negativeMarking.fraction')
        .optional()
        .isFloat({ min: 0, max: 1 })
        .withMessage('Negative marking fraction must be between 0 and 1'),
    validate,
];

/**
 * Question creation validation rules
 */
const questionValidation = [
    body('questionText')
        .trim()
        .notEmpty()
        .withMessage('Question text is required'),
    body('questionType')
        .optional()
        .isIn(['mcq', 'true_false', 'multi_select'])
        .withMessage('Question type must be mcq, true_false, or multi_select'),
    body('options')
        .isArray({ min: 2 })
        .withMessage('At least 2 options are required'),
    body('options.*.text')
        .trim()
        .notEmpty()
        .withMessage('Option text is required'),
    body('options.*.isCorrect')
        .isBoolean()
        .withMessage('isCorrect must be a boolean'),
    body('marks')
        .isInt({ min: 0 })
        .withMessage('Marks must be a non-negative integer'),
    body('difficulty')
        .optional()
        .isIn(['easy', 'medium', 'hard'])
        .withMessage('Difficulty must be easy, medium, or hard'),
    validate,
];

/**
 * Answer submission validation
 */
const answerValidation = [
    body('questionId')
        .notEmpty()
        .withMessage('Question ID is required')
        .isMongoId()
        .withMessage('Invalid question ID'),
    body('selectedOptions')
        .isArray()
        .withMessage('Selected options must be an array'),
    validate,
];

/**
 * MongoDB ObjectId param validation
 */
const mongoIdParam = (paramName) => [
    param(paramName).isMongoId().withMessage(`Invalid ${paramName}`),
    validate,
];

module.exports = {
    validate,
    registerValidation,
    loginValidation,
    examValidation,
    questionValidation,
    answerValidation,
    mongoIdParam,
};
