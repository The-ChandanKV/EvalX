const Attempt = require('../models/Attempt');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Response = require('../models/Response');
const { ApiError, asyncHandler, successResponse } = require('../utils/helpers');

/**
 * @desc    Start an exam attempt
 * @route   POST /api/attempts/:examId/start
 * @access  Private/Student
 *
 * Core Logic:
 *  1. Validate exam exists and is published
 *  2. Validate exam schedule (within start/end time window)
 *  3. Server-side timer: calculates deadline based on server clock
 *  4. Prevent multiple attempts beyond maxAttempts
 *  5. Prevent concurrent in-progress attempts
 */
const startExam = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.examId);

    if (!exam) {
        throw new ApiError(404, 'Exam not found');
    }

    // 1. Check exam is published
    if (exam.status !== 'published') {
        throw new ApiError(400, 'This exam is not available for taking');
    }

    // 2. Validate exam schedule — server-side time check
    const now = new Date();

    if (now < exam.startTime) {
        const startsIn = Math.ceil((exam.startTime - now) / (1000 * 60));
        throw new ApiError(
            400,
            `Exam has not started yet. It starts in ${startsIn} minute(s) at ${exam.startTime.toISOString()}`
        );
    }

    if (now > exam.endTime) {
        throw new ApiError(400, 'Exam window has closed. You cannot take this exam anymore.');
    }

    // 3. Check for allowed students (if list is specified)
    if (
        exam.allowedStudents &&
        exam.allowedStudents.length > 0 &&
        !exam.allowedStudents.some(
            (id) => id.toString() === req.user._id.toString()
        )
    ) {
        throw new ApiError(403, 'You are not authorized to take this exam');
    }

    // 4. Prevent multiple attempts beyond maxAttempts
    const previousAttempts = await Attempt.countDocuments({
        exam: exam._id,
        student: req.user._id,
        status: { $in: ['submitted', 'auto_submitted', 'evaluated'] },
    });

    if (previousAttempts >= exam.maxAttempts) {
        throw new ApiError(
            400,
            `You have exhausted all ${exam.maxAttempts} attempt(s) for this exam`
        );
    }

    // 5. Check for in-progress attempt (prevent concurrent attempts)
    const inProgressAttempt = await Attempt.findOne({
        exam: exam._id,
        student: req.user._id,
        status: 'in_progress',
    });

    if (inProgressAttempt) {
        // Check if the in-progress attempt has timed out
        if (new Date() > inProgressAttempt.serverEndTime) {
            // Auto-submit the timed-out attempt
            inProgressAttempt.status = 'auto_submitted';
            inProgressAttempt.submittedAt = inProgressAttempt.serverEndTime;
            await inProgressAttempt.save();

            // Evaluate the auto-submitted attempt
            await evaluateAttempt(inProgressAttempt._id);
        } else {
            // Return existing in-progress attempt
            const questions = await getExamQuestions(exam._id, exam.shuffleQuestions);
            const remainingTime = Math.max(
                0,
                Math.floor((inProgressAttempt.serverEndTime - new Date()) / 1000)
            );

            return successResponse(
                res,
                200,
                'Resuming existing attempt',
                {
                    attempt: inProgressAttempt,
                    questions,
                    remainingTimeSeconds: remainingTime,
                }
            );
        }
    }

    // 6. Server-side timer: Calculate the exact end time on the server
    const serverStartTime = new Date();
    // End time is the earlier of: exam duration OR exam window end
    const durationEndTime = new Date(
        serverStartTime.getTime() + exam.duration * 60 * 1000
    );
    const serverEndTime = durationEndTime < exam.endTime ? durationEndTime : exam.endTime;

    // 7. Create the attempt
    const attempt = await Attempt.create({
        exam: exam._id,
        student: req.user._id,
        attemptNumber: previousAttempts + 1,
        startedAt: serverStartTime,
        serverStartTime,
        serverEndTime,
        totalMarks: exam.totalMarks,
        status: 'in_progress',
    });

    // 8. Get questions (optionally shuffled) — hide correct answers from students
    const questions = await getExamQuestions(exam._id, exam.shuffleQuestions);

    const remainingTimeSeconds = Math.floor(
        (serverEndTime - serverStartTime) / 1000
    );

    successResponse(res, 201, 'Exam started successfully', {
        attempt,
        questions,
        remainingTimeSeconds,
        examTitle: exam.title,
        totalMarks: exam.totalMarks,
    });
});

