import {
  createContribution,
  addContributionEntry,
  getContributions,
  getContribution,
  updateContributionEntry,
  deleteContributionEntry,
  updateContribution,
  deleteContribution,
} from '../services/contribution.service.js';

import { asyncHandler } from '../utils/asyncHandler.js';

export const createContributionController = asyncHandler(async (req, res) => {
  const contribution = await createContribution({
    user: req.user,
    title: req.body.title,
  });

  res.status(201).json(contribution);
});

export const addContributionEntryController = asyncHandler(async (req, res) => {
  const entry = await addContributionEntry({
    user: req.user,
    contributionId: req.params.contributionId,
    memberId: req.body.memberId,
    amount: req.body.amount,
    contributedAt: req.body.contributedAt,
  });

  res.status(201).json(entry);
});

export const getContributionsController = asyncHandler(async (req, res) => {
  const contributions = await getContributions({
    user: req.user,
  });

  res.json(contributions);
});

export const getContributionController = asyncHandler(async (req, res) => {
  const contribution = await getContribution({
    user: req.user,
    contributionId: req.params.contributionId,
  });

  res.json(contribution);
});

export const updateContributionEntryController = asyncHandler(
  async (req, res) => {
    const entry = await updateContributionEntry({
      user: req.user,
      contributionId: req.params.contributionId,
      entryId: req.params.entryId,
      memberId: req.body.memberId,
      amount: req.body.amount,
      contributedAt: req.body.contributedAt,
    });

    res.json(entry);
  },
);

export const deleteContributionEntryController = asyncHandler(
  async (req, res) => {
    const entry = await deleteContributionEntry({
      user: req.user,
      contributionId: req.params.contributionId,
      entryId: req.params.entryId,
    });

    res.json({
      message: 'Contribution entry deleted successfully',
      entry,
    });
  },
);

export const updateContributionController = asyncHandler(async (req, res) => {
  const contribution = await updateContribution({
    user: req.user,
    contributionId: req.params.contributionId,
    title: req.body.title,
  });

  res.json(contribution);
});

export const deleteContributionController = asyncHandler(async (req, res) => {
  const result = await deleteContribution({
    user: req.user,
    contributionId: req.params.contributionId,
  });

  res.json(result);
});
