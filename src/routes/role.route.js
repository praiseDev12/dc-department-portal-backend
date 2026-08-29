import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  makeUnitHead,
  removeUnitHead,
  makeMainAdmin,
  removeMainAdmin,
} from '../controllers/role.controller.js';

export const roleRouter = express.Router();

roleRouter.use(requireAuth, requireRole('main_admin'));
roleRouter.patch('/:memberId/make-unit-head', makeUnitHead);
roleRouter.patch('/:memberId/remove-unit-head', removeUnitHead);
roleRouter.patch('/:memberId/make-main-admin', makeMainAdmin);
roleRouter.patch('/:memberId/remove-main-admin', removeMainAdmin);