/**
 * Get exam questions for students (without correct answer info)
 */
const getExamQuestions = async (examId, shuffle = false) => {
    let questions = await Question.find({ exam: examId })
        .select('-__v')
        .sort({ order: 1 })
        .lean();

    // Remove isCorrect from options (don't show answers to students)
    questions = questions.map((q) => ({
        _id: q._id,
        questionText: q.questionText,
        questionType: q.questionType,
        marks: q.marks,
        difficulty: q.difficulty,
        options: q.options.map((opt) => ({
            _id: opt._id,
            text: opt.text,
        })),
    }));

    // Shuffle questions if enabled
    if (shuffle) {
        for (let i = questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [questions[i], questions[j]] = [questions[j], questions[i]];
        }
    }

    return questions;
};

/**
 * @desc    Submit answer for a question during exam
 * @route   POST /api/attempts/:attemptId/answer
 * @access  Private/Student
 */
const submitAnswer = asyncHandler(async (req, res) => {
    const { questionId, selectedOptions } = req.body;

    const attempt = await Attempt.findById(req.params.attemptId);

    if (!attempt) {
        throw new ApiError(404, 'Attempt not found');
    }

    // Verify this attempt belongs to the student
    if (attempt.student.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'This is not your attempt');
    }

    // Check attempt is still in progress
    if (attempt.status !== 'in_progress') {
        throw new ApiError(400, 'This attempt has already been submitted');
    }

    // Server-side timer validation: Check if time has expired
    if (new Date() > attempt.serverEndTime) {
        // Auto-submit the attempt
        attempt.status = 'auto_submitted';
        attempt.submittedAt = attempt.serverEndTime;
        await attempt.save();

        await evaluateAttempt(attempt._id);

        throw new ApiError(
            400,
            'Time has expired. Your exam has been auto-submitted.'
        );
    }

    // Verify question belongs to this exam
    const question = await Question.findOne({
        _id: questionId,
        exam: attempt.exam,
    });

    if (!question) {
        throw new ApiError(404, 'Question not found in this exam');
    }

    // Upsert response (update if already answered, create if new)
    const response = await Response.findOneAndUpdate(
        {
            attempt: attempt._id,
            question: questionId,
        },
        {
            attempt: attempt._id,
            question: questionId,
            student: req.user._id,
            selectedOptions,
            answeredAt: new Date(),
        },
        {
            upsert: true,
            new: true,
            runValidators: true,
        }
    );

    successResponse(res, 200, 'Answer saved successfully', {
        response: {
            questionId: response.question,
            selectedOptions: response.selectedOptions,
            answeredAt: response.answeredAt,
        },
    });
});

/**
 * @desc    Submit exam and trigger auto-evaluation
 * @route   POST /api/attempts/:attemptId/submit
 * @access  Private/Student
 */
const submitExam = asyncHandler(async (req, res) => {
    const attempt = await Attempt.findById(req.params.attemptId);

    if (!attempt) {
        throw new ApiError(404, 'Attempt not found');
    }

    // Verify this belongs to the student
    if (attempt.student.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'This is not your attempt');
    }

    // Check attempt is in progress
    if (attempt.status !== 'in_progress') {
        throw new ApiError(400, 'This attempt has already been submitted');
    }

    // Mark as submitted
    attempt.status = 'submitted';
    attempt.submittedAt = new Date();

    // Calculate time taken
    attempt.timeTaken = Math.floor(
        (attempt.submittedAt - attempt.serverStartTime) / 1000
    );

    await attempt.save();

    // Run auto-evaluation
    const result = await evaluateAttempt(attempt._id);

    successResponse(res, 200, 'Exam submitted and evaluated successfully', {
        result,
    });
});

