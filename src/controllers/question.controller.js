const Question = require('../models/Question');
const Exam = require('../models/Exam');
const Attempt = require('../models/Attempt');
const Response = require('../models/Response');
const { ApiError, asyncHandler, successResponse } = require('../utils/helpers');

/* ── Helpers ─────────────────────────────────────────── */
const assertExamOwner = async (examId, userId, role) => {
    const exam = await Exam.findById(examId);
    if (!exam) throw new ApiError(404, 'Exam not found');
    if (role !== 'admin' && exam.createdBy.toString() !== userId.toString())
        throw new ApiError(403, 'You can only manage questions in your own exams');
    if (['active', 'completed'].includes(exam.status))
        throw new ApiError(400, 'Cannot modify questions in an active or completed exam');
    return exam;
};

/* ── Add Single Question ──────────────────────────────── */
const addQuestion = asyncHandler(async (req, res) => {
    const exam = await assertExamOwner(req.params.examId, req.user._id, req.user.role);
    req.body.exam = exam._id;
    // subject defaults to exam subject if not provided
    if (!req.body.subject) req.body.subject = exam.subject;
    const last = await Question.findOne({ exam: exam._id }).sort({ order: -1 });
    req.body.order = last ? last.order + 1 : 1;
    const question = await Question.create(req.body);
    successResponse(res, 201, 'Question added successfully', { question });
});

/* ── Get All Questions for an Exam ───────────────────── */
const getQuestions = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.examId);
    if (!exam) throw new ApiError(404, 'Exam not found');
    if (req.user.role !== 'admin' && exam.createdBy.toString() !== req.user._id.toString())
        throw new ApiError(403, 'You can only view questions for your own exams');

    const questions = await Question.find({ exam: exam._id }).sort({ order: 1 });
    const totalMarks = questions.reduce((s, q) => s + q.marks, 0);

    successResponse(res, 200, 'Questions fetched', { questions, count: questions.length, totalMarks });
});

/* ── Update Question ──────────────────────────────────── */
const updateQuestion = asyncHandler(async (req, res) => {
    let question = await Question.findById(req.params.questionId).populate('exam', 'createdBy status');
    if (!question) throw new ApiError(404, 'Question not found');
    if (req.user.role !== 'admin' && question.exam?.createdBy?.toString() !== req.user._id.toString())
        throw new ApiError(403, 'You can only update questions in your own exams');
    if (question.exam && ['active', 'completed'].includes(question.exam.status))
        throw new ApiError(400, 'Cannot update questions in an active or completed exam');

    question = await Question.findByIdAndUpdate(req.params.questionId, req.body, { new: true, runValidators: true });
    successResponse(res, 200, 'Question updated', { question });
});

/* ── Delete Question ──────────────────────────────────── */
const deleteQuestion = asyncHandler(async (req, res) => {
    const question = await Question.findById(req.params.questionId).populate('exam', 'createdBy status');
    if (!question) throw new ApiError(404, 'Question not found');
    if (req.user.role !== 'admin' && question.exam?.createdBy?.toString() !== req.user._id.toString())
        throw new ApiError(403, 'You can only delete questions in your own exams');
    if (question.exam && ['active', 'completed'].includes(question.exam.status))
        throw new ApiError(400, 'Cannot delete questions from an active or completed exam');

    await Question.findByIdAndDelete(req.params.questionId);
    successResponse(res, 200, 'Question deleted');
});

/* ── Bulk Add (programmatic — used by CSV upload) ────── */
const bulkAddQuestions = asyncHandler(async (req, res) => {
    const exam = await assertExamOwner(req.params.examId, req.user._id, req.user.role);
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0)
        throw new ApiError(400, 'Provide an array of questions');

    const last = await Question.findOne({ exam: exam._id }).sort({ order: -1 });
    let order = last ? last.order + 1 : 1;

    // Validate each question individually so pre-validate hooks fire correctly
    const validationErrors = [];
    const validDocs = [];

    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const doc = new Question({
            ...q,
            exam: exam._id,
            subject: q.subject || exam.subject,
            order: order++,
        });
        try {
            await doc.validate();
            validDocs.push(doc.toObject());
        } catch (err) {
            validationErrors.push({
                row: i + 1,
                question: (q.questionText || '').slice(0, 60),
                error: Object.values(err.errors).map(e => e.message).join(', '),
            });
        }
    }

    if (validDocs.length === 0) {
        return res.status(400).json({
            success: false,
            message: `All ${questions.length} questions failed validation`,
            errors: validationErrors,
        });
    }

    // Safe to insert without runValidators since we already ran them above
    const inserted = await Question.insertMany(validDocs);
    const msg = validationErrors.length
        ? `${inserted.length} added, ${validationErrors.length} skipped due to errors`
        : `${inserted.length} questions added`;

    successResponse(res, 201, msg, {
        questions: inserted,
        count: inserted.length,
        skipped: validationErrors.length,
        errors: validationErrors,
    });
});

