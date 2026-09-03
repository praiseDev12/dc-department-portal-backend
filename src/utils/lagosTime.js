const TIME_ZONE = 'Africa/Lagos';

export function getLagosDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });

  const parts = formatter.formatToParts(date);

  const values = {};

  for (const part of parts) {
    if (part.type !== 'literal') {
      values[part.type] = part.value;
    }
  }

  const weekdayMap = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    dateString: `${values.year}-${values.month}-${values.day}`,
    weekday: weekdayMap[values.weekday],
  };
}

/**
 * Creates a Date representing a Lagos local date/time.
 *
 * Lagos is UTC+1 and does not observe daylight saving time.
 */
export function lagosDateTimeToUtc(dateString, timeString) {
  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes] = timeString.split(':').map(Number);

  return new Date(Date.UTC(year, month - 1, day, hours - 1, minutes));
}

export function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}
