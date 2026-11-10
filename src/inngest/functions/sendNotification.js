import { inngest } from '../../config/inngest.js';
import { sendRosterAssignmentNotification } from '../../services/rosterNotification.service.js';

export const sendRosterNotification = inngest.createFunction(
  {
    id: 'send-roster-notification',
    retries: 3,
    triggers: {
      event: 'roster/notification.send',
    },
  },
  async ({ event }) => {
    const { rosterId, occurrenceId, assignmentId, notificationType } =
      event.data;

    const result = await sendRosterAssignmentNotification({
      rosterId,
      occurrenceId,
      assignmentId,
      notificationType,
    });

    console.log('Roster notification result:', result);

    if (!result.success) {
      throw new Error(result.message || 'Failed to send roster notification.');
    }

    return result;
  },
);