/* ── Question Bank ────────────────────────────────────── */
// GET /api/questions/bank — browse bank with filters
const getBankQuestions = asyncHandler(async (req, res) => {
    const { subject, topic, difficulty, type, search, page = 1, limit = 50 } = req.query;
    const query = { isBank: true };
    if (subject) query.subject = { $regex: subject, $options: 'i' };
    if (topic) query.topic = { $regex: topic, $options: 'i' };
    if (difficulty) query.difficulty = difficulty;
    if (type) query.questionType = type;
    if (search) query.questionText = { $regex: search, $options: 'i' };

    const [questions, total] = await Promise.all([
        Question.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(+limit),
        Question.countDocuments(query),
    ]);
    successResponse(res, 200, 'Bank fetched', { questions, total, page: +page, pages: Math.ceil(total / limit) });
});

// POST /api/questions/bank — add question directly to bank
const addBankQuestion = asyncHandler(async (req, res) => {
    req.body.isBank = true;
    req.body.exam = null;
    const question = await Question.create(req.body);
    successResponse(res, 201, 'Added to question bank', { question });
});

// POST /api/questions/bank/import/:examId — import selected bank questions into an exam
const importFromBank = asyncHandler(async (req, res) => {
    const exam = await assertExamOwner(req.params.examId, req.user._id, req.user.role);
    const { questionIds } = req.body;
    if (!Array.isArray(questionIds) || questionIds.length === 0)
        throw new ApiError(400, 'Provide an array of questionIds');

    const bankQuestions = await Question.find({ _id: { $in: questionIds }, isBank: true }).lean();
    if (!bankQuestions.length) throw new ApiError(404, 'No matching bank questions found');

    const last = await Question.findOne({ exam: exam._id }).sort({ order: -1 });
    let order = last ? last.order + 1 : 1;

    const toInsert = bankQuestions.map(({ _id, __v, isBank, createdAt, updatedAt, ...rest }) => ({
        ...rest,
        exam: exam._id,
        order: order++,
        isBank: false,
    }));

    const created = await Question.insertMany(toInsert);
    successResponse(res, 201, `${created.length} questions imported from bank`, { questions: created });
});

/* ── Manual Grading (Descriptive / Coding) ─────────────── */
// GET /api/questions/grade/:examId — list all submissions needing grading
const getPendingGrading = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.examId);
    if (!exam) throw new ApiError(404, 'Exam not found');
    if (req.user.role !== 'admin' && exam.createdBy.toString() !== req.user._id.toString())
        throw new ApiError(403, 'Access denied');

    // Get questions of type descriptive/coding for this exam
    const questions = await Question.find({
        exam: exam._id,
        questionType: { $in: ['descriptive', 'coding'] },
    }).lean();

    if (!questions.length) {
        return successResponse(res, 200, 'No open-ended questions', { submissions: [], exam });
    }

    const qIds = questions.map(q => q._id);

    // Get all submitted responses for these questions
    const responses = await Response.find({ question: { $in: qIds } })
        .populate('attempt', 'student status submittedAt')
        .populate('question', 'questionText questionType marks modelAnswer testCases codeLanguage')
        .populate({ path: 'attempt', populate: { path: 'student', select: 'name email enrollmentNo' } })
        .lean();

    // Only show from submitted/auto_submitted/evaluated attempts
    const valid = responses.filter(r =>
        r.attempt && ['submitted', 'auto_submitted', 'evaluated'].includes(r.attempt.status)
    );

    successResponse(res, 200, 'Pending grading fetched', { submissions: valid, exam, questions });
});

// POST /api/questions/grade/:responseId — manually grade a response
const gradeResponse = asyncHandler(async (req, res) => {
    const { marksAwarded, feedback } = req.body;
    if (marksAwarded === undefined || marksAwarded === null)
        throw new ApiError(400, 'marksAwarded is required');

    const response = await Response.findById(req.params.responseId)
        .populate('attempt')
        .populate('question', 'marks');

    if (!response) throw new ApiError(404, 'Response not found');
    if (marksAwarded < 0 || marksAwarded > response.question.marks)
        throw new ApiError(400, `Marks must be between 0 and ${response.question.marks}`);

    const prevMarks = response.marksAwarded || 0;
    response.marksAwarded = marksAwarded;
    response.isCorrect = marksAwarded > 0;
    response.feedback = feedback || '';
    response.gradedManually = true;
    await response.save();

    // Update the attempt's obtainedMarks
    const attempt = response.attempt;
    const delta = marksAwarded - prevMarks;
    attempt.obtainedMarks = Math.max(0, (attempt.obtainedMarks || 0) + delta);
    attempt.percentage = attempt.totalMarks > 0
        ? parseFloat(((attempt.obtainedMarks / attempt.totalMarks) * 100).toFixed(2))
        : 0;
    attempt.passed = attempt.obtainedMarks >= (attempt.exam?.passingMarks || 0);
    attempt.status = 'evaluated';
    await attempt.save();

    successResponse(res, 200, 'Response graded', { response, attempt });
});

module.exports = {
    addQuestion, getQuestions, updateQuestion, deleteQuestion, bulkAddQuestions,
    getBankQuestions, addBankQuestion, importFromBank,
    getPendingGrading, gradeResponse,
};
