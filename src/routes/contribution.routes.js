import express from 'express';
import { body } from 'express-validator';
import { Contribution } from '../models/Contribution.js';
import { Department } from '../models/Department.js';
import { Member } from '../models/Member.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { unitScopedFilter } from '../utils/scope.js';
import { audit } from '../services/audit.service.js';
import { notFound } from '../utils/errors.js';

export const contributionRouter = express.Router();
contributionRouter.use(requireAuth);

contributionRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = unitScopedFilter(req);
    if (req.query.status) filter.status = req.query.status;
    if (req.query.period) filter.period = req.query.period;
    res.json(
      await Contribution.find(filter)
        .populate('member', 'fullName')
        .populate('unit', 'name')
        .sort('-period'),
    );
  }),
);

contributionRouter.post(
  '/',
  [
    body('member').isMongoId(),
    body('period').notEmpty(),
    body('amountPaid').isFloat({ min: 0 }),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const member = await Member.findOne(
      unitScopedFilter(req, { _id: req.body.member }),
    );
    if (!member) throw notFound('Member not found');
    const department = await Department.findById(req.user.department);
    const expected = Number(
      req.body.amountExpected ?? department.settings.contribution.amount,
    );
    const amountPaid = Number(req.body.amountPaid);
    const status =
      amountPaid >= expected ? 'paid' : amountPaid > 0 ? 'partial' : 'overdue';
    const contribution = await Contribution.findOneAndUpdate(
      {
        department: req.user.department,
        member: member._id,
        period: req.body.period,
      },
      {
        department: req.user.department,
        unit: member.unit,
        member: member._id,
        period: req.body.period,
        amountExpected: expected,
        interval:
          req.body.interval || department.settings.contribution.interval,
        amountPaid,
        datePaid: amountPaid > 0 ? new Date() : undefined,
        status,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    await audit(req, 'upsert', 'Contribution', contribution._id, {
      period: contribution.period,
      status,
    });
    res.status(201).json(contribution);
  }),
);
