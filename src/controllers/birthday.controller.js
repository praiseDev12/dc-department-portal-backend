import { getUpcomingBirthdays } from '../services/birthday.service.js';

export const getBirthdays = async (req, res) => {
  try {
    const { month } = req.query;

    const departmentId = req.user.department;

    const unitId = req.user.role === 'unit_admin' ? req.user.unit : null;

    const birthdays = await getUpcomingBirthdays({
      departmentId,
      unitId,
      month: month || new Date().getMonth() + 1,
    });

    return res.status(200).json({
      success: true,
      birthdays,
    });
  } catch (error) {
    console.error('Get birthdays error:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch birthdays.',
    });
  }
};
