export function rosterAssignmentEmail({
  memberName,
  eventName,
  roleName,
  date,
  startTime,
  endTime,
  location,
  notificationType,
}) {
  const roleText = roleName ? ` as ${roleName}` : '';

  const timeText = endTime ? `${startTime} - ${endTime}` : startTime;

  const subject =
    notificationType === 'dayBefore'
      ? `Roster Reminder: ${eventName} Tomorrow`
      : `Roster Reminder: ${eventName} Today`;

  const greeting = memberName ? `Hello ${memberName},` : 'Hello,';

  const intro =
    notificationType === 'dayBefore'
      ? `This is a reminder that you are scheduled to serve${roleText} tomorrow.`
      : `This is a reminder that you are scheduled to serve${roleText} today.`;

  const locationText = location ? `Location: ${location}` : '';

  const text = [
    greeting,
    '',
    intro,
    '',
    `Event: ${eventName}`,
    `Date: ${date}`,
    `Time: ${timeText}`,
    locationText,
    '',
    'Please make the necessary preparations and arrive on time.',
    '',
    'DC Department Portal Asaba HQ',
  ]
    .filter(Boolean)
    .join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
      <p>${greeting}</p>

      <p>${intro}</p>

      <div style="margin: 20px 0; padding: 16px; border: 1px solid #ddd; border-radius: 8px;">
        <p><strong>Event:</strong> ${eventName}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${timeText}</p>
        ${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
      </div>

      <p>Please make the necessary preparations and arrive on time.</p>

      <p>DC Department Portal Asaba HQ</p>
    </div>
  `;

  return {
    subject,
    text,
    html,
  };
}
