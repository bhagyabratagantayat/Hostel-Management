const express = require('express');
const router = express.Router();
const hostelController = require('../controllers/hostelController');

router.get('/', hostelController.getAllHostels);

module.exports = router;
