/**
 * Database Seeder
 * Creates sample data for testing the EvalX system
 *
 * Usage: npm run seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Attempt = require('../models/Attempt');
const Response = require('../models/Response');

const seedData = async () => {
    try {
        await connectDB();

        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await Response.deleteMany({});
        await Attempt.deleteMany({});
        await Question.deleteMany({});
        await Exam.deleteMany({});
        await User.deleteMany({});

        // Create users
        console.log('👤 Creating users...');
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@evalx.com',
            password: 'admin123',
            role: 'admin',
            department: 'Administration',
        });

        const faculty = await User.create({
            name: 'Dr. Sharma',
            email: 'faculty@evalx.com',
            password: 'faculty123',
            role: 'faculty',
            department: 'Computer Science',
        });

        const student1 = await User.create({
            name: 'Rahul Kumar',
            email: 'student1@evalx.com',
            password: 'student123',
            role: 'student',
            department: 'Computer Science',
            enrollmentNo: 'CS2024001',
        });

        const student2 = await User.create({
            name: 'Priya Singh',
            email: 'student2@evalx.com',
            password: 'student123',
            role: 'student',
            department: 'Computer Science',
            enrollmentNo: 'CS2024002',
        });

        console.log('  ✅ Admin: admin@evalx.com / admin123');
        console.log('  ✅ Faculty: faculty@evalx.com / faculty123');
        console.log('  ✅ Student 1: student1@evalx.com / student123');
        console.log('  ✅ Student 2: student2@evalx.com / student123');

        // Create exam
        console.log('\n📝 Creating exam...');
        const exam = await Exam.create({
            title: 'Data Structures & Algorithms - Mid Term',
            description:
                'Mid-term examination covering arrays, linked lists, stacks, queues, and basic sorting algorithms.',
            subject: 'Data Structures',
            createdBy: faculty._id,
            duration: 60, // 60 minutes
            totalMarks: 40,
            passingMarks: 16,
            startTime: new Date(), // Starts now
            endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Ends in 7 days
            maxAttempts: 1,
            negativeMarking: {
                enabled: true,
                fraction: 0.25,
            },
            shuffleQuestions: false,
            showResults: true,
            status: 'published',
        });

        console.log(`  ✅ Exam: "${exam.title}"`);

        // Create questions
        console.log('\n❓ Creating questions...');
        const questions = await Question.insertMany([
            {
                exam: exam._id,
                questionText:
                    'What is the time complexity of binary search on a sorted array?',
                questionType: 'mcq',
                options: [
                    { text: 'O(n)', isCorrect: false },
                    { text: 'O(log n)', isCorrect: true },
                    { text: 'O(n log n)', isCorrect: false },
                    { text: 'O(1)', isCorrect: false },
                ],
                marks: 5,
                difficulty: 'easy',
                explanation:
                    'Binary search repeatedly divides the search space in half, giving O(log n) time complexity.',
                order: 1,
            },
            {
                exam: exam._id,
                questionText:
                    'Which data structure uses LIFO (Last In First Out) principle?',
                questionType: 'mcq',
                options: [
                    { text: 'Queue', isCorrect: false },
                    { text: 'Stack', isCorrect: true },
                    { text: 'Array', isCorrect: false },
                    { text: 'Linked List', isCorrect: false },
                ],
                marks: 5,
                difficulty: 'easy',
                explanation: 'Stack follows LIFO - the last element pushed is the first one to be popped.',
                order: 2,
            },
            {
                exam: exam._id,
                questionText:
                    'What is the worst-case time complexity of QuickSort?',
                questionType: 'mcq',
                options: [
                    { text: 'O(n log n)', isCorrect: false },
                    { text: 'O(n)', isCorrect: false },
                    { text: 'O(n²)', isCorrect: true },
                    { text: 'O(log n)', isCorrect: false },
                ],
                marks: 5,
                difficulty: 'medium',
                explanation:
                    'QuickSort has O(n²) worst case when the pivot selection is poor (e.g., already sorted array with first/last element as pivot).',
                order: 3,
            },
            {
                exam: exam._id,
                questionText: 'A linked list allows random access to elements.',
                questionType: 'true_false',
                options: [
                    { text: 'True', isCorrect: false },
                    { text: 'False', isCorrect: true },
                ],
                marks: 5,
                difficulty: 'easy',
                explanation:
                    'Linked lists require sequential traversal. Only arrays support O(1) random access.',
                order: 4,
            },
            {
                exam: exam._id,
                questionText:
                    'Which of the following are linear data structures?',
                questionType: 'multi_select',
                options: [
                    { text: 'Array', isCorrect: true },
                    { text: 'Binary Tree', isCorrect: false },
                    { text: 'Stack', isCorrect: true },
                    { text: 'Graph', isCorrect: false },
                    { text: 'Queue', isCorrect: true },
                ],
                marks: 5,
                difficulty: 'medium',
                explanation:
                    'Arrays, Stacks, and Queues are linear. Trees and Graphs are non-linear data structures.',
                order: 5,
            },
            {
                exam: exam._id,
                questionText:
                    'What is the space complexity of merge sort?',
                questionType: 'mcq',
                options: [
                    { text: 'O(1)', isCorrect: false },
                    { text: 'O(log n)', isCorrect: false },
                    { text: 'O(n)', isCorrect: true },
                    { text: 'O(n²)', isCorrect: false },
                ],
                marks: 5,
                difficulty: 'medium',
                explanation:
                    'Merge sort requires O(n) additional space for the temporary arrays used during merging.',
                order: 6,
            },
            {
                exam: exam._id,
                questionText:
                    'In a circular queue, the rear pointer wraps around when it reaches the end of the array.',
                questionType: 'true_false',
                options: [
                    { text: 'True', isCorrect: true },
                    { text: 'False', isCorrect: false },
                ],
                marks: 5,
                difficulty: 'easy',
                explanation:
                    'In a circular queue, rear = (rear + 1) % size, which wraps around to the beginning.',
                order: 7,
            },
            {
                exam: exam._id,
                questionText:
                    'What is the minimum number of nodes in a complete binary tree of height h?',
                questionType: 'mcq',
                options: [
                    { text: '2^h', isCorrect: true },
                    { text: '2^(h+1) - 1', isCorrect: false },
                    { text: 'h + 1', isCorrect: false },
                    { text: '2h', isCorrect: false },
                ],
                marks: 5,
                difficulty: 'hard',
                explanation:
                    'A complete binary tree of height h has a minimum of 2^h nodes (when the last level has only one node).',
                order: 8,
            },
        ]);

        console.log(`  ✅ Created ${questions.length} questions (Total: 40 marks)`);

        console.log('\n🎉 Database seeded successfully!');
        console.log('\n📋 Summary:');
        console.log('  - 1 Admin, 1 Faculty, 2 Students');
        console.log('  - 1 Published Exam (DSA Mid-Term, 60 min, 40 marks)');
        console.log('  - 8 Questions (MCQ, True/False, Multi-Select)');
        console.log('  - Negative marking enabled (0.25x)');
        console.log('\n🔑 Login Credentials:');
        console.log('  Admin:   admin@evalx.com / admin123');
        console.log('  Faculty: faculty@evalx.com / faculty123');
        console.log('  Student: student1@evalx.com / student123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }
};

seedData();
