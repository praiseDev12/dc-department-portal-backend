import mongoose from 'mongoose';

const contributionSchema = new mongoose.Schema(
  {
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

contributionSchema.index({ department: 1, createdAt: -1 });

export const Contribution =
  mongoose.models.Contribution ||
  mongoose.model('Contribution', contributionSchema);
