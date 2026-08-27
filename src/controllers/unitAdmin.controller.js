import { asyncHandler } from '../utils/asyncHandler.js';
import { registerUnitAdmin } from '../services/unitAdmin.service.js';

export const register = asyncHandler(async (req, res) => {
  const result = await registerUnitAdmin(req.body);
  res.status(201).json(result);
});
