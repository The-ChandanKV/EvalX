const Exam = require('../models/Exam');
const Question = require('../models/Question');
const { ApiError, asyncHandler, successResponse } = require('../utils/helpers');

/**
 * @desc    Create a new exam
 * @route   POST /api/exams
 * @access  Private/Faculty/Admin
 */
const createExam = asyncHandler(async (req, res) => {
    req.body.createdBy = req.user._id;

    const exam = await Exam.create(req.body);

    successResponse(res, 201, 'Exam created successfully', { exam });
});

/**
 * @desc    Get all exams
 * @route   GET /api/exams
 * @access  Private
 */
const getExams = asyncHandler(async (req, res) => {
    const { status, subject, page = 1, limit = 20 } = req.query;

    let query = {};

    // Students can only see published/active exams
    if (req.user.role === 'student') {
        query.status = { $in: ['published', 'active', 'completed'] };
    }

    // Faculty can only see their own exams
    if (req.user.role === 'faculty') {
        query.createdBy = req.user._id;
    }

    if (status) query.status = status;
    if (subject) query.subject = { $regex: subject, $options: 'i' };

    const exams = await Exam.find(query)
        .populate('createdBy', 'name email')
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

    const total = await Exam.countDocuments(query);

    successResponse(res, 200, 'Exams fetched successfully', {
        exams,
        pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
        },
    });
});

/**
 * @desc    Get single exam by ID
 * @route   GET /api/exams/:id
 * @access  Private
 */
const getExam = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id).populate(
        'createdBy',
        'name email'
    );

    if (!exam) {
        throw new ApiError(404, 'Exam not found');
    }

    // Students can only view published exams
    if (
        req.user.role === 'student' &&
        !['published', 'active', 'completed'].includes(exam.status)
    ) {
        throw new ApiError(403, 'You cannot view this exam');
    }

    // Faculty can only view their own exams
    if (
        req.user.role === 'faculty' &&
        exam.createdBy._id.toString() !== req.user._id.toString()
    ) {
        throw new ApiError(403, 'You can only view exams you created');
    }

    // Get question count
    const questionCount = await Question.countDocuments({ exam: exam._id });

    successResponse(res, 200, 'Exam fetched successfully', {
        exam,
        questionCount,
    });
});

/**
 * @desc    Update an exam
 * @route   PUT /api/exams/:id
 * @access  Private/Faculty(owner)/Admin
 */
const updateExam = asyncHandler(async (req, res) => {
    let exam = await Exam.findById(req.params.id);

    if (!exam) {
        throw new ApiError(404, 'Exam not found');
    }

    // Only owner or admin can update
    if (
        req.user.role !== 'admin' &&
        exam.createdBy.toString() !== req.user._id.toString()
    ) {
        throw new ApiError(403, 'You can only update exams you created');
    }

    // Cannot update active or completed exams
    if (['active', 'completed'].includes(exam.status)) {
        throw new ApiError(400, 'Cannot update an active or completed exam');
    }

    exam = await Exam.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    successResponse(res, 200, 'Exam updated successfully', { exam });
});

/**
 * @desc    Delete an exam
 * @route   DELETE /api/exams/:id
 * @access  Private/Faculty(owner)/Admin
 */
const deleteExam = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
        throw new ApiError(404, 'Exam not found');
    }

    // Only owner or admin can delete
    if (
        req.user.role !== 'admin' &&
        exam.createdBy.toString() !== req.user._id.toString()
    ) {
        throw new ApiError(403, 'You can only delete exams you created');
    }

    // Cannot delete active exams
    if (exam.status === 'active') {
        throw new ApiError(400, 'Cannot delete an active exam');
    }

    // Delete associated questions
    await Question.deleteMany({ exam: exam._id });

    // Delete exam
    await Exam.findByIdAndDelete(req.params.id);

    successResponse(res, 200, 'Exam and associated questions deleted');
});

/**
 * @desc    Publish an exam (make it available for students)
 * @route   PATCH /api/exams/:id/publish
 * @access  Private/Faculty(owner)/Admin
 */
const publishExam = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
        throw new ApiError(404, 'Exam not found');
    }

    // Only owner or admin can publish
    if (
        req.user.role !== 'admin' &&
        exam.createdBy.toString() !== req.user._id.toString()
    ) {
        throw new ApiError(403, 'You can only publish exams you created');
    }

    // Check if exam has questions
    const questionCount = await Question.countDocuments({ exam: exam._id });
    if (questionCount === 0) {
        throw new ApiError(
            400,
            'Cannot publish an exam without questions. Add at least one question.'
        );
    }

    // Validate total marks match
    const totalQuestionMarks = await Question.aggregate([
        { $match: { exam: exam._id } },
        { $group: { _id: null, total: { $sum: '$marks' } } },
    ]);

    if (
        totalQuestionMarks.length > 0 &&
        totalQuestionMarks[0].total !== exam.totalMarks
    ) {
        throw new ApiError(
            400,
            `Total marks of questions (${totalQuestionMarks[0].total}) don't match exam total marks (${exam.totalMarks}). Please adjust.`
        );
    }

    exam.status = 'published';
    await exam.save();

    successResponse(res, 200, 'Exam published successfully', { exam });
});

module.exports = {
    createExam,
    getExams,
    getExam,
    updateExam,
    deleteExam,
    publishExam,
};
