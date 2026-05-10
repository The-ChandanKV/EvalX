# EvalX - Online Examination and Evaluation System

An online examination and evaluation system that automates exam conduction, auto-evaluates objective questions, and generates instant results. Built with Node.js, Express, and MongoDB.

## 🚀 Features

### Phase 1 - Core System Logic
- **Authentication & Authorization**: JWT-based auth with role-based access control (Admin, Faculty, Student)
- **Database Design**: Well-structured MongoDB collections for Users, Exams, Questions, Attempts, and Responses
- **Exam Engine Core**: Start exam API, schedule validation, server-side timer, and prevention of multiple attempts
- **Auto Evaluation**: Automatic marking, result calculation, and optional negative marking

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt.js
- **Validation**: express-validator

## 📁 Project Structure

```
EvalX/
├── src/
│   ├── config/
│   │   └── db.js                # MongoDB connection
│   ├── controllers/
│   │   ├── auth.controller.js   # Auth logic
│   │   ├── exam.controller.js   # Exam CRUD
│   │   ├── question.controller.js # Question management
│   │   └── attempt.controller.js  # Exam attempts & evaluation
│   ├── middleware/
│   │   ├── auth.middleware.js   # JWT verification
│   │   └── validators.js       # Request validation
│   ├── models/
│   │   ├── User.js             # User schema
│   │   ├── Exam.js             # Exam schema
│   │   ├── Question.js         # Question schema
│   │   ├── Attempt.js          # Attempt schema
│   │   └── Response.js         # Response schema
│   ├── routes/
│   │   ├── auth.routes.js      # Auth endpoints
│   │   ├── exam.routes.js      # Exam endpoints
│   │   ├── question.routes.js  # Question endpoints
│   │   └── attempt.routes.js   # Attempt endpoints
│   ├── utils/
│   │   ├── helpers.js          # Utility functions
│   │   └── seed.js             # Database seeder
│   └── server.js               # Express app entry point
├── .env.example                 # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## 🔧 Setup & Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/The-ChandanKV/EvalX.git
   cd EvalX
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   ```

4. **Start MongoDB** (ensure MongoDB is running locally or use MongoDB Atlas)

5. **Run the server**
   ```bash
   # Development mode (with hot reload)
   npm run dev

   # Production mode
   npm start
   ```

6. **Seed the database** (optional - creates sample data)
   ```bash
   npm run seed
   ```

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register a new user | Public |
| POST | `/api/auth/login` | Login and get JWT token | Public |
| GET | `/api/auth/me` | Get current user profile | Authenticated |
| GET | `/api/auth/users` | Get all users | Admin |

### Exams
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/exams` | Create a new exam | Faculty/Admin |
| GET | `/api/exams` | Get all exams | Authenticated |
| GET | `/api/exams/:id` | Get exam by ID | Authenticated |
| PUT | `/api/exams/:id` | Update an exam | Faculty (owner)/Admin |
| DELETE | `/api/exams/:id` | Delete an exam | Faculty (owner)/Admin |
| PATCH | `/api/exams/:id/publish` | Publish an exam | Faculty (owner)/Admin |

### Questions
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/questions/:examId` | Add question to exam | Faculty (owner)/Admin |
| GET | `/api/questions/:examId` | Get all questions for exam | Faculty (owner)/Admin |
| PUT | `/api/questions/:questionId` | Update a question | Faculty/Admin |
| DELETE | `/api/questions/:questionId` | Delete a question | Faculty/Admin |
| POST | `/api/questions/:examId/bulk` | Add multiple questions | Faculty (owner)/Admin |

