const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const db = require('./config/db');

// Import routes
const healthRoutes = require('./routes/healthRoutes');
const hostelRoutes = require('./routes/hostelRoutes');
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const floorRoutes = require('./routes/floorRoutes');
const roomRoutes = require('./routes/roomRoutes');
const bedRoutes = require('./routes/bedRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

// Initialize express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: env.NODE_ENV === 'production' 
    ? false // Set your production domain here when ready
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'], // Vite default and common local ports
  credentials: true
}));

// Body parsing & Cookie parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Test DB Connection on startup
db.testConnection().then((connected) => {
  if (!connected) {
    console.warn('\x1b[33m%s\x1b[0m', 'Warning: Server started but database is offline/unreachable.');
  }
});

const noticeRoutes = require('./routes/noticeRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const visitorRoutes = require('./routes/visitorRoutes');
const messRoutes = require('./routes/messRoutes');
const feeRoutes = require('./routes/feeRoutes');
const reportRoutes = require('./routes/reportRoutes');
const allocationRoutes = require('./routes/allocationRoutes');

// Mounting API Routes
app.use('/api/health', healthRoutes);
app.use('/api/hostels', hostelRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/floors', floorRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/beds', bedRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/notices', noticeRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/mess', messRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/allocations', allocationRoutes);


// Base route for API documentation / welcome
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the College Hostel Management System API',
    version: '1.0.0',
    status: 'ACTIVE'
  });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('\x1b[31m%s\x1b[0m', 'Express global error handler caught error:');
  console.error(err.stack || err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: env.NODE_ENV === 'development' ? message : 'An unexpected error occurred.',
    stack: env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Handle 404 Route Not Found
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.originalUrl}`
  });
});

// Start listening if run directly
if (require.main === module) {
  app.listen(env.PORT, () => {
    console.log(`Server is running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    console.log(`Health endpoint available at http://localhost:${env.PORT}/api/health`);
    console.log(`Hostels endpoint available at http://localhost:${env.PORT}/api/hostels`);
    console.log(`Auth endpoints mounted at http://localhost:${env.PORT}/api/auth`);
    console.log(`Students endpoints mounted at http://localhost:${env.PORT}/api/students`);
  });
}

module.exports = app;
