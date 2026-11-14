import { inngest } from '../../config/inngest.js';
import { Member } from '../../models/Member.js';
import { Department } from '../../models/Department.js';
import { sendBirthdaySummaryEmail } from '../../utils/email.js';

export const sendBirthdaySummary = inngest.createFunction(
  {
    id: 'send-monthly-birthday-summary',
    triggers: {
      event: 'birthday/summary.requested',
    },
  },
  async ({ event }) => {
    try {
      const { departmentId, month } = event.data;

      const monthNumber = Number(month);

      if (
        !departmentId ||
        !Number.isInteger(monthNumber) ||
        monthNumber < 1 ||
        monthNumber > 12
      ) {
        throw new Error('Invalid birthday summary data.');
      }

      const department = await Department.findById(departmentId)
        .select('name')
        .lean();

      if (!department) {
        throw new Error('Department not found.');
      }

      // Get all active members in the department
      const members = await Member.find({
        department: departmentId,
        status: 'active',
        dateOfBirth: { $ne: null },
      })
        .select('_id fullName dateOfBirth photoUrl email unit role')
        .populate('unit', 'name')
        .lean();

      const birthdays = members
        .filter((member) => {
          const birthdayMonth = new Date(member.dateOfBirth).getMonth() + 1;

          return birthdayMonth === monthNumber;
        })
        .sort((a, b) => {
          const dayA = new Date(a.dateOfBirth).getDate();
          const dayB = new Date(b.dateOfBirth).getDate();

          return dayA - dayB;
        });

      const monthName = new Date(2000, monthNumber - 1, 1).toLocaleDateString(
        'en-NG',
        {
          month: 'long',
        },
      );

      // Find the main admin for this department
      const mainAdmin = await Member.findOne({
        department: departmentId,
        role: 'main_admin',
        status: 'active',
      })
        .select('email fullName')
        .lean();

      if (!mainAdmin?.email) {
        throw new Error(
          'No active main admin with an email address was found for this department.',
        );
      }

      // Send department-wide birthday summary to main admin
      await sendBirthdaySummaryEmail({
        email: mainAdmin.email,
        departmentName: department.name,
        monthName,
        birthdays,
      });

      // Find all active unit admins in the department
      const unitAdmins = await Member.find({
        department: departmentId,
        role: 'unit_admin',
        status: 'active',
      })
        .select('email fullName unit')
        .populate('unit', 'name')
        .lean();

      let recipientCount = 1;

      // Send each unit admin only birthdays from their own unit
      for (const unitAdmin of unitAdmins) {
        if (!unitAdmin.email || !unitAdmin.unit?._id) {
          continue;
        }

        const unitBirthdays = birthdays.filter(
          (birthday) =>
            birthday.unit?._id?.toString() === unitAdmin.unit._id.toString(),
        );

        await sendBirthdaySummaryEmail({
          email: unitAdmin.email,
          departmentName: `${department.name} - ${unitAdmin.unit.name}`,
          monthName,
          birthdays: unitBirthdays,
        });

        recipientCount += 1;
      }

      return {
        success: true,
        departmentId,
        month: monthNumber,
        birthdayCount: birthdays.length,
        unitAdminCount: unitAdmins.length,
        recipientCount,
      };
    } catch (error) {
      console.error('Send birthday summary error:', error);

      throw error;
    }
  },
);
