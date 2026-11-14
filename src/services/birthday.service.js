import { Member } from '../models/Member.js';

export async function getUpcomingBirthdays({
  departmentId,
  unitId = null,
  month,
}) {
  const monthNumber = Number(month);

  if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
    throw new Error('Invalid month. Month must be between 1 and 12.');
  }

  const query = {
    department: departmentId,
    status: 'active',
    dateOfBirth: { $ne: null },
  };

  if (unitId) {
    query.unit = unitId;
  }

  const members = await Member.find(query)
    .select('_id fullName dateOfBirth photoUrl department unit email')
    .populate('department', 'name')
    .populate('unit', 'name')
    .lean();

  const birthdays = members
    .filter((member) => {
      if (!member.dateOfBirth) return false;

      const birthdayMonth = new Date(member.dateOfBirth).getMonth() + 1;

      return birthdayMonth === monthNumber;
    })
    .sort((a, b) => {
      const dayA = new Date(a.dateOfBirth).getDate();
      const dayB = new Date(b.dateOfBirth).getDate();

      return dayA - dayB;
    });

  return birthdays;
}
