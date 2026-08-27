import express from 'express';
import {
  getDepartments,
  getUnitsForDepartment,
} from '../controllers/public.controller.js';

export const publicRouter = express.Router();

publicRouter.get('/departments', getDepartments);
publicRouter.get('/departments/:departmentId/units', getUnitsForDepartment);
