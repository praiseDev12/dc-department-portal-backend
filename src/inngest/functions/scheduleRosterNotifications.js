import { inngest } from '../../config/inngest.js';
import { MonthlyRoster } from '../../models/MonthlyRoster.js';
import { scheduleRosterAssignmentNotifications } from '../../services/rosterNotificationSchedule.service.js';

const PROCESSING_TIMEOUT_MINUTES = 15;

export const scheduleRosterNotifications = inngest.createFunction(
  {
    id: 'schedule-roster-notifications',
    triggers: {
      event: 'roster/published',
    },
  },
  async ({ event }) => {
    const { rosterId } = event.data;

    const existingRoster = await MonthlyRoster.findOne({
      _id: rosterId,
      status: 'published',
    });

    if (!existingRoster) {
      return {
        success: false,
        message: 'Published roster not found.',
      };
    }

    const processingStartedAt =
      existingRoster.notificationScheduling.processingStartedAt;

    const processingTimeoutAt =
      Date.now() - PROCESSING_TIMEOUT_MINUTES * 60 * 1000;

    const processingTimedOut =
      existingRoster.notificationScheduling.status === 'processing' &&
      processingStartedAt &&
      new Date(processingStartedAt).getTime() < processingTimeoutAt;

    if (processingTimedOut) {
      await MonthlyRoster.updateOne(
        {
          _id: rosterId,
          status: 'published',
          'notificationScheduling.status': 'processing',
          'notificationScheduling.processingStartedAt': processingStartedAt,
        },
        {
          $set: {
            'notificationScheduling.status': 'pending',
            'notificationScheduling.processingStartedAt': null,
          },
        },
      );
    }

    if (existingRoster.notificationScheduling.status === 'scheduled') {
      return {
        success: true,
        scheduledCount: 0,
        alreadyScheduled: true,
        message: 'Roster notifications have already been scheduled.',
      };
    }

    const claimedRoster = await MonthlyRoster.findOneAndUpdate(
      {
        _id: rosterId,
        status: 'published',
        'notificationScheduling.status': 'pending',
      },
      {
        $set: {
          'notificationScheduling.status': 'processing',
          'notificationScheduling.processingStartedAt': new Date(),
        },
      },
      {
        new: true,
      },
    );

    if (!claimedRoster) {
      const currentRoster = await MonthlyRoster.findOne({
        _id: rosterId,
        status: 'published',
      });

      if (currentRoster?.notificationScheduling.status === 'scheduled') {
        return {
          success: true,
          scheduledCount: 0,
          alreadyScheduled: true,
          message: 'Roster notifications have already been scheduled.',
        };
      }

      if (currentRoster?.notificationScheduling.status === 'processing') {
        return {
          success: true,
          scheduledCount: 0,
          alreadyProcessing: true,
          message: 'Roster notification scheduling is already in progress.',
        };
      }

      return {
        success: false,
        scheduledCount: 0,
        message: 'Unable to claim roster notification scheduling.',
      };
    }

    const roster = claimedRoster;

    let scheduledCount = 0;

    try {
      for (const occurrence of roster.occurrences) {
        for (const assignment of occurrence.assignments) {
          const result = await scheduleRosterAssignmentNotifications({
            rosterId: roster._id,
            occurrenceId: occurrence._id,
            assignmentId: assignment._id,
            date: occurrence.date,
            timezone: roster.timezone,
          });

          scheduledCount += result.scheduledCount || 0;
        }
      }

      roster.notificationScheduling.status = 'scheduled';
      roster.notificationScheduling.processingStartedAt = null;
      roster.notificationScheduling.scheduledAt = new Date();
      roster.notificationScheduling.failedAt = null;
      roster.notificationScheduling.errorMessage = '';

      await roster.save();

      console.log('Roster notifications scheduled:', {
        rosterId: String(roster._id),
        scheduledCount,
      });

      return {
        success: true,
        scheduledCount,
      };
    } catch (error) {
      roster.notificationScheduling.status = 'failed';
      roster.notificationScheduling.processingStartedAt = null;
      roster.notificationScheduling.failedAt = new Date();
      roster.notificationScheduling.errorMessage =
        error.message || 'Failed to schedule roster notifications.';

      await roster.save();

      console.error('Failed to schedule roster notifications:', error);

      throw error;
    }
  },
);