/**
 * AUTO EVALUATION ENGINE
 *
 * This function:
 * 1. Gets all questions for the exam
 * 2. Gets all responses for this attempt
 * 3. Compares each response with correct answers
 * 4. Applies negative marking if enabled
 * 5. Calculates total, percentage, and pass/fail
 * 6. Stores results in the attempt document
 */
const evaluateAttempt = async (attemptId) => {
    const attempt = await Attempt.findById(attemptId).populate('exam');

    if (!attempt) {
        throw new ApiError(404, 'Attempt not found');
    }

    const exam = attempt.exam;

    // Get all questions for this exam
    const questions = await Question.find({ exam: exam._id }).lean();

    // Get all responses for this attempt
    const responses = await Response.find({ attempt: attemptId }).lean();

    // Build a map of question ID -> response for quick lookup
    const responseMap = new Map();
    responses.forEach((r) => {
        responseMap.set(r.question.toString(), r);
    });

    let correctAnswers = 0;
    let wrongAnswers = 0;
    let unanswered = 0;
    let obtainedMarks = 0;
    let negativeMarks = 0;

    // Evaluate each question
    for (const question of questions) {
        const response = responseMap.get(question._id.toString());

        if (!response || response.selectedOptions.length === 0) {
            // Unanswered question
            unanswered++;

            // Update response if exists
            if (response) {
                await Response.findByIdAndUpdate(response._id, {
                    isCorrect: false,
                    marksAwarded: 0,
                });
            }
            continue;
        }

        // Check if the answer is correct
        const correctOptionIds = question.options
            .filter((opt) => opt.isCorrect)
            .map((opt) => opt._id.toString());

        const selectedOptionIds = response.selectedOptions.map((id) =>
            id.toString()
        );

        let isCorrect = false;

        if (question.questionType === 'multi_select') {
            // For multi-select: ALL correct options must be selected and NO wrong ones
            isCorrect =
                correctOptionIds.length === selectedOptionIds.length &&
                correctOptionIds.every((id) => selectedOptionIds.includes(id));
        } else {
            // For MCQ and True/False: exactly one correct option must match
            isCorrect =
                selectedOptionIds.length === 1 &&
                correctOptionIds.includes(selectedOptionIds[0]);
        }

        let marksAwarded = 0;

        if (isCorrect) {
            correctAnswers++;
            marksAwarded = question.marks;
            obtainedMarks += marksAwarded;
        } else {
            wrongAnswers++;

            // Apply negative marking if enabled
            if (exam.negativeMarking && exam.negativeMarking.enabled) {
                const penalty = question.marks * exam.negativeMarking.fraction;
                negativeMarks += penalty;
                marksAwarded = -penalty;
                obtainedMarks -= penalty;
            }
        }

        // Update individual response with evaluation result
        await Response.findByIdAndUpdate(response._id, {
            isCorrect,
            marksAwarded,
        });
    }

    // Ensure obtained marks don't go below 0
    obtainedMarks = Math.max(0, obtainedMarks);

    // Calculate percentage
    const percentage =
        exam.totalMarks > 0
            ? parseFloat(((obtainedMarks / exam.totalMarks) * 100).toFixed(2))
            : 0;

    // Determine pass/fail
    const passed = obtainedMarks >= exam.passingMarks;

    // Update attempt with results
    const result = {
        totalMarks: exam.totalMarks,
        obtainedMarks: parseFloat(obtainedMarks.toFixed(2)),
        correctAnswers,
        wrongAnswers,
        unanswered,
        negativeMarks: parseFloat(negativeMarks.toFixed(2)),
        percentage,
        passed,
        status: 'evaluated',
        timeTaken: attempt.timeTaken || Math.floor(
            ((attempt.submittedAt || new Date()) - attempt.serverStartTime) / 1000
        ),
    };

    await Attempt.findByIdAndUpdate(attemptId, result);

    return {
        ...result,
        examTitle: exam.title,
        totalQuestions: questions.length,
        attemptNumber: attempt.attemptNumber,
    };
};

/**
 * @desc    Get result for a specific attempt
 * @route   GET /api/attempts/:attemptId/result
 * @access  Private/Student(own)/Faculty/Admin
 */
