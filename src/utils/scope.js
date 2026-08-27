import { forbidden } from './errors.js';

export function departmentScope(req, extra = {}) {
  return { department: req.user.department, ...extra };
}

export function unitScopedFilter(req, extra = {}) {
  const filter = departmentScope(req, extra);
  if (req.user.role === 'unit_admin') {
    filter.unit = req.user.unit;
  }
  return filter;
}

export function assertMainAdmin(req) {
  if (req.user.role !== 'main_admin') {
    throw forbidden('Main admin access is required');
  }
}

export function assertUnitAccess(req, unitId) {
  if (req.user.role === 'unit_admin' && String(req.user.unit) !== String(unitId)) {
    throw forbidden('Unit admins can only access their own unit');
  }
}
