import express from 'express';

import { requireAuth, requireRole } from '../middleware/auth.js';

import {
  createRosterEvent,
  deactivateRosterEvent,
  getRosterEvents,
  updateRosterEvent,
} from '../controllers/rosterEvent.controller.js';

export const rosterEventRouter = express.Router();

rosterEventRouter.use(requireAuth);

rosterEventRouter.post(
  '/',
  requireRole('unit_admin', 'main_admin'),
  createRosterEvent,
);

rosterEventRouter.get(
  '/template/:templateId',
  requireRole('unit_admin', 'main_admin'),
  getRosterEvents,
);

rosterEventRouter.patch(
  '/:eventId',
  requireRole('unit_admin', 'main_admin'),
  updateRosterEvent,
);

rosterEventRouter.patch(
  '/:eventId/deactivate',
  requireRole('unit_admin', 'main_admin'),
  deactivateRosterEvent,
);
