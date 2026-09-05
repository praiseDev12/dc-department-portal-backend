import { Member } from '../../models/Member.js';
import { Attendance } from '../../models/Attendance.js';
import { ContributionEntry } from '../../models/ContributionEntry.js';
import { CheckInSession } from '../../models/CheckInSession.js';

import {
  drawHeader,
  drawSummaryCard,
  drawSectionTitle,
  formatDate,
} from '../../utils/pdf.js';

export async function buildGeneralReport({
  doc,
  department,
  departmentName,
  from,
  to,
  startNewPage,
}) {
  const memberFilter = {
    department,
  };

  const attendanceFilter = {
    department,
  };

  const contributionFilter = {
    department,
  };

  if (from || to) {
    const startDate = from ? new Date(`${from}T00:00:00`) : null;

    const endDate = to ? new Date(`${to}T23:59:59.999`) : null;

    if (startDate || endDate) {
      attendanceFilter.checkedInAt = {};

      contributionFilter.contributedAt = {};

      if (startDate) {
        attendanceFilter.checkedInAt.$gte = startDate;
        contributionFilter.contributedAt.$gte = startDate;
      }

      if (endDate) {
        attendanceFilter.checkedInAt.$lte = endDate;
        contributionFilter.contributedAt.$lte = endDate;
      }
    }
  }

  const sessionFilter = {
    department,
  };

  if (from || to) {
    sessionFilter.serviceDate = {};

    if (from) {
      sessionFilter.serviceDate.$gte = from;
    }

    if (to) {
      sessionFilter.serviceDate.$lte = to;
    }
  }

  const [members, attendanceRecords, contributionEntries, sessions] =
    await Promise.all([
      Member.find(memberFilter)
        .select('fullName status unit')
        .populate('unit', 'name')
        .lean(),

      Attendance.find(attendanceFilter)
        .select('member status checkedInAt')
        .lean(),

      ContributionEntry.find(contributionFilter)
        .select('member amount contributedAt')
        .lean(),

      CheckInSession.find(sessionFilter).select('_id serviceDate').lean(),
    ]);

  const totalMembers = members.length;

  const activeMembers = members.filter(
    (member) => member.status === 'active',
  ).length;

  const inactiveMembers = totalMembers - activeMembers;

  const totalAttendance = attendanceRecords.length;

  const onTimeAttendance = attendanceRecords.filter(
    (record) => record.status === 'on_time',
  ).length;

  const lateAttendance = attendanceRecords.filter(
    (record) => record.status === 'late',
  ).length;

  const totalSessions = sessions.length;

  const expectedAttendance = activeMembers * totalSessions;

  const attendanceRate =
    expectedAttendance > 0
      ? Math.min(100, Math.round((totalAttendance / expectedAttendance) * 100))
      : 0;

  const totalContribution = contributionEntries.reduce(
    (sum, entry) => sum + entry.amount,
    0,
  );

  const contributorCount = new Set(
    contributionEntries.map((entry) => String(entry.member)),
  ).size;

  const contributionCount = contributionEntries.length;

  const memberById = new Map(
    members.map((member) => [String(member._id), member]),
  );

  const unitStats = new Map();

  for (const member of members) {
    const unitId = member.unit?._id ? String(member.unit._id) : 'unassigned';

    if (!unitStats.has(unitId)) {
      unitStats.set(unitId, {
        unitId,
        unitName: member.unit?.name || 'Unassigned',
        totalMembers: 0,
        activeMembers: 0,
        attendance: 0,
        onTime: 0,
        late: 0,
        contributors: 0,
        contributions: 0,
      });
    }

    const unit = unitStats.get(unitId);

    unit.totalMembers += 1;

    if (member.status === 'active') {
      unit.activeMembers += 1;
    }
  }

  for (const record of attendanceRecords) {
    const member = memberById.get(String(record.member));

    const unitId = member?.unit?._id ? String(member.unit._id) : 'unassigned';

    if (!unitStats.has(unitId)) {
      unitStats.set(unitId, {
        unitId,
        unitName: member?.unit?.name || 'Unassigned',
        totalMembers: 0,
        activeMembers: 0,
        attendance: 0,
        onTime: 0,
        late: 0,
        contributors: 0,
        contributions: 0,
      });
    }

    const unit = unitStats.get(unitId);

    unit.attendance += 1;

    if (record.status === 'on_time') {
      unit.onTime += 1;
    }

    if (record.status === 'late') {
      unit.late += 1;
    }
  }

  for (const entry of contributionEntries) {
    const member = memberById.get(String(entry.member));

    const unitId = member?.unit?._id ? String(member.unit._id) : 'unassigned';

    if (!unitStats.has(unitId)) {
      unitStats.set(unitId, {
        unitId,
        unitName: member?.unit?.name || 'Unassigned',
        totalMembers: 0,
        activeMembers: 0,
        attendance: 0,
        onTime: 0,
        late: 0,
        contributors: 0,
        contributions: 0,
      });
    }

    const unit = unitStats.get(unitId);

    unit.contributions += entry.amount;
  }

  for (const entry of contributionEntries) {
    const member = memberById.get(String(entry.member));

    const unitId = member?.unit ? String(member.unit) : 'unassigned';

    const unit = unitStats.get(unitId);

    if (!unit) continue;

    if (!unit.contributorIds) {
      unit.contributorIds = new Set();
    }

    unit.contributorIds.add(String(entry.member));
  }

  for (const unit of unitStats.values()) {
    unit.contributors = unit.contributorIds?.size || 0;

    delete unit.contributorIds;
  }

  const subtitleParts = [departmentName];

  if (from || to) {
    subtitleParts.push(
      `${from ? formatDate(from) : 'Beginning'} - ${
        to ? formatDate(to) : 'Present'
      }`,
    );
  } else {
    subtitleParts.push('General department overview');
  }

  const subtitle = subtitleParts.join(' • ');

  let y = drawHeader(doc, 'GENERAL REPORT', subtitle);

  y = drawSectionTitle(doc, 'Department Overview', y);

  const cardGap = 12;
  const cardWidth =
    (doc.page.width -
      doc.page.margins.left -
      doc.page.margins.right -
      cardGap * 3) /
    4;

  const cardHeight = 72;

  drawSummaryCard(
    doc,
    doc.page.margins.left,
    y,
    cardWidth,
    cardHeight,
    'Total Members',
    totalMembers,
  );

  drawSummaryCard(
    doc,
    doc.page.margins.left + cardWidth + cardGap,
    y,
    cardWidth,
    cardHeight,
    'Active Members',
    activeMembers,
  );

  drawSummaryCard(
    doc,
    doc.page.margins.left + (cardWidth + cardGap) * 2,
    y,
    cardWidth,
    cardHeight,
    'Inactive Members',
    inactiveMembers,
  );

  drawSummaryCard(
    doc,
    doc.page.margins.left + (cardWidth + cardGap) * 3,
    y,
    cardWidth,
    cardHeight,
    'Attendance',
    `${attendanceRate}%`,
  );

  y += cardHeight + 28;

  y = drawSectionTitle(doc, 'Attendance Summary', y);

  drawSummaryCard(
    doc,
    doc.page.margins.left,
    y,
    cardWidth,
    cardHeight,
    'Total Attendance',
    totalAttendance,
  );

  drawSummaryCard(
    doc,
    doc.page.margins.left + cardWidth + cardGap,
    y,
    cardWidth,
    cardHeight,
    'On Time',
    onTimeAttendance,
  );

  drawSummaryCard(
    doc,
    doc.page.margins.left + (cardWidth + cardGap) * 2,
    y,
    cardWidth,
    cardHeight,
    'Late',
    lateAttendance,
  );

  drawSummaryCard(
    doc,
    doc.page.margins.left + (cardWidth + cardGap) * 3,
    y,
    cardWidth,
    cardHeight,
    'Attendance Rate',
    `${attendanceRate}%`,
  );

  y += cardHeight + 28;

  y = drawSectionTitle(doc, 'Contribution Summary', y);

  drawSummaryCard(
    doc,
    doc.page.margins.left,
    y,
    cardWidth,
    cardHeight,
    'Total Contributions',
    `NGN ${totalContribution.toLocaleString()}`,
  );

  drawSummaryCard(
    doc,
    doc.page.margins.left + cardWidth + cardGap,
    y,
    cardWidth,
    cardHeight,
    'Entries',
    contributionCount,
  );

  drawSummaryCard(
    doc,
    doc.page.margins.left + (cardWidth + cardGap) * 2,
    y,
    cardWidth,
    cardHeight,
    'Contributors',
    contributorCount,
  );

  y += cardHeight + 28;

  y = drawSectionTitle(doc, 'Unit Breakdown', y);

  const tableLeft = doc.page.margins.left;
  const tableWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;

  const columnWidths = [
    105, // Unit
    50, // Members
    50, // Active
    55, // Attendance
    50, // On Time
    45, // Late
    55, // Contributors
    tableWidth - 465, // Contributions
  ];

  const rowHeight = 24;
  const headerHeight = 28;

  const drawUnitTableHeader = (headerY) => {
    let x = tableLeft;

    doc
      .rect(tableLeft, headerY, tableWidth, headerHeight)
      .fill([235, 238, 243]);

    const headers = [
      'Unit',
      'Members',
      'Active',
      'Attendance',
      'On Time',
      'Late',
      'Contributors',
      'Contributions',
    ];

    headers.forEach((header, index) => {
      doc
        .font('Helvetica-Bold')
        .fontSize(7)
        .fillColor([60, 60, 60])
        .text(header, x + 5, headerY + 9, {
          width: columnWidths[index] - 10,
          align: index === 0 ? 'left' : 'right',
          lineBreak: false,
        });

      x += columnWidths[index];
    });
  };

  const unitRows = Array.from(unitStats.values()).sort((a, b) =>
    a.unitName.localeCompare(b.unitName),
  );

  if (unitRows.length === 0) {
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor([100, 100, 100])
      .text('No units found for this department.', tableLeft, y);

    y += 35;
  } else {
    drawUnitTableHeader(y);

    y += headerHeight;

    for (const unit of unitRows) {
      const footerSpace = 85;

      if (y + rowHeight + footerSpace > doc.page.height) {
        y = startNewPage('GENERAL REPORT', subtitle);

        y = drawSectionTitle(doc, 'Unit Breakdown', y);

        drawUnitTableHeader(y);

        y += headerHeight;
      }

      const values = [
        unit.unitName,
        unit.totalMembers,
        unit.activeMembers,
        unit.attendance,
        unit.onTime,
        unit.late,
        unit.contributors,
        `NGN ${unit.contributions.toLocaleString()}`,
      ];

      let x = tableLeft;

      doc
        .rect(tableLeft, y, tableWidth, rowHeight)
        .fill(
          unitRows.indexOf(unit) % 2 === 0 ? [250, 250, 250] : [255, 255, 255],
        );

      values.forEach((value, index) => {
        doc
          .font(index === 0 ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(7.5)
          .fillColor([50, 50, 50])
          .text(String(value), x + 5, y + 8, {
            width: columnWidths[index] - 10,
            align: index === 0 ? 'left' : 'right',
            lineBreak: false,
          });

        x += columnWidths[index];
      });

      doc
        .moveTo(tableLeft, y + rowHeight)
        .lineTo(tableLeft + tableWidth, y + rowHeight)
        .lineWidth(0.5)
        .strokeColor([225, 228, 233])
        .stroke();

      y += rowHeight;
    }

    y += 25;
  }

  y = drawSectionTitle(doc, 'Executive Summary', y);

  const summaryText =
    `${departmentName} recorded ${totalMembers} member${
      totalMembers === 1 ? '' : 's'
    }, with ${activeMembers} active member${activeMembers === 1 ? '' : 's'}. ` +
    `During the reporting period, ${totalAttendance} attendance record${
      totalAttendance === 1 ? '' : 's'
    } were recorded, including ${onTimeAttendance} on-time and ${lateAttendance} late attendance record${
      lateAttendance === 1 ? '' : 's'
    }. ` +
    `The department recorded NGN ${totalContribution.toLocaleString()} ` +
    `across ${contributionCount} contribution entr${
      contributionCount === 1 ? 'y' : 'ies'
    } from ${contributorCount} contributor${
      contributorCount === 1 ? '' : 's'
    }.`;

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor([70, 70, 70])
    .text(summaryText, doc.page.margins.left, y, {
      width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
      lineGap: 5,
    });

  return y;
}
