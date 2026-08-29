import { Member } from '../models/Member.js';
import { AppError } from '../utils/errors.js';

const MAX_UNIT_HEADS = 2;
const MAX_MAIN_ADMINS = 2;

export async function assignUnitHead(memberId, actingUser) {
  const member = await Member.findOne({
    _id: memberId,
    department: actingUser.department,
  });
  if (!member) throw new AppError('Member not found in your department', 404);

  const currentHeadCount = await Member.countDocuments({
    unit: member.unit,
    role: 'unit_admin',
    _id: { $ne: member._id },
  });
  if (currentHeadCount >= MAX_UNIT_HEADS) {
    throw new AppError(
      'This unit already has the maximum of two unit heads',
      409,
    );
  }

  member.role = 'unit_admin';
  await member.save();
  return member;
}

export async function revokeUnitHead(memberId, actingUser) {
  const member = await Member.findOne({
    _id: memberId,
    department: actingUser.department,
    role: 'unit_admin',
  });
  if (!member)
    throw new AppError('Unit head not found in your department', 404);

  member.role = 'member';
  await member.save();
  return member;
}

export async function assignMainAdmin(memberId, actingUser) {
  const member = await Member.findOne({
    _id: memberId,
    department: actingUser.department,
  });
  if (!member) throw new AppError('Member not found in your department', 404);

  const currentAdminCount = await Member.countDocuments({
    department: actingUser.department,
    role: 'main_admin',
    _id: { $ne: member._id },
  });
  if (currentAdminCount >= MAX_MAIN_ADMINS) {
    throw new AppError(
      'This department already has the maximum of two main admins',
      409,
    );
  }

  member.role = 'main_admin';
  await member.save();
  return member;
}

export async function revokeMainAdmin(memberId, actingUser) {
  const member = await Member.findOne({
    _id: memberId,
    department: actingUser.department,
    role: 'main_admin',
  });
  if (!member)
    throw new AppError('Main admin not found in your department', 404);

  member.role = 'member';
  await member.save();
  return member;
}
