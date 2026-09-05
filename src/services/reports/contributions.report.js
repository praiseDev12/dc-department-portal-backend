import { ContributionEntry } from '../../models/ContributionEntry.js';

import {
  PRIMARY_COLOR,
  DARK_COLOR,
  MUTED_COLOR,
  formatDate,
  drawHeader,
  drawSummaryCard,
  drawSectionTitle,
} from '../../utils/pdf.js';

export async function buildContributionReport({
  doc,
  department,
  departmentName,
  from,
  to,
  format = 'summary',
  startNewPage,
}) {
  const dateFilter = {};

  if (from) {
    dateFilter.$gte = new Date(`${from}T00:00:00.000Z`);
  }

  if (to) {
    dateFilter.$lte = new Date(`${to}T23:59:59.999Z`);
  }

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

  return y;
}
