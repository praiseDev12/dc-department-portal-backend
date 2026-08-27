import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
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
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      index: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    serviceInstance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceInstance',
      required: true,
      index: true,
    },
    checkInAt: { type: Date, required: true },
    status: { type: String, enum: ['on_time', 'late'], required: true },
    method: { type: String, enum: ['code', 'qr'], required: true },
  },
  { timestamps: true },
);

attendanceSchema.index(
  { department: 1, member: 1, serviceInstance: 1 },
  { unique: true },
);

export const Attendance =
  mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
