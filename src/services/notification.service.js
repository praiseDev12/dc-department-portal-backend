import { getMessaging } from 'firebase-admin/messaging';
import '../config/firebaseAdmin.js';

import { Member } from '../models/Member.js';

export async function registerNotificationToken({
  memberId,
  token,
  platform = 'web',
}) {
  const member = await Member.findById(memberId);

  if (!member) {
    return {
      success: false,
      status: 404,
      message: 'Member not found',
    };
  }

  const existingToken = member.notificationTokens.find(
    (item) => item.token === token,
  );

  if (existingToken) {
    existingToken.platform = platform;
    existingToken.lastUsedAt = new Date();
  } else {
    member.notificationTokens.push({
      token,
      platform,
      createdAt: new Date(),
      lastUsedAt: new Date(),
    });
  }

  await member.save();

  return {
    success: true,
    status: 200,
    message: 'Notification token registered successfully',
  };
}

export async function sendNotificationToMember({
  memberId,
  title,
  body,
  data = {},
}) {
  const member = await Member.findById(memberId);

  if (!member) {
    return {
      success: false,
      status: 404,
      message: 'Member not found',
    };
  }

  const notificationTokens = member.notificationTokens || [];

  const tokens = notificationTokens.map((item) => item.token).filter(Boolean);

  if (!tokens.length) {
    return {
      success: false,
      status: 404,
      message: 'Member has no registered notification devices',
    };
  }

  const messaging = getMessaging();

  const notificationData = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      typeof value === 'string' ? value : JSON.stringify(value),
    ]),
  );

  const response = await messaging.sendEachForMulticast({
    tokens,
    data: {
      title,
      body,
      ...notificationData,
    },
  });

  const invalidTokens = [];

  response.responses.forEach((item, index) => {
    if (
      !item.success &&
      (item.error?.code === 'messaging/registration-token-not-registered' ||
        item.error?.code === 'messaging/invalid-registration-token')
    ) {
      invalidTokens.push(tokens[index]);
    }
  });

  if (invalidTokens.length) {
    member.notificationTokens = member.notificationTokens.filter(
      (item) => !invalidTokens.includes(item.token),
    );

    await member.save();
  }

  return {
    success: true,
    status: 200,
    message: 'Notification sent successfully',
    successCount: response.successCount,
    failureCount: response.failureCount,
  };
}

export async function sendNotificationToDepartment({
  departmentId,
  title,
  body,
  data = {},
}) {
  const members = await Member.find({
    department: departmentId,
    'notificationTokens.0': {
      $exists: true,
    },
  }).select('notificationTokens');

  const notificationTokens = members.flatMap(
    (member) => member.notificationTokens || [],
  );

  const tokens = notificationTokens.map((item) => item.token).filter(Boolean);

  if (!tokens.length) {
    return {
      success: true,
      status: 200,
      message: 'No notification devices found',
      successCount: 0,
      failureCount: 0,
    };
  }

  const notificationData = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      typeof value === 'string' ? value : JSON.stringify(value),
    ]),
  );

  const messaging = getMessaging();

  const response = await messaging.sendEachForMulticast({
    tokens,
    data: {
      title,
      body,
      ...notificationData,
    },
  });

  const invalidTokens = [];

  response.responses.forEach((item, index) => {
    if (!item.success) {
      console.error('FCM notification failed:', {
        token: tokens[index],
        code: item.error?.code,
        message: item.error?.message,
      });

      if (
        item.error?.code === 'messaging/registration-token-not-registered' ||
        item.error?.code === 'messaging/invalid-registration-token'
      ) {
        invalidTokens.push(tokens[index]);
      }
    }
  });

  if (invalidTokens.length) {
    await Member.updateMany(
      {
        department: departmentId,
      },
      {
        $pull: {
          notificationTokens: {
            token: {
              $in: invalidTokens,
            },
          },
        },
      },
    );
  }

  return {
    success: response.successCount > 0,
    status: response.successCount > 0 ? 200 : 500,
    message:
      response.successCount > 0
        ? 'Department notification sent successfully'
        : 'Failed to deliver department notification',
    successCount: response.successCount,
    failureCount: response.failureCount,
  };
}
