import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    dayOfWeek: { type: Number, min: 0, max: 6, required: true },
    startTime: { type: String, required: true },
    opensMinutesBefore: { type: Number, default: 75, min: 0 },
    closesMinutesAfter: { type: Number, default: 45, min: 0 },
    graceMinutes: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

serviceSchema.index({ department: 1, name: 1 });

export const Service =
  mongoose.models.Service || mongoose.model('Service', serviceSchema);
