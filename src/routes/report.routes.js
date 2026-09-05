import express from 'express';

import { requireAuth, requireRole } from '../middleware/auth.js';
import { generateReport } from '../controllers/reports.controller.js';

export const reportsRouter = express.Router();

reportsRouter.get(
  '/generate',
  requireAuth,
  requireRole('main_admin'),
  generateReport,
);
