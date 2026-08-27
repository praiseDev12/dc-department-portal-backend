import express from 'express';
import { validate } from '../middleware/validate.js';
import {
  onboardValidation,
  loginValidation,
} from '../validators/authValidators.js';
import { onboard, login } from '../controllers/auth.controller.js';

export const authRouter = express.Router();

authRouter.post('/onboard', onboardValidation, validate, onboard);
authRouter.post('/login', loginValidation, validate, login);
