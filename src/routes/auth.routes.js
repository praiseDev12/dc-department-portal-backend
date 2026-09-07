import express from 'express';
import { validate } from '../middleware/validate.js';
import {
  onboardValidation,
  registerValidation,
  loginValidation,
} from '../validators/authValidators.js';
import {
  onboard,
  registerHandler,
  loginHandler,
  forgotPasswordController,
  resetPasswordController,
} from '../controllers/auth.controller.js';

export const authRouter = express.Router();

authRouter.post('/onboard', onboardValidation, validate, onboard);
authRouter.post('/register', registerValidation, validate, registerHandler);
authRouter.post('/login', loginValidation, validate, loginHandler);
authRouter.post('/forgot-password', forgotPasswordController);
authRouter.post('/reset-password/:token', resetPasswordController);
