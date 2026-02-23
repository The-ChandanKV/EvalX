const Question = require('../models/Question');
const Exam = require('../models/Exam');
const { ApiError, asyncHandler, successResponse } = require('../utils/helpers');

/**
 * @desc    Add a question to an exam
 * @route   POST /api/questions/:examId
 * @access  Private/Faculty(owner)/Admin
 */
const addQuestion = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.examId);

    if (!exam) {
        throw new ApiError(404, 'Exam not found');
    }

    // Only owner or admin can add questions
    if (
        req.user.role !== 'admin' &&
        exam.createdBy.toString() !== req.user._id.toString()
    ) {
        throw new ApiError(403, 'You can only add questions to your own exams');
    }

    // Cannot add questions to active/completed exams
    if (['active', 'completed'].includes(exam.status)) {
        throw new ApiError(
            400,
            'Cannot add questions to an active or completed exam'
        );
    }

    req.body.exam = exam._id;

    // Set order to next available
    const lastQuestion = await Question.findOne({ exam: exam._id }).sort({
        order: -1,
    });
    req.body.order = lastQuestion ? lastQuestion.order + 1 : 1;

    const question = await Question.create(req.body);

    successResponse(res, 201, 'Question added successfully', { question });
});

/**
 * @desc    Get all questions for an exam
 * @route   GET /api/questions/:examId
 * @access  Private/Faculty(owner)/Admin
 */
const getQuestions = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.examId);

    if (!exam) {
        throw new ApiError(404, 'Exam not found');
    }

    // Only owner or admin can view all questions with answers
    if (
        req.user.role !== 'admin' &&
        exam.createdBy.toString() !== req.user._id.toString()
    ) {
        throw new ApiError(
            403,
            'You can only view questions for your own exams'
        );
    }

    const questions = await Question.find({ exam: exam._id }).sort({
        order: 1,
    });

    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

    successResponse(res, 200, 'Questions fetched successfully', {
        questions,
        count: questions.length,
        totalMarks,
    });
});

/**
 * @desc    Update a question
 * @route   PUT /api/questions/:questionId
 * @access  Private/Faculty/Admin
 */
const updateQuestion = asyncHandler(async (req, res) => {
    let question = await Question.findById(req.params.questionId).populate({
        path: 'exam',
        select: 'createdBy status',
    });

    if (!question) {
        throw new ApiError(404, 'Question not found');
    }

    // Only owner or admin can update
    if (
        req.user.role !== 'admin' &&
        question.exam.createdBy.toString() !== req.user._id.toString()
    ) {
        throw new ApiError(403, 'You can only update questions in your own exams');
    }

    // Cannot update questions in active exams
    if (['active', 'completed'].includes(question.exam.status)) {
        throw new ApiError(
            400,
            'Cannot update questions in an active or completed exam'
        );
    }

    question = await Question.findByIdAndUpdate(
        req.params.questionId,
        req.body,
        {
            new: true,
            runValidators: true,
        }
    );

    successResponse(res, 200, 'Question updated successfully', { question });
});

/**
 * @desc    Delete a question
 * @route   DELETE /api/questions/:questionId
 * @access  Private/Faculty/Admin
 */
const deleteQuestion = asyncHandler(async (req, res) => {
    const question = await Question.findById(req.params.questionId).populate({
        path: 'exam',
        select: 'createdBy status',
    });

    if (!question) {
        throw new ApiError(404, 'Question not found');
    }

    // Only owner or admin can delete
    if (
        req.user.role !== 'admin' &&
        question.exam.createdBy.toString() !== req.user._id.toString()
    ) {
        throw new ApiError(403, 'You can only delete questions in your own exams');
    }

    if (['active', 'completed'].includes(question.exam.status)) {
        throw new ApiError(
            400,
            'Cannot delete questions from an active or completed exam'
        );
    }

    await Question.findByIdAndDelete(req.params.questionId);

    successResponse(res, 200, 'Question deleted successfully');
});

/**
 * @desc    Bulk add questions to an exam
 * @route   POST /api/questions/:examId/bulk
 * @access  Private/Faculty(owner)/Admin
 */
const bulkAddQuestions = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.examId);

    if (!exam) {
        throw new ApiError(404, 'Exam not found');
    }

    if (
        req.user.role !== 'admin' &&
        exam.createdBy.toString() !== req.user._id.toString()
    ) {
        throw new ApiError(403, 'You can only add questions to your own exams');
    }

    if (['active', 'completed'].includes(exam.status)) {
        throw new ApiError(
            400,
            'Cannot add questions to an active or completed exam'
        );
    }

    const { questions } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
        throw new ApiError(400, 'Please provide an array of questions');
    }

    // Get current max order
    const lastQuestion = await Question.findOne({ exam: exam._id }).sort({
        order: -1,
    });
    let currentOrder = lastQuestion ? lastQuestion.order + 1 : 1;

    // Add exam reference and order to each question
    const questionsToInsert = questions.map((q) => ({
        ...q,
        exam: exam._id,
        order: currentOrder++,
    }));

    const insertedQuestions = await Question.insertMany(questionsToInsert, {
        runValidators: true,
    });

    successResponse(res, 201, `${insertedQuestions.length} questions added`, {
        questions: insertedQuestions,
        count: insertedQuestions.length,
    });
});

module.exports = {
    addQuestion,
    getQuestions,
    updateQuestion,
    deleteQuestion,
    bulkAddQuestions,
};
