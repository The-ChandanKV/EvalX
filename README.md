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

## 📄 License

MIT License