### Exam Attempts & Evaluation
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/attempts/:examId/start` | Start an exam attempt | Student |
| POST | `/api/attempts/:attemptId/answer` | Submit answer for a question | Student |
| POST | `/api/attempts/:attemptId/submit` | Submit exam & auto-evaluate | Student |
| GET | `/api/attempts/:attemptId/result` | Get attempt result | Student (own)/Faculty/Admin |
| GET | `/api/attempts/exam/:examId/results` | Get all results for an exam | Faculty/Admin |
| GET | `/api/attempts/my-attempts` | Get student's own attempts | Student |

## 🔐 Roles & Permissions

| Feature | Admin | Faculty | Student |
|---------|-------|---------|---------|
| Manage Users | ✅ | ❌ | ❌ |
| Create/Edit Exams | ✅ | ✅ (own) | ❌ |
| Add Questions | ✅ | ✅ (own) | ❌ |
| Take Exams | ❌ | ❌ | ✅ |
| View Results | ✅ (all) | ✅ (own exams) | ✅ (own) |

## 👥 Team

- **Phase 1**: Core System Logic (Authentication, Database, Exam Engine, Auto Evaluation)
- **Phase 2**: Question Management, Frontend, Grading System (Pranav)

---

## 🆕 Phase 2 — What's New ---**PARTIAL**

### 🖥️ Frontend (React + Vite)
- Full React frontend with role-based routing (Student / Faculty / Admin)
- Dark-mode design system with glassmorphism, animations, and responsive layout
- Sidebar navigation adapts per role
- Pages: Login, Register, Dashboard, Courses, Exams, Questions, My Attempts, Results, Grading, My Result

### 📝 Question Management (All 5 Types)
- **MCQ** — single correct answer, lettered options, auto-graded
- **MSQ** — multiple correct answers, checkbox-style, auto-graded
- **True/False** — two-button UI, auto-graded
- **Descriptive** — long-form text answer, model answer reference, manual grading
- **Coding** — dark code editor, language selector, test cases with input/output, manual grading

### 📤 Bulk CSV Upload
- Upload many questions at once via `.csv` file
- Live preview before upload (shows type, marks, options for each row)
- Per-row validation error reporting — shows exactly which rows failed and why
- Download CSV template button with correct format

### 🏦 Question Bank
- Create standalone questions not tied to any specific exam
- Filter by subject, topic, difficulty, type, and keyword search
- Checkbox-select multiple bank questions → import into any exam in one click
- Full CRUD for bank questions

### 🎲 Exam Randomization & Settings
- **Shuffle Questions** — different question order per student
- **Shuffle Options** — MCQ/MSQ answer options randomized per student
- **Random Question Selection** — set a pool of N questions, pick X randomly per student
- **Negative Marking** — configurable fraction deducted for wrong answers
- **Show Results** — toggle whether students see results immediately after submission

### ⏱️ Timer + Auto-Submit
- Server-side `serverEndTime` enforced (client cannot cheat the timer)
- Countdown timer: normal → amber (< 5 min) → red (< 1 min)
- Auto-submits on the client when timer hits 0
- Backend also auto-submits if student calls any API after time expired

### 🤖 Auto Grading (MCQ / MSQ / True-False)
- Compares submitted option IDs against correct option IDs
- Full MSQ logic — all correct options must match exactly
- Negative marking applied when enabled
- Calculates: `obtainedMarks`, `percentage`, `passed`, `correctAnswers`, `wrongAnswers`, `unanswered`

### 🖊️ Manual Grading Page (`/grading`)
- Faculty selects an exam → sees all descriptive/coding submissions
- Side-by-side view: student's answer vs model answer
- Quick-mark buttons (0 / 50% / 75% / 100% of max marks)
- Faculty can write **feedback** per answer (shown to the student in their result)
- Grading instantly updates the attempt's total score
- Filter tabs: All / Pending / Graded with badge counts

### 🎓 Student Result Page (`/my-result`)
- Pass/Fail gradient banner with emoji
- Score grid: score, percentage, correct, wrong, unanswered, passing marks
- Per-question answer review — selected options highlighted green (correct) or red (wrong)
- Text answer display for descriptive and coding questions
- Faculty feedback shown per question
- Pending grading notice shown if some answers still need manual review

### 🏫 Courses & Announcements
- Faculty can create courses with a unique course code
- Students join a course by entering the code
- Faculty can post announcements inside a course
- Students see enrolled courses on their dashboard

### 📡 New API Endpoints (Phase 2)

#### Question Bank
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/questions/bank` | Browse question bank with filters | Faculty/Admin |
| POST | `/api/questions/bank` | Add question to bank | Faculty/Admin |
| POST | `/api/questions/bank/import/:examId` | Import bank questions into exam | Faculty/Admin |

#### Manual Grading
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/questions/grade/:examId` | Get pending submissions for grading | Faculty/Admin |
| POST | `/api/questions/grade/:responseId` | Grade a single response | Faculty/Admin |

#### Courses
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/courses` | Create a course | Faculty/Admin |
| GET | `/api/courses` | Get all courses for user | Authenticated |
| POST | `/api/courses/join` | Join a course via code | Student |
| POST | `/api/courses/:id/announcements` | Post an announcement | Faculty/Admin |
