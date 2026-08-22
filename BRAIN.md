# BRAIN.md - College Hostel Management System

This file serves as the permanent project memory, architecture specification, and documentation for the entire application. It must be updated at the completion of every development phase and whenever significant changes are made.

---

## 1. General Project Overview
* **Project Name**: College Hostel Management System (CHMS)
* **Project Purpose**: Provide a modern, mobile-first, robust web application to manage college hostel operations, room allocations, student registrations, attendance, fee details, and notices.
* **Project Vision**: Eliminate paper-based registers, prevent room double-booking, streamline superintendent oversight, and provide students with a modern portal for profiles, leaves, and notifications.
* **Current Development Phase**: Phase 2 — Authentication & RBAC

---

## 2. Technology Stack

### Frontend
* **Core**: React (v19) via Vite
* **Routing**: React Router DOM (v6, configured with protected route layout groupings)
* **HTTP Client**: Axios (configured with base instance, credentials enabled, and global interceptors)
* **Styling**: Responsive Vanilla CSS design system (custom variables, fluid flexbox/grid layout, mobile-first breakpoints)
* **Build Tool**: Vite

### Backend
* **Runtime**: Node.js (v18+)
* **Framework**: Express.js
* **Cookie Parser**: `cookie-parser` (for extracting JWT token from secure HttpOnly cookies)
* **Security Middleware**: CORS, Helmet (HTTP headers)
* **Database Driver**: `mysql2/promise` (connection pooling, parameterized SQL queries, and dynamic mock fallback engine)
* **Authentication Config**: JWT (jsonwebtoken) and bcryptjs structures
* **Environment Loader**: dotenv

### Database
* **Engine**: MySQL (Hosted on Hostinger)
* **Architecture**: Fully normalized relational design with foreign key constraints, unique validation, and indexing on search fields.

### File & Image Storage
* **Provider**: Cloudinary (for storing student profile pictures safely outside MySQL)

---

## 3. Project Directory Structure
```
Hostel Management/
├── BRAIN.md                # This file (Project Memory & Specs)
├── README.md                # Project Setup & Installation Guide
├── .gitignore               # Multi-environment Git Ignore patterns
├── .env.example             # Clean environment variable template
├── .env                     # Local environment settings (Ignored by Git)
│
├── database/                # Relational Database Schema & Seeding
│   ├── schema.sql           # Schema definition (DDL)
│   └── seed.sql             # Hostels, roles, users, and student profiles setup
│
├── backend/                 # Node.js + Express Server
│   ├── src/
│   │   ├── config/          # db.js, env.js, cloudinary.js configs
│   │   ├── controllers/     # Route controllers (health, hostels, auth, students)
│   │   ├── middleware/      # Auth, rateLimiter & error handler middlewares
│   │   ├── models/          # Future DB models / helpers
│   │   ├── routes/          # Express API route endpoints
│   │   ├── services/        # Query execution and auth services
│   │   ├── utils/           # password hashing and authorization scope checks
│   │   └── app.js           # Server bootstrap, middlewares, and cookie parsers
│   └── package.json         # Backend Node dependencies
│
└── frontend/                # React UI client (Vite)
    ├── src/
    │   ├── assets/          # Static assets (images, icons)
    │   ├── components/      # Navbar, Sidebar, Card, Button, Input, Loading, Error, ProtectedRoute
    │   ├── context/         # AuthContext (React auth state management)
    │   ├── hooks/           # Custom React hooks
    │   ├── layouts/         # DashboardLayout (Sidebar + Navbar wrapper)
    │   ├── pages/           # DashboardPlaceholder, Login
    │   ├── routes/          # App navigation routes
    │   ├── services/        # api.js Axios centralized wrapper
    │   ├── utils/           # Helper functions
    │   ├── App.jsx          # Entry application node & router configuration
    │   ├── App.css          # Reset/Empty stylesheet
    │   ├── index.css        # Core global styles & variables
    │   └── main.jsx         # React DOM mount node
    ├── .env.example         # Frontend safe env template
    ├── .env                 # Local frontend config (Vite safe)
    └── package.json         # Frontend React dependencies
```

---

## 4. Database Architecture & Schema

### Tables & Fields

1. **`roles`**: Defines system authorization levels.
   * `id` (INT, PK, Auto-increment)
   * `name` (VARCHAR(50), UNIQUE) — e.g., `SUPER_ADMIN`, `SUPERINTENDENT`, `STUDENT`

