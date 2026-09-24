import express from 'express';

import { requireAuth, requireRole } from '../middleware/auth.js';

import {
  createContributionController,
  addContributionEntryController,
  getContributionsController,
  getContributionController,
  updateContributionEntryController,
  deleteContributionEntryController,
  updateContributionController,
  deleteContributionController,
  getMyContributionsController,
} from '../controllers/contribution.controller.js';

export const contributionRouter = express.Router();

// All contribution routes require authentication.
contributionRouter.use(requireAuth);

// Member-specific contribution history.
contributionRouter.get('/my-contributions', getMyContributionsController);

// Admin-only contribution management.
contributionRouter.use(requireRole('main_admin'));

contributionRouter.get('/', getContributionsController);

contributionRouter.post('/', createContributionController);

contributionRouter.get('/:contributionId', getContributionController);

contributionRouter.post(
  '/:contributionId/entries',
  addContributionEntryController,
);

contributionRouter.patch(
  '/:contributionId/entries/:entryId',
  updateContributionEntryController,
);

contributionRouter.delete(
  '/:contributionId/entries/:entryId',
  deleteContributionEntryController,
);

contributionRouter.patch('/:contributionId', updateContributionController);

contributionRouter.delete('/:contributionId', deleteContributionController);
