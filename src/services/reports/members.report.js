import { Member } from '../../models/Member.js';

import {
  PRIMARY_COLOR,
  DARK_COLOR,
  MUTED_COLOR,
  BORDER_COLOR,
  formatDate,
  drawHeader,
  drawSummaryCard,
  drawSectionTitle,
} from '../../utils/pdf.js';

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

export async function buildMembersReport({
  doc,
  department,
  departmentName,
  unit,
  memberReportOptions = {},
  startNewPage,
}) {
  const memberFilter = {
    department,
  };

  if (unit) {
    memberFilter.unit = unit;
  }

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

  return y;
}
