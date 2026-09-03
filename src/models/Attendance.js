import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CheckInSession',
      required: true,
      index: true,
    },

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

    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      index: true,
    },

    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit',
    },

    status: {
      type: String,
      enum: ['on_time', 'late'],
      required: true,
    },

    checkedInAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

attendanceSchema.index({ session: 1, member: 1 }, { unique: true });

export const Attendance =
  mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
