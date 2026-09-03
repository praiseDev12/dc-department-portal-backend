import mongoose from 'mongoose';

const checkInSessionSchema = new mongoose.Schema(
  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },

    // Date of the service occurrence in Africa/Lagos
    serviceDate: {
      type: String,
      required: true,
    },

    code: {
      type: String,
      required: true,
    },

    scheduledStart: {
      type: Date,
      required: true,
    },

    opensAt: {
      type: Date,
      required: true,
    },

    closesAt: {
      type: Date,
      required: true,
    },

    graceEndsAt: {
      type: Date,
      required: true,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

checkInSessionSchema.index({ service: 1, serviceDate: 1 }, { unique: true });

export const CheckInSession =
  mongoose.models.CheckInSession ||
  mongoose.model('CheckInSession', checkInSessionSchema);
