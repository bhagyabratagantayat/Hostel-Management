# BRAIN.md - College Hostel Management System

This file serves as the permanent project memory, architecture specification, and documentation for the entire application. It must be updated at the completion of every development phase and whenever significant changes are made.

---

## 1. General Project Overview
* **Project Name**: College Hostel Management System (CHMS)
* **Project Purpose**: Provide a modern, mobile-first, robust web application to manage college hostel operations, room allocations, student registrations, attendance, fee details, and notices.
* **Project Vision**: Eliminate paper-based registers, prevent room double-booking, streamline superintendent oversight, and provide students with a modern portal for profiles, leaves, and notifications.
* **Current Development Phase**: Foundation Phase (Phase 1)

---

## 2. Technology Stack

### Frontend
* **Core**: React (v19) via Vite
* **Routing**: React Router DOM (to be configured in detail in Phase 2)
* **HTTP Client**: Axios (configured with base instance and global request/response interceptors)
* **Styling**: Responsive Vanilla CSS design system (custom variables, fluid flexbox/grid layout, mobile-first breakpoints)
* **Build Tool**: Vite

### Backend
* **Runtime**: Node.js (v18+)
* **Framework**: Express.js
* **Security Middleware**: CORS, Helmet (HTTP headers)
* **Database Driver**: `mysql2/promise` (connection pooling and parameterized SQL queries)
* **Authentication Config**: JWT architecture and bcryptjs structures ready
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
│   └── seed.sql             # Hostels and roles setup (DML)
│
├── backend/                 # Node.js + Express Server
│   ├── src/
│   │   ├── config/          # db.js, env.js, cloudinary.js configs
│   │   ├── controllers/     # Route logic handlers (health, hostels)
│   │   ├── middleware/      # Auth & error handler middlewares
│   │   ├── models/          # Future DB models / helpers
│   │   ├── routes/          # Express API route endpoints
│   │   ├── services/        # Query execution services
│   │   ├── utils/           # Utilities
│   │   └── app.js           # Server bootstrap and middlewares
│   └── package.json         # Backend Node dependencies
│
└── frontend/                # React UI client (Vite)
    ├── src/
    │   ├── assets/          # Static assets (images, icons)
    │   ├── components/      # Reusable components (Navbar, Sidebar, Card, Button, Input, Loading, Error)
    │   ├── context/         # Auth and state contexts
    │   ├── hooks/           # Custom React hooks
    │   ├── layouts/         # DashboardLayout (Sidebar + Navbar wrapper)
    │   ├── pages/           # DashboardPlaceholder page
    │   ├── routes/          # App navigation routes
    │   ├── services/        # api.js Axios centralized wrapper
    │   ├── utils/           # Helper functions
    │   ├── App.jsx          # Entry application node
    │   ├── App.css          # Reset/Empty stylesheet
    │   ├── index.css        # Core global styles & Tailwind variables
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

### Relational Entity-Relationship Flow
```
[Hostels] ──1:N──> [Floors] ──1:N──> [Rooms] ──1:N──> [Beds] ──1:1──> [Students]
   │                                                                     │
   ├────────────── Many-to-Many via [Superintendent Hostels] ─────────────┤
   │                                                                     │
   └─────────1:N──> [Attendance] <──1:N──────────────────────────────────┘
```

---

## 5. Security & Configuration Decisions

### Server Hardening
1. **Helmet.js**: Enabled globally to set secure, defensive HTTP headers (e.g. X-Content-Type-Options, X-Frame-Options).
2. **CORS Validation**: Restricted to allow connections only from designated frontend origins (`http://localhost:5173`, etc.).
3. **Database Input**: All queries will use parameterized placeholder inputs (using `mysql2/promise` pool executions) to mathematically block SQL injection.

### Environment Management
* Private configurations (passwords, tokens, Cloudinary API secrets) are loaded strictly through a root `.env` which is ignored in Git via `.gitignore`.
* **Centralization**: Config values are imported and checked on startup within `backend/src/config/env.js` and never read directly through raw `process.env` inside controllers.
* **Vite Env Safety**: No server-side secrets are prefixed with `VITE_` to ensure they never get compiled into public browser scripts.

---

## 6. Project Status Summary

### Completed Features
* Established modular project layout (`backend/`, `frontend/`, `database/`).
* Created and seeded MySQL `schema.sql` and `seed.sql` with roles and the 6 hostels:
  1. **Meridian Boys Hostel** (MBH)
  2. **Meridian Girls Hostel** (MGH)
  3. **BEC Boys Hostel** (BBH)
  4. **BEC Kara Hostel** (BKH)
  5. **Barmunda Boys Hostel** (BMBH)
  6. **Barmunda Girls Hostel** (BMGH)
* Configured Express server foundation with security middlewares (Helmet, CORS) and centralized error logging.
* Developed health verification API (`/api/health`) and dynamic hostel query API (`/api/hostels`).
* Set up Vite React workspace with modular folders (`components`, `layouts`, `pages`, `services`).
* Built a fully responsive mobile-first UI layout shell featuring:
  * Navbar header with hamburger toggle.
  * Sidebar sliding drawer overlay (mobile) switching to fixed sidebar (desktop).
  * Dynamic status indicator panels querying server and MySQL connectivity.
  * Hostels list grid styled with responsive cards and active category badges.
* Integrated Axios client API with interceptors.

### Not Yet Implemented (Planned for Future Phases)
* JWT User Authentication, registration flow, and password encryption (bcryptjs).
* Role-based Route Guards.
* Student and room assignment admin dashboards.
* Superintendent allocation and room detail modification UI.
* Daily attendance marking system.
* Cloudinary file upload pipelines for student profile photos.
* Notification panel and notices manager.

---

## 7. Project Change Log

* **2026-08-22**
  * **Change**: Initialized system repository, backend and database structure, and mobile-first frontend shell.
  * **Reason**: Fulfilling the Foundation Phase criteria for CHMS.
  * **Files Affected**: Entire repository initialized.
  * **Database Changes**: Executed `schema.sql` and `seed.sql` parameters.
  * **API Changes**: Added `/api/health` and `/api/hostels`.
  * **Frontend Changes**: Custom CSS layout wrapper and Axios services integrated.
  * **Security Impact**: Parameterized connection verified; environment files successfully hidden.
  * **Status**: Complete.
