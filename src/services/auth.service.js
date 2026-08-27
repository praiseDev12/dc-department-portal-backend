import { Department } from '../models/Department.js';
import { Unit } from '../models/Unit.js';
import { User } from '../models/User.js';
import { signToken } from '../middleware/auth.js';
import { AppError } from '../utils/errors.js';
import { escapeRegex } from '../utils/regex.js';
import { success } from 'zod/v4';

export async function onboardDepartment({
  departmentName,
  unitName,
  adminName,
  email,
  password,
  setupCode,
}) {
  if (!setupCode || setupCode !== process.env.DEPARTMENT_SETUP_CODE) {
    throw new AppError('Invalid setup code', 403);
  }

  const trimmedName = departmentName.trim();

  const existing = await Department.findOne({
    name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, 'i') },
  });
  if (existing) {
    return {
      success: false,
      status: 403,
      message: 'A department with this name already exists',
    };
    throw new AppError('A department with this name already exists', 409);
  }

  const department = await Department.create({ name: trimmedName });
  const unit = await Unit.create({
    department: department._id,
    name: unitName || 'General',
  });

  const user = new User({
    department: department._id,
    name: adminName,
    email,
    role: 'main_admin',
  });
  await user.setPassword(password);
  await user.save();

  return {
    success: true,
    status: 201,
    message: 'Created Successfully',
    token: signToken(user),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    },
    department,
    unit,
  };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email, active: true });
  if (!user || !(await user.verifyPassword(password))) {
    return {
      success: false,
      status: 401,
      message: 'Invalid email or password',
    };
    throw new AppError('Invalid email or password', 401);
  }

  return {
    token: signToken(user),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      unit: user.unit,
    },
  };
}
