const hostelService = require('../services/hostelService');

/**
 * Retrieves all hostels, filtered by user's role and assignments.
 */
const getAllHostels = async (req, res, next) => {
  try {
    const hostels = await hostelService.getAllHostels(req.user);
    return res.status(200).json({
      success: true,
      count: hostels.length,
      data: hostels
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves a single hostel by ID.
 */
const getHostelById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hostel = await hostelService.getHostelById(id, req.user);
    return res.status(200).json({
      success: true,
      data: hostel
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Creates a new hostel (Super Admin only).
 */
const createHostel = async (req, res, next) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only Super Admins can create hostels.'
      });
    }

    const hostel = await hostelService.createHostel(req.body);
    return res.status(201).json({
      success: true,
      data: hostel
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Updates a hostel (Super Admin only).
 */
const updateHostel = async (req, res, next) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only Super Admins can update hostels.'
      });
    }

    const { id } = req.params;
    const hostel = await hostelService.updateHostel(id, req.body);
    return res.status(200).json({
      success: true,
      data: hostel
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Safely deletes a hostel (Super Admin only).
 */
const deleteHostel = async (req, res, next) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only Super Admins can delete hostels.'
      });
    }

    const { id } = req.params;
    await hostelService.deleteHostel(id);
    return res.status(200).json({
      success: true,
      message: 'Hostel deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves summary statistics for a hostel.
 */
const getHostelSummary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const summary = await hostelService.getHostelSummary(id, req.user);
    return res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllHostels,
  getHostelById,
  createHostel,
  updateHostel,
  deleteHostel,
  getHostelSummary
};
