import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Member } from '../models/Member.js';
import { AppError } from '../utils/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export function signToken(user) {
  return jwt.sign(
    {
      sub: user._id,
      department: user.department,
      unit: user.unit,
      role: user.role,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );
}

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new AppError('Authentication required', 401);

  const payload = jwt.verify(token, env.jwtSecret);
  const member = await Member.findById(payload.sub).select('-password');
  if (!member || member.status !== 'active')
    throw new AppError('Authentication required', 401);

  req.user = member;
  next();
});

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      next(new AppError('Insufficient role', 403));
      return;
    }
    next();
  };
}
