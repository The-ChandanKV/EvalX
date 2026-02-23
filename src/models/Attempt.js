const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema(
    {
        exam: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Exam',
            required: [true, 'Exam reference is required'],
        },
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Student reference is required'],
        },
        attemptNumber: {
            type: Number,
            default: 1,
            min: 1,
        },
        startedAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
        submittedAt: {
            type: Date,
        },
        serverStartTime: {
            type: Date,
            required: true,
            default: Date.now,
        },
        serverEndTime: {
            type: Date,
        },
        status: {
            type: String,
            enum: ['in_progress', 'submitted', 'auto_submitted', 'evaluated'],
            default: 'in_progress',
        },
        // Results (populated after evaluation)
        totalMarks: {
            type: Number,
            default: 0,
        },
        obtainedMarks: {
            type: Number,
            default: 0,
        },
        correctAnswers: {
            type: Number,
            default: 0,
        },
        wrongAnswers: {
            type: Number,
            default: 0,
        },
        unanswered: {
            type: Number,
            default: 0,
        },
        negativeMarks: {
            type: Number,
            default: 0,
        },
        percentage: {
            type: Number,
            default: 0,
        },
        passed: {
            type: Boolean,
            default: false,
        },
        timeTaken: {
            type: Number, // in seconds
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index to prevent duplicate active attempts
attemptSchema.index({ exam: 1, student: 1 });

// Virtual to check if attempt has timed out
attemptSchema.virtual('isTimedOut').get(function () {
    if (!this.serverEndTime) return false;
    return new Date() > this.serverEndTime;
});

attemptSchema.set('toJSON', { virtuals: true });
attemptSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Attempt', attemptSchema);
