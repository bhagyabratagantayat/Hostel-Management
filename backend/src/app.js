const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const db = require('./config/db');

// Import routes
const healthRoutes = require('./routes/healthRoutes');
const hostelRoutes = require('./routes/hostelRoutes');

// Initialize express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: env.NODE_ENV === 'production' 
    ? false // Set your production domain here when ready
    : ['http://localhost:5173', 'http://localhost:3000'], // Vite default and common local ports
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test DB Connection on startup
db.testConnection().then((connected) => {
  if (!connected) {
    console.warn('\x1b[33m%s\x1b[0m', 'Warning: Server started but database is offline/unreachable.');
  }
});

// Mounting API Routes
app.use('/api/health', healthRoutes);
app.use('/api/hostels', hostelRoutes);

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

  const statusCode = err.statusCode || 500;
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

// Start listening
const server = app.listen(env.PORT, () => {
  console.log(`Server is running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  console.log(`Health endpoint available at http://localhost:${env.PORT}/api/health`);
  console.log(`Hostels endpoint available at http://localhost:${env.PORT}/api/hostels`);
});

module.exports = app;
