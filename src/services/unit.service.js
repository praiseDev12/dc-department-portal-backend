import mongoose from 'mongoose';

import { Unit } from '../models/Unit.js';

function ensureMainAdmin(user) {
  if (user?.role !== 'main_admin') {
    throw new Error('Only the main admin can perform this action');
  }
}

export async function getUnits({ user }) {
  if (!user?.department) {
    throw new Error('Department not found');
  }

  const units = await Unit.aggregate([
    {
      $match: {
        department: user.department,
      },
    },

    // Get members belonging to each unit
    {
      $lookup: {
        from: 'members',
        localField: '_id',
        foreignField: 'unit',
        as: 'members',
      },
    },

    {
      $lookup: {
        from: 'members',
        let: {
          unitId: '$_id',
          departmentId: '$department',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$unit', '$$unitId'] },
                  { $eq: ['$department', '$$departmentId'] },
                  { $eq: ['$role', 'unit_admin'] },
                ],
              },
            },
          },
          {
            $project: {
              fullName: 1,
              email: 1,
              role: 1,
              status: 1,
            },
          },
        ],
        as: 'adminUsers',
      },
    },

    // Count members
    {
      $addFields: {
        memberCount: {
          $size: '$members',
        },
      },
    },

    // Don't return the actual member documents
    {
      $project: {
        members: 0,
      },
    },

    // Alphabetical order
    {
      $sort: {
        name: 1,
      },
    },
  ]);

  return units;
}

export async function createUnit({ user, name: { name } }) {
  ensureMainAdmin(user);

  console.log('Name:', name);

  if (typeof name !== 'string') {
    throw new Error('Unit name must be a string');
  }

  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error('Unit name is required');
  }

  const existingUnit = await Unit.findOne({
    department: user.department,
    name: trimmedName,
  });

  if (existingUnit) {
    throw new Error('A unit with this name already exists');
  }

  const unit = await Unit.create({
    department: user.department,
    name: trimmedName,
    adminUsers: [],
  });

  return Unit.findById(unit._id)
    .populate('adminUsers', 'name email role')
    .lean();
}

export async function updateUnit({ user, unitId, name: { name } }) {
  ensureMainAdmin(user);

  if (!mongoose.isValidObjectId(unitId)) {
    throw new Error('Invalid unit ID');
  }

  if (typeof name !== 'string') {
    throw new Error('Unit name must be a string');
  }

  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error('Unit name is required');
  }

  const unit = await Unit.findOne({
    _id: unitId,
    department: user.department,
  });

  if (!unit) {
    throw new Error('Unit not found');
  }

  const duplicate = await Unit.findOne({
    _id: { $ne: unitId },
    department: user.department,
    name: trimmedName,
  });

  if (duplicate) {
    throw new Error('A unit with this name already exists');
  }

  unit.name = trimmedName;

  await unit.save();

  return Unit.findById(unit._id)
    .populate('adminUsers', 'name email role')
    .lean();
}

export async function deleteUnit({ user, unitId, setupCode }) {
  ensureMainAdmin(user);

  if (!mongoose.isValidObjectId(unitId)) {
    throw new Error('Invalid unit ID');
  }

  if (!setupCode || setupCode !== process.env.DEPARTMENT_SETUP_CODE) {
    throw new Error('Invalid department setup code');
  }

  const unit = await Unit.findOne({
    _id: unitId,
    department: user.department,
  });

  if (!unit) {
    throw new Error('Unit not found');
  }

  await Unit.deleteOne({
    _id: unit._id,
  });

  return true;
}
