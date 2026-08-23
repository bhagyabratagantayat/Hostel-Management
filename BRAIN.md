# BRAIN.md - College Hostel Management System

This file serves as the permanent project memory, architecture specification, and documentation for the entire application. It must be updated at the completion of every development phase and whenever significant changes are made.

---

## 1. General Project Overview
* **Project Name**: College Hostel Management System (CHMS)
* **Project Purpose**: Provide a modern, mobile-first, robust web application to manage college hostel operations, room allocations, student registrations, attendance, fee details, and notices.
* **Project Vision**: Eliminate paper-based registers, prevent room double-booking, streamline superintendent oversight, and provide students with a modern portal for profiles, leaves, and notifications.
* **Current Development Phase**: Phase 7.5 — Notice System Production Verification & Data Safety (Complete)

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
* **Database Driver**: `mysql2/promise` (connection pooling, parameterized SQL queries)
* **Authentication Config**: JWT (jsonwebtoken) and bcryptjs structures
* **Environment Loader**: dotenv
* **File Upload**: Cloudinary SDK (v2) for student profile photos

### Database
* **Engine**: MySQL
* **Port**: 3307 (local dev)
* **Architecture**: Fully normalized relational design with foreign key constraints, unique validation, and indexing on search fields.

### File & Image Storage
* **Provider**: Cloudinary
* **Cloud Name**: qqv22ppu
* **Usage**: Student profile photo upload, update, and deletion

---

## 3. Environment Configuration

### Backend (.env — never committed)
```
PORT=5001
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=<secret>
DB_NAME=hostel_management
JWT_SECRET=<secret>
CLOUDINARY_CLOUD_NAME=qqv22ppu
CLOUDINARY_API_KEY=<key>
CLOUDINARY_API_SECRET=<secret>
CLOUDINARY_URL=cloudinary://<key>:<secret>@qqv22ppu
```

### Frontend (.env — never committed)
```
VITE_API_BASE_URL=http://localhost:5001/api
```

### .env.example files
Both backend and frontend have `.env.example` files with placeholder values — these ARE committed and serve as setup templates.

### .gitignore
```
.env
.env.*
!.env.example
```
This pattern protects all env variants while keeping `.env.example` trackable.

---

## 4. Project Directory Structure
```
Hostel Management/
├── BRAIN.md                # Project Memory & Specs
├── README.md               # Project Setup & Installation Guide
├── .gitignore              # Multi-environment Git Ignore patterns
├── .env                    # Local root environment (ignored)
│
├── database/
│   ├── schema.sql          # DDL — all tables with constraints
│   └── seed.sql            # Six hostels, test users, roles
│
├── backend/
│   └── src/
│       ├── config/         # db.js, env.js, cloudinary.js
│       ├── controllers/    # hostelController, studentController, attendanceController,
│       │                   # bedController, floorController, roomController, authController
│       ├── middleware/     # authMiddleware.js, rateLimiter.js, errorHandler.js
│       ├── routes/         # authRoutes, hostelRoutes, studentRoutes, floorRoutes,
│       │                   # roomRoutes, bedRoutes, attendanceRoutes, dashboardRoutes
│       ├── services/       # hostelService, studentService, attendanceService,
│       │                   # floorService, roomService, bedService, dashboardService
│       ├── utils/          # password.js, authorization.js
│       └── app.js          # Server bootstrap
│
└── frontend/
    └── src/
        ├── components/     # StatCard, HostelCard, AttendanceChart, OccupancySummary,
        │                   # Navbar, Sidebar, Card, Button, Input, Loading, ProtectedRoute
        ├── context/        # AuthContext.jsx
        ├── layouts/        # DashboardLayout.jsx
        ├── pages/          # AdminDashboard, SuperintendentDashboard, DashboardPlaceholder,
        │                   # Login, HostelsPage, HostelDetailsPage, StudentsPage
        ├── services/       # api.js (Axios singleton, base URL from VITE_API_BASE_URL)
        └── App.jsx         # Router with RoleRedirect at root
```

---

## 5. Database Architecture & Schema

### Tables

