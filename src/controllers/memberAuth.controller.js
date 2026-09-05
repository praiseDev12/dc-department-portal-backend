import { asyncHandler } from '../utils/asyncHandler.js';
import { registerMember, loginMember } from '../services/memberAuth.service.js';

export const register = asyncHandler(async (req, res) => {
  try {
    const result = await registerMember(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('register error:', error);
    res
      .status(error.statusCode || error.status || 500)
      .json({ message: error.message || 'Failed to register' });
  }
});

export const login = asyncHandler(async (req, res) => {
  try {
    const result = await loginMember(req.body);
    res.json(result);
  } catch (error) {
    console.error('login error:', error);
    res
      .status(error.statusCode || error.status || 500)
      .json({ message: error.message || 'Failed to log in' });
  }
});
