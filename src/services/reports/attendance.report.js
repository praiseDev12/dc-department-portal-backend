import { Member } from '../../models/Member.js';
import { Attendance } from '../../models/Attendance.js';

import {
  PRIMARY_COLOR,
  DARK_COLOR,
  MUTED_COLOR,
  BORDER_COLOR,
  formatDate,
  formatDateTime,
  drawHeader,
  drawFooter,
  drawSummaryCard,
  drawSectionTitle,
} from '../../utils/pdf.js';

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

  const status =
    record.status === 'on_time'
      ? 'On Time'
      : record.status === 'late'
        ? 'Late'
        : record.status || 'Unknown';

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

export async function buildAttendanceReport({
  doc,
  department,
  departmentName,
  unit,
  from,
  to,
  format = 'summary',
  startNewPage,
}) {
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

  doc
    .fillColor(MUTED_COLOR)
    .font('Helvetica')
    .fontSize(8)
    .text(`Generated ${formatDateTime(new Date())}`, doc.page.margins.left, y);

  y += 25;

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

  return y;
}
