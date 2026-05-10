const express = require('express');
const router = express.Router();
const {
    addQuestion, getQuestions, updateQuestion, deleteQuestion, bulkAddQuestions,
    getBankQuestions, addBankQuestion, importFromBank,
    getPendingGrading, gradeResponse,
} = require('../controllers/question.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { questionValidation } = require('../middleware/validators');

router.use(protect);

// ── Question Bank (no examId required) ──────────────────
router.route('/bank')
    .get(authorize('faculty', 'admin'), getBankQuestions)
    .post(authorize('faculty', 'admin'), questionValidation, addBankQuestion);

router.post('/bank/import/:examId', authorize('faculty', 'admin'), importFromBank);

// ── Manual Grading ───────────────────────────────────────
router.get('/grade/:examId', authorize('faculty', 'admin'), getPendingGrading);
router.post('/grade/:responseId', authorize('faculty', 'admin'), gradeResponse);

// ── Exam Questions ───────────────────────────────────────
router.route('/:examId')
    .post(authorize('faculty', 'admin'), questionValidation, addQuestion)
    .get(authorize('faculty', 'admin'), getQuestions);

router.post('/:examId/bulk', authorize('faculty', 'admin'), bulkAddQuestions);

// ── Question CRUD ────────────────────────────────────────
router.route('/edit/:questionId')
    .put(authorize('faculty', 'admin'), updateQuestion)
    .delete(authorize('faculty', 'admin'), deleteQuestion);

module.exports = router;
