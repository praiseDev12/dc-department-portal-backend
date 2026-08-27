import { asyncHandler } from '../utils/asyncHandler.js';
import { registerMember, loginMember } from '../services/memberAuth.service.js';

export const register = asyncHandler(async (req, res) => {
  const result = await registerMember(req.body);
  res.status(result?.status || 201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await loginMember(req.body);
  res.status(result?.status || 200).json(result);
});
