import { inngest } from '../../config/inngest.js';
import { sendRosterAssignmentNotification } from '../../services/rosterNotification.service.js';

export const sendRosterNotification = inngest.createFunction(
  {
    id: 'send-roster-notification',
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

    return result;
  },
);
