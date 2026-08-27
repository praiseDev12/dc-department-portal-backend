import express from 'express';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { body } from 'express-validator';
import { Service } from '../models/Service.js';
import { ServiceInstance } from '../models/ServiceInstance.js';
import { Member } from '../models/Member.js';
import { Attendance } from '../models/Attendance.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  assertMainAdmin,
  departmentScope,
  unitScopedFilter,
} from '../utils/scope.js';
import {
  attendanceStatus,
  combineDateAndTime,
  isInsideWindow,
} from '../utils/time.js';
import { audit } from '../services/audit.service.js';
import { AppError, notFound } from '../utils/errors.js';

export const serviceRouter = express.Router();
serviceRouter.use(requireAuth);

serviceRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(
      await Service.find(departmentScope(req)).sort('dayOfWeek startTime'),
    );
  }),
);

serviceRouter.post(
  '/',
  [
    body('name').trim().notEmpty(),
    body('dayOfWeek').isInt({ min: 0, max: 6 }),
    body('startTime').matches(/^\d{2}:\d{2}$/),
  ],
  validate,
  asyncHandler(async (req, res) => {
    assertMainAdmin(req);
    const service = await Service.create({
      ...req.body,
      department: req.user.department,
    });
    await audit(req, 'create', 'Service', service._id, { name: service.name });
    res.status(201).json(service);
  }),
);

serviceRouter.post(
  '/:id/instances',
  asyncHandler(async (req, res) => {
    assertMainAdmin(req);
    const service = await Service.findOne(
      departmentScope(req, { _id: req.params.id }),
    );
    if (!service) throw notFound('Service not found');
    const serviceDate = new Date(req.body.serviceDate || Date.now());
    serviceDate.setHours(0, 0, 0, 0);
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const startsAt = combineDateAndTime(serviceDate, service.startTime);
    const verificationCodeHash = await bcrypt.hash(code, 10);
    const qrPayload = JSON.stringify({
      service: service._id,
      date: serviceDate.toISOString(),
      code,
    });
    const qrDataUrl = await QRCode.toDataURL(qrPayload);
    const instance = await ServiceInstance.findOneAndUpdate(
      { department: req.user.department, service: service._id, serviceDate },
      {
        department: req.user.department,
        service: service._id,
        serviceDate,
        startsAt,
        verificationCodeHash,
        codeExpiresAt: new Date(
          startsAt.getTime() + service.closesMinutesAfter * 60_000,
        ),
        qrPayload,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    await audit(req, 'generate_code', 'ServiceInstance', instance._id, {
      service: service.name,
    });
    res.status(201).json({ instance, code, qrDataUrl });
  }),
);

serviceRouter.post(
  '/check-in',
  [
    body('memberId').isMongoId(),
    body('serviceInstanceId').isMongoId(),
    body('code').notEmpty(),
    body('method').isIn(['code', 'qr']),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const member = await Member.findOne(
      unitScopedFilter(req, { _id: req.body.memberId, status: 'active' }),
    );
    if (!member) throw notFound('Member not found');
    const instance = await ServiceInstance.findOne(
      departmentScope(req, { _id: req.body.serviceInstanceId }),
    ).populate('service');
    if (!instance) throw notFound('Service instance not found');
    const service = instance.service;
    const now = new Date();
    if (
      !isInsideWindow({
        now,
        startsAt: instance.startsAt,
        opensMinutesBefore: service.opensMinutesBefore,
        closesMinutesAfter: service.closesMinutesAfter,
      })
    ) {
      throw new AppError(
        'Check-in is not currently open for this service',
        409,
      );
    }
    if (
      !(await bcrypt.compare(
        String(req.body.code),
        instance.verificationCodeHash,
      ))
    ) {
      throw new AppError('Invalid verification code', 400);
    }
    const attendance = await Attendance.create({
      department: req.user.department,
      unit: member.unit,
      member: member._id,
      service: service._id,
      serviceInstance: instance._id,
      checkInAt: now,
      status: attendanceStatus({
        checkInAt: now,
        startsAt: instance.startsAt,
        graceMinutes: service.graceMinutes,
      }),
      method: req.body.method,
    });
    res.status(201).json(attendance);
  }),
);

serviceRouter.get(
  '/attendance/summary',
  asyncHandler(async (req, res) => {
    const match = unitScopedFilter(req);
    const rows = await Attendance.aggregate([
      { $match: match },
      {
        $group: {
          _id: { status: '$status', unit: '$unit' },
          count: { $sum: 1 },
        },
      },
    ]);
    res.json(rows);
  }),
);
