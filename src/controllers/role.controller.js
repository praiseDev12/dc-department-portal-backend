import { asyncHandler } from '../utils/asyncHandler.js';
import * as roleService from '../services/role.service.js';

export const makeUnitHead = asyncHandler(async (req, res) => {
  const member = await roleService.assignUnitHead(
    req.params.memberId,
    req.user,
  );
  res.json({ message: 'Member promoted to unit head', member });
});

export const removeUnitHead = asyncHandler(async (req, res) => {
  const member = await roleService.revokeUnitHead(
    req.params.memberId,
    req.user,
  );
  res.json({ message: 'Unit head role removed', member });
});

export const makeMainAdmin = asyncHandler(async (req, res) => {
  const member = await roleService.assignMainAdmin(
    req.params.memberId,
    req.user,
  );
  res.json({ message: 'Member promoted to main admin', member });
});

export const removeMainAdmin = asyncHandler(async (req, res) => {
  const member = await roleService.revokeMainAdmin(
    req.params.memberId,
    req.user,
  );
  res.json({ message: 'Main admin role removed', member });
});
