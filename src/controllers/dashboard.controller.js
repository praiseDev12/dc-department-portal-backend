import { asyncHandler } from '../utils/asyncHandler.js';
import { getDashboardSummary } from '../services/dashboard.service.js';

export const getSummary = asyncHandler(async (req, res) => {
  try {
    const { role, department, unit } = req.user;

    const summary = await getDashboardSummary({
      role,
      departmentId: department,
      unitId: unit,
    });

    res.json(summary);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ success: false, message: 'Server Error', err: err.message });
  }
});
