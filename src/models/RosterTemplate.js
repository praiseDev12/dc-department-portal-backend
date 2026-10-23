import mongoose from 'mongoose';

const rosterRoleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Controls the order in which roles appear in the roster.
    order: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: true },
);

const rosterDutySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // 0 = Sunday, 1 = Monday, ... 6 = Saturday.
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },

    // Uses 24-hour format, e.g. 08:00 or 17:30.
    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },

    // Optional end time for conflict detection and display.
    endTime: {
      type: String,
      default: null,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },

    // Number of members required for this duty occurrence.
    membersNeeded: {
      type: Number,
      required: true,
      min: 1,
    },

    // Roles are enabled by default but can be disabled.
    rolesEnabled: {
      type: Boolean,
      default: true,
    },

    roles: {
      type: [rosterRoleSchema],
      default: [],
    },

    // Optional venue or location for the duty.
    location: {
      type: String,
      trim: true,
      default: '',
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true },
);

const rosterTemplateSchema = new mongoose.Schema(
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

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    // Each duty defines a recurring weekly schedule.
    duties: {
      type: [rosterDutySchema],
      required: true,
      validate: {
        validator(duties) {
          return Array.isArray(duties) && duties.length > 0;
        },
        message: 'A roster must contain at least one duty.',
      },
    },

    settings: {
      // Avoid assigning a member to overlapping duties.
      avoidOverlappingAssignments: {
        type: Boolean,
        default: true,
      },

      // Try to distribute assignments evenly across members.
      balanceAssignments: {
        type: Boolean,
        default: true,
      },

      // Vary the roles members receive across assignments.
      rotateRoles: {
        type: Boolean,
        default: true,
      },
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },

    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true },
);

// Prevent duplicate template names within the same unit.
rosterTemplateSchema.index({ unit: 1, name: 1 }, { unique: true });

export const RosterTemplate =
  mongoose.models.RosterTemplate ||
  mongoose.model('RosterTemplate', rosterTemplateSchema);
