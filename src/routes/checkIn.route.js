import express from 'express';

import { requireAuth, requireRole } from '../middleware/auth.js';

import {
  getServices,
  createService,
  updateService,
  deleteService,
  generateCheckInCode,
  getTodaySessions,
  checkIn,
  getMyAttendance,
  getLastServiceAttendance,
  activateService,
} from '../controllers/checkIn.controller.js';

export const checkInRouter = express.Router();

checkInRouter.use(requireAuth);

// Services
checkInRouter.get('/services', getServices);

checkInRouter.post('/services', requireRole('main_admin'), createService);

checkInRouter.patch(
  '/services/:serviceId',
  requireRole('main_admin'),
  updateService,
);

checkInRouter.delete(
  '/services/:serviceId',
  requireRole('main_admin'),
  deleteService,
);

checkInRouter.patch(
  '/services/:serviceId/activate',
  requireRole('main_admin'),
  activateService,
);

// Today's generated sessions
checkInRouter.get('/sessions/today', getTodaySessions);

// Admin generates/displays today's code
checkInRouter.post('/services/:serviceId/generate-code', generateCheckInCode);

// Member checks themselves in
checkInRouter.post('/check-in', checkIn);

// Member attendance history
checkInRouter.get('/my-attendance', getMyAttendance);

checkInRouter.get(
  '/last-service',
  requireRole('main_admin', 'unit_admin'),
  getLastServiceAttendance,
);
