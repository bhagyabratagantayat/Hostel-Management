const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.post('/', maintenanceController.createRequest);
router.get('/', maintenanceController.getRequests);
router.get('/:id', maintenanceController.getRequestById);
router.patch('/:id/status', maintenanceController.updateStatus);
router.patch('/:id/assign', requireRole('SUPER_ADMIN', 'SUPERINTENDENT'), maintenanceController.assignStaff);
router.patch('/:id/priority', requireRole('SUPER_ADMIN', 'SUPERINTENDENT'), maintenanceController.updatePriority);
router.post('/:id/updates', maintenanceController.addUpdate);

module.exports = router;
