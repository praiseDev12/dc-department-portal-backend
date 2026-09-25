import { asyncHandler } from '../utils/asyncHandler.js';

import {
  createAnnouncement,
  deactivateAnnouncement,
  getAllDepartmentAnnouncements,
  getDepartmentAnnouncements,
} from '../services/announcement.service.js';

import { sendNotificationToDepartment } from '../services/notification.service.js';

export const createAnnouncementController = asyncHandler(async (req, res) => {
  try {
    const {
      title,
      message,
      priority,
      publishAt,
      expiresAt,
      notificationFrequency,
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        message: 'Title and message are required',
      });
    }

    const announcement = await createAnnouncement({
      departmentId: req.user.department,
      title,
      message,
      priority,
      createdBy: req.user._id,
      publishAt,
      expiresAt,
      notificationFrequency,
    });

    sendNotificationToDepartment({
      departmentId: req.user.department,
      title: announcement.title,
      body: announcement.message,
      data: {
        type: 'announcement',
        announcementId: announcement._id.toString(),
        url: '/member/announcements',
      },
    }).catch((error) => {
      console.error('Failed to send announcement notification:', error);
    });

    return res.status(201).json({
      message: 'Announcement created successfully',
      announcement,
    });
  } catch (error) {
    console.error('createAnnouncementController error:', error);

    return res.status(error.statusCode || error.status || 500).json({
      message: error.message || 'Failed to create announcement',
    });
  }
});

export const getAnnouncementsController = asyncHandler(async (req, res) => {
  try {
    const announcements = await getDepartmentAnnouncements({
      departmentId: req.user.department,
    });

    return res.status(200).json({
      announcements,
    });
  } catch (error) {
    console.error('getAnnouncementsController error:', error);

    return res.status(error.statusCode || error.status || 500).json({
      message: error.message || 'Failed to fetch announcements',
    });
  }
});

export const getAdminAnnouncementsController = asyncHandler(
  async (req, res) => {
    try {
      const announcements = await getAllDepartmentAnnouncements({
        departmentId: req.user.department,
      });

      return res.status(200).json({
        announcements,
      });
    } catch (error) {
      console.error('getAdminAnnouncementsController error:', error);

      return res.status(error.statusCode || error.status || 500).json({
        message: error.message || 'Failed to fetch admin announcements',
      });
    }
  },
);

export const deleteAnnouncementController = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const result = await deactivateAnnouncement({
      announcementId: id,
      departmentId: req.user.department,
    });

    return res.status(result.status).json({
      message: result.message,
      announcement: result.announcement,
    });
  } catch (error) {
    console.error('deleteAnnouncementController error:', error);

    return res.status(error.statusCode || error.status || 500).json({
      message: error.message || 'Failed to remove announcement',
    });
  }
});
