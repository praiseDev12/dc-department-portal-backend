import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors.js';
import { Member } from '../models/Member.js';

// One middleware for everyone — member, unit_admin, or main_admin.
// req.user is the full Member document, so existing code that reads
// req.user.department / req.user.unit / req.user.role (e.g. your
// members.service.js buildMemberScope) keeps working unchanged.
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('Not authenticated', 401));
  }

  try {
    const payload = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    const member = await Member.findById(payload._id || payload.id);

    if (!member || member.status !== 'active') {
      return next(new AppError('Not authenticated', 401));
    }

    req.user = member;
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
}

// Layer this after requireAuth on routes that need a specific role,
// e.g. requireAuth, requireRole('main_admin')
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(new AppError('Not authorized', 403));
    }
    next();
  };
}
