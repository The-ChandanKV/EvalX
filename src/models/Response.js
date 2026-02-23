const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema(
    {
        attempt: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Attempt',
            required: [true, 'Attempt reference is required'],
        },
        question: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question',
            required: [true, 'Question reference is required'],
        },
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Student reference is required'],
        },
        selectedOptions: [
            {
                type: mongoose.Schema.Types.ObjectId, // References option._id from Question
            },
        ],
        isCorrect: {
            type: Boolean,
            default: false,
        },
        marksAwarded: {
            type: Number,
            default: 0,
        },
        answeredAt: {
            type: Date,
            default: Date.now,
        },
        timeTaken: {
            type: Number, // Time spent on this question in seconds
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index to prevent duplicate responses for same question in an attempt
responseSchema.index({ attempt: 1, question: 1 }, { unique: true });

module.exports = mongoose.model('Response', responseSchema);
