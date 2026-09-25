import { asyncHandler } from '../utils/asyncHandler.js';

import { registerNotificationToken } from '../services/notification.service.js';

export const registerToken = asyncHandler(async (req, res) => {
  try {
    const { token, platform } = req.body;

    if (!token) {
      return res.status(400).json({
        message: 'Notification token is required',
      });
    }

    const result = await registerNotificationToken({
      memberId: req.user._id,
      token,
      platform,
    });

    return res.status(result.status).json({
      message: result.message,
    });
  } catch (error) {
    console.error('registerToken error:', error);

    return res.status(error.statusCode || error.status || 500).json({
      message: error.message || 'Failed to register notification token',
    });
  }
});

// export const sendTestNotification = asyncHandler(async (req, res) => {
//   try {
//     const result = await sendNotificationToMember({
//       memberId: req.user._id,
//       title: 'Church Portal 🔔',
//       body: 'Your notifications are working successfully!',
//       data: {
//         type: 'test',
//       },
//     });

//     return res.status(result.status).json({
//       message: result.message,
//       successCount: result.successCount,
//       failureCount: result.failureCount,
//     });
//   } catch (error) {
//     console.error('sendTestNotification error:', error);

//     return res.status(error.statusCode || error.status || 500).json({
//       message: error.message || 'Failed to send test notification',
//     });
//   }
// });
