const express = require('express');
const router = express.Router();
const {
    addQuestion,
    getQuestions,
    updateQuestion,
    deleteQuestion,
    bulkAddQuestions,
} = require('../controllers/question.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { questionValidation } = require('../middleware/validators');

// All routes require authentication and faculty/admin role
router.use(protect);
router.use(authorize('faculty', 'admin'));

// Routes by exam
router
    .route('/:examId')
    .post(questionValidation, addQuestion)
    .get(getQuestions);

// Bulk add questions
router.post('/:examId/bulk', bulkAddQuestions);

// Routes by question ID
router
    .route('/edit/:questionId')
    .put(updateQuestion)
    .delete(deleteQuestion);

module.exports = router;
