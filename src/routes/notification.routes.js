import express from 'express';

import { requireAuth } from '../middleware/auth.js';

import { registerToken } from '../controllers/notification.controller.js';

export const notificationRouter = express.Router();

notificationRouter.post('/token', requireAuth, registerToken);
