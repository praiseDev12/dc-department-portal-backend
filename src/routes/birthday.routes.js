import express from 'express';

import { requireAuth } from '../middleware/auth.js';
import { getBirthdays } from '../controllers/birthday.controller.js';

export const birthdayRouter = express.Router();

birthdayRouter.get('/', requireAuth, getBirthdays);
