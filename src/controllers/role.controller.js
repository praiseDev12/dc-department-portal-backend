import { asyncHandler } from '../utils/asyncHandler.js';
import * as roleService from '../services/role.service.js';

export const makeUnitHead = asyncHandler(async (req, res) => {
  try {
    const member = await roleService.assignUnitHead(
      req.params.memberId,
      req.user,
    );
    res.json({ message: 'Member promoted to unit head', member });
  } catch (error) {
    console.error('makeUnitHead error:', error);
    res
      .status(error.statusCode || error.status || 500)
      .json({ message: error.message || 'Failed to promote to unit head' });
  }
});

export const removeUnitHead = asyncHandler(async (req, res) => {
  try {
    const member = await roleService.revokeUnitHead(
      req.params.memberId,
      req.user,
    );
    res.json({ message: 'Unit head role removed', member });
  } catch (error) {
    console.error('removeUnitHead error:', error);
    res
      .status(error.statusCode || error.status || 500)
      .json({ message: error.message || 'Failed to remove unit head role' });
  }
});

export const makeMainAdmin = asyncHandler(async (req, res) => {
  try {
    const member = await roleService.assignMainAdmin(
      req.params.memberId,
      req.user,
    );
    res.json({ message: 'Member promoted to main admin', member });
  } catch (error) {
    console.error('makeMainAdmin error:', error);
    res
      .status(error.statusCode || error.status || 500)
      .json({ message: error.message || 'Failed to promote to main admin' });
  }
});

export const removeMainAdmin = asyncHandler(async (req, res) => {
  try {
    const member = await roleService.revokeMainAdmin(
      req.params.memberId,
      req.user,
    );
    res.json({ message: 'Main admin role removed', member });
  } catch (error) {
    console.error('removeMainAdmin error:', error);
    res
      .status(error.statusCode || error.status || 500)
      .json({ message: error.message || 'Failed to remove main admin role' });
  }
});
