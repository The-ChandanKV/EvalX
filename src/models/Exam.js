const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Exam title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
        },
        subject: {
            type: String,
            required: [true, 'Subject is required'],
            trim: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Exam creator is required'],
        },
        duration: {
            type: Number, // Duration in minutes
            required: [true, 'Exam duration is required'],
            min: [1, 'Duration must be at least 1 minute'],
            max: [480, 'Duration cannot exceed 480 minutes (8 hours)'],
        },
        totalMarks: {
            type: Number,
            required: [true, 'Total marks is required'],
            min: [1, 'Total marks must be at least 1'],
        },
        passingMarks: {
            type: Number,
            required: [true, 'Passing marks is required'],
            min: [0, 'Passing marks cannot be negative'],
        },
        startTime: {
            type: Date,
            required: [true, 'Exam start time is required'],
        },
        endTime: {
            type: Date,
            required: [true, 'Exam end time is required'],
        },
        maxAttempts: {
            type: Number,
            default: 1,
            min: [1, 'Max attempts must be at least 1'],
        },
        negativeMarking: {
            enabled: {
                type: Boolean,
                default: false,
            },
            fraction: {
                type: Number,
                default: 0.25, // 1/4th of marks deducted for wrong answer
                min: 0,
                max: 1,
            },
        },
        shuffleQuestions: {
            type: Boolean,
            default: false,
        },
        showResults: {
            type: Boolean,
            default: true, // Show results immediately after submission
        },
        status: {
            type: String,
            enum: ['draft', 'published', 'active', 'completed'],
            default: 'draft',
        },
        allowedStudents: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Validate that endTime is after startTime
examSchema.pre('validate', function (next) {
    if (this.endTime && this.startTime && this.endTime <= this.startTime) {
        this.invalidate('endTime', 'End time must be after start time');
    }
    if (this.passingMarks > this.totalMarks) {
        this.invalidate(
            'passingMarks',
            'Passing marks cannot exceed total marks'
        );
    }
    next();
});

// Virtual: Check if exam is currently active
examSchema.virtual('isActive').get(function () {
    const now = new Date();
    return (
        this.status === 'published' &&
        now >= this.startTime &&
        now <= this.endTime
    );
});

// Virtual: Get question count
examSchema.virtual('questions', {
    ref: 'Question',
    localField: '_id',
    foreignField: 'exam',
    count: true,
});

examSchema.set('toJSON', { virtuals: true });
examSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Exam', examSchema);
