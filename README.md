# 🎓 Campus Lost & Found Portal

A full-stack web application to help college students report, find, and recover lost items on campus — with smart automatic matching.

---

## ✨ Features

- **Smart Matching Engine** — Automatically compares lost & found reports with a 100-point weighted scoring system
- **Secure In-App Messaging** — Students communicate without exposing personal contact details
- **Handover Workflow** — Schedule, confirm, and close handover at safe campus locations
- **Three Roles** — Student, Admin, Super Admin with full RBAC
- **Real-time Notifications** — Match found, contact requests, handover reminders
- **Admin Dashboard** — Charts, analytics, approve/reject reports, manage users

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Student | `student@college.edu` | `Password@123` |
| Admin | `admin@college.edu` | `Password@123` |
| Super Admin | `superadmin@college.edu` | `Password@123` |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Recharts, Axios |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Auth | JWT + bcryptjs |
| File Upload | Multer |
| Styling | Custom CSS (no framework) |

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone / Open Project
```
cd student-lost-found
```

### 2. Setup PostgreSQL Database
Open pgAdmin or psql and run:
```sql
CREATE DATABASE student_lost_found;
```
Then run the schema and seed:
```bash
psql -U postgres -d student_lost_found -f database/schema.sql
psql -U postgres -d student_lost_found -f database/seed.sql
```

### 3. Configure Backend
Edit `backend/.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=student_lost_found
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD
```

### 4. Install & Start Backend
```bash
cd backend
npm install
npm run dev
```
Backend runs at: **http://localhost:5000**

### 5. Install & Start Frontend
```bash
cd frontend
npm install
npm start
```
Frontend runs at: **http://localhost:3000**

---

## 📁 Project Structure

```
student-lost-found/
├── database/
│   ├── schema.sql          # All 12 tables + triggers + indexes
│   └── seed.sql            # Demo data (7 users, items, matches)
├── backend/
│   ├── server.js           # Express app entry point
│   ├── config/database.js  # PostgreSQL pool
│   ├── controllers/        # Business logic (8 controllers)
│   ├── routes/             # REST API routes (11 route files)
│   ├── middleware/         # Auth, upload, validation
│   ├── services/           # Smart matching algorithm
│   └── utils/              # ID generation, notifications
└── frontend/
    └── src/
        ├── App.js          # Routes & guards
        ├── context/        # Auth context
        ├── layouts/        # Student & Admin layouts
        ├── pages/          # All pages (public, student, admin)
        └── services/       # Axios API client
```

---

## 🎯 Matching Algorithm

| Factor | Weight |
|--------|--------|
| Item Name | 25 pts |
| Category | 15 pts |
| Colour | 15 pts |
| Description | 10 pts |
| Brand | 10 pts |
| Building | 10 pts |
| Room Number | 10 pts |
| Date | 5 pts |
| **Total** | **100 pts** |

Matches above **50 points** are recorded. Students are notified automatically.

---

## 📡 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register student |
| POST | `/api/auth/login` | Login |
| GET | `/api/users/dashboard` | Student dashboard |
| POST | `/api/lost` | Report lost item |
| POST | `/api/found` | Report found item |
| GET | `/api/matches` | Get my matches |
| POST | `/api/matches/:id/contact` | Request contact |
| POST | `/api/messages` | Send message |
| POST | `/api/handovers` | Schedule handover |
| GET | `/api/admin/dashboard` | Admin dashboard |

---

## 🔐 Security

- Passwords hashed with **bcrypt** (12 salt rounds)
- JWT tokens with 7-day expiry
- **Phone numbers never publicly exposed**
- Role-based route protection (student / admin / superadmin)
- Rate limiting on auth endpoints
- Helmet.js security headers

---

*Built for the Campus Lost & Found Portal • 2026*
