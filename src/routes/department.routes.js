import express from 'express';
import { body } from 'express-validator';
import { Department } from '../models/Department.js';
import { Unit } from '../models/Unit.js';
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { assertMainAdmin, departmentScope } from '../utils/scope.js';
import { audit } from '../services/audit.service.js';

export const departmentRouter = express.Router();
departmentRouter.use(requireAuth);

departmentRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    const department = await Department.findById(req.user.department);
    res.json(department);
  }),
);

departmentRouter.patch(
  '/settings',
  [
    body('settings.contribution.amount').optional().isFloat({ min: 0 }),
    body('settings.contribution.interval')
      .optional()
      .isIn(['monthly', 'quarterly', 'yearly']),
  ],
  validate,
  asyncHandler(async (req, res) => {
    assertMainAdmin(req);
    const department = await Department.findOneAndUpdate(
      departmentScope(req),
      { $set: req.body },
      { new: true },
    );
    await audit(req, 'update_settings', 'Department', department._id, req.body);
    res.json(department);
  }),
);

departmentRouter.get(
  '/units',
  asyncHandler(async (req, res) => {
    const filter =
      req.user.role === 'unit_admin'
        ? { department: req.user.department, _id: req.user.unit }
        : departmentScope(req);
    res.json(await Unit.find(filter).sort('name'));
  }),
);

departmentRouter.post(
  '/units',
  [body('name').trim().notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    assertMainAdmin(req);
    const unit = await Unit.create({
      department: req.user.department,
      name: req.body.name,
    });
    await audit(req, 'create', 'Unit', unit._id, { name: unit.name });
    res.status(201).json(unit);
  }),
);

departmentRouter.post(
  '/admins',
  [
    body('name').trim().notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('role').isIn(['main_admin', 'unit_admin']),
    body('unit').optional().isMongoId(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    assertMainAdmin(req);
    const user = new User({
      department: req.user.department,
      unit: req.body.role === 'unit_admin' ? req.body.unit : undefined,
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
    });
    await user.setPassword(req.body.password);
    await user.save();
    if (user.unit)
      await Unit.findOneAndUpdate(departmentScope(req, { _id: user.unit }), {
        $addToSet: { adminUsers: user._id },
      });
    await audit(req, 'create', 'User', user._id, { role: user.role });
    res
      .status(201)
      .json({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        unit: user.unit,
      });
  }),
);
