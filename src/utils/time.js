export function combineDateAndTime(date, time) {
  const [hours, minutes] = time.split(':').map(Number);
  const value = new Date(date);
  value.setHours(hours, minutes, 0, 0);
  return value;
}

export function attendanceStatus({ checkInAt, startsAt, graceMinutes = 0 }) {
  const lateAfter = new Date(startsAt.getTime() + graceMinutes * 60_000);
  return checkInAt <= lateAfter ? 'on_time' : 'late';
}

export function isInsideWindow({ now, startsAt, opensMinutesBefore, closesMinutesAfter }) {
  const opensAt = new Date(startsAt.getTime() - opensMinutesBefore * 60_000);
  const closesAt = new Date(startsAt.getTime() + closesMinutesAfter * 60_000);
  return now >= opensAt && now <= closesAt;
}
