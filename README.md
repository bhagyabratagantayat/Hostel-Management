# College Hostel Management System (CHMS)

A robust, production-ready full-stack application built to streamline room bookings, attendance, notification boards, and profile management for university hostels.

## Features (Planned & Under Development)
- **Multi-Hostel Directory**: Management of 6 independent campuses (boys and girls branches).
- **Floor-Room-Bed Allocation**: Normalized tracking to prevent double-booking.
- **Superintendent Oversight**: Assignment mapping for wardens to manage single/multiple buildings.
- **Direct Image Uploads**: Cloudinary-powered profile photo storage.
- **Roll-Call & Attendance**: Daily attendance check records.
- **Announcement Board**: Multi-hostel notices broadcast.

---

## 🛠️ Technology Stack
- **Frontend**: React (Vite), Axios, Tailwind CSS (Pending confirmation), Responsive Vanilla CSS Core
- **Backend**: Node.js, Express, Helmet, CORS, Dotenv, MySQL (`mysql2/promise`)
- **Database**: MySQL (Hosted on Hostinger)
- **Media Hosting**: Cloudinary

---

## 📂 Project Structure
```
Hostel Management/
├── BRAIN.md                # Persistent project details & Change Log
├── README.md                # Quickstart & setup documentation
├── .gitignore               # Multi-env git rule filters
├── .env.example             # Clean environment configuration keys
│
├── database/
│   ├── schema.sql           # MySQL database schema definition
│   └── seed.sql             # MySQL default seed roles and hostels
│
├── backend/                 # Express REST API
│   ├── src/
│   │   ├── config/          # Environment variables validation, database and Cloudinary setup
│   │   ├── controllers/     # Route controller actions (Health check, Hostels)
│   │   ├── routes/          # Express Router definition
│   │   └── app.js           # Server initializer
│   └── package.json
│
└── frontend/                # React (Vite) User Portal
    ├── src/
    │   ├── components/      # UI components (Navbar, Sidebar, Card, Button, Input, Loading, Error)
    │   ├── layouts/         # Layout modules (DashboardLayout)
    │   ├── pages/           # Pages (DashboardPlaceholder)
    │   ├── services/        # Axios API configurations
    │   ├── App.jsx          # Root view mount
    │   └── main.jsx         # React application initializer
    └── package.json
```

---

## 🚀 Installation & Local Setup

### 1. Database Setup
1. Open your MySQL client (local or Hostinger phpMyAdmin).
2. Execute the schema statements in [database/schema.sql](file:///d:/TEST%20PROJECT/Hostel%20Management/database/schema.sql) to initialize all tables, foreign keys, and indexes.
3. Execute [database/seed.sql](file:///d:/TEST%20PROJECT/Hostel%20Management/database/seed.sql) to populate system roles and the six default hostels.

### 2. Environment Configuration
Create a `.env` file in the root workspace directory matching the variables in `.env.example`:
```env
# Server
PORT=5000
NODE_ENV=development

# MySQL DB
DB_HOST=your_hostinger_or_local_db_host
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=hostel_management

# JWT (Authentication)
JWT_SECRET=your_jwt_secret_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

### 3. Backend Setup
1. Open a terminal in the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server (runs nodemon):
   ```bash
   npm run dev
   ```

The backend server is accessible at `http://localhost:5000`. You can check:
* API Health Status: `http://localhost:5000/api/health`
* Seeded Hostels: `http://localhost:5000/api/hostels`

### 4. Frontend Setup
1. Open a terminal in the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` if not already done:
   ```bash
   cp .env.example .env
   ```
4. Start the development hot reload server:
   ```bash
   npm run dev
   ```

The frontend client is accessible at `http://localhost:5173`.

---

## 🔒 Git Security Protocol
- Private secrets and passwords must **never** be hard-coded in React or committed to git.
- Verify that your local `.env` is ignored by checking `git status` to ensure it is not tracked.

---

## 📱 Mobile-First Guidelines
- All interactive controls (buttons, navigation elements) are touch-friendly with a minimum size of 44x44px.
- Grid structures adapt from single column on small mobile screens to multiple columns on desktop.
- Responsive Sidebar defaults to a sliding drawer on mobile and sits fixed on the left on desktop screen widths (>1024px).
