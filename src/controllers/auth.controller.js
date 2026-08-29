import { asyncHandler } from '../utils/asyncHandler.js';
import {
  onboardDepartment,
  register,
  login,
} from '../services/auth.service.js';

export const onboard = asyncHandler(async (req, res) => {
  const result = await onboardDepartment(req.body);
  res.status(result.status).json(result);
});

export const registerHandler = asyncHandler(async (req, res) => {
  const result = await register(req.body);
  res.status(result.status).json(result);
});

export const loginHandler = asyncHandler(async (req, res) => {
  const result = await login(req.body);
  res.status(result.status).json(result);
});
