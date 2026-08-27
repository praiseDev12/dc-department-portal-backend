import mongoose from 'mongoose';

const serviceWindowSchema = new mongoose.Schema(
  {
    opensMinutesBefore: { type: Number, default: 75, min: 0 },
    closesMinutesAfter: { type: Number, default: 45, min: 0 },
    graceMinutes: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    logoUrl: String,
    settings: {
      checkInWindow: { type: serviceWindowSchema, default: () => ({}) },
      contribution: {
        amount: { type: Number, default: 0, min: 0 },
        interval: {
          type: String,
          enum: ['monthly', 'quarterly', 'yearly'],
          default: 'monthly',
        },
      },
      absenceFlagThreshold: { type: Number, default: 3, min: 1 },
    },
  },
  { timestamps: true },
);

export const Department =
  mongoose.models.Department || mongoose.model('Department', departmentSchema);
