const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
    {
        exam: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Exam',
            required: [true, 'Exam reference is required'],
        },
        questionText: {
            type: String,
            required: [true, 'Question text is required'],
            trim: true,
        },
        questionType: {
            type: String,
            enum: ['mcq', 'true_false', 'multi_select'],
            default: 'mcq',
        },
        options: [
            {
                text: {
                    type: String,
                    required: true,
                    trim: true,
                },
                isCorrect: {
                    type: Boolean,
                    required: true,
                    default: false,
                },
            },
        ],
        marks: {
            type: Number,
            required: [true, 'Marks for the question is required'],
            min: [0, 'Marks cannot be negative'],
        },
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: 'medium',
        },
        explanation: {
            type: String,
            trim: true,
        },
        order: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Validate that at least one option is correct
questionSchema.pre('validate', function (next) {
    if (this.options && this.options.length > 0) {
        const hasCorrectOption = this.options.some((opt) => opt.isCorrect);
        if (!hasCorrectOption) {
            this.invalidate(
                'options',
                'At least one option must be marked as correct'
            );
        }
    }
    if (this.options && this.options.length < 2) {
        this.invalidate('options', 'At least 2 options are required');
    }
    next();
});

// Index for efficient querying
questionSchema.index({ exam: 1, order: 1 });

module.exports = mongoose.model('Question', questionSchema);
