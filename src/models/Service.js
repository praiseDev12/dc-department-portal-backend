import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    // 0 = Sunday, 1 = Monday, ... 6 = Saturday
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },

    // 24-hour format, e.g. "09:00", "18:30"
    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },

    // How many minutes before start members can check in
    openBeforeMinutes: {
      type: Number,
      default: 60,
      min: 0,
    },

    // How many minutes after start check-in remains open
    closeAfterMinutes: {
      type: Number,
      default: 60,
      min: 0,
    },

    // Members checking in after this point are marked late
    graceMinutes: {
      type: Number,
      default: 15,
      min: 0,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

serviceSchema.index({ department: 1, name: 1 }, { unique: true });

export const Service =
  mongoose.models.Service || mongoose.model('Service', serviceSchema);
