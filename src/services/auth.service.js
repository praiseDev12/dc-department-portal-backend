import { Department } from '../models/Department.js';
import { Unit } from '../models/Unit.js';
import { Member } from '../models/Member.js';
import { signToken } from '../middleware/auth.js';
import { escapeRegex } from '../utils/regex.js';

function toPublicMember(member) {
  return {
    id: member._id,
    fullName: member.fullName,
    email: member.email,
    role: member.role,
    photoUrl: member.photoUrl,
    department: member.department,
    unit: member.unit,
  };
}

// Creates a brand-new department, its first unit, and its founding
// main_admin — who is a full Member record, not a stripped-down admin
// account. Gated by DEPARTMENT_SETUP_CODE so this can't be reached by
// just anyone who finds the page.
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

// Universal self-registration — used by everyone. Role always starts as
// 'member'; becoming a unit head or main admin later is a role change on
// this same record (see roleService.js), never a separate account.
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

  return {
    success: true,
    status: 201,
    message: 'Registered successfully',
    token: signToken(member),
    user: toPublicMember(member),
  };
}

// One login for every role — the token carries whatever role the
// Member currently has, so a promotion/demotion takes effect the next
// time they log in (or immediately, if you re-issue a token on change).
export async function login({ email, password }) {
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
  }

  return {
    success: true,
    status: 200,
    message: 'Login successful',
    token: signToken(member),
    user: toPublicMember(member),
  };
}
