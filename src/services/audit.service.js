import { AuditLog } from '../models/AuditLog.js';

export function audit(req, action, recordType, recordId, metadata = {}) {
  return AuditLog.create({
    department: req.user.department,
    actor: req.user._id,
    action,
    recordType,
    recordId,
    metadata,
  });
}
