const mongoose = require('mongoose');
const { customAlphabet } = require('nanoid');

// 6-char uppercase alphanumeric code, e.g. "AB3X9Z"
const generateCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

const courseSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Course name is required'],
            trim: true,
            maxlength: [100, 'Course name cannot exceed 100 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        subject: {
            type: String,
            required: [true, 'Subject is required'],
            trim: true,
        },
        code: {
            type: String,
            unique: true,
            uppercase: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        students: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Auto-generate a unique course code before saving
courseSchema.pre('save', async function (next) {
    if (!this.isNew) return next();
    let code, exists;
    do {
        code = generateCode();
        exists = await mongoose.model('Course').findOne({ code });
    } while (exists);
    this.code = code;
    next();
});

module.exports = mongoose.model('Course', courseSchema);
