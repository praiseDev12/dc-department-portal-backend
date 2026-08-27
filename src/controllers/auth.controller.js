import { asyncHandler } from '../utils/asyncHandler.js';
import { onboardDepartment, loginUser } from '../services/auth.service.js';

export const onboard = asyncHandler(async (req, res) => {
  const result = await onboardDepartment(req.body);
  console.log(result);
  res.status(result?.status || 201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body);
  res.status(result.status || 200).json(result);
});
