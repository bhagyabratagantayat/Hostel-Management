const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

// Get current student's own profile
router.get('/profile/me', requireAuth, requireRole('STUDENT'), studentController.getMyProfile);

// Get specific student by ID (requires SUPER_ADMIN or SUPERINTENDENT, or ownership validation handled inside the controller)
router.get('/:id', requireAuth, studentController.getStudentById);

module.exports = router;
