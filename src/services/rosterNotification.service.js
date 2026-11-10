import mongoose from 'mongoose';

import { MonthlyRoster } from '../models/MonthlyRoster.js';
import { sendNotificationToMember } from './notification.service.js';

const NOTIFICATION_PROCESSING_TIMEOUT_MINUTES = 15;

export async function sendRosterAssignmentNotification({
  rosterId,
  occurrenceId,
  assignmentId,
  notificationType,
}) {
  if (!mongoose.isValidObjectId(rosterId)) {
    return {
      success: false,
      status: 400,
      message: 'Invalid rosterId.',
    };
  }

  if (!mongoose.isValidObjectId(occurrenceId)) {
    return {
      success: false,
      status: 400,
      message: 'Invalid occurrenceId.',
    };
  }

  if (!mongoose.isValidObjectId(assignmentId)) {
    return {
      success: false,
      status: 400,
      message: 'Invalid assignmentId.',
    };
  }

  if (!['dayBefore', 'sameDay'].includes(notificationType)) {
    return {
      success: false,
      status: 400,
      message: 'Invalid notification type.',
    };
  }

  const sentAtField =
    notificationType === 'dayBefore' ? 'dayBeforeSentAt' : 'sameDaySentAt';

  const processingAtField =
    notificationType === 'dayBefore'
      ? 'dayBeforeProcessingAt'
      : 'sameDayProcessingAt';

  const statusField = `notificationStatus.${notificationType}`;

  const processingTimeoutAt = new Date(
    Date.now() - NOTIFICATION_PROCESSING_TIMEOUT_MINUTES * 60 * 1000,
  );

  const claimQuery = {
    _id: rosterId,
    status: 'published',
    occurrences: {
      $elemMatch: {
        _id: occurrenceId,
        assignments: {
          $elemMatch: {
            _id: assignmentId,
          },
        },
      },
    },
    [statusField]: {
      $in: ['pending', 'failed'],
    },
  };

  const claimUpdate = {
    $set: {
      [statusField]: 'processing',
      [processingAtField]: new Date(),
    },
  };

  const claimedRoster = await MonthlyRoster.findOneAndUpdate(
    claimQuery,
    claimUpdate,
    {
      new: true,
    },
  );

  let roster = claimedRoster;

  if (!roster) {
    const existingRoster = await MonthlyRoster.findOne({
      _id: rosterId,
      status: 'published',
    });

    if (!existingRoster) {
      return {
        success: false,
        status: 404,
        message: 'Published roster not found.',
      };
    }

    const occurrence = existingRoster.occurrences.id(occurrenceId);

    if (!occurrence) {
      return {
        success: false,
        status: 404,
        message: 'Roster occurrence not found.',
      };
    }

    const assignment = occurrence.assignments.id(assignmentId);

    if (!assignment) {
      return {
        success: false,
        status: 404,
        message: 'Roster assignment not found.',
      };
    }

    const currentStatus = assignment.notificationStatus?.[notificationType];

    if (currentStatus === 'sent') {
      return {
        success: true,
        status: 200,
        message: `${notificationType} notification has already been sent.`,
        alreadySent: true,
      };
    }

    if (currentStatus === 'processing') {
      const processingAt = assignment[processingAtField];

      const processingTimedOut =
        processingAt &&
        new Date(processingAt).getTime() < processingTimeoutAt.getTime();

      if (!processingTimedOut) {
        return {
          success: true,
          status: 200,
          message: `${notificationType} notification is already being processed.`,
          alreadyProcessing: true,
        };
      }

      const recoveredRoster = await MonthlyRoster.findOneAndUpdate(
        {
          _id: rosterId,
          status: 'published',
          [statusField]: 'processing',
          [processingAtField]: processingAt,
        },
        {
          $set: {
            [statusField]: 'pending',
            [processingAtField]: null,
          },
        },
        {
          new: false,
        },
      );

      if (!recoveredRoster) {
        return {
          success: true,
          status: 200,
          message: `${notificationType} notification is already being processed.`,
          alreadyProcessing: true,
        };
      }

      roster = await MonthlyRoster.findOneAndUpdate(claimQuery, claimUpdate, {
        new: true,
      });

      if (!roster) {
        return {
          success: false,
          status: 409,
          message: `Unable to claim ${notificationType} notification.`,
        };
      }
    } else {
      return {
        success: false,
        status: 409,
        message: `Unable to claim ${notificationType} notification.`,
      };
    }
  }

  const occurrence = roster.occurrences.id(occurrenceId);

  if (!occurrence) {
    return {
      success: false,
      status: 404,
      message: 'Roster occurrence not found.',
    };
  }

  const assignment = occurrence.assignments.id(assignmentId);

  if (!assignment) {
    return {
      success: false,
      status: 404,
      message: 'Roster assignment not found.',
    };
  }

  const roleText = assignment.roleName ? ` as ${assignment.roleName}` : '';

  const timeText = occurrence.endTime
    ? `${occurrence.startTime} - ${occurrence.endTime}`
    : occurrence.startTime;

  const locationText = occurrence.location
    ? `\nLocation: ${occurrence.location}`
    : '';

  const body =
    notificationType === 'dayBefore'
      ? `You are scheduled for ${occurrence.eventName}${roleText} tomorrow at ${timeText}.${locationText}`
      : `Reminder: you are scheduled for ${occurrence.eventName}${roleText} today at ${timeText}.${locationText}`;

  const result = await sendNotificationToMember({
    memberId: assignment.member,
    title:
      notificationType === 'dayBefore'
        ? 'Roster Reminder'
        : 'Roster Reminder: Today',
    body,
    data: {
      type: 'roster_assignment',
      notificationType,
      rosterId: String(roster._id),
      occurrenceId: String(occurrence._id),
      assignmentId: String(assignment._id),
      date: occurrence.date,
      startTime: occurrence.startTime,
      endTime: occurrence.endTime || '',
      eventName: occurrence.eventName,
      url: `/roster/${roster._id}`,
    },
  });

  if (!result.success || result.successCount === 0) {
    assignment.notificationStatus[notificationType] = 'failed';
    assignment[processingAtField] = null;

    await roster.save();

    return {
      success: false,
      status: result.status || 500,
      message: result.message || 'Failed to send roster notification.',
      failureCount: result.failureCount || 0,
    };
  }

  assignment.notificationStatus[notificationType] = 'sent';
  assignment[processingAtField] = null;
  assignment[sentAtField] = new Date();

  await roster.save();

  return {
    success: true,
    status: 200,
    message: `${notificationType} roster notification sent successfully.`,
    successCount: result.successCount,
    failureCount: result.failureCount,
  };
}
