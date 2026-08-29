import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors.js';

// Mirrors whatever your admin auth middleware does for verifying the
// Bearer token — adjust the verify call if your existing middleware reads
// it differently. The important part: it specifically requires
// role === 'member', so an admin's token can't be used to check in as a
// member, and a member's token can't reach admin-only routes.
export function requireMember(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('Not authenticated', 401));
  }

  try {
    const payload = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    if (payload.role !== 'member') {
      return next(new AppError('Not authorized', 403));
    }
    req.memberId = payload.id ?? payload._id;
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
}
