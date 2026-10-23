import { MonthlyRoster } from '../models/MonthlyRoster.js';

const getDatesBetween = (startDate, endDate) => {
  const dates = [];

  const current = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
};

const getAffectedMonths = (oldEvent, event) => {
  const oldDates = getDatesBetween(oldEvent.startDate, oldEvent.endDate);

  const newDates = getDatesBetween(event.startDate, event.endDate);

  return [
    ...new Set([...oldDates, ...newDates].map((date) => date.slice(0, 7))),
  ];
};

export const syncDraftRostersForEvent = async (event, oldEvent) => {
  const oldDates = getDatesBetween(oldEvent.startDate, oldEvent.endDate);

  const newDates = getDatesBetween(event.startDate, event.endDate);

  const oldDateSet = new Set(oldDates);
  const newDateSet = new Set(newDates);

  const affectedMonths = getAffectedMonths(oldEvent, event);

  const drafts = await MonthlyRoster.find({
    department: event.department,
    unit: event.unit,
    template: event.template,
    month: { $in: affectedMonths },
    status: 'draft',
  });

  for (const roster of drafts) {
    const rosterMonth = roster.month;

    const oldMonthDates = oldDates.filter((date) =>
      date.startsWith(rosterMonth),
    );

    const newMonthDates = newDates.filter((date) =>
      date.startsWith(rosterMonth),
    );

    const oldOccurrences = roster.occurrences.filter(
      (occurrence) =>
        occurrence.eventId &&
        occurrence.eventId.toString() === event._id.toString(),
    );

    // Remove occurrences for dates that no longer belong
    // to the event.
    roster.occurrences = roster.occurrences.filter((occurrence) => {
      if (
        !occurrence.eventId ||
        occurrence.eventId.toString() !== event._id.toString()
      ) {
        return true;
      }

      return newDateSet.has(occurrence.date);
    });

    // Update occurrences that still belong to the event.
    for (const occurrence of roster.occurrences) {
      if (
        !occurrence.eventId ||
        occurrence.eventId.toString() !== event._id.toString()
      ) {
        continue;
      }

      occurrence.eventName = event.name;
      occurrence.startTime = event.startTime;
      occurrence.endTime = event.endTime;
      occurrence.location = event.location;
      occurrence.membersNeeded = event.membersNeeded;
      occurrence.rolesEnabled = event.rolesEnabled;

      if (occurrence.assignments.length > event.membersNeeded) {
        occurrence.assignments = occurrence.assignments.slice(
          0,
          event.membersNeeded,
        );
      }

      occurrence.shortageCount = Math.max(
        0,
        event.membersNeeded - occurrence.assignments.length,
      );

      occurrence.needsAttention = occurrence.shortageCount > 0;
    }

    // Add newly-created dates to this draft.
    for (const date of newMonthDates) {
      const alreadyExists = roster.occurrences.some(
        (occurrence) =>
          occurrence.eventId &&
          occurrence.eventId.toString() === event._id.toString() &&
          occurrence.date === date,
      );

      if (alreadyExists) {
        continue;
      }

      roster.occurrences.push({
        eventId: event._id,
        templateDutyId: null,
        eventName: event.name,
        date,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        membersNeeded: event.membersNeeded,
        rolesEnabled: event.rolesEnabled,
        assignments: [],
        needsAttention: true,
        shortageCount: event.membersNeeded,
      });
    }

    // Keep the roster ordered after adding/removing dates.
    roster.occurrences.sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }

      return a.startTime.localeCompare(b.startTime);
    });

    if (
      oldMonthDates.length > 0 ||
      newMonthDates.length > 0 ||
      oldOccurrences.length > 0
    ) {
      roster.revision += 1;
    }

    await roster.save();
  }
};
