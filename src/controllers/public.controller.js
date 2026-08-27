import { asyncHandler } from '../utils/asyncHandler.js';
import {
  listDepartments,
  listUnitsForDepartment,
} from '../services/public.service.js';

export const getDepartments = asyncHandler(async (req, res) => {
  const departments = await listDepartments();
  res.json({ departments });
});

export const getUnitsForDepartment = asyncHandler(async (req, res) => {
  const units = await listUnitsForDepartment(req.params.departmentId);
  res.json({ units });
});
