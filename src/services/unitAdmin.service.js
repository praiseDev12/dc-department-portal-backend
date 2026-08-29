import { Department } from '../models/Department.js';
import { Unit } from '../models/Unit.js';
import { User } from '../models/User.js';
import { signToken } from '../middleware/auth.js';
import { AppError } from '../utils/errors.js';

const MAX_UNIT_HEADS = 2;

export async function registerUnitAdmin({
  department,
  unit,
  adminName,
  email,
  password,
  setupCode,
}) {
  if (!setupCode || setupCode !== process.env.UNIT_HEAD_SETUP_CODE) {
    throw new AppError('Invalid setup code', 403);
  }

  // Department and unit must already exist — this route can never create
  // either one, only attach a new unit_admin to something that's already there.
  const departmentDoc = await Department.findById(department);
  if (!departmentDoc) {
    throw new AppError('Selected department was not found', 404);
  }

  const unitDoc = await Unit.findOne({ _id: unit, department });
  if (!unitDoc) {
    throw new AppError('Selected unit does not belong to that department', 404);
  }

  const currentHeadCount = await User.countDocuments({
    unit,
    role: 'unit_admin',
  });
  if (currentHeadCount >= MAX_UNIT_HEADS) {
    throw new AppError(
      'This unit already has the maximum of two unit heads',
      409,
    );
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new AppError('An account with this email already exists', 409);
  }

  const user = new User({
    department,
    unit,
    name: adminName,
    email,
    role: 'unit_admin',
  });
  await user.setPassword(password);
  await user.save();

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
