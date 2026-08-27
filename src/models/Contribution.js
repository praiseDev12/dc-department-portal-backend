import mongoose from 'mongoose';

const contributionSchema = new mongoose.Schema(
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
    period: { type: String, required: true },
    amountExpected: { type: Number, required: true, min: 0 },
    interval: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly'],
      default: 'monthly',
    },
    amountPaid: { type: Number, default: 0, min: 0 },
    datePaid: Date,
    status: {
      type: String,
      enum: ['paid', 'overdue', 'partial'],
      default: 'overdue',
      index: true,
    },
  },
  { timestamps: true },
);

contributionSchema.index(
  { department: 1, member: 1, period: 1 },
  { unique: true },
);

export const Contribution =
  mongoose.models.Contribution ||
  mongoose.model('Contribution', contributionSchema);
