import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

import { Member } from '../models/Member.js';
import { Attendance } from '../models/Attendance.js';
import { Contribution } from '../models/Contribution.js';
import { ContributionEntry } from '../models/ContributionEntry.js';
import { Unit } from '../models/Unit.js';
import { Department } from '../models/Department.js';

const PRIMARY_COLOR = [0, 54, 154];
const DARK_COLOR = [30, 30, 30];
const MUTED_COLOR = [100, 100, 100];
const LIGHT_COLOR = [245, 247, 250];
const BORDER_COLOR = [225, 228, 233];

const LOGO_PATH = path.join(process.cwd(), 'src/assets', 'logo.png');

function formatDate(date) {
  if (!date) return 'N/A';

  return new Date(date).toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(date) {
  if (!date) return 'N/A';

  return new Date(date).toLocaleString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatStatus(status) {
  if (status === 'on_time') return 'On Time';
  if (status === 'late') return 'Late';

  return status || 'Unknown';
}

function drawHeader(doc, title, subtitle = '') {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const left = doc.page.margins.left;
  const right = pageWidth - doc.page.margins.right;

  // Top accent
  doc.rect(0, 0, pageWidth, 7).fill(PRIMARY_COLOR);

  // Logo
  if (fs.existsSync(LOGO_PATH)) {
    doc.image(LOGO_PATH, left, 28, {
      fit: [70, 70],
      align: 'left',
      valign: 'center',
    });
  }

  const textX = left + 85;

  doc
    .fillColor(PRIMARY_COLOR)
    .font('Helvetica-Bold')
    .fontSize(17)
    .text('CHURCH DEPARTMENT PORTAL', textX, 32);

  doc
    .fillColor(DARK_COLOR)
    .font('Helvetica-Bold')
    .fontSize(22)
    .text(title, textX, 55);

  if (subtitle) {
    doc
      .fillColor(MUTED_COLOR)
      .font('Helvetica')
      .fontSize(9)
      .text(subtitle, textX, 80);
  }

  doc
    .moveTo(left, 112)
    .lineTo(right, 112)
    .lineWidth(1)
    .strokeColor(BORDER_COLOR)
    .stroke();

  return 132;
}

function drawFooter(doc, pageNumber) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const left = doc.page.margins.left;
  const right = pageWidth - doc.page.margins.right;

  // Keep everything ABOVE the bottom margin.
  const lineY = pageHeight - 68;
  const textY = pageHeight - 60;

  doc
    .moveTo(left, lineY)
    .lineTo(right, lineY)
    .lineWidth(0.7)
    .strokeColor(BORDER_COLOR)
    .stroke();

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(MUTED_COLOR)
    .text('Church Department Portal', left, textY, {
      width: 250,
      align: 'left',
      lineBreak: false,
    });

  doc.text(`Page ${pageNumber}`, right - 100, textY, {
    width: 100,
    align: 'right',
    lineBreak: false,
  });
}

function drawSummaryCard(doc, x, y, width, height, label, value) {
  doc.roundedRect(x, y, width, height, 7).fill(LIGHT_COLOR);

  doc.roundedRect(x, y, 4, height, 2).fill(PRIMARY_COLOR);

  doc
    .fillColor(MUTED_COLOR)
    .font('Helvetica-Bold')
    .fontSize(8)
    .text(label.toUpperCase(), x + 16, y + 12);

  doc
    .fillColor(DARK_COLOR)
    .font('Helvetica-Bold')
    .fontSize(20)
    .text(String(value), x + 16, y + 27);
}

function drawSectionTitle(doc, title, y) {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;

  doc
    .fillColor(DARK_COLOR)
    .font('Helvetica-Bold')
    .fontSize(14)
    .text(title, left, y);

  doc
    .moveTo(left, y + 23)
    .lineTo(right, y + 23)
    .lineWidth(1)
    .strokeColor(PRIMARY_COLOR)
    .stroke();

  return y + 38;
}

function drawAttendanceTableHeader(doc, y) {
  const left = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  doc.rect(left, y, width, 28).fill(PRIMARY_COLOR);

  doc.fillColor([255, 255, 255]).font('Helvetica-Bold').fontSize(8);

  doc.text('MEMBER', left + 10, y + 9, {
    width: 145,
  });

  doc.text('SERVICE', left + 155, y + 9, {
    width: 120,
  });

  doc.text('STATUS', left + 275, y + 9, {
    width: 75,
  });

  doc.text('CHECK-IN TIME', left + 350, y + 9, {
    width: 110,
  });

  return y + 28;
}

function drawMembersTableHeader(doc, y) {
  const left = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  doc.rect(left, y, width, 28).fill(PRIMARY_COLOR);

  doc.fillColor([255, 255, 255]).font('Helvetica-Bold').fontSize(8);

  doc.text('MEMBER', left + 10, y + 9, {
    width: 155,
  });

  doc.text('PHONE', left + 165, y + 9, {
    width: 105,
  });

  doc.text('UNIT', left + 270, y + 9, {
    width: 105,
  });

  doc.text('STATUS', left + 375, y + 9, {
    width: 65,
  });

  doc.text('JOINED', left + 440, y + 9, {
    width: 70,
  });

  return y + 28;
}

function drawMemberRow(doc, member, y, index) {
  const left = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  const rowHeight = 32;

  if (index % 2 === 0) {
    doc.rect(left, y, width, rowHeight).fill([250, 251, 253]);
  }

  const unitName = member.unit?.name || 'Unassigned';

  const status =
    member.status === 'active'
      ? 'Active'
      : member.status === 'inactive'
        ? 'Inactive'
        : member.status || 'Unknown';

  doc.fillColor(DARK_COLOR).font('Helvetica').fontSize(8.5);

  doc.text(member.fullName || 'Unknown member', left + 10, y + 10, {
    width: 155,
    ellipsis: true,
    lineBreak: false,
  });

  doc.text(member.phoneNumber || 'N/A', left + 165, y + 10, {
    width: 105,
    ellipsis: true,
    lineBreak: false,
  });

  doc.text(unitName, left + 270, y + 10, {
    width: 105,
    ellipsis: true,
    lineBreak: false,
  });

  doc
    .font('Helvetica-Bold')
    .fillColor(member.status === 'active' ? PRIMARY_COLOR : MUTED_COLOR)
    .text(status, left + 375, y + 10, {
      width: 65,
      lineBreak: false,
    });

  doc
    .font('Helvetica')
    .fillColor(DARK_COLOR)
    .text(formatDate(member.createdAt), left + 440, y + 10, {
      width: 70,
      lineBreak: false,
    });

  doc
    .moveTo(left, y + rowHeight)
    .lineTo(left + width, y + rowHeight)
    .lineWidth(0.5)
    .strokeColor(BORDER_COLOR)
    .stroke();

  return y + rowHeight;
}

function drawAttendanceRow(doc, record, y, index) {
  const left = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  const rowHeight = 32;

  if (index % 2 === 0) {
    doc.rect(left, y, width, rowHeight).fill([250, 251, 253]);
  }

  const serviceName =
    record.session?.service?.name || record.service?.name || 'Unknown service';

  const memberName = record.member?.fullName || 'Unknown member';

  const status = formatStatus(record.status);

  doc.fillColor(DARK_COLOR).font('Helvetica').fontSize(8.5);

  doc.text(memberName, left + 10, y + 10, {
    width: 145,
    ellipsis: true,
  });

  doc.text(serviceName, left + 155, y + 10, {
    width: 120,
    ellipsis: true,
  });

  doc
    .font('Helvetica-Bold')
    .fillColor(record.status === 'late' ? [180, 100, 0] : PRIMARY_COLOR)
    .text(status, left + 275, y + 10, {
      width: 75,
    });

  doc
    .font('Helvetica')
    .fillColor(DARK_COLOR)
    .text(formatDateTime(record.checkedInAt), left + 350, y + 10, {
      width: 110,
    });

  doc
    .moveTo(left, y + rowHeight)
    .lineTo(left + width, y + rowHeight)
    .lineWidth(0.5)
    .strokeColor(BORDER_COLOR)
    .stroke();

  return y + rowHeight;
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
  const departmentData = await Department.findById(department).select('name');

  const departmentName = departmentData?.name || 'Department';

  const memberFilter = {
    department,
  };

  if (unit) {
    memberFilter.unit = unit;
  }

  const dateFilter = {};

  if (from) {
    dateFilter.$gte = new Date(`${from}T00:00:00.000Z`);
  }

  if (to) {
    dateFilter.$lte = new Date(`${to}T23:59:59.999Z`);
  }

  const doc = new PDFDocument({
    margin: 48,
    size: 'A4',
  });

  let currentPageNumber = 1;

  const chunks = [];

  const startNewPage = (title, subtitle = '') => {
    // Finish the current page
    drawFooter(doc, currentPageNumber);

    // Create the next page
    doc.addPage();

    currentPageNumber += 1;

    // Draw its header
    return drawHeader(doc, title, subtitle);
  };

  doc.on('data', (chunk) => {
    chunks.push(chunk);
  });

  /*
   * ============================
   * ATTENDANCE REPORT
   * ============================
   */

  if (reportType === 'attendance') {
    const attendanceFilter = {
      department,
      ...(unit ? { unit } : {}),
      ...(Object.keys(dateFilter).length ? { checkedInAt: dateFilter } : {}),
    };

    const [totalMembers, attendanceSummary] = await Promise.all([
      Member.countDocuments({
        ...memberFilter,
        status: 'active',
      }),

      Attendance.aggregate([
        {
          $match: attendanceFilter,
        },
        {
          $group: {
            _id: '$status',
            count: {
              $sum: 1,
            },
          },
        },
      ]),
    ]);

    const onTimeCount =
      attendanceSummary.find((item) => item._id === 'on_time')?.count || 0;

    const lateCount =
      attendanceSummary.find((item) => item._id === 'late')?.count || 0;

    const attendanceRecords =
      format === 'detailed'
        ? await Attendance.find(attendanceFilter)
            .populate('member', 'fullName')
            .populate('service', 'name')
            .populate({
              path: 'session',
              select: 'service',
              populate: {
                path: 'service',
                select: 'name',
              },
            })
            .sort({
              checkedInAt: -1,
            })
        : [];

    let subtitle = 'Attendance summary';

    if (from || to) {
      if (from && to) {
        subtitle = `${formatDate(from)} - ${formatDate(to)}`;
      } else if (from) {
        subtitle = `From ${formatDate(from)}`;
      } else if (to) {
        subtitle = `Until ${formatDate(to)}`;
      }
    }

    let y = drawHeader(
      doc,
      'ATTENDANCE REPORT',
      `${departmentName} • ${subtitle}`,
    );
    // Generated metadata
    doc
      .fillColor(MUTED_COLOR)
      .font('Helvetica')
      .fontSize(8)
      .text(
        `Generated ${formatDateTime(new Date())}`,
        doc.page.margins.left,
        y,
      );

    y += 25;

    // Summary cards
    const cardGap = 10;
    const cardWidth =
      (doc.page.width -
        doc.page.margins.left -
        doc.page.margins.right -
        cardGap * 2) /
      3;

    drawSummaryCard(
      doc,
      doc.page.margins.left,
      y,
      cardWidth,
      62,
      'Total Members',
      totalMembers,
    );

    drawSummaryCard(
      doc,
      doc.page.margins.left + cardWidth + cardGap,
      y,
      cardWidth,
      62,
      'On Time',
      onTimeCount,
    );

    drawSummaryCard(
      doc,
      doc.page.margins.left + (cardWidth + cardGap) * 2,
      y,
      cardWidth,
      62,
      'Late',
      lateCount,
    );

    y += 92;

    y = drawSectionTitle(doc, 'Attendance Overview', y);

    const totalAttendance = onTimeCount + lateCount;

    doc
      .fillColor(DARK_COLOR)
      .font('Helvetica')
      .fontSize(10)
      .text(
        `Total attendance records: ${totalAttendance}`,
        doc.page.margins.left,
        y,
      );

    y += 28;

    if (format === 'detailed') {
      y = drawSectionTitle(doc, 'Detailed Attendance', y);

      const bottomLimit = doc.page.height - doc.page.margins.bottom - 70;

      y = drawAttendanceTableHeader(doc, y);

      attendanceRecords.forEach((record, index) => {
        if (y + 32 > bottomLimit) {
          y = startNewPage(
            'ATTENDANCE REPORT',
            `${departmentName} • ${subtitle}`,
          );
          y = drawAttendanceTableHeader(doc, y);
        }

        y = drawAttendanceRow(doc, record, y, index);
      });
    }
  }

  /*
   * ============================
   * CONTRIBUTIONS REPORT
   * ============================
   */

  if (reportType === 'contributions') {
    const contributionFilter = {
      department,
      ...(Object.keys(dateFilter).length
        ? {
            contributedAt: dateFilter,
          }
        : {}),
    };

    const contributionEntries = await ContributionEntry.find(contributionFilter)
      .populate('member', 'fullName')
      .populate('contribution', 'title')
      .sort({
        contributedAt: -1,
      });

    const totalAmount = contributionEntries.reduce(
      (sum, entry) => sum + entry.amount,
      0,
    );

    const contributorIds = new Set(
      contributionEntries.map((entry) => entry.member?._id?.toString()),
    );

    let y = drawHeader(
      doc,
      'CONTRIBUTION REPORT',
      `${departmentName} • Contribution summary`,
    );

    y += 20;

    const cardGap = 10;
    const cardWidth =
      (doc.page.width -
        doc.page.margins.left -
        doc.page.margins.right -
        cardGap * 2) /
      3;

    drawSummaryCard(
      doc,
      doc.page.margins.left,
      y,
      cardWidth,
      62,
      'Records',
      contributionEntries.length,
    );

    drawSummaryCard(
      doc,
      doc.page.margins.left + cardWidth + cardGap,
      y,
      cardWidth,
      62,
      'Contributors',
      contributorIds.size,
    );

    drawSummaryCard(
      doc,
      doc.page.margins.left + (cardWidth + cardGap) * 2,
      y,
      cardWidth,
      62,
      'Total',
      `NGN ${totalAmount.toLocaleString()}`,
    );

    if (format === 'detailed') {
      y += 92;

      y = drawSectionTitle(doc, 'Detailed Contributions', y);

      contributionEntries.forEach((entry, index) => {
        if (y > doc.page.height - doc.page.margins.bottom - 80) {
          y = startNewPage(
            'CONTRIBUTION REPORT',
            `${departmentName} • Detailed contributions`,
          );
          y = drawSectionTitle(doc, 'Detailed Contributions', y);
        }

        if (index % 2 === 0) {
          doc
            .rect(
              doc.page.margins.left,
              y - 4,
              doc.page.width - doc.page.margins.left - doc.page.margins.right,
              28,
            )
            .fill([250, 251, 253]);
        }

        doc
          .fillColor(DARK_COLOR)
          .font('Helvetica')
          .fontSize(9)
          .text(
            entry.member?.fullName || 'Unknown member',
            doc.page.margins.left + 10,
            y + 4,
            {
              width: 150,
            },
          );

        doc.text(
          entry.contribution?.title || 'Unknown contribution',
          doc.page.margins.left + 160,
          y + 4,
          {
            width: 150,
          },
        );

        doc
          .font('Helvetica-Bold')
          .fillColor(PRIMARY_COLOR)
          .text(
            `NGN ${entry.amount.toLocaleString()}`,
            doc.page.margins.left + 310,
            y + 4,
            {
              width: 100,
            },
          );

        doc
          .font('Helvetica')
          .fillColor(MUTED_COLOR)
          .text(
            formatDate(entry.contributedAt),
            doc.page.margins.left + 410,
            y + 4,
            {
              width: 80,
            },
          );

        y += 28;
      });
    }
  }

  /*
   * ============================
   * MEMBERS REPORT
   * ============================
   */

  if (reportType === 'members') {
    const members = await Member.find(memberFilter)
      .populate('unit', 'name')
      .sort({
        fullName: 1,
      });

    const activeCount = members.filter(
      (member) => member.status === 'active',
    ).length;

    const inactiveCount = members.filter(
      (member) => member.status === 'inactive',
    ).length;

    let y = drawHeader(
      doc,
      'MEMBERS REPORT',
      `${departmentName} • Department member directory`,
    );

    y += 20;

    const cardGap = 10;
    const cardWidth =
      (doc.page.width -
        doc.page.margins.left -
        doc.page.margins.right -
        cardGap * 2) /
      3;

    drawSummaryCard(
      doc,
      doc.page.margins.left,
      y,
      cardWidth,
      62,
      'Total Members',
      members.length,
    );

    drawSummaryCard(
      doc,
      doc.page.margins.left + cardWidth + cardGap,
      y,
      cardWidth,
      62,
      'Active',
      activeCount,
    );

    drawSummaryCard(
      doc,
      doc.page.margins.left + (cardWidth + cardGap) * 2,
      y,
      cardWidth,
      62,
      'Inactive',
      inactiveCount,
    );

    if (
      memberReportOptions.contactInfo !== false ||
      memberReportOptions.unitInfo !== false
    ) {
      y += 92;

      y = drawSectionTitle(doc, 'Member Details', y);

      const bottomLimit = doc.page.height - doc.page.margins.bottom - 70;

      y = drawMembersTableHeader(doc, y);

      members.forEach((member, index) => {
        if (y + 32 > bottomLimit) {
          y = startNewPage(
            'MEMBERS REPORT',
            `${departmentName} • Department member directory`,
          );
          y = drawMembersTableHeader(doc, y);
        }

        y = drawMemberRow(doc, member, y, index);
      });
    }
  }

  /*
   * ============================
   * FOOTERS
   * ============================
   */

  drawFooter(doc, currentPageNumber);

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    doc.on('error', reject);
  });
}
