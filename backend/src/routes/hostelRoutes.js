const express = require('express');
const router = express.Router();
const hostelController = require('../controllers/hostelController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/', requireAuth, hostelController.getAllHostels);

module.exports = router;
