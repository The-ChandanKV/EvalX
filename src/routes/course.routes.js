const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const {
    createCourse, getMyCourses, getCourse, joinCourse,
    removeStudent, leaveCourse, deleteCourse,
    getAnnouncements, createAnnouncement, deleteAnnouncement, togglePinAnnouncement,
} = require('../controllers/course.controller');

router.use(protect);

// Courses
router.route('/').get(getMyCourses).post(authorize('faculty', 'admin'), createCourse);
router.post('/join', authorize('student'), joinCourse);
router.route('/:id').get(getCourse).delete(deleteCourse);
router.delete('/:id/leave', authorize('student'), leaveCourse);
router.delete('/:id/students/:studentId', authorize('faculty', 'admin'), removeStudent);

// Announcements (nested under course)
router.route('/:courseId/announcements')
    .get(getAnnouncements)
    .post(authorize('faculty', 'admin'), createAnnouncement);

router.delete('/:courseId/announcements/:announcementId', deleteAnnouncement);
router.patch('/:courseId/announcements/:announcementId/pin', authorize('faculty', 'admin'), togglePinAnnouncement);

module.exports = router;