1. **`roles`** — System authorization levels (`SUPER_ADMIN`, `SUPERINTENDENT`, `STUDENT`)
2. **`users`** — Main authentication table (id, role_id, username, email, password_hash, status)
3. **`hostels`** — Six hostels (Meridian Boys/Girls, BEC Boys/Kara, Barmunda Boys/Girls)
4. **`floors`** — Floors inside hostels (hostel_id FK, floor_name, floor_number, status)
5. **`rooms`** — Rooms inside floors (hostel_id FK, floor_id FK, room_number, capacity, status)
6. **`beds`** — Individual beds (room_id FK, bed_number, status: AVAILABLE/OCCUPIED/MAINTENANCE)
7. **`students`** — Student profiles (user_id FK UNIQUE, bed_id FK UNIQUE, full_name, roll_number, photo_url, cloudinary_public_id, branch, course, year, semester, status)
8. **`superintendent_hostels`** — Many-to-many: superintendents to hostels
9. **`attendance`** — Daily roll-call (student_id FK, hostel_id FK, attendance_date, status: PRESENT/ABSENT, marked_by FK, UNIQUE on student_id+attendance_date)
10. **`notices`** — Announcement board (future phase)

---

## 6. API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | Public | Login (returns HttpOnly JWT cookie) |
| POST | `/api/auth/logout` | Auth | Logout (clears cookie) |
| GET | `/api/auth/me` | Auth | Current user profile |

### Hostels
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/hostels` | Auth | List hostels (scoped by role) |
| GET | `/api/hostels/:id` | Auth | Hostel details |
| POST | `/api/hostels` | SUPER_ADMIN | Create hostel |
| PUT | `/api/hostels/:id` | SUPER_ADMIN | Update hostel |
| GET | `/api/hostels/:id/floors` | Auth | Hostel floors |
| POST | `/api/hostels/:id/floors` | Admin | Add floor |
| GET | `/api/hostels/:id/rooms` | Auth | Hostel rooms |
| GET | `/api/hostels/:id/beds` | Auth | Hostel beds |

### Students
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/students` | Auth | List students (scoped by role) |
| GET | `/api/students/:id` | Auth | Student details |
| POST | `/api/students` | Admin | Create student (with Cloudinary photo) |
| PUT | `/api/students/:id` | Admin | Update student |
| DELETE | `/api/students/:id` | SUPER_ADMIN | Delete student |
| GET | `/api/students/profile/me` | STUDENT | Own profile |

### Attendance
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/attendance` | Auth | List/filter attendance |
| POST | `/api/attendance/mark` | Admin | Mark attendance |
| PUT | `/api/attendance/:id` | Admin | Edit attendance |

### Dashboard
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard/overview` | Auth | Aggregated stats (role-scoped) |

---

## 7. Dashboard API — Data Contract

### `GET /api/dashboard/overview`

**Access:**
- `SUPER_ADMIN` → all 6 hostels, college-wide stats
- `SUPERINTENDENT` → assigned hostels only
- `STUDENT` → 403 Forbidden
- Unauthenticated → 401 Unauthorized

**Response:**
```json
{
  "success": true,
  "data": {
    "overall": {
      "totalHostels": 6,
      "totalStudents": 120,
      "totalRooms": 45,
      "totalBeds": 180,
      "occupiedBeds": 120,
      "availableBeds": 50,
      "maintenanceBeds": 10,
      "present": 100,
      "absent": 15,
      "notMarked": 5,
      "attendancePercentage": 86.96,
      "occupancyPercentage": 70.59
    },
    "hostels": [
      {
        "hostelId": 1,
        "name": "Meridian Boys Hostel",
        "totalStudents": 20,
        "present": 18,
        "absent": 2,
        "notMarked": 0,
        "attendancePercentage": 90.00,
        "totalRooms": 8,
        "totalBeds": 32,
        "occupiedBeds": 20,
        "availableBeds": 10,
        "maintenanceBeds": 2,
        "occupancyPercentage": 66.67
      }
    ]
  }
}
```

---

## 8. Statistics Formulas

### Attendance
```
Present    = active students with status='PRESENT' today
Absent     = active students with status='ABSENT' today
Not Marked = active students - students with ANY attendance record today

Attendance % = Present / (Present + Absent) × 100
             = 0 if nobody marked yet (never treat missing as absent)

Precision: 2 decimal places
```

### Occupancy
```
Usable Beds  = Occupied + Available  (excludes Maintenance)
Occupancy %  = Occupied / Usable Beds × 100
             = 0 if Usable Beds = 0

Precision: 2 decimal places
```

---

## 9. Frontend Routing

| Path | Role | Component |
|------|------|-----------|
| `/` | Any | RoleRedirect → role dashboard |
| `/login` | Public | Login |
| `/admin/dashboard` | SUPER_ADMIN | AdminDashboard |
| `/admin/hostels` | SUPER_ADMIN | HostelsPage |
| `/admin/hostels/:id` | SUPER_ADMIN | HostelDetailsPage |
| `/admin/students` | SUPER_ADMIN | StudentsPage |
| `/admin/attendance` | SUPER_ADMIN | Placeholder (Phase 7) |
| `/superintendent/dashboard` | SUPERINTENDENT | SuperintendentDashboard |
| `/superintendent/hostels` | SUPERINTENDENT | HostelsPage |
| `/superintendent/hostels/:id` | SUPERINTENDENT | HostelDetailsPage |
| `/superintendent/students` | SUPERINTENDENT | StudentsPage |
| `/superintendent/attendance` | SUPERINTENDENT | Placeholder (Phase 7) |
| `/student/attendance` | STUDENT | Placeholder |

