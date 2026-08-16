# 🎓 EduSmart — School Management System

A complete, production-ready school management system with a modern React frontend, Node.js REST API, and a real SQLite database.

## ✨ Features

- **Landing page** — professional marketing site with hero, features and CTA
- **Authentication** — secure login with JWT tokens, 3 roles (admin / teacher / student)
- **Dashboard** — live stats: students, teachers, classes, attendance, finance
- **Students** — admissions, profiles, guardians, class assignment, status tracking
- **Teachers** — staff records, qualifications, subjects, salaries
- **Classes** — create classes, assign homeroom teachers, capacities, student counts
- **Attendance** — mark present / absent / late / excused per class per day
- **Grades** — record scores per subject & term, automatic letter grades, report cards with averages
- **Finance** — fee structures, payments, expenses, per-student balance tracking

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router |
| Backend | Node.js, Express |
| Database | SQLite (sql.js — WASM, works on any filesystem) |
| Auth | JWT + bcrypt password hashing |

## 🚀 Run Locally

### Backend (port 5000)
```bash
cd backend
npm install
npm start
```

### Frontend (dev mode, port 5173)
```bash
cd frontend
npm install
npm run dev
```

Or build the frontend and let the backend serve it:
```bash
cd frontend
npm run build
# then restart backend — it serves frontend/dist automatically
```

## 🔑 Demo Accounts

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Teacher | `teacher1` | `teacher123` |
| Student | `student1` | `student123` |

## 📁 Project Structure

```
school-management-system/
├── backend/
│   ├── server.js          # Express app entry
│   ├── db.js              # SQLite schema + seed + wrapper
│   ├── middleware/auth.js # JWT auth + role checks
│   └── routes/
│       ├── auth.js        # login, register, password
│       ├── students.js    # CRUD students
│       ├── teachers.js    # CRUD teachers
│       ├── classes.js     # CRUD classes
│       ├── attendance.js  # mark + summary
│       ├── grades.js      # grades + report cards
│       ├── finance.js     # payments, expenses, balances
│       ├── subjects.js    # subjects CRUD
│       └── stats.js       # dashboard stats
└── frontend/
    ├── src/
    │   ├── App.jsx        # router + auth context
    │   ├── styles.css     # design system
    │   ├── components/Layout.jsx
    │   └── pages/         # Landing, Login, Dashboard, Students, Teachers, Classes, Attendance, Grades, Finance
    └── vite.config.js
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login → JWT token |
| GET | `/api/auth/me` | Current user |
| GET/POST/PUT/DELETE | `/api/students` | Student CRUD |
| GET/POST/PUT/DELETE | `/api/teachers` | Teacher CRUD |
| GET/POST/PUT/DELETE | `/api/classes` | Class CRUD |
| GET/POST | `/api/attendance` | Attendance records + bulk mark |
| GET/POST | `/api/grades` | Grades + report cards |
| GET/POST | `/api/finance/*` | Payments, expenses, balances |
| GET | `/api/stats` | Dashboard statistics |

## 📄 License

MIT — free to use for any school.