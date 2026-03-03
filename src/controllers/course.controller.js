const Course = require('../models/Course');
const Announcement = require('../models/Announcement');
const { ApiError, asyncHandler, successResponse } = require('../utils/helpers');

/* ── Course CRUD ──────────────────────────────────────── */

const createCourse = asyncHandler(async (req, res) => {
    const { name, description, subject } = req.body;
    const course = await Course.create({ name, description, subject, createdBy: req.user._id });
    await course.populate('createdBy', 'name email');
    successResponse(res, 201, 'Course created successfully', { course });
});

const getMyCourses = asyncHandler(async (req, res) => {
    let courses;
    if (req.user.role === 'student') {
        courses = await Course.find({ students: req.user._id, isActive: true })
            .populate('createdBy', 'name email department')
            .sort({ createdAt: -1 });
    } else {
        courses = await Course.find({ createdBy: req.user._id, isActive: true })
            .populate('students', 'name email enrollmentNo department')
            .sort({ createdAt: -1 });
    }
    successResponse(res, 200, 'Courses fetched', { courses });
});

const getCourse = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id)
        .populate('createdBy', 'name email department')
        .populate('students', 'name email enrollmentNo department');
    if (!course) throw new ApiError(404, 'Course not found');

    const isCreator = course.createdBy._id.toString() === req.user._id.toString();
    const isStudent = course.students.some(s => s._id.toString() === req.user._id.toString());
    if (!isCreator && !isStudent && req.user.role !== 'admin')
        throw new ApiError(403, 'You are not a member of this course');

    successResponse(res, 200, 'Course fetched', { course });
});

const joinCourse = asyncHandler(async (req, res) => {
    const { code } = req.body;
    if (!code) throw new ApiError(400, 'Course code is required');

    const course = await Course.findOne({ code: code.toUpperCase().trim(), isActive: true })
        .populate('createdBy', 'name email department');
    if (!course) throw new ApiError(404, 'Invalid course code. Please check and try again.');
    if (course.students.includes(req.user._id))
        throw new ApiError(409, 'You are already enrolled in this course.');
    if (course.createdBy._id.toString() === req.user._id.toString())
        throw new ApiError(400, 'You cannot join your own course.');

    course.students.push(req.user._id);
    await course.save();
    await course.populate('students', 'name email enrollmentNo department');
    successResponse(res, 200, 'Successfully joined the course!', { course });
});

const removeStudent = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);
    if (!course) throw new ApiError(404, 'Course not found');
    if (course.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin')
        throw new ApiError(403, 'Only the course creator can remove students');
    course.students = course.students.filter(s => s.toString() !== req.params.studentId);
    await course.save();
    successResponse(res, 200, 'Student removed from course');
});

const leaveCourse = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);
    if (!course) throw new ApiError(404, 'Course not found');
    course.students = course.students.filter(s => s.toString() !== req.user._id.toString());
    await course.save();
    successResponse(res, 200, 'You have left the course');
});

const deleteCourse = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);
    if (!course) throw new ApiError(404, 'Course not found');
    if (course.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin')
        throw new ApiError(403, 'Only the course creator can delete this course');
    await Announcement.deleteMany({ course: course._id });
    await course.deleteOne();
    successResponse(res, 200, 'Course deleted successfully');
});

/* ── Announcements ────────────────────────────────────── */

// Helper: verify user is a member of the course
const assertMember = async (courseId, userId, role) => {
    const course = await Course.findById(courseId);
    if (!course) throw new ApiError(404, 'Course not found');
    const isCreator = course.createdBy.toString() === userId.toString();
    const isStudent = course.students.some(s => s.toString() === userId.toString());
    if (!isCreator && !isStudent && role !== 'admin')
        throw new ApiError(403, 'You are not a member of this course');
    return course;
};

const getAnnouncements = asyncHandler(async (req, res) => {
    await assertMember(req.params.courseId, req.user._id, req.user.role);
    const announcements = await Announcement.find({ course: req.params.courseId })
        .populate('author', 'name email role')
        .sort({ pinned: -1, createdAt: -1 });
    successResponse(res, 200, 'Announcements fetched', { announcements });
});

const createAnnouncement = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.courseId);
    if (!course) throw new ApiError(404, 'Course not found');
    const isCreator = course.createdBy.toString() === req.user._id.toString();
    if (!isCreator && req.user.role !== 'admin')
        throw new ApiError(403, 'Only the course creator can post announcements');

    const { title, content, pinned } = req.body;
    const announcement = await Announcement.create({
        course: req.params.courseId,
        author: req.user._id,
        title, content, pinned: !!pinned,
    });
    await announcement.populate('author', 'name email role');
    successResponse(res, 201, 'Announcement posted', { announcement });
});

const deleteAnnouncement = asyncHandler(async (req, res) => {
    const ann = await Announcement.findById(req.params.announcementId).populate('course');
    if (!ann) throw new ApiError(404, 'Announcement not found');
    const isCreator = ann.course.createdBy.toString() === req.user._id.toString();
    const isAuthor = ann.author.toString() === req.user._id.toString();
    if (!isCreator && !isAuthor && req.user.role !== 'admin')
        throw new ApiError(403, 'Not authorized to delete this announcement');
    await ann.deleteOne();
    successResponse(res, 200, 'Announcement deleted');
});

const togglePinAnnouncement = asyncHandler(async (req, res) => {
    const ann = await Announcement.findById(req.params.announcementId).populate('course');
    if (!ann) throw new ApiError(404, 'Announcement not found');
    const isCreator = ann.course.createdBy.toString() === req.user._id.toString();
    if (!isCreator && req.user.role !== 'admin')
        throw new ApiError(403, 'Only course creator can pin announcements');
    ann.pinned = !ann.pinned;
    await ann.save();
    successResponse(res, 200, ann.pinned ? 'Announcement pinned' : 'Announcement unpinned', { announcement: ann });
});

module.exports = {
    createCourse, getMyCourses, getCourse, joinCourse,
    removeStudent, leaveCourse, deleteCourse,
    getAnnouncements, createAnnouncement, deleteAnnouncement, togglePinAnnouncement,
};
