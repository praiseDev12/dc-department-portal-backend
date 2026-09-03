import { DateTime } from 'luxon';

export const DEFAULT_TIMEZONE = 'Africa/Lagos';

export function getNowInTimezone(timezone = DEFAULT_TIMEZONE) {
  return DateTime.now().setZone(timezone);
}

export function getLocalDate(timezone = DEFAULT_TIMEZONE) {
  return getNowInTimezone(timezone).toISODate();
}

export function getDayOfWeek(timezone = DEFAULT_TIMEZONE) {
  // Luxon:
  // 1 = Monday
  // 7 = Sunday
  //
  // Convert to:
  // 0 = Sunday
  // 1 = Monday
  // ...
  // 6 = Saturday

  const weekday = getNowInTimezone(timezone).weekday;

  return weekday === 7 ? 0 : weekday;
}

export function createScheduledStart({
  date,
  startTime,
  timezone = DEFAULT_TIMEZONE,
}) {
  const [hour, minute] = startTime.split(':').map(Number);

  const dateTime = DateTime.fromISO(date, {
    zone: timezone,
  }).set({
    hour,
    minute,
    second: 0,
    millisecond: 0,
  });

  if (!dateTime.isValid) {
    throw new Error('Invalid service date or start time');
  }

  return dateTime;
}

export function calculateCheckInWindow({
  date,
  startTime,
  timezone = DEFAULT_TIMEZONE,
  opensBeforeMinutes = 30,
  graceMinutes = 15,
  closesAfterMinutes = 60,
}) {
  const scheduledStart = createScheduledStart({
    date,
    startTime,
    timezone,
  });

  const opensAt = scheduledStart.minus({
    minutes: opensBeforeMinutes,
  });

  const graceEndsAt = scheduledStart.plus({
    minutes: graceMinutes,
  });

  const closesAt = scheduledStart.plus({
    minutes: closesAfterMinutes,
  });

  return {
    scheduledStart: scheduledStart.toUTC().toJSDate(),
    opensAt: opensAt.toUTC().toJSDate(),
    graceEndsAt: graceEndsAt.toUTC().toJSDate(),
    closesAt: closesAt.toUTC().toJSDate(),
  };
}

export function getCheckInStatus({
  now = new Date(),
  opensAt,
  graceEndsAt,
  closesAt,
}) {
  const timestamp = new Date(now).getTime();

  const open = new Date(opensAt).getTime();
  const graceEnd = new Date(graceEndsAt).getTime();
  const close = new Date(closesAt).getTime();

  if (timestamp < open) {
    return 'not_open';
  }

  if (timestamp > close) {
    return 'closed';
  }

  if (timestamp <= graceEnd) {
    return 'on_time';
  }

  return 'late';
}
