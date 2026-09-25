import cron from 'node-cron';

import { Announcement } from '../models/Announcement.js';

import { sendNotificationToDepartment } from '../services/notification.service.js';

const FREQUENCY_MS = {
  every_30_seconds: 30 * 1000,
  every_6_hours: 6 * 60 * 60 * 1000,
  every_12_hours: 12 * 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
};

async function processRecurringAnnouncements() {
  try {
    const now = new Date();

    const dueAnnouncements = await Announcement.find({
      active: true,
      notificationFrequency: {
        $ne: 'once',
      },
      nextNotificationAt: {
        $lte: now,
      },
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    });

    for (const announcement of dueAnnouncements) {
      const interval = FREQUENCY_MS[announcement.notificationFrequency];

      if (!interval) {
        continue;
      }

      // Prevent another scheduler run from processing
      // this announcement while this run is sending it.
      const claimedAnnouncement = await Announcement.findOneAndUpdate(
        {
          _id: announcement._id,
          nextNotificationAt: {
            $lte: now,
          },
        },
        {
          $set: {
            nextNotificationAt:
              announcement.expiresAt &&
              new Date(now.getTime() + interval) >= announcement.expiresAt
                ? null
                : new Date(now.getTime() + interval),
          },
        },
        {
          new: true,
        },
      );

      if (!claimedAnnouncement) {
        continue;
      }

      try {
        const result = await sendNotificationToDepartment({
          departmentId: claimedAnnouncement.department,
          title: claimedAnnouncement.title,
          body: claimedAnnouncement.message,
          data: {
            type: 'announcement',
            announcementId: claimedAnnouncement._id.toString(),
            url: '/member/announcements',
          },
        });

        console.log(
          `Recurring announcement sent: ${claimedAnnouncement._id}`,
          result,
        );
      } catch (error) {
        console.error(
          `Failed to send recurring announcement ${claimedAnnouncement._id}:`,
          error,
        );
      }
    }
  } catch (error) {
    console.error('Announcement scheduler error:', error);
  }
}
export function startAnnouncementScheduler() {
  cron.schedule('*/10 * * * * *', processRecurringAnnouncements);

  console.log('Announcement scheduler started.');
}
