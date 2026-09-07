import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { passwordResetEmail } from '../templates/passwordResetEmail.js';

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

// test SMTP connection
// export async function verifyEmailConnection() {
//   await transporter.verify();
//   console.log('✅ Gmail SMTP connection is working');
// }
