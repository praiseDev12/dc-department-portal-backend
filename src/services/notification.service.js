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

  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: {
      title,
      body,
    },
    data,
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