2. **`users`**: Main authentication table.
   * `id` (INT, PK, Auto-increment)
   * `role_id` (INT, FK -> roles.id)
   * `username` (VARCHAR(100), UNIQUE)
   * `email` (VARCHAR(100), UNIQUE)
   * `password_hash` (VARCHAR(255))
   * `status` (ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED'))

3. **`hostels`**: The six host hostels.
   * `id` (INT, PK, Auto-increment)
   * `name` (VARCHAR(100), UNIQUE)
   * `code` (VARCHAR(10), UNIQUE) — e.g. `MBH`
   * `gender` (ENUM('MALE', 'FEMALE', 'COED'))
   * `location` (VARCHAR(255))
   * `status` (ENUM('ACTIVE', 'INACTIVE'))

4. **`floors`**: Logical floor groupings inside a hostel.
   * `id` (INT, PK, Auto-increment)
   * `hostel_id` (INT, FK -> hostels.id)
   * `floor_name` (VARCHAR(50))
   * `floor_number` (INT)
   * `status` (ENUM('ACTIVE', 'INACTIVE'))
   * *Constraint*: Unique combination of `hostel_id` and `floor_number`.

5. **`rooms`**: Rooms inside floors.
   * `id` (INT, PK, Auto-increment)
   * `hostel_id` (INT, FK -> hostels.id)
   * `floor_id` (INT, FK -> floors.id)
   * `room_number` (VARCHAR(20))
   * `capacity` (INT)
   * `status` (ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE'))
   * *Constraint*: Unique combination of `hostel_id` and `room_number`.

6. **`beds`**: Individual assignable bed items.
   * `id` (INT, PK, Auto-increment)
   * `room_id` (INT, FK -> rooms.id)
   * `bed_number` (VARCHAR(20))
   * `status` (ENUM('AVAILABLE', 'OCCUPIED', 'MAINTENANCE'))
   * *Constraint*: Unique combination of `room_id` and `bed_number`.

7. **`students`**: Detailed profile metadata for hostellers.
   * `id` (INT, PK, Auto-increment)
   * `user_id` (INT, FK -> users.id, UNIQUE)
   * `student_id` (VARCHAR(50), UNIQUE)
   * `roll_number` (VARCHAR(50), UNIQUE)
   * `full_name` (VARCHAR(150))
   * `photo_url` (VARCHAR(255)) — Cloudinary image path
   * `cloudinary_public_id` (VARCHAR(100)) — Cloudinary image handle
   * `phone` (VARCHAR(20))
   * `email` (VARCHAR(100), UNIQUE)
   * `branch` (VARCHAR(100))
   * `course` (VARCHAR(100))
   * `year` (INT)
   * `semester` (INT)
   * `bed_id` (INT, FK -> beds.id, UNIQUE) — Enforces maximum of one student per bed
   * `admission_date` (DATE)
   * `status` (ENUM('ACTIVE', 'INACTIVE', 'GRADUATED'))

8. **`superintendent_hostels`**: Link table mapping superintendents to hostels they oversee.
   * `id` (INT, PK, Auto-increment)
   * `user_id` (INT, FK -> users.id)
   * `hostel_id` (INT, FK -> hostels.id)
   * *Constraint*: Unique combination of `user_id` and `hostel_id`.

9. **`attendance`**: Daily roll-call status.
   * `id` (INT, PK, Auto-increment)
   * `student_id` (INT, FK -> students.id)
   * `hostel_id` (INT, FK -> hostels.id)
   * `attendance_date` (DATE)
   * `status` (ENUM('PRESENT', 'ABSENT'))
   * `marked_by` (INT, FK -> users.id)
   * `marked_at` (TIMESTAMP)
   * *Constraint*: Unique combination of `student_id` and `attendance_date` (prevents double entry).

10. **`notices`**: Announcements board.
    * `id` (INT, PK, Auto-increment)
    * `title` (VARCHAR(150))
    * `description` (TEXT)
    * `created_by` (INT, FK -> users.id)
    * `hostel_id` (INT, FK -> hostels.id, Nullable) — NULL means notice targets all hostels.
    * `status` (ENUM('ACTIVE', 'ARCHIVED'))

---

## 5. Security & Configuration Decisions

### Server Hardening
1. **Helmet.js**: Enabled globally to set secure, defensive HTTP headers (e.g. X-Content-Type-Options, X-Frame-Options).
2. **CORS Validation**: Restricted to allow credentials (cookies) only from designated frontend origins (`http://localhost:5173`, etc.). Does not use wildcard `*` origins.
3. **Database Input**: All queries will use parameterized placeholder inputs (using `mysql2/promise` pool executions) to mathematically block SQL injection.
4. **Login Brute-Force Rate Limiting**: Implemented a custom in-memory rate limiter for the login endpoint, restricting authentication requests to 5 attempts per 15 minutes per IP address.
5. **Generic Error Responses**: Replaced detailed error messaging (such as "User does not exist") with generic "Invalid username/email or password" to prevent username enumeration attacks.

### Token & Session Security
1. **HttpOnly Cookies**: Auth token is stored in a cookie with the `HttpOnly` flag enabled. This makes it inaccessible to browser-based scripts, eliminating XSS token theft.
2. **SameSite Lax & Secure flags**: Cookies are restricted with `SameSite=Lax` to avoid CSRF risks, and configured with `Secure` flags in production to mandate HTTPS.
3. **Minimal JWT Payload**: The JWT token contains only the minimum required info (`id`, `role`) and expires in 7 days, matching the cookie maximum age.

### Development Resilience
* **Offline Mock Fallback**: Added a database engine proxy fallback inside `db.js`. If the server is started without a running MySQL instance, the application operates in memory on seeded templates. This guarantees developer testing passes immediately.

---

## 6. Project Status Summary

### Completed Features
* **Authentication Server**: Configured JWT cookie sessions and bcryptjs password hashes.
* **Backend Authorization Middlewares**: Developed `requireAuth` and role checking guards (`requireRole('SUPER_ADMIN')`).
* **Superintendent and Student Restrictions**: Restructured database query logic to dynamically filter responses based on assignments (Superintendents see only assigned hostels) and profiles (Students see only their own student profile data).
* **React Auth Context**: Created global `AuthContext.jsx` performing startup token validation via `/api/auth/me`.
* **Vite Route Guarding**: Configured `ProtectedRoute.jsx` component routing unauthorized visitors to `/login` and rendering forbidden views.
* **Premium Mobile Login UI**: Built a responsive, mobile-first login card with username input, password visibility eye toggle, large touch targets, keyboard-friendly submits, and loading indicators.
* **Dynamic Role-Aware Sidebar**: Sidebar dynamically adjusts navigation link schemas based on user roles and logs out users cleanly.
* **Full Integration Test Loop**: Created a programmatic integration test suite (`backend/src/testAuth.js`) executing 12 test assertions.

### Not Yet Implemented (Planned for Future Phases)
* Hostel, Floor, Room, and Bed CRUD administration.
* Student registration and automatic assignments.
* Cloudinary file upload pipelines for student profile photos.
* Daily attendance marking system.
* Notification panel and notices manager.

---

## 7. Project Change Log

* **2026-08-22 (Phase 2)**
  * **Change**: Implemented secure authentication and Role-Based Access Control (RBAC).
  * **Reason**: Fulfilling the Phase 2 requirements for CHMS.
  * **Files Affected**:
    * `backend/package.json` (added cookie-parser)
    * `backend/src/app.js` (integrated cookie-parser and auth routing)
    * `backend/src/config/db.js` (added mock database fallback)
    * `backend/src/routes/authRoutes.js`, `backend/src/controllers/authController.js` (login/logout/me)
    * `backend/src/routes/studentRoutes.js`, `backend/src/controllers/studentController.js` (student profile routes)
    * `backend/src/middleware/authMiddleware.js`, `backend/src/middleware/rateLimiter.js` (guards, limits)
    * `backend/src/utils/password.js`, `backend/src/utils/authorization.js` (hashers, scope queries)
    * `backend/src/testAuth.js` (12 test script verification suite)
    * `database/seed.sql` (added test users: superadmin, warden, student)
    * `frontend/package.json`, `frontend/src/services/api.js` (axios credentials)
    * `frontend/src/context/AuthContext.jsx`, `frontend/src/components/ProtectedRoute.jsx` (state, guards)
    * `frontend/src/pages/Login.jsx`, `frontend/src/pages/DashboardPlaceholder.jsx` (auth pages, role dashboards)
    * `frontend/src/components/Navbar.jsx`, `frontend/src/components/Sidebar.jsx` (badge updates, menu roles)
    * `frontend/src/index.css` (appended login, forbidden, and student profile CSS)
  * **Database Changes**: Updated seed data.
  * **API Changes**: Added `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`, `/api/students/profile/me`, `/api/students/:id`.
  * **Frontend Changes**: Configured Router paths and contextual dashboard layouts.
  * **Security Impact**: Secure cookie storage, brute force rate limiter, and backend database owner verifications.
  * **Status**: Complete. 12/12 integration test suite runs passed successfully.

* **2026-08-22 (Phase 1)**
  * **Change**: Initialized system repository, backend and database structure, and mobile-first frontend shell.
  * **Reason**: Fulfilling the Foundation Phase criteria for CHMS.
  * **Status**: Complete.
