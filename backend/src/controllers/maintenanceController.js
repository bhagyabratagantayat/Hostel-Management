const maintenanceService = require('../services/maintenanceService');

const createRequest = async (req, res, next) => {
  try {
    const record = await maintenanceService.createMaintenanceRequest(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Maintenance request submitted successfully.',
      data: record
    });
  } catch (error) {
    next(error);
  }
};

const getRequests = async (req, res, next) => {
  try {
    const result = await maintenanceService.getMaintenanceRequests(req.query, req.user);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getRequestById = async (req, res, next) => {
  try {
    const record = await maintenanceService.getMaintenanceById(req.params.id, req.user);
    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status, resolutionNote } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status field is required.' });
    }
    const record = await maintenanceService.updateMaintenanceStatus(req.params.id, status, resolutionNote, req.user);
    res.json({
      success: true,
      message: `Maintenance request status updated to ${status}.`,
      data: record
    });
  } catch (error) {
    next(error);
  }
};

const assignStaff = async (req, res, next) => {
  try {
    const { assigned_to } = req.body;
    if (!assigned_to) {
      return res.status(400).json({ success: false, message: 'assigned_to user ID is required.' });
    }
    const record = await maintenanceService.assignMaintenance(req.params.id, assigned_to, req.user);
    res.json({
      success: true,
      message: 'Maintenance request assigned successfully.',
      data: record
    });
  } catch (error) {
    next(error);
  }
};

const updatePriority = async (req, res, next) => {
  try {
    const { priority, reason } = req.body;
    if (!priority) {
      return res.status(400).json({ success: false, message: 'Priority field is required.' });
    }
    const record = await maintenanceService.updateMaintenancePriority(req.params.id, priority, reason, req.user);
    res.json({
      success: true,
      message: 'Maintenance request priority updated successfully.',
      data: record
    });
  } catch (error) {
    next(error);
  }
};

const addUpdate = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }
    const record = await maintenanceService.addMaintenanceUpdate(req.params.id, message, req.user);
    res.json({
      success: true,
      message: 'Update note added successfully.',
      data: record
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequest,
  getRequests,
  getRequestById,
  updateStatus,
  assignStaff,
  updatePriority,
  addUpdate
};
