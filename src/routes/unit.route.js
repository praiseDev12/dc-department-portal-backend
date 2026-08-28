import express from 'express';

import {
  getUnits,
  createUnit,
  updateUnit,
  deleteUnit,
} from '../controllers/unit.controller.js';

import { requireAuth } from '../middleware/auth.js';

export const unitRouter = express.Router();

unitRouter.use(requireAuth);

unitRouter.get('/', getUnits);

unitRouter.post('/', createUnit);

unitRouter.patch('/:id', updateUnit);

unitRouter.delete('/:id', deleteUnit);
