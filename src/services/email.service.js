import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

export function createTransport() {
  if (!env.smtp.host) return null;
  return nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined
  });
}

export async function sendReportEmail({ to, subject, pdf }) {
  const transport = createTransport();
  if (!transport) return { skipped: true };
  await transport.sendMail({
    from: env.smtp.from,
    to,
    subject,
    text: 'Attached is your Church Department Portal report.',
    attachments: [{ filename: 'department-report.pdf', content: pdf }]
  });
  return { skipped: false };
}
