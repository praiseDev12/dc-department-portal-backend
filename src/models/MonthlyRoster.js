import mongoose from 'mongoose';

const rosterAssignmentSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },

    // The role assigned to this member, if roles are enabled.
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    roleName: {
      type: String,
      trim: true,
      default: '',
    },

    // Tracks whether an admin manually changed this assignment.
    manuallyAssigned: {
      type: Boolean,
      default: false,
    },

    // Retains the assignment if a replacement is needed later.
    replacedMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      default: null,
    },

    notificationStatus: {
      dayBefore: {
        type: String,
        enum: ['pending', 'processing', 'sent', 'failed', 'not_required'],
        default: 'pending',
      },

      sameDay: {
        type: String,
        enum: ['pending', 'processing', 'sent', 'failed', 'not_required'],
        default: 'pending',
      },
    },

    dayBeforeSentAt: {
      type: Date,
      default: null,
    },

    sameDaySentAt: {
      type: Date,
      default: null,
    },

    dayBeforeProcessingAt: {
      type: Date,
      default: null,
    },

    sameDayProcessingAt: {
      type: Date,
      default: null,
    },

    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RosterEvent',
      default: null,
    },
  },
  { _id: true },
);

const rosterOccurrenceSchema = new mongoose.Schema(
  {
    // Reference to a recurring duty in the template, if applicable.
    templateDutyId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // Allows one-off or multi-day events that are not recurring duties.
    eventName: {
      type: String,
      required: true,
      trim: true,
    },

    // Local calendar date in Africa/Lagos: YYYY-MM-DD.
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },

    endTime: {
      type: String,
      default: null,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },

    location: {
      type: String,
      trim: true,
      default: '',
    },

    membersNeeded: {
      type: Number,
      required: true,
      min: 1,
    },

    rolesEnabled: {
      type: Boolean,
      default: true,
    },

    assignments: {
      type: [rosterAssignmentSchema],
      default: [],
    },

    // Flags shortages instead of silently duplicating assignments.
    needsAttention: {
      type: Boolean,
      default: false,
    },

    shortageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: true },
);

const monthlyRosterSchema = new mongoose.Schema(
  {
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },

    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit',
      required: true,
      index: true,
    },

    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RosterTemplate',
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Store the month as YYYY-MM, e.g. 2026-10.
    month: {
      type: String,
      required: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/,
    },

    timezone: {
      type: String,
      default: 'Africa/Lagos',
    },

    occurrences: {
      type: [rosterOccurrenceSchema],
      default: [],
    },

    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },

    generatedAt: {
      type: Date,
      default: Date.now,
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      default: null,
    },

    notificationScheduling: {
      status: {
        type: String,
        enum: ['pending', 'processing', 'scheduled', 'failed'],
        default: 'pending',
      },

      processingStartedAt: {
        type: Date,
        default: null,
      },

      scheduledAt: {
        type: Date,
        default: null,
      },

      failedAt: {
        type: Date,
        default: null,
      },

      errorMessage: {
        type: String,
        default: '',
      },
    },

    // Incremented when an authorised edit changes the published roster.
    revision: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { timestamps: true },
);

// Only one monthly roster per unit and template.
monthlyRosterSchema.index({ unit: 1, template: 1, month: 1 }, { unique: true });

monthlyRosterSchema.index({
  department: 1,
  unit: 1,
  month: 1,
  status: 1,
});

export const MonthlyRoster =
  mongoose.models.MonthlyRoster ||
  mongoose.model('MonthlyRoster', monthlyRosterSchema);