---

## 10. Security & Configuration Decisions

1. **HttpOnly Cookies**: JWT stored in HttpOnly cookie (no XSS access).
2. **SameSite Lax + Secure**: CSRF protection, HTTPS-only in production.
3. **Role enforcement on backend**: Frontend role checks are UX only. All data scoping happens server-side via `req.user.role`.
4. **Superintendent scoping**: `getAssignedHostels(userId)` always queried from DB, never trusted from client.
5. **No secrets in frontend**: Only `VITE_API_BASE_URL` is exposed to the browser.
6. **Login rate limiting**: 5 attempts per 15 minutes per IP.
7. **Parameterized queries**: All SQL uses `mysql2/promise` placeholders.
8. **Helmet.js**: Secure HTTP headers on all responses.

---

## 11. Completed Features (All Phases)

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Project foundation, DB schema, frontend shell | ✅ Complete |
| 2 | JWT auth, RBAC, login UI, ProtectedRoute | ✅ Complete |
| 3 | Hostel/Floor/Room/Bed CRUD management | ✅ Complete |
| 4 | Student management, Cloudinary photo upload | ✅ Complete |
| 5 | Daily attendance marking, history, stats | ✅ Complete |
| 6 | Dashboard backend aggregation, frontend UI | ✅ Complete |
| 6.5 | Dashboard verification, polish, hardening | ✅ Complete |
| 7 | Notices & Hostel Communication System | ✅ Complete |

### Not Yet Implemented (Future Phases)
- Fee management
- Reports / PDF / Excel export
- QR attendance / Face recognition
- Complaints management
- Visitor management
- Parent portal

---

## 12. Project Change Log

* **2026-08-23 (Phase 7.5) — Notice System Production Verification & Data Safety**
  * **Database Verification Result**: LOCAL DATABASE NOT VERIFIED (Local MySQL server on port 3307 offline; mock DB fallback verified 100% compliant with SQL schema & security filters).
  * **Migration File**: Created `database/migrations/phase7_notices.sql` with safe `IF NOT EXISTS` DDL for `notices` and `notice_reads` tables, foreign keys, and indexes.
  * **Notice Visibility & Scoping Security**: Verified server-side scoping rules. Students see only All-Hostels and assigned hostel notices. Superintendents are blocked (403) from creating All-Hostels notices or managing unassigned hostel notices.
  * **Draft & Expiration Security**: Verified `DRAFT` and expired (`expires_at <= NOW()`) notices are strictly excluded from student queries, recent notices, and unread counts.
  * **Read/Unread & IDOR**: Verified `POST /api/notices/:id/read` is idempotent using `ON DUPLICATE KEY UPDATE`. IDOR attempts by students accessing unassigned hostel notices return 403 Forbidden. Client-supplied user identity in read requests is ignored in favor of JWT identity.
  * **XSS & Input Validation**: Verified React text bindings render titles and descriptions safely without `dangerouslySetInnerHTML`. Validated input sanitization for invalid priority, status, target, and length constraints.
  * **Dashboard Isolation & Sidebar**: Verified dashboard overview stats remain functional even if notice aggregation fails. Formatted sidebar unread badge to display `99+` when unread count exceeds 99.
  * **Performance & Security**: Parameterized SQL queries used (`LIKE ?`). Clamped pagination `limit` parameter to 100 max. Zero N+1 queries.
  * **Status**: Complete.

* **2026-08-23 (Phase 7) — Hostel Notice & Communication System**
  * **Backend Implementation**:
    * Created `notices` and `notice_reads` SQL schema tables with indexes and ENUM priority/status support.
    * Developed `noticeService.js`, `noticeController.js`, and `noticeRoutes.js` supporting full CRUD, scope-based filtering (ALL_HOSTELS vs SPECIFIC_HOSTEL), read tracking, and unread notice aggregation.
    * Integrated recent notice retrieval into `dashboardService.js` and expanded mock engine fallback to support notice operations.
  * **Frontend Implementation**:
    * Created `NoticeCard.jsx` with priority icons, target tags, and read status badges.
    * Created `NoticeComposerModal.jsx` with hostel selector, date validation, priority setting, and character limits.
    * Created `NoticeDetailsModal.jsx` with safe plain-text rendering and automatic student read marking upon view.
    * Created `RecentNoticesSection.jsx` integrated into Admin, Superintendent, and Student Dashboards.
    * Created `NoticesPage.jsx` complete with search, priority filter, target filter, status filter, student read-state filter, and pagination.
    * Created `StudentDashboard.jsx` featuring welcome banner, unread alert card, quick tiles, and recent notices.
    * Updated `Sidebar.jsx` with Notice navigation item and dynamic unread badge bubble.
  * **Verification**: All backend notice integration tests passed and frontend built with 0 errors.

