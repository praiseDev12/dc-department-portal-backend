import { inngest } from '../config/inngest.js';
import { createScheduledStart } from '../utils/timezone.js';

export async function scheduleRosterAssignmentNotifications({
  rosterId,
  occurrenceId,
  assignmentId,
  date,
  timezone,
}) {
  const dayBeforeDateTime = createScheduledStart({
    date,
    startTime: '19:00',
    timezone,
  }).minus({ days: 1 });

  const sameDayDateTime = createScheduledStart({
    date,
    startTime: '06:00',
    timezone,
  });

  const events = [];

  if (dayBeforeDateTime.toMillis() > Date.now()) {
    events.push({
      id: `roster-notification-${rosterId}-${occurrenceId}-${assignmentId}-dayBefore`,
      name: 'roster/notification.send',
      data: {
        rosterId: String(rosterId),
        occurrenceId: String(occurrenceId),
        assignmentId: String(assignmentId),
        notificationType: 'dayBefore',
      },
      ts: dayBeforeDateTime.toMillis(),
    });
  }

  if (sameDayDateTime.toMillis() > Date.now()) {
    events.push({
      id: `roster-notification-${rosterId}-${occurrenceId}-${assignmentId}-sameDay`,
      name: 'roster/notification.send',
      data: {
        rosterId: String(rosterId),
        occurrenceId: String(occurrenceId),
        assignmentId: String(assignmentId),
        notificationType: 'sameDay',
      },
      ts: sameDayDateTime.toMillis(),
    });
  }

  if (events.length === 0) {
    return {
      success: true,
      scheduledCount: 0,
      message: 'No future roster notifications to schedule.',
    };
  }

  await inngest.send(events);

  return {
    success: true,
    scheduledCount: events.length,
  };
}
