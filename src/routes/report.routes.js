import express from 'express';
import { body } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildDepartmentReport } from '../services/report.service.js';
import { sendReportEmail } from '../services/email.service.js';

export const reportRouter = express.Router();
reportRouter.use(requireAuth);

reportRouter.get(
  '/department.pdf',
  asyncHandler(async (req, res) => {
    const pdf = await buildDepartmentReport({
      department: req.user.department,
      unit: req.user.role === 'unit_admin' ? req.user.unit : undefined,
    });
    res.header('Content-Type', 'application/pdf');
    res.attachment('department-report.pdf');
    res.send(pdf);
  }),
);

reportRouter.post(
  '/email',
  [body('to').isEmail()],
  validate,
  asyncHandler(async (req, res) => {
    const pdf = await buildDepartmentReport({
      department: req.user.department,
      unit: req.user.role === 'unit_admin' ? req.user.unit : undefined,
    });
    const result = await sendReportEmail({
      to: req.body.to,
      subject: 'Church Department Portal Report',
      pdf,
    });
    res.json(result);
  }),
);
