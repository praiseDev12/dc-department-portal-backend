import crypto from 'crypto';

import { Service } from '../models/Service.js';
import { CheckInSession } from '../models/CheckInSession.js';

import { sendNotificationToDepartment } from '../services/notification.service.js';

import {
  getLagosDateParts,
  lagosDateTimeToUtc,
  addMinutes,
} from '../utils/lagosTime.js';

let schedulerStarted = false;

function generateCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

async function createTodaySession({
  service,
  serviceDate,
  scheduledStart,
  opensAt,
  closesAt,
}) {
  const existing = await CheckInSession.findOne({
    service: service._id,
    serviceDate,
  });

  if (existing) {
    return existing;
  }

  const graceEndsAt = addMinutes(scheduledStart, service.graceMinutes);

  try {
    const session = await CheckInSession.create({
      service: service._id,
      department: service.department,
      serviceDate,
      code: generateCode(),
      scheduledStart,
      opensAt,
      closesAt,
      graceEndsAt,
      active: true,
    });

    console.log(`Check-in session created for "${service.name}"`, {
      sessionId: session._id.toString(),
      code: session.code,
    });

    return session;
  } catch (error) {
    // Another scheduler/process may have created the same
    // service session at almost the same time.
    if (error.code === 11000) {
      return CheckInSession.findOne({
        service: service._id,
        serviceDate,
      });
    }

    throw error;
  }
}

async function processCheckInServices() {
  const services = await Service.find({
    active: true,
  }).lean();

  const now = new Date();
  const today = getLagosDateParts();

  for (const service of services) {
    if (service.dayOfWeek !== today.weekday) {
      continue;
    }

    const scheduledStart = lagosDateTimeToUtc(
      today.dateString,
      service.startTime,
    );

    const opensAt = addMinutes(scheduledStart, -service.openBeforeMinutes);

    const closesAt = addMinutes(scheduledStart, service.closeAfterMinutes);

    // The check-in window has not opened yet.
    if (now < opensAt) {
      continue;
    }

    // The check-in window has already closed.
    if (now > closesAt) {
      continue;
    }

    const session = await createTodaySession({
      service,
      serviceDate: today.dateString,
      scheduledStart,
      opensAt,
      closesAt,
    });

    // Send exactly one notification for this service occurrence.
    if (!session.notificationSentAt) {
      const notificationResult = await sendNotificationToDepartment({
        departmentId: service.department,
        title: `${service.name} Check In is now open`,
        body: `${service.name} Get the code from your admin and Check In`,
        data: {
          type: 'service_check_in',
          sessionId: session._id.toString(),
          serviceId: service._id.toString(),
          url: '/check-in',
        },
      });

      console.log(
        `Check-in notification result for "${service.name}":`,
        notificationResult,
      );

      // Only mark the notification as sent when at least
      // one device actually received it.
      if (notificationResult.successCount > 0) {
        session.notificationSentAt = new Date();

        await session.save();
      }
    }
  }
}

export function startCheckInScheduler() {
  if (schedulerStarted) {
    return;
  }

  schedulerStarted = true;

  console.log('Check-in scheduler started');

  // Run immediately when the server starts.
  processCheckInServices().catch((error) => {
    console.error('Initial check-in scheduler run failed:', error);
  });

  // Check every 30 seconds for service windows that have opened.
  setInterval(async () => {
    try {
      await processCheckInServices();
    } catch (error) {
      console.error('Check-in scheduler error:', error);
    }
  }, 30 * 1000);
}
