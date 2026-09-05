import { Member } from '../models/Member.js';
import { CheckInSession } from '../models/CheckInSession.js';
import { Attendance } from '../models/Attendance.js';

export async function getDashboardSummary({ role, departmentId, unitId }) {
  // main_admin sees the whole department; unit_admin sees only their unit.
  const memberFilter =
    role === 'main_admin' ? { department: departmentId } : { unit: unitId };

  const totalMembers = await Member.countDocuments({
    ...memberFilter,
    status: 'active',
  });

  // The most recently generated service occurrence for this department,
  // regardless of which named Service it belongs to — "whatever last
  // happened," not a specific recurring service.
  const lastSession = await CheckInSession.findOne({
    department: departmentId,
  }).sort({ scheduledStart: -1 });

  let presentLastService = null;
  let lateLastService = null;
  let absentLastService = null;

  if (lastSession) {
    const attendanceFilter =
      role === 'main_admin'
        ? { session: lastSession._id }
        : { session: lastSession._id, unit: unitId };

    // "Present" = checked in at all (on-time + late combined).
    // "Late" = the subset of those who were late.
    const [totalPresent, lateCount] = await Promise.all([
      Attendance.countDocuments(attendanceFilter),
      Attendance.countDocuments({ ...attendanceFilter, status: 'late' }),
    ]);

    presentLastService = totalPresent;
    lateLastService = lateCount;
    // Everyone eligible, minus everyone who has an Attendance record for
    // this session — a plain set difference, not a separate query.
    absentLastService = totalMembers - totalPresent;
  }

  return {
    totalMembers,
    presentLastService,
    lateLastService,
    absentLastService,
    // Still null — depends on the Contribution model, which doesn't exist yet.
    contributionsOverdue: null,
  };
}
