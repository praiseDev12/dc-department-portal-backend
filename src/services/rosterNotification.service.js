import mongoose from 'mongoose';

import { MonthlyRoster } from '../models/MonthlyRoster.js';
import { sendNotificationToMember } from './notification.service.js';

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

  const roster = await MonthlyRoster.findOne({
    _id: rosterId,
    status: 'published',
  });

  if (!roster) {
    return {
      success: false,
      status: 404,
      message: 'Published roster not found.',
    };
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

  const currentStatus = assignment.notificationStatus?.[notificationType];

  if (currentStatus === 'sent') {
    return {
      success: true,
      status: 200,
      message: `${notificationType} notification has already been sent.`,
      alreadySent: true,
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

    await roster.save();

    return {
      success: false,
      status: result.status || 500,
      message: result.message || 'Failed to send roster notification.',
      failureCount: result.failureCount || 0,
    };
  }

  assignment.notificationStatus[notificationType] = 'sent';

  if (notificationType === 'dayBefore') {
    assignment.dayBeforeSentAt = new Date();
  } else {
    assignment.sameDaySentAt = new Date();
  }

  await roster.save();

  return {
    success: true,
    status: 200,
    message: `${notificationType} roster notification sent successfully.`,
    successCount: result.successCount,
    failureCount: result.failureCount,
  };
}
