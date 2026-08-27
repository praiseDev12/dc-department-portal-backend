import express from 'express';
import multer from 'multer';
import { body } from 'express-validator';
import { parse } from 'csv-parse/sync';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { Member } from '../models/Member.js';
import { Unit } from '../models/Unit.js';
import { Attendance } from '../models/Attendance.js';
import { Contribution } from '../models/Contribution.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  assertMainAdmin,
  assertUnitAccess,
  departmentScope,
  unitScopedFilter,
} from '../utils/scope.js';
import { audit } from '../services/audit.service.js';
import { notFound } from '../utils/errors.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
});

if (env.cloudinary.cloudName) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
}

export const memberRouter = express.Router();
memberRouter.use(requireAuth);

function memberPayload(req) {
  const allowed = [
    'fullName',
    'dateOfBirth',
    'gender',
    'maritalStatus',
    'phoneNumber',
    'whatsappNumber',
    'email',
    'address',
    'occupation',
    'roleInUnit',
    'dateJoinedDepartment',
    'status',
    'consentAcceptedAt',
  ];
  return Object.fromEntries(
    allowed
      .filter((key) => req.body[key] !== undefined)
      .map((key) => [key, req.body[key]]),
  );
}

memberRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = unitScopedFilter(req);
    if (req.query.unit && req.user.role === 'main_admin')
      filter.unit = req.query.unit;
    if (req.query.gender) filter.gender = req.query.gender;
    if (req.query.maritalStatus) filter.maritalStatus = req.query.maritalStatus;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) filter.$text = { $search: req.query.search };
    if (req.query.joinedFrom || req.query.joinedTo) {
      filter.dateJoinedDepartment = {};
      if (req.query.joinedFrom)
        filter.dateJoinedDepartment.$gte = new Date(req.query.joinedFrom);
      if (req.query.joinedTo)
        filter.dateJoinedDepartment.$lte = new Date(req.query.joinedTo);
    }
    const members = await Member.find(filter)
      .populate('unit', 'name')
      .sort('fullName')
      .limit(500);
    res.json(members);
  }),
);

memberRouter.post(
  '/',
  upload.single('photo'),
  [body('fullName').trim().notEmpty(), body('unit').isMongoId()],
  validate,
  asyncHandler(async (req, res) => {
    assertUnitAccess(req, req.body.unit);
    const unit = await Unit.findOne(
      departmentScope(req, { _id: req.body.unit }),
    );
    if (!unit) throw notFound('Unit not found');

    const payload = memberPayload(req);
    let photoUrl;
    if (req.file && env.cloudinary.cloudName) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'church-department-portal' },
          (error, data) => {
            if (error) reject(error);
            else resolve(data);
          },
        );
        stream.end(req.file.buffer);
      });
      photoUrl = result.secure_url;
    }

    const member = await Member.create({
      ...payload,
      photoUrl,
      department: req.user.department,
      unit: unit._id,
      consentAcceptedAt: payload.consentAcceptedAt || new Date(),
    });
    await audit(req, 'create', 'Member', member._id, {
      fullName: member.fullName,
    });
    res.status(201).json(member);
  }),
);

memberRouter.post(
  '/import',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw notFound('Import file not found');
    const rows = parse(req.file.buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    const docs = rows.map((row) => {
      assertUnitAccess(req, row.unit);
      return {
        department: req.user.department,
        unit: row.unit,
        fullName: row.fullName,
        email: row.email,
        phoneNumber: row.phoneNumber,
        gender: row.gender,
        maritalStatus: row.maritalStatus,
        status: row.status || 'active',
        consentAcceptedAt: new Date(),
      };
    });
    const result = await Member.insertMany(docs, { ordered: false });
    await audit(req, 'bulk_import', 'Member', undefined, {
      count: result.length,
    });
    res.status(201).json({ imported: result.length });
  }),
);

memberRouter.get(
  '/export/csv',
  asyncHandler(async (req, res) => {
    const members = await Member.find(unitScopedFilter(req))
      .populate('unit', 'name')
      .sort('fullName');
    const rows = ['Full Name,Unit,Email,Phone,Status'];
    members.forEach((member) => {
      rows.push(
        [
          member.fullName,
          member.unit?.name || '',
          member.email || '',
          member.phoneNumber || '',
          member.status,
        ]
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(','),
      );
    });
    res.header('Content-Type', 'text/csv');
    res.attachment('members.csv');
    res.send(rows.join('\n'));
  }),
);

memberRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const member = await Member.findOne(
      unitScopedFilter(req, { _id: req.params.id }),
    ).populate('unit', 'name');
    if (!member) throw notFound('Member not found');
    const [attendance, contributions] = await Promise.all([
      Attendance.find({ department: req.user.department, member: member._id })
        .populate('service', 'name')
        .sort('-checkInAt')
        .limit(100),
      Contribution.find({ department: req.user.department, member: member._id })
        .sort('-period')
        .limit(100),
    ]);
    res.json({ member, attendance, contributions });
  }),
);

memberRouter.patch(
  '/:id',
  upload.single('photo'),
  asyncHandler(async (req, res) => {
    const member = await Member.findOne(
      unitScopedFilter(req, { _id: req.params.id }),
    );
    if (!member) throw notFound('Member not found');
    Object.assign(member, memberPayload(req));
    await member.save();
    await audit(req, 'update', 'Member', member._id, req.body);
    res.json(member);
  }),
);

memberRouter.post(
  '/:id/transfer',
  [body('unit').isMongoId()],
  validate,
  asyncHandler(async (req, res) => {
    assertMainAdmin(req);
    const member = await Member.findOne(
      departmentScope(req, { _id: req.params.id }),
    );
    if (!member) throw notFound('Member not found');
    const targetUnit = await Unit.findOne(
      departmentScope(req, { _id: req.body.unit }),
    );
    if (!targetUnit) throw notFound('Unit not found');
    member.unitHistory.push({
      unit: member.unit,
      movedBy: req.user._id,
      note: req.body.note,
    });
    member.unit = targetUnit._id;
    await member.save();
    await audit(req, 'transfer', 'Member', member._id, {
      toUnit: targetUnit._id,
    });
    res.json(member);
  }),
);

memberRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const member = await Member.findOneAndDelete(
      unitScopedFilter(req, { _id: req.params.id }),
    );
    if (!member) throw notFound('Member not found');
    await audit(req, 'delete', 'Member', member._id, {
      fullName: member.fullName,
    });
    res.status(204).end();
  }),
);
