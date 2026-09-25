import { Announcement } from '../models/Announcement.js';

const NOTIFICATION_INTERVALS = {
  every_30_seconds: 30 * 1000,
  every_6_hours: 6 * 60 * 60 * 1000,
  every_12_hours: 12 * 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
};

export async function createAnnouncement({
  departmentId,
  title,
  message,
  priority = 'normal',
  createdBy,
  publishAt,
  expiresAt = null,
  notificationFrequency = 'once',
}) {
  const scheduledPublishAt = publishAt || new Date();

  const interval = NOTIFICATION_INTERVALS[notificationFrequency];

  const nextNotificationAt =
    notificationFrequency === 'once' || !interval
      ? null
      : new Date(new Date(scheduledPublishAt).getTime() + interval);

  const announcement = await Announcement.create({
    department: departmentId,
    title,
    message,
    priority,
    createdBy,
    publishAt: scheduledPublishAt,
    expiresAt,
    notificationFrequency,
    nextNotificationAt,
  });

  return announcement;
}

export async function getDepartmentAnnouncements({ departmentId }) {
  return Announcement.find({
    department: departmentId,
    active: true,
    publishAt: {
      $lte: new Date(),
    },
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  })
    .populate('createdBy', 'fullName')
    .sort({
      publishAt: -1,
    });
}

export async function getAllDepartmentAnnouncements({ departmentId }) {
  return Announcement.find({
    department: departmentId,
    active: true,
  })
    .populate('createdBy', 'fullName')
    .sort({
      publishAt: -1,
    });
}

export async function deactivateAnnouncement({ announcementId, departmentId }) {
  const announcement = await Announcement.findOneAndUpdate(
    {
      _id: announcementId,
      department: departmentId,
      active: true,
    },
    {
      $set: {
        active: false,
        nextNotificationAt: null,
      },
    },
    {
      new: true,
    },
  );

  if (!announcement) {
    return {
      success: false,
      status: 404,
      message: 'Announcement not found',
    };
  }

  return {
    success: true,
    status: 200,
    message: 'Announcement removed successfully',
    announcement,
  };
}
