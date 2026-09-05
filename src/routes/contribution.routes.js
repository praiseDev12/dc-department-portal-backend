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
} from '../controllers/contribution.controller.js';

export const contributionRouter = express.Router();

contributionRouter.use(requireAuth, requireRole('main_admin'));

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
