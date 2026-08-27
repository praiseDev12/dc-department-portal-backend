import PDFDocument from 'pdfkit';
import { Member } from '../models/Member.js';
import { Attendance } from '../models/Attendance.js';
import { Contribution } from '../models/Contribution.js';
import { Unit } from '../models/Unit.js';

export async function buildDepartmentReport({ department, unit }) {
  const memberFilter = { department };
  if (unit) memberFilter.unit = unit;

  const [members, units, attendanceSummary, contributionSummary] = await Promise.all([
    Member.countDocuments(memberFilter),
    Unit.find({ department }).sort('name'),
    Attendance.aggregate([
      { $match: memberFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Contribution.aggregate([
      { $match: memberFilter },
      { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amountPaid' } } }
    ])
  ]);

  const doc = new PDFDocument({ margin: 48 });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  doc.fontSize(22).text('Church Department Portal Report');
  doc.moveDown();
  doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`);
  doc.text(`Members: ${members}`);
  doc.moveDown();
  doc.fontSize(16).text('Units');
  units.forEach((item) => doc.fontSize(11).text(`- ${item.name}`));
  doc.moveDown();
  doc.fontSize(16).text('Attendance');
  attendanceSummary.forEach((item) => doc.fontSize(11).text(`${item._id}: ${item.count}`));
  doc.moveDown();
  doc.fontSize(16).text('Contributions');
  contributionSummary.forEach((item) => doc.fontSize(11).text(`${item._id}: ${item.count} records, paid ${item.amount}`));
  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
}
