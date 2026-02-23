const express = require('express');
const router = express.Router();
const {
    startExam,
    submitAnswer,
    submitExam,
    getResult,
    getExamResults,
    getMyAttempts,
} = require('../controllers/attempt.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { answerValidation } = require('../middleware/validators');

// All routes require authentication
router.use(protect);

// Student routes
router.post('/:examId/start', authorize('student'), startExam);
router.post('/:attemptId/answer', authorize('student'), answerValidation, submitAnswer);
router.post('/:attemptId/submit', authorize('student'), submitExam);

// Student: view own attempts
router.get('/my-attempts', authorize('student'), getMyAttempts);

// Result routes (role-based access handled in controller)
router.get('/:attemptId/result', getResult);

// Faculty/Admin: view all results for an exam
router.get(
    '/exam/:examId/results',
    authorize('faculty', 'admin'),
    getExamResults
);

module.exports = router;
