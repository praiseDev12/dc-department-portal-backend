import { asyncHandler } from '../utils/asyncHandler.js';
import {
  onboardDepartment,
  register,
  login,
  forgotPassword,
  resetPassword,
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

export async function forgotPasswordController(req, res) {
  try {
    const { email, department } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Email is required',
      });
    }

    if (!department) {
      return res.status(400).json({
        message: 'Department is required',
      });
    }

    const result = await forgotPassword({
      email,
      department,
    });

    return res.status(result.status).json({
      message: result.message,
    });
  } catch (error) {
    console.error('Forgot password error:', error);

    return res.status(500).json({
      message: 'Unable to process password reset request',
    });
  }
}

export async function resetPasswordController(req, res) {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({
        message: 'Reset token is required',
      });
    }

    if (!password) {
      return res.status(400).json({
        message: 'Password is required',
      });
    }

    const result = await resetPassword({
      token,
      password,
    });

    return res.status(result.status).json({
      message: result.message,
    });
  } catch (error) {
    console.error('Reset password error:', error);

    return res.status(500).json({
      message: 'Unable to reset password',
    });
  }
}
