import { inngest } from '../../config/inngest.js';
import { Department } from '../../models/Department.js';

export const scheduleMonthlyBirthdays = inngest.createFunction(
  {
    id: 'schedule-monthly-birthday-summary',
    triggers: {
      cron: '0 7 1 * *',
    },
  },
  async () => {
    try {
      const now = new Date();

      const month = now.getMonth() + 1;

      const departments = await Department.find({}).select('_id name').lean();

      if (!departments.length) {
        return {
          success: true,
          message: 'No departments found.',
          departmentCount: 0,
        };
      }

      const events = departments.map((department) => ({
        name: 'birthday/summary.requested',
        data: {
          departmentId: department._id.toString(),
          month,
        },
      }));

      await inngest.send(events);

      console.log(
        `Monthly birthday summaries scheduled for ${departments.length} department(s).`,
      );

      return {
        success: true,
        month,
        departmentCount: departments.length,
      };
    } catch (error) {
      console.error('Schedule monthly birthday summaries error:', error);

      throw error;
    }
  },
);
