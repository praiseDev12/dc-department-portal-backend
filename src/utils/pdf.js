import path from 'path';
import fs from 'fs';

export const PRIMARY_COLOR = [0, 54, 154];
export const DARK_COLOR = [30, 30, 30];
export const MUTED_COLOR = [100, 100, 100];
export const LIGHT_COLOR = [245, 247, 250];
export const BORDER_COLOR = [225, 228, 233];

export const LOGO_PATH = path.join(process.cwd(), 'src/assets', 'logo.png');

export function formatDate(date) {
  if (!date) return 'N/A';

  return new Date(date).toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date) {
  if (!date) return 'N/A';

  return new Date(date).toLocaleString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatStatus(status) {
  if (status === 'on_time') return 'On Time';
  if (status === 'late') return 'Late';

  return status || 'Unknown';
}

export function drawHeader(doc, title, subtitle = '') {
  const pageWidth = doc.page.width;
  const left = doc.page.margins.left;
  const right = pageWidth - doc.page.margins.right;

  doc.rect(0, 0, pageWidth, 7).fill(PRIMARY_COLOR);

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

export function drawFooter(doc, pageNumber) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const left = doc.page.margins.left;
  const right = pageWidth - doc.page.margins.right;

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

export function drawSummaryCard(doc, x, y, width, height, label, value) {
  doc.roundedRect(x, y, width, height, 7).fill(LIGHT_COLOR);

  doc.roundedRect(x, y, 4, height, 2).fill(PRIMARY_COLOR);

  doc
    .fillColor(MUTED_COLOR)
    .font('Helvetica-Bold')
    .fontSize(8)
    .text(label.toUpperCase(), x + 16, y + 12, {
      width: width - 24,
      lineBreak: false,
    });

  const valueText = String(value);

  let valueFontSize = 20;

  if (valueText.length > 12) {
    valueFontSize = 16;
  }

  if (valueText.length > 16) {
    valueFontSize = 14;
  }

  if (valueText.length > 20) {
    valueFontSize = 12;
  }

  doc
    .fillColor(DARK_COLOR)
    .font('Helvetica-Bold')
    .fontSize(valueFontSize)
    .text(valueText, x + 16, y + 27, {
      width: width - 28,
      lineBreak: false,
      ellipsis: true,
    });
}

export function drawSectionTitle(doc, title, y) {
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
