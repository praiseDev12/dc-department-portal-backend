import express from 'express';
import { validate } from '../middleware/validate.js';
import {
  registerValidation,
  loginValidation,
} from '../validators/memberAuthValidators.js';
import { register, login } from '../controllers/memberAuth.controller.js';

export const memberAuthRouter = express.Router();

memberAuthRouter.post('/register', registerValidation, validate, register);
memberAuthRouter.post('/login', loginValidation, validate, login);
