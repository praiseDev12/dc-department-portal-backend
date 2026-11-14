import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { passwordResetEmail } from '../templates/passwordResetEmail.js';
import { rosterAssignmentEmail } from '../templates/rosterAssignmentEmail.js';
import { birthdaySummaryEmail } from '../templates/birthdaySummaryEmail.js';

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.port === 465,
  auth: {
    user: env.smtp.user,
    pass: env.smtp.pass,
  },
});

export async function sendPasswordResetEmail({ email, resetUrl }) {
  const template = passwordResetEmail({
    resetUrl,
  });

  await transporter.sendMail({
    from: env.smtp.from,
    to: email,
    subject: template.subject,
    text: template.text,
    html: template.html,
  });
}

export async function sendRosterAssignmentEmail({
  email,
  memberName,
  eventName,
  roleName,
  date,
  startTime,
  endTime,
  location,
  notificationType,
}) {
  const template = rosterAssignmentEmail({
    memberName,
    eventName,
    roleName,
    date,
    startTime,
    endTime,
    location,
    notificationType,
  });

  await transporter.sendMail({
    from: env.smtp.from,
    to: email,
    subject: template.subject,
    text: template.text,
    html: template.html,
  });
}

export async function sendBirthdaySummaryEmail({
  email,
  departmentName,
  monthName,
  birthdays,
}) {
  const template = birthdaySummaryEmail({
    departmentName,
    monthName,
    birthdays,
  });

  await transporter.sendMail({
    from: env.smtp.from,
    to: email,
    subject: template.subject,
    text: template.text,
    html: template.html,
  });
}
