import mongoose from 'mongoose';

const rosterEventSchema = new mongoose.Schema(
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

    description: {
      type: String,
      trim: true,
      default: '',
    },

    // Inclusive start and end dates in YYYY-MM-DD format.
    startDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    endDate: {
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

    roles: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },

        order: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
    ],

    // Set to false to exclude the event from future draft generation.
    active: {
      type: Boolean,
      default: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },
  },
  { timestamps: true },
);

rosterEventSchema.index({
  department: 1,
  unit: 1,
  startDate: 1,
  endDate: 1,
});

export const RosterEvent =
  mongoose.models.RosterEvent ||
  mongoose.model('RosterEvent', rosterEventSchema);
