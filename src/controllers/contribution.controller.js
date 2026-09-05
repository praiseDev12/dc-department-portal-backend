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
  try {
    const contribution = await createContribution({
      user: req.user,
      title: req.body.title,
    });

    res.status(201).json(contribution);
  } catch (error) {
    console.error('createContributionController error:', error);
    res
      .status(error.statusCode || error.status || 500)
      .json({ message: error.message || 'Failed to create contribution' });
  }
});

export const addContributionEntryController = asyncHandler(async (req, res) => {
  try {
    const entry = await addContributionEntry({
      user: req.user,
      contributionId: req.params.contributionId,
      memberId: req.body.memberId,
      amount: req.body.amount,
      contributedAt: req.body.contributedAt,
    });

    res.status(201).json(entry);
  } catch (error) {
    console.error('addContributionEntryController error:', error);
    res
      .status(error.statusCode || error.status || 500)
      .json({ message: error.message || 'Failed to add contribution entry' });
  }
});

export const getContributionsController = asyncHandler(async (req, res) => {
  try {
    const contributions = await getContributions({
      user: req.user,
    });

    res.json(contributions);
  } catch (error) {
    console.error('getContributionsController error:', error);
    res
      .status(error.statusCode || error.status || 500)
      .json({ message: error.message || 'Failed to load contributions' });
  }
});

export const getContributionController = asyncHandler(async (req, res) => {
  try {
    const contribution = await getContribution({
      user: req.user,
      contributionId: req.params.contributionId,
    });

    res.json(contribution);
  } catch (error) {
    console.error('getContributionController error:', error);
    res
      .status(error.statusCode || error.status || 500)
      .json({ message: error.message || 'Failed to load contribution' });
  }
});

export const updateContributionEntryController = asyncHandler(
  async (req, res) => {
    try {
      const entry = await updateContributionEntry({
        user: req.user,
        contributionId: req.params.contributionId,
        entryId: req.params.entryId,
        memberId: req.body.memberId,
        amount: req.body.amount,
        contributedAt: req.body.contributedAt,
      });

      res.json(entry);
    } catch (error) {
      console.error('updateContributionEntryController error:', error);
      res
        .status(error.statusCode || error.status || 500)
        .json({
          message: error.message || 'Failed to update contribution entry',
        });
    }
  },
);

export const deleteContributionEntryController = asyncHandler(
  async (req, res) => {
    try {
      const entry = await deleteContributionEntry({
        user: req.user,
        contributionId: req.params.contributionId,
        entryId: req.params.entryId,
      });

      res.json({
        message: 'Contribution entry deleted successfully',
        entry,
      });
    } catch (error) {
      console.error('deleteContributionEntryController error:', error);
      res
        .status(error.statusCode || error.status || 500)
        .json({
          message: error.message || 'Failed to delete contribution entry',
        });
    }
  },
);

export const updateContributionController = asyncHandler(async (req, res) => {
  try {
    const contribution = await updateContribution({
      user: req.user,
      contributionId: req.params.contributionId,
      title: req.body.title,
    });

    res.json(contribution);
  } catch (error) {
    console.error('updateContributionController error:', error);
    res
      .status(error.statusCode || error.status || 500)
      .json({ message: error.message || 'Failed to update contribution' });
  }
});

export const deleteContributionController = asyncHandler(async (req, res) => {
  try {
    const result = await deleteContribution({
      user: req.user,
      contributionId: req.params.contributionId,
    });

    res.json(result);
  } catch (error) {
    console.error('deleteContributionController error:', error);
    res
      .status(error.statusCode || error.status || 500)
      .json({ message: error.message || 'Failed to delete contribution' });
  }
});
