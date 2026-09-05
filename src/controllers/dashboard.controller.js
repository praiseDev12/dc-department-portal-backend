import { asyncHandler } from '../utils/asyncHandler.js';
import { getDashboardSummary } from '../services/dashboard.service.js';

export const getSummary = asyncHandler(async (req, res) => {
  try {
    // Assumes your admin auth middleware attaches req.user with these fields
    // (matching the shape returned from login: role, department, unit).
    // Adjust field names here if your middleware attaches it differently.
    const { role, department, unit } = req.user;

    const summary = await getDashboardSummary({
      role,
      departmentId: department,
      unitId: unit,
    });

    res.json(summary);
  } catch (error) {
    console.error('getSummary error:', error);
    res
      .status(error.statusCode || error.status || 500)
      .json({ message: error.message || 'Failed to load dashboard summary' });
  }
});