const getResult = asyncHandler(async (req, res) => {
    const attempt = await Attempt.findById(req.params.attemptId)
        .populate('exam', 'title subject totalMarks passingMarks showResults negativeMarking')
        .populate('student', 'name email enrollmentNo');

    if (!attempt) {
        throw new ApiError(404, 'Attempt not found');
    }

    // Students can only see their own results
    if (
        req.user.role === 'student' &&
        attempt.student._id.toString() !== req.user._id.toString()
    ) {
        throw new ApiError(403, 'You can only view your own results');
    }

    // Check if exam allows showing results
    if (req.user.role === 'student' && !attempt.exam.showResults) {
        throw new ApiError(
            403,
            'Results are not available for this exam yet. Contact your faculty.'
        );
    }

    // Check if attempt has been evaluated
    if (attempt.status === 'in_progress') {
        throw new ApiError(400, 'This attempt has not been submitted yet');
    }

    // Get detailed responses if requested
    let detailedResponses = [];
    if (req.query.detailed === 'true' && req.user.role !== 'student') {
        detailedResponses = await Response.find({
            attempt: attempt._id,
        })
            .populate('question', 'questionText options marks questionType')
            .lean();
    }

    successResponse(res, 200, 'Result fetched successfully', {
        result: attempt,
        detailedResponses:
            detailedResponses.length > 0 ? detailedResponses : undefined,
    });
});

/**
 * @desc    Get all results for an exam (faculty/admin)
 * @route   GET /api/attempts/exam/:examId/results
 * @access  Private/Faculty/Admin
 */
const getExamResults = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.examId);

    if (!exam) {
        throw new ApiError(404, 'Exam not found');
    }

    // Faculty can only see results for their own exams
    if (
        req.user.role === 'faculty' &&
        exam.createdBy.toString() !== req.user._id.toString()
    ) {
        throw new ApiError(403, 'You can only view results for your own exams');
    }

    const attempts = await Attempt.find({
        exam: exam._id,
        status: 'evaluated',
    })
        .populate('student', 'name email enrollmentNo department')
        .sort({ obtainedMarks: -1 }); // Sorted by marks (rank order)

    // Calculate statistics
    const totalStudents = attempts.length;
    const passedStudents = attempts.filter((a) => a.passed).length;
    const avgMarks =
        totalStudents > 0
            ? parseFloat(
                (
                    attempts.reduce((sum, a) => sum + a.obtainedMarks, 0) /
                    totalStudents
                ).toFixed(2)
            )
            : 0;
    const highestMarks =
        totalStudents > 0
            ? Math.max(...attempts.map((a) => a.obtainedMarks))
            : 0;
    const lowestMarks =
        totalStudents > 0
            ? Math.min(...attempts.map((a) => a.obtainedMarks))
            : 0;

    successResponse(res, 200, 'Exam results fetched successfully', {
        exam: {
            title: exam.title,
            subject: exam.subject,
            totalMarks: exam.totalMarks,
            passingMarks: exam.passingMarks,
        },
        statistics: {
            totalStudents,
            passedStudents,
            failedStudents: totalStudents - passedStudents,
            passPercentage:
                totalStudents > 0
                    ? parseFloat(((passedStudents / totalStudents) * 100).toFixed(2))
                    : 0,
            averageMarks: avgMarks,
            highestMarks,
            lowestMarks,
        },
        results: attempts,
    });
});

/**
 * @desc    Get student's own attempts
 * @route   GET /api/attempts/my-attempts
 * @access  Private/Student
 */
const getMyAttempts = asyncHandler(async (req, res) => {
    const { examId, page = 1, limit = 20 } = req.query;

    const query = { student: req.user._id };
    if (examId) query.exam = examId;

    const attempts = await Attempt.find(query)
        .populate('exam', 'title subject totalMarks passingMarks')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    const total = await Attempt.countDocuments(query);

    successResponse(res, 200, 'Your attempts fetched successfully', {
        attempts,
        pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
        },
    });
});

module.exports = {
    startExam,
    submitAnswer,
    submitExam,
    getResult,
    getExamResults,
    getMyAttempts,
};
