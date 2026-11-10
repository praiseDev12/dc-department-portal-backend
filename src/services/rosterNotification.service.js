import mongoose from 'mongoose';

import { MonthlyRoster } from '../models/MonthlyRoster.js';
import { sendNotificationToMember } from './notification.service.js';
import { sendRosterAssignmentEmail } from '../utils/email.js';

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

  const emailSentAtField =
    notificationType === 'dayBefore'
      ? 'dayBeforeEmailSentAt'
      : 'sameDayEmailSentAt';

  const emailProcessingAtField =
    notificationType === 'dayBefore'
      ? 'dayBeforeEmailProcessingAt'
      : 'sameDayEmailProcessingAt';

  const emailStatusField = `emailStatus.${notificationType}`;

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

  const member = await mongoose
    .model('Member')
    .findById(assignment.member)
    .select('fullName email');

  if (!member) {
    assignment.notificationStatus[notificationType] = 'failed';
    assignment[processingAtField] = null;

    await roster.save();

    return {
      success: false,
      status: 404,
      message: 'Assigned member not found.',
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

  const fcmDelivered = result.success && result.successCount > 0;

  if (fcmDelivered) {
    assignment.notificationStatus[notificationType] = 'sent';
    assignment[processingAtField] = null;
    assignment[sentAtField] = new Date();

    assignment.emailStatus[notificationType] = 'not_required';
    assignment[emailProcessingAtField] = null;

    await roster.save();

    return {
      success: true,
      status: 200,
      message: `${notificationType} roster notification sent successfully.`,
      deliveryMethod: 'fcm',
      successCount: result.successCount,
      failureCount: result.failureCount,
    };
  }

  if (!member.email) {
    assignment.notificationStatus[notificationType] = 'failed';
    assignment[processingAtField] = null;

    assignment.emailStatus[notificationType] = 'not_required';
    assignment[emailProcessingAtField] = null;

    await roster.save();

    return {
      success: false,
      status: result.status || 500,
      message:
        'FCM notification failed and assigned member has no email address.',
      failureCount: result.failureCount || 0,
    };
  }

  const currentEmailStatus = assignment.emailStatus?.[notificationType];

  if (currentEmailStatus === 'sent') {
    assignment.notificationStatus[notificationType] = 'sent';
    assignment[processingAtField] = null;

    await roster.save();

    return {
      success: true,
      status: 200,
      message: `${notificationType} roster notification was already sent by email.`,
      deliveryMethod: 'email',
      alreadySent: true,
    };
  }

  if (currentEmailStatus === 'processing') {
    const emailProcessingAt = assignment[emailProcessingAtField];

    const emailProcessingTimedOut =
      emailProcessingAt &&
      new Date(emailProcessingAt).getTime() < processingTimeoutAt.getTime();

    if (!emailProcessingTimedOut) {
      return {
        success: true,
        status: 200,
        message: `${notificationType} roster email is already being processed.`,
        alreadyProcessing: true,
      };
    }

    assignment.emailStatus[notificationType] = 'pending';
    assignment[emailProcessingAtField] = null;
  }

  assignment.emailStatus[notificationType] = 'processing';
  assignment[emailProcessingAtField] = new Date();

  await roster.save();

  try {
    await sendRosterAssignmentEmail({
      email: member.email,
      memberName: member.fullName,
      eventName: occurrence.eventName,
      roleName: assignment.roleName,
      date: occurrence.date,
      startTime: occurrence.startTime,
      endTime: occurrence.endTime,
      location: occurrence.location,
      notificationType,
    });

    assignment.notificationStatus[notificationType] = 'sent';
    assignment[processingAtField] = null;
    assignment[sentAtField] = new Date();

    assignment.emailStatus[notificationType] = 'sent';
    assignment[emailProcessingAtField] = null;
    assignment[emailSentAtField] = new Date();

    await roster.save();

    return {
      success: true,
      status: 200,
      message: `${notificationType} roster notification sent successfully.`,
      deliveryMethod: 'email',
      successCount: 1,
      failureCount: result.failureCount || 0,
    };
  } catch (error) {
    assignment.notificationStatus[notificationType] = 'failed';
    assignment[processingAtField] = null;

    assignment.emailStatus[notificationType] = 'failed';
    assignment[emailProcessingAtField] = null;

    await roster.save();

    console.error('Failed to send roster assignment email:', error);

    return {
      success: false,
      status: 500,
      message: 'FCM notification failed and roster email could not be sent.',
      failureCount: result.failureCount || 0,
    };
  }
}
