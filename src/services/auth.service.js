import crypto from 'crypto';
import { Department } from '../models/Department.js';
import { Unit } from '../models/Unit.js';
import { Member } from '../models/Member.js';
import { signToken } from '../middleware/auth.js';
import { escapeRegex } from '../utils/regex.js';
import { sendPasswordResetEmail } from '../utils/email.js';
import { env } from '../config/env.js';

function toPublicMember(member) {
  return {
    id: member._id,
    fullName: member.fullName,
    email: member.email,
    role: member.role,
    photoUrl: member.photoUrl,

    department: member.department
      ? {
          id: member.department._id,
          name: member.department.name,
        }
      : null,

    unit: member.unit
      ? {
          id: member.unit._id,
          name: member.unit.name,
        }
      : null,
  };
}

export async function onboardDepartment({
  departmentName,
  unitName,
  fullName,
  dateOfBirth,
  gender,
  maritalStatus,
  phoneNumber,
  whatsappNumber,
  email,
  address,
  occupation,
  password,
  setupCode,
}) {
  if (!setupCode || setupCode !== process.env.DEPARTMENT_SETUP_CODE) {
    return { success: false, status: 403, message: 'Invalid setup code' };
  }

  const trimmedName = departmentName.trim();
  const existingDept = await Department.findOne({
    name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, 'i') },
  });
  if (existingDept) {
    return {
      success: false,
      status: 409,
      message: 'A department with this name already exists',
    };
  }

  const department = await Department.create({ name: trimmedName });
  const unit = await Unit.create({
    department: department._id,
    name: unitName || 'General',
  });

  const member = new Member({
    department: department._id,
    unit: unit._id,
    fullName,
    dateOfBirth,
    gender,
    maritalStatus,
    phoneNumber,
    whatsappNumber,
    email,
    address,
    occupation,
    roleInUnit: 'Head of Department',
    role: 'main_admin',
    dateJoinedDepartment: new Date(),
  });
  await member.setPassword(password);
  await member.save();

  return {
    success: true,
    status: 201,
    message: 'Department, unit, and admin account created successfully',
    token: signToken(member),
    user: toPublicMember(member),
    department,
    unit,
  };
}

export async function register({
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
  }

  const unitDoc = await Unit.findOne({ _id: unit, department });
  if (!unitDoc) {
    return {
      success: false,
      status: 404,
      message: 'Selected unit does not belong to that department',
    };
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
    role: 'member',
    dateJoinedDepartment: new Date(),
    consentAcceptedAt: consentAccepted ? new Date() : undefined,
  });
  await member.setPassword(password);
  await member.save();

  await member.populate('department', 'name');

  return {
    success: true,
    status: 201,
    message: 'Registered successfully',
    token: signToken(member),
    user: toPublicMember(member),
  };
}

export async function login({ email, password }) {
  const member = await Member.findOne({
    email: email.toLowerCase(),
    status: 'active',
  })
    .select('+password')
    .populate('department', 'name')
    .populate('unit', 'name');

  if (!member || !(await member.verifyPassword(password))) {
    return {
      success: false,
      status: 401,
      message: 'Invalid email or password',
    };
  }

  return {
    success: true,
    status: 200,
    message: 'Login successful',
    token: signToken(member),
    user: toPublicMember(member),
  };
}

export async function forgotPassword({ email }) {
  const member = await Member.findOne({
    email: email.toLowerCase(),
  });

  // Don't reveal whether the email exists
  if (!member) {
    return {
      success: true,
      status: 200,
      message:
        'If an account with that email exists, a password reset link has been sent',
    };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');

  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  member.resetPasswordToken = hashedToken;
  member.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);

  await member.save();

  const resetUrl = `${env.clientOrigin}/reset-password/${resetToken}`;

  await sendPasswordResetEmail({
    email: member.email,
    resetUrl,
  });

  return {
    success: true,
    status: 200,
    message:
      'If an account with that email exists, a password reset link has been sent',
  };
}

export async function resetPassword({ token, password }) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const member = await Member.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  }).select('+password');

  if (!member) {
    return {
      success: false,
      status: 400,
      message: 'Invalid or expired password reset link',
    };
  }

  await member.setPassword(password);

  // Make the token single-use
  member.resetPasswordToken = null;
  member.resetPasswordExpires = null;

  await member.save();

  return {
    success: true,
    status: 200,
    message: 'Password reset successfully',
  };
}
