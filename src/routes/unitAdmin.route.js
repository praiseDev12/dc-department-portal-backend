import express from 'express';
import { validate } from '../middleware/validate.js';
import { registerUnitAdminValidation } from '../validators/unitAdminValidators.js';
import { register } from '../controllers/unitAdmin.controller.js';

export const unitAdminRouter = express.Router();

unitAdminRouter.post(
  '/register',
  registerUnitAdminValidation,
  validate,
  register,
);
