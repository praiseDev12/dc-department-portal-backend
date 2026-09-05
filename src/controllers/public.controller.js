import { asyncHandler } from '../utils/asyncHandler.js';
import {
  listDepartments,
  listUnitsForDepartment,
} from '../services/public.service.js';

export const getDepartments = asyncHandler(async (req, res) => {
  try {
    const departments = await listDepartments();
    res.json({ departments });
  } catch (error) {
    console.error('getDepartments error:', error);
    res
      .status(error.statusCode || error.status || 500)
      .json({ message: error.message || 'Failed to load departments' });
  }
});

export const getUnitsForDepartment = asyncHandler(async (req, res) => {
  try {
    const units = await listUnitsForDepartment(req.params.departmentId);
    res.json({ units });
  } catch (error) {
    console.error('getUnitsForDepartment error:', error);
    res
      .status(error.statusCode || error.status || 500)
      .json({ message: error.message || 'Failed to load units' });
  }
});
