import { Member } from '../models/Member.js';
import { CheckInSession } from '../models/CheckInSession.js';
import { Attendance } from '../models/Attendance.js';

export async function getDashboardSummary({ role, departmentId, unitId }) {
  // main_admin sees the whole department;
  // unit_admin sees only their unit.
  const memberFilter =
    role === 'main_admin' ? { department: departmentId } : { unit: unitId };

  const totalMembers = await Member.countDocuments({
    ...memberFilter,
    status: 'active',
  });

  // Find the most recently scheduled service occurrence
  // for the department.
  const lastSession = await CheckInSession.findOne({
    department: departmentId,
  })
    .populate('service', 'name')
    .sort({ scheduledStart: -1 });

  let presentLastService = null;
  let lateLastService = null;
  let absentLastService = null;

  if (lastSession) {
    const attendanceFilter =
      role === 'main_admin'
        ? { session: lastSession._id }
        : {
            session: lastSession._id,
            unit: unitId,
          };

    // Present = checked in at all.
    // Late = the subset of present members who checked in late.
    const [totalPresent, lateCount] = await Promise.all([
      Attendance.countDocuments(attendanceFilter),
      Attendance.countDocuments({
        ...attendanceFilter,
        status: 'late',
      }),
    ]);

    presentLastService = totalPresent;
    lateLastService = lateCount;
    absentLastService = totalMembers - totalPresent;
  }

  return {
    totalMembers,
    presentLastService,
    lateLastService,
    absentLastService,
    lastServiceName: lastSession?.service?.name ?? null,
    lastServiceDate: lastSession?.scheduledStart ?? null,
  };
}
