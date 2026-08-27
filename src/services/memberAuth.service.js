import { Member } from '../models/Member.js';
import { Department } from '../models/Department.js';
import { Unit } from '../models/Unit.js';
import { signToken } from '../middleware/auth.js';
import { AppError } from '../utils/errors.js';
import { success } from 'zod/v4';

function toPublicMember(member) {
  return {
    id: member._id,
    fullName: member.fullName,
    email: member.email,
    department: member.department,
    unit: member.unit,
  };
}

export async function registerMember({
  department,
  unit,
  fullName,
  dateOfBirth,
  gender,
  maritalStatus,
  phoneNumber,
  whatsappNumber,
  email,
  address,
  occupation,
  roleInUnit,
  password,
  consentAccepted,
}) {
  const departmentDoc = await Department.findById(department);
  if (!departmentDoc) {
    return {
      success: false,
      status: 404,
      message: 'The selected department was not found',
    };
    throw new AppError('Selected department was not found', 404);
  }

  const unitDoc = await Unit.findOne({ _id: unit, department });
  if (!unitDoc) {
    return {
      success: false,
      status: 404,
      message: 'Selected unit does not belong to that department',
    };
    throw new AppError('Selected unit does not belong to that department', 404);
  }

  const existing = await Member.findOne({
    department,
    email: email.toLowerCase(),
  });
  if (existing) {
    return {
      success: false,
      status: 409,
      message: 'A member with this email already exists in this department',
    };
    throw new AppError(
      'A member with this email already exists in this department',
      409,
    );
  }

  const member = new Member({
    department,
    unit,
    fullName,
    dateOfBirth,
    gender,
    maritalStatus,
    phoneNumber,
    whatsappNumber,
    email,
    address,
    occupation,
    roleInUnit,
    dateJoinedDepartment: new Date(),
    consentAcceptedAt: consentAccepted ? new Date() : undefined,
  });
  await member.setPassword(password);
  await member.save();

  return {
    success: true,
    status: 201,
    message: 'Registered Successfully',
    token: signToken({ _id: member._id, role: 'member' }),
    member: toPublicMember(member),
  };
}

export async function loginMember({ email, password }) {
  const member = await Member.findOne({
    email: email.toLowerCase(),
    status: 'active',
  }).select('+password');
  if (!member || !(await member.verifyPassword(password))) {
    return {
      success: false,
      status: 401,
      message: 'Invalid email or password',
    };
    throw new AppError('Invalid email or password', 401);
  }

  return {
    success: true,
    status: 202,
    message: 'Login Successful',
    token: signToken({ _id: member._id, role: 'member' }),
    member: toPublicMember(member),
  };
}
