import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getSummary } from '../controllers/dashboard.controller.js';

export const dashboardRouter = express.Router();

dashboardRouter.get('/summary', requireAuth, getSummary);
