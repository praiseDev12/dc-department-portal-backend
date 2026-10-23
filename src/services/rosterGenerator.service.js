import { Member } from '../models/Member.js';
import { RosterEvent } from '../models/RosterEvent.js';

const DEFAULT_TIMEZONE = 'Africa/Lagos';

const getMonthDates = (month) => {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month);

  if (!match) {
    throw new Error('Month must use YYYY-MM format, e.g. 2026-10.');
  }

  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();

  return Array.from(
    { length: daysInMonth },
    (_, index) => `${month}-${String(index + 1).padStart(2, '0')}`,
  );
};

const getDayOfWeek = (date) => {
  const [year, month, day] = date.split('-').map(Number);

  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
};

const timeToMinutes = (time) => {
  if (!time) return null;

  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);

  if (!match) {
    throw new Error(`Invalid time "${time}". Use HH:mm.`);
  }

  return Number(match[1]) * 60 + Number(match[2]);
};

const hasTimeOverlap = (first, second) => {
  const firstStart = timeToMinutes(first.startTime);
  const secondStart = timeToMinutes(second.startTime);

  // When no end time is configured, assume a one-hour duty.
  const firstEnd = first.endTime
    ? timeToMinutes(first.endTime)
    : firstStart + 60;

  const secondEnd = second.endTime
    ? timeToMinutes(second.endTime)
    : secondStart + 60;

  return firstStart < secondEnd && secondStart < firstEnd;
};

const shuffle = (items) => {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));

    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }

  return result;
};

const createRoleSlots = (item) => {
  if (!item.rolesEnabled || !item.roles?.length) {
    return Array.from({ length: item.membersNeeded }, () => ({
      roleId: null,
      roleName: '',
    }));
  }

  const roles = [...item.roles].sort((a, b) => (a.order || 0) - (b.order || 0));

  return Array.from({ length: item.membersNeeded }, (_, index) => {
    const role = roles[index];

    return role
      ? {
          roleId: role._id || null,
          roleName: role.name,
        }
      : { roleId: null, roleName: '' };
  });
};

const getRoleRotationScore = ({ memberId, roleName, previousRoleByMember }) => {
  if (!roleName) return 0;

  const previousRole = previousRoleByMember.get(memberId);

  if (!previousRole) return 0;

  return previousRole === roleName.trim().toLowerCase() ? 1 : 0;
};

const createOccurrence = ({ item, date, templateDutyId = null }) => ({
  templateDutyId,
  eventName: item.name,
  date,
  startTime: item.startTime,
  endTime: item.endTime || null,
  location: item.location || '',
  membersNeeded: item.membersNeeded,
  rolesEnabled: item.rolesEnabled !== false,
  assignments: [],
  needsAttention: false,
  shortageCount: 0,
});

