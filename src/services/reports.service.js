import PDFDocument from 'pdfkit';

import { Department } from '../models/Department.js';

import { buildAttendanceReport } from './reports/attendance.report.js';
import { buildContributionReport } from './reports/contributions.report.js';
import { buildMembersReport } from './reports/members.report.js';
import { buildGeneralReport } from './reports/general.report.js';

import { drawHeader, drawFooter } from '../utils/pdf.js';

function createPdfDocument() {
  return new PDFDocument({
    margin: 48,
    size: 'A4',
  });
}

async function getDepartmentName(department) {
  const departmentData = await Department.findById(department).select('name');

  return departmentData?.name || 'Department';
}

function createPageManager(doc) {
  let currentPageNumber = 1;

  const startNewPage = (title, subtitle = '') => {
    drawFooter(doc, currentPageNumber);

    doc.addPage();

    currentPageNumber += 1;

    return drawHeader(doc, title, subtitle);
  };

  const drawCurrentPageFooter = () => {
    drawFooter(doc, currentPageNumber);
  };

  return {
    startNewPage,
    drawCurrentPageFooter,
  };
}

export async function buildDepartmentReport({
  department,
  unit,
  reportType = 'attendance',
  from,
  to,
  format = 'summary',
  memberReportOptions = {},
}) {
  try {
    const departmentName = await getDepartmentName(department);

    const doc = createPdfDocument();

    const chunks = [];

    doc.on('data', (chunk) => {
      chunks.push(chunk);
    });

    const { startNewPage, drawCurrentPageFooter } = createPageManager(doc);

    switch (reportType) {
      case 'attendance':
        await buildAttendanceReport({
          doc,
          department,
          departmentName,
          unit,
          from,
          to,
          format,
          startNewPage,
        });
        break;

      case 'contributions':
        await buildContributionReport({
          doc,
          department,
          departmentName,
          from,
          to,
          format,
          startNewPage,
        });
        break;

      case 'members':
        await buildMembersReport({
          doc,
          department,
          departmentName,
          unit,
          memberReportOptions,
          startNewPage,
        });
        break;

      case 'general':
        await buildGeneralReport({
          doc,
          department,
          departmentName,
          from,
          to,
        });
        break;

      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }

    drawCurrentPageFooter();

    doc.end();

    return await new Promise((resolve, reject) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on('error', reject);
    });
  } catch (error) {
    throw error;
  }
}
