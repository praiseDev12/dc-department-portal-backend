import { asyncHandler } from '../utils/asyncHandler.js';
import {
  onboardDepartment,
  register,
  login,
} from '../services/auth.service.js';

export const onboard = asyncHandler(async (req, res) => {
  try {
    const result = await onboardDepartment(req.body);
    res.status(result.status).json(result);
  } catch (error) {
    console.error('onboard error:', error);
    res
      .status(error.statusCode || error.status || 500)
      .json({ message: error.message || 'Failed to onboard department' });
  }
});

export const registerHandler = asyncHandler(async (req, res) => {
  try {
    const result = await register(req.body);
    res.status(result.status).json(result);
  } catch (error) {
    console.error('registerHandler error:', error);
    res
      .status(error.statusCode || error.status || 500)
      .json({ message: error.message || 'Failed to register' });
  }
});

export const loginHandler = asyncHandler(async (req, res) => {
  try {
    const result = await login(req.body);
    res.status(result.status).json(result);
  } catch (error) {
    console.error('loginHandler error:', error);
    res
      .status(error.statusCode || error.status || 500)
      .json({ message: error.message || 'Failed to log in' });
  }
});
