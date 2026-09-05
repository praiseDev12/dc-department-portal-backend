import { asyncHandler } from '../utils/asyncHandler.js';
import { buildDepartmentReport } from '../services/reports.service.js';

export const generateReport = asyncHandler(async (req, res) => {
  try {
    const {
      type = 'attendance',
      from,
      to,
      format = 'summary',
      contactInfo,
      unitInfo,
      statistics,
    } = req.query;

    const allowedTypes = ['attendance', 'contributions', 'members'];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        message: 'Invalid report type.',
      });
    }

    if (from && to && from > to) {
      return res.status(400).json({
        message: 'The From date cannot be later than the To date.',
      });
    }

    const pdf = await buildDepartmentReport({
      department: req.user.department,
      unit: req.user.role === 'unit_admin' ? req.user.unit : undefined,
      reportType: type,
      from,
      to,
      format,
      memberReportOptions: {
        contactInfo: contactInfo !== 'false',
        unitInfo: unitInfo !== 'false',
        statistics: statistics !== 'false',
      },
    });

    const filename = `${type}-report.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdf.length,
    });

    res.send(pdf);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'An error occurred while generating the report.',
    });
  }
});