export const generateRosterOccurrences = async ({
  template,
  month,
  departmentId,
  unitId,
  timezone = DEFAULT_TIMEZONE,
  existingOccurrences = [],
}) => {
  if (!template) {
    throw new Error('A roster template is required.');
  }

  if (!departmentId || !unitId) {
    throw new Error('Department and unit are required.');
  }

  const dates = getMonthDates(month);
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];

  const members = await Member.find({
    department: departmentId,
    unit: unitId,
    status: 'active',
  })
    .select('_id fullName')
    .lean();

  if (!members.length) {
    throw new Error('No active members were found in this unit.');
  }

  const duties = (template.duties || [])
    .filter((duty) => duty.active !== false)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  if (!duties.length) {
    throw new Error('The roster template has no active duties.');
  }

  // Load events that overlap any day in the selected month.
  const events = await RosterEvent.find({
    department: departmentId,
    unit: unitId,
    template: template._id,
    active: true,
    startDate: { $lte: lastDate },
    endDate: { $gte: firstDate },
  }).lean();

  // Build candidates first so recurring duties and event duties
  // can be assigned together in chronological order.
  const candidates = [];

  for (const date of dates) {
    const dayOfWeek = getDayOfWeek(date);

    for (const duty of duties) {
      if (duty.dayOfWeek !== dayOfWeek) continue;

      candidates.push({
        date,
        startTime: duty.startTime,
        occurrence: createOccurrence({
          item: duty,
          date,
          templateDutyId: duty._id,
        }),
        item: duty,
      });
    }
  }

  for (const event of events) {
    for (const date of dates) {
      if (date < event.startDate || date > event.endDate) {
        continue;
      }

      candidates.push({
        date,
        startTime: event.startTime,
        occurrence: {
          ...createOccurrence({
            item: event,
            date,
            templateDutyId: null,
          }),
          eventId: event._id,
        },
        item: event,
      });
    }
  }

  candidates.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
  );

  // Track assignments already recorded in supplied occurrences.
  const memberCounts = new Map(
    members.map((member) => [String(member._id), 0]),
  );

  const lastAssignedDate = new Map();
  const previousRoleByMember = new Map();
  const assignedSlots = [];

  for (const occurrence of existingOccurrences) {
    for (const assignment of occurrence.assignments || []) {
      const memberId = String(assignment.member?._id || assignment.member);

      if (!memberCounts.has(memberId)) continue;

      memberCounts.set(memberId, memberCounts.get(memberId) + 1);

      assignedSlots.push({
        memberId,
        date: occurrence.date,
        startTime: occurrence.startTime,
        endTime: occurrence.endTime,
      });

      const previousDate = lastAssignedDate.get(memberId);

      if (!previousDate || occurrence.date > previousDate) {
        lastAssignedDate.set(memberId, occurrence.date);

        if (assignment.roleName) {
          previousRoleByMember.set(
            memberId,
            assignment.roleName.trim().toLowerCase(),
          );
        }
      }
    }
  }

  const occurrences = [];

  for (const candidate of candidates) {
    const occurrence = candidate.occurrence;
    const roleSlots = createRoleSlots(candidate.item);

    for (const slot of roleSlots) {
      const eligibleMembers = members.filter((member) => {
        const memberId = String(member._id);

        // A member cannot fill two positions in this same occurrence.
        if (
          occurrence.assignments.some(
            (assignment) => String(assignment.member) === memberId,
          )
        ) {
          return false;
        }

        if (template.settings?.avoidOverlappingAssignments !== false) {
          const hasConflict = assignedSlots.some(
            (assignment) =>
              assignment.memberId === memberId &&
              assignment.date === occurrence.date &&
              hasTimeOverlap(assignment, occurrence),
          );

          if (hasConflict) return false;
        }

        return true;
      });

      if (!eligibleMembers.length) {
        occurrence.needsAttention = true;
        occurrence.shortageCount += 1;
        continue;
      }

      // Randomise ties, then favour members with fewer assignments.
      const rankedMembers = shuffle(eligibleMembers).sort((a, b) => {
        if (template.settings?.rotateRoles !== false) {
          const aRoleScore = getRoleRotationScore({
            memberId: String(a._id),
            roleName: slot.roleName,
            previousRoleByMember,
          });

          const bRoleScore = getRoleRotationScore({
            memberId: String(b._id),
            roleName: slot.roleName,
            previousRoleByMember,
          });

          // Prefer the member who did not perform this role previously.
          if (aRoleScore !== bRoleScore) {
            return aRoleScore - bRoleScore;
          }
        }

        if (template.settings?.balanceAssignments !== false) {
          const countDifference =
            memberCounts.get(String(a._id)) - memberCounts.get(String(b._id));

          if (countDifference !== 0) return countDifference;
        }

        const aLastDate = lastAssignedDate.get(String(a._id)) || '';
        const bLastDate = lastAssignedDate.get(String(b._id)) || '';

        return aLastDate.localeCompare(bLastDate);
      });

      const selectedMember = rankedMembers[0];
      const selectedId = String(selectedMember._id);

      occurrence.assignments.push({
        member: selectedMember._id,
        roleId: slot.roleId,
        roleName: slot.roleName,
        manuallyAssigned: false,
        notificationStatus: {
          dayBefore: 'pending',
          sameDay: 'pending',
        },
      });

      lastAssignedDate.set(selectedId, occurrence.date);

      if (slot.roleName) {
        previousRoleByMember.set(
          selectedId,
          slot.roleName.trim().toLowerCase(),
        );
      }

      assignedSlots.push({
        memberId: selectedId,
        date: occurrence.date,
        startTime: occurrence.startTime,
        endTime: occurrence.endTime,
      });
    }

    occurrences.push(occurrence);
  }

  return {
    month,
    timezone,
    occurrences,
    generatedAt: new Date(),
  };
};
