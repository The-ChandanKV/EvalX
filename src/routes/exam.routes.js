const express = require('express');
const router = express.Router();
const {
    createExam,
    getExams,
    getExam,
    updateExam,
    deleteExam,
    publishExam,
} = require('../controllers/exam.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { examValidation } = require('../middleware/validators');

// All routes require authentication
router.use(protect);

router
    .route('/')
    .post(authorize('faculty', 'admin'), examValidation, createExam)
    .get(getExams);

router
    .route('/:id')
    .get(getExam)
    .put(authorize('faculty', 'admin'), updateExam)
    .delete(authorize('faculty', 'admin'), deleteExam);

router.patch('/:id/publish', authorize('faculty', 'admin'), publishExam);

module.exports = router;
