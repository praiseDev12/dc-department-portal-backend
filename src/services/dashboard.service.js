import { Member } from '../models/Member.js';

export async function getDashboardSummary({ role, departmentId, unitId }) {
  // main_admin sees the whole department; unit_admin sees only their unit.
  const memberFilter =
    role === 'main_admin' ? { department: departmentId } : { unit: unitId };

  const totalMembers = await Member.countDocuments({
    ...memberFilter,
    status: 'active',
  });

  return {
    totalMembers,
    // These depend on Attendance/Service and Contribution models, which
    // don't exist yet — null (not 0) so the frontend can show
    // "Coming soon" instead of a misleading real-looking number.
    presentLastService: null,
    lateLastService: null,
    contributionsOverdue: null,
  };
}
