import express from 'express';

import { requireAuth, requireRole } from '../middleware/auth.js';

import {
  addRosterAssignment,
  deleteDraftRoster,
  generateMonthlyRoster,
  getMonthlyRoster,
  getMonthlyRosterByTemplateMonth,
  getMyRoster,
  getPublishedRosters,
  getRosterTemplates,
  publishMonthlyRoster,
  removeRosterAssignment,
  resetRosterData,
  updateRosterAssignment,
} from '../controllers/roster.controller.js';

import {
  createRosterTemplate,
  deleteRosterTemplate,
  updateRosterTemplate,
} from '../controllers/rosterTemplate.controller.js';

export const rosterRouter = express.Router();

rosterRouter.use(requireAuth);

rosterRouter.get(
  '/templates',
  requireRole('unit_admin', 'main_admin'),
  getRosterTemplates,
);

rosterRouter.get(
  '/published',
  requireRole('unit_admin', 'main_admin'),
  getPublishedRosters,
);

// Create a reusable roster template.
rosterRouter.post(
  '/templates',
  requireRole('unit_admin', 'main_admin'),
  createRosterTemplate,
);

rosterRouter.patch(
  '/templates/:templateId',
  requireRole('unit_admin', 'main_admin'),
  updateRosterTemplate,
);

rosterRouter.delete(
  '/templates/:templateId',
  requireRole('unit_admin', 'main_admin'),
  deleteRosterTemplate,
);

rosterRouter.get(
  '/template/:templateId/month/:month',
  requireRole('unit_admin', 'main_admin'),
  getMonthlyRosterByTemplateMonth,
);

// Generate a monthly roster draft.
rosterRouter.post(
  '/generate',
  requireRole('unit_admin', 'main_admin'),
  generateMonthlyRoster,
);

rosterRouter.get('/my-roster', getMyRoster);

rosterRouter.get(
  '/:rosterId',
  requireRole('unit_admin', 'main_admin'),
  getMonthlyRoster,
);

rosterRouter.post(
  '/:rosterId/occurrences/:occurrenceId/assignments',
  requireRole('unit_admin', 'main_admin'),
  addRosterAssignment,
);

rosterRouter.patch(
  '/:rosterId/occurrences/:occurrenceId/assignments/:assignmentId',
  requireRole('unit_admin', 'main_admin'),
  updateRosterAssignment,
);

rosterRouter.delete(
  '/reset',
  requireRole('unit_admin', 'main_admin'),
  resetRosterData,
);

rosterRouter.delete(
  '/:rosterId/occurrences/:occurrenceId/assignments/:assignmentId',
  requireRole('unit_admin', 'main_admin'),
  removeRosterAssignment,
);

rosterRouter.patch(
  '/:rosterId/publish',
  requireRole('unit_admin', 'main_admin'),
  publishMonthlyRoster,
);

rosterRouter.delete(
  '/:rosterId',
  requireRole('unit_admin', 'main_admin'),
  deleteDraftRoster,
);