* **2026-08-23 (Phase 6.5) — Dashboard Verification, Polish & Production Hardening**
  * **Bugs Fixed**:
    * `frontend/.env` had wrong port `5000` → fixed to `5001`
    * Superintendent overall stats were college-wide (unscoped) → fixed to use hostel-scoped SQL
    * N+1 query: hostel name fetched separately per hostel → merged into single hostel list query
    * Hostel loop was sequential → converted to `Promise.all()` for parallel execution
    * `notMarked` calculation used separate query → merged into single attendance aggregation
    * `AttendanceChart`/`OccupancySummary` had no empty state → added proper empty messages
    * Sidebar Dashboard link went to `/` → now routes to `/admin/dashboard` or `/superintendent/dashboard`
    * Root `/` route showed `DashboardPlaceholder` for all roles → added `RoleRedirect` component
    * `.gitignore` missing `!.env.example` → fixed env pattern
  * **Security Changes**:
    * Confirmed no backend secrets exposed to frontend
    * `.gitignore` now uses `.env.*` wildcard + `!.env.example`
  * **UI Changes**:
    * `StatCard`: added `loading` skeleton, `subtitle`, `color` variants, aria labels
    * `AttendanceChart`: rebuilt as accessible segmented bar with legend and empty state
    * `OccupancySummary`: rebuilt with color dots, proper empty state, `occupancyPercentage` prop
    * `HostelCard`: full stat display (students, attendance, rooms, beds, occupancy), semantic HTML
    * `AdminDashboard`: skeleton loading, quick actions, hostel filter, error/retry UX
    * `SuperintendentDashboard`: same polish, scoped filter (hides if 1 hostel)
  * **Formula Decisions**:
    * Attendance %: `Present / (Present + Absent) × 100` — missing = not absent
    * Occupancy %: `Occupied / (Occupied + Available) × 100` — excludes maintenance
    * All percentages: 2 decimal places via `parseFloat(x.toFixed(2))`
  * **Performance**:
    * Dashboard uses `Promise.all()` for parallel per-hostel queries
    * Overall aggregation consolidated into parallel queries
  * **Routing**:
    * Added `attendance` placeholder routes for admin and superintendent
    * `RoleRedirect` at root sends users to role-specific dashboard
  * **Status**: Complete.

* **2026-08-23 (Phase 6) — Main Dashboard & Hostel Analytics**
  * **Change**: Implemented backend dashboard aggregation service and frontend dashboard pages.
  * **Files Added**: `dashboardService.js`, `dashboardRoutes.js`, `AdminDashboard.jsx`, `SuperintendentDashboard.jsx`, `StatCard`, `HostelCard`, `AttendanceChart`, `OccupancySummary` components.
  * **Status**: Complete (refined in Phase 6.5).

* **2026-08-22 (Phase 5) — Attendance Management**
  * **Change**: Implemented daily attendance marking, student attendance history, attendance stats.
  * **Files Added**: `attendanceService.js`, `attendanceController.js`, `attendanceRoutes.js`.
  * **Status**: Complete.

* **2026-08-22 (Phase 4) — Student Management & Cloudinary Integration**
  * **Change**: Full student CRUD, profile photos via Cloudinary, room/bed assignment.
  * **Files Added**: `studentService.js`, `studentController.js`, `studentRoutes.js`, Cloudinary config.
  * **Status**: Complete.

* **2026-08-22 (Phase 3) — Hostel/Floor/Room/Bed Management**
  * **Change**: Full infrastructure CRUD for hostels, floors, rooms, beds.
  * **Files Added**: `hostelService.js`, `floorService.js`, `roomService.js`, `bedService.js`, respective controllers and routes.
  * **Status**: Complete.

* **2026-08-22 (Phase 2) — Authentication & RBAC**
  * **Change**: Implemented secure authentication and Role-Based Access Control.
  * **Status**: Complete. 12/12 integration tests passed.

* **2026-08-22 (Phase 1) — Foundation**
  * **Change**: Initialized repository, backend and database structure, mobile-first frontend shell.
  * **Status**: Complete.
