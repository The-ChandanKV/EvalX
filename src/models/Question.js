const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
    input: { type: String, default: '' },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: false }, // hidden from student
    marks: { type: Number, default: 1 },
}, { _id: true });

const questionSchema = new mongoose.Schema(
    {
        exam: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Exam',
            default: null, // null = Question Bank entry
        },
        questionText: {
            type: String,
            required: [true, 'Question text is required'],
            trim: true,
        },
        questionType: {
            type: String,
            enum: ['mcq', 'true_false', 'multi_select', 'descriptive', 'coding'],
            default: 'mcq',
        },
        options: [
            {
                text: { type: String, required: true, trim: true },
                isCorrect: { type: Boolean, required: true, default: false },
            },
        ],
        // For descriptive / coding: reference answer shown to faculty only
        modelAnswer: { type: String, trim: true },
        // For coding: test cases for automated evaluation
        testCases: [testCaseSchema],
        // Coding language hint
        codeLanguage: { type: String, default: 'javascript' },
        marks: {
            type: Number,
            required: [true, 'Marks is required'],
            min: [0, 'Marks cannot be negative'],
        },
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: 'medium',
        },
        // Topic / chapter for bank filtering
        topic: { type: String, trim: true },
        subject: { type: String, trim: true },
        explanation: { type: String, trim: true },
        order: { type: Number, default: 0 },
        // Bank-only flag
        isBank: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Only validate options for choice-based question types
questionSchema.pre('validate', function (next) {
    const needsOptions = ['mcq', 'true_false', 'multi_select'].includes(this.questionType);
    if (needsOptions) {
        if (!this.options || this.options.length < 2) {
            this.invalidate('options', 'At least 2 options are required');
        } else if (!this.options.some(opt => opt.isCorrect)) {
            this.invalidate('options', 'At least one option must be marked as correct');
        }
    }
    next();
});

questionSchema.index({ exam: 1, order: 1 });
questionSchema.index({ subject: 1, topic: 1, difficulty: 1 });
questionSchema.index({ isBank: 1 });

module.exports = mongoose.model('Question', questionSchema);
