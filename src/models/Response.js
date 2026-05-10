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
        // For MCQ/MSQ: array of selected option _ids
        selectedOptions: [{ type: mongoose.Schema.Types.ObjectId }],
        // For descriptive / coding: text answer
        textAnswer: { type: String, default: '' },
        isCorrect: { type: Boolean, default: false },
        marksAwarded: { type: Number, default: 0 },
        answeredAt: { type: Date, default: Date.now },
        timeTaken: { type: Number, default: 0 },
        // Manual grading fields
        gradedManually: { type: Boolean, default: false },
        feedback: { type: String, default: '' },
    },
    { timestamps: true }
);

responseSchema.index({ attempt: 1, question: 1 }, { unique: true });

module.exports = mongoose.model('Response', responseSchema);
